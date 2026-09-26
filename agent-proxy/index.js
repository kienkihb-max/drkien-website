// Máy chủ trung gian giữa khung chat trên web và agent trên Google Cloud.
//
// Vì sao cần: muốn hỏi agent (Vertex AI Agent Engine) phải có quyền của tài
// khoản Google Cloud. Để quyền đó trong code web thì ai mở trang cũng lấy
// được và dùng agent bằng tiền của chủ site. File này chạy trên Cloud Run,
// tự lấy quyền từ tài khoản dịch vụ của Cloud Run — không có khoá nào nằm
// trong code hay trên trình duyệt.
//
// Khuôn nói chuyện với khung chat (ChatWidget.astro):
//   gửi   POST { message, user_id, session_id? }
//   nhận       { reply, session_id }
// session_id là mã phiên của agent. Lần đầu khung chat chưa có thì để trống,
// máy chủ tạo phiên mới và trả về; các lần sau khung chat gửi lại để agent
// nhớ các câu trước trong cùng cuộc trò chuyện.

import functions from "@google-cloud/functions-framework";
import { GoogleAuth } from "google-auth-library";
import { execSync } from "node:child_process";

const PROJECT = process.env.AGENT_PROJECT || "warm-gantry-z0w9t";
const LOCATION = process.env.AGENT_LOCATION || "us-west1";
const ENGINE_ID = process.env.AGENT_ENGINE_ID || "7012601599071617024";

const ENGINE_URL =
  `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}` +
  `/locations/${LOCATION}/reasoningEngines/${ENGINE_ID}`;

// Chỉ trang của mình được gọi. Không chặn nguồn thì trang khác cũng nhúng
// được khung chat trỏ vào đây và tiêu tiền agent của chủ site.
//
// ALLOWED_ORIGINS: danh sách địa chỉ, ngăn bằng dấu cách hoặc dấu phẩy (dấu
// cách tiện hơn khi đặt bằng `gcloud run deploy --set-env-vars`, vì gcloud
// coi dấu phẩy là ranh giới giữa hai biến).
//
// Được phép đúng MỘT dạng ký tự đại diện, cho bản xem trước của Cloudflare
// Pages:  https://*.<tên-project>.pages.dev
// Dấu * chỉ thay cho một nhãn gồm chữ thường, số, gạch ngang (tên nhánh hoặc
// mã bản dựng, ví dụ "ai-chatbot" hay "3f2a1b9c"). Viết "https://*.pages.dev"
// sẽ bị bỏ qua: như thế là mở cho trang của bất kỳ ai trên Cloudflare Pages.
const DEFAULT_ORIGINS =
  "https://bacsikien.com https://www.bacsikien.com http://localhost:4321 http://localhost:4322";

const originRules = (process.env.ALLOWED_ORIGINS || DEFAULT_ORIGINS)
  .split(/[\s,]+/)
  .filter(Boolean)
  .flatMap((entry) => {
    if (!entry.includes("*")) return [{ exact: entry.replace(/\/+$/, "") }];
    const m = entry.match(/^https:\/\/\*\.([a-z0-9-]+)\.pages\.dev$/);
    if (!m) {
      console.warn(`Bỏ qua "${entry}": chỉ chấp nhận dạng https://*.<project>.pages.dev`);
      return [];
    }
    return [{ previewOf: m[1] }];
  });

const isAllowedOrigin = (origin) =>
  !!origin &&
  originRules.some((rule) => {
    if (rule.exact) return origin === rule.exact;
    const m = origin.match(/^https:\/\/([a-z0-9-]{1,63})\.([a-z0-9-]+)\.pages\.dev$/);
    return !!m && m[2] === rule.previewOf;
  });

// Câu hỏi dài quá thì cắt, tránh bị gửi cả trang văn bản để đốt tiền agent.
const MAX_MESSAGE_LENGTH = 1000;

// --- Chống lạm dụng ---------------------------------------------------------
// Chặn Origin chỉ ngăn trang KHÁC nhúng khung chat; ai viết script gọi thẳng
// vào đây vẫn giả được Origin. Nên đếm thêm số câu hỏi, giữ trong bộ nhớ của
// máy chủ (không cần database). Mỗi máy Cloud Run đếm riêng, khởi động lại là
// đếm từ đầu — đủ để chặn một người gửi liên tục, không phải hàng rào tuyệt
// đối. Hàng rào về tiền là `--max-instances` lúc deploy (xem HUONG-DAN.md).
//
// Số liệu chỉnh được bằng biến môi trường, không phải sửa code.
const RATE_LIMIT = Number(process.env.RATE_LIMIT_PER_IP) || 20; // câu hỏi…
const RATE_WINDOW_MS = (Number(process.env.RATE_WINDOW_MINUTES) || 10) * 60 * 1000; // …mỗi 10 phút
// Một cuộc trò chuyện dài bao nhiêu câu. Agent đọc lại cả lịch sử mỗi lần trả
// lời, nên phiên càng dài thì mỗi câu càng tốn tiền. Người thật hiếm khi hỏi
// quá vài chục câu; muốn hỏi tiếp thì bấm "Đoạn chat mới".
const MAX_TURNS_PER_SESSION = Number(process.env.MAX_TURNS_PER_SESSION) || 30;

const hitsByIp = new Map(); // ip → [thời điểm các lần hỏi gần đây]
const turnsBySession = new Map(); // mã phiên → { count, last }

/** Địa chỉ IP của người hỏi. Cloud Run ghi IP thật vào đầu X-Forwarded-For. */
const clientIp = (req) =>
  String(req.get("X-Forwarded-For") || "").split(",")[0].trim() || req.ip || "unknown";

/** true nếu IP này đã hỏi quá RATE_LIMIT câu trong RATE_WINDOW_MS vừa qua. */
const isRateLimited = (ip) => {
  const now = Date.now();
  const recent = (hitsByIp.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hitsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  hitsByIp.set(ip, recent);
  return false;
};

// Dọn bộ đếm cũ mỗi 10 phút, kẻo bộ nhớ phình dần theo số người ghé.
// unref(): không giữ tiến trình sống chỉ vì cái hẹn giờ này.
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of hitsByIp) {
    if (!times.some((t) => now - t < RATE_WINDOW_MS)) hitsByIp.delete(ip);
  }
  for (const [id, s] of turnsBySession) {
    if (now - s.last > 24 * 60 * 60 * 1000) turnsBySession.delete(id);
  }
}, 10 * 60 * 1000).unref();

const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });

// Chạy thử trên máy thì mượn quyền của tài khoản đã `gcloud auth login`.
// Quyền đó hết hạn sau một giờ nên lấy lại sau mỗi 45 phút. Trên Cloud Run
// (có biến K_SERVICE) thì không đi đường này — quyền lấy từ tài khoản dịch vụ.
const IS_LOCAL = !process.env.K_SERVICE;
let localToken = { value: "", expires: 0 };

const getLocalToken = () => {
  if (Date.now() < localToken.expires) return localToken.value;
  const value = execSync("gcloud auth print-access-token", { encoding: "utf8" }).trim();
  localToken = { value, expires: Date.now() + 45 * 60 * 1000 };
  return value;
};

const authHeaders = async () => {
  let token;
  if (IS_LOCAL) {
    token = getLocalToken();
  } else {
    const client = await auth.getClient();
    ({ token } = await client.getAccessToken());
  }
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

/**
 * Tạo phiên mới cho người đọc, trả về mã phiên.
 *
 * Dùng Sessions API của Agent Engine chứ không gọi class_method
 * "async_create_session": agent dựng bằng Agent Studio không mở phương thức
 * đó (gọi vào trả 404 — đã thử ngày 26/9/2026).
 */
const createSession = async (userId) => {
  const res = await fetch(`${ENGINE_URL}/sessions`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error(`create_session ${res.status}: ${await res.text()}`);
  // Kết quả là một "operation", mã phiên nằm trong tên:
  // projects/…/reasoningEngines/…/sessions/<MÃ PHIÊN>/operations/…
  const data = await res.json();
  const id = data.name?.match(/\/sessions\/([^/]+)/)?.[1];
  if (!id) throw new Error("create_session: không thấy mã phiên trong kết quả");
  return id;
};

/**
 * Gửi câu hỏi và gom chữ trả lời.
 *
 * Agent trả về một chuỗi sự kiện (gọi công cụ, kết quả công cụ, chữ trả
 * lời…), mỗi sự kiện một dòng JSON, có thể có tiền tố "data: " của SSE.
 * Chỉ lấy phần chữ do agent (role "model") nói ra, bỏ qua phần gọi công cụ.
 */
const streamQuery = async (userId, sessionId, message) => {
  const res = await fetch(`${ENGINE_URL}:streamQuery?alt=sse`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      class_method: "async_stream_query",
      input: { user_id: userId, session_id: sessionId, message },
    }),
  });
  if (!res.ok) {
    const err = new Error(`stream_query ${res.status}: ${await res.text()}`);
    err.status = res.status;
    throw err;
  }

  const raw = await res.text();
  const texts = [];
  for (let line of raw.split("\n")) {
    line = line.trim();
    if (line.startsWith("data:")) line = line.slice(5).trim();
    if (!line) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    // Lỗi bên trong agent (ví dụ không đọc được tài liệu) vẫn về với mã 200,
    // chỉ nằm trong một sự kiện có error_code — phải tự bắt.
    if (event.error_code) {
      throw new Error(`agent: ${event.error_message || event.error_code}`);
    }
    const content = event.content;
    if (!content || (content.role && content.role !== "model")) continue;
    for (const part of content.parts || []) {
      // part.thought là phần "suy nghĩ" nội bộ của mô hình, không cho người đọc thấy.
      if (typeof part.text === "string" && !part.thought) texts.push(part.text);
    }
  }
  return texts.join("").trim();
};

functions.http("chat", async (req, res) => {
  const origin = req.get("Origin") || "";
  const allowed = isAllowedOrigin(origin);
  if (allowed) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!allowed) return res.status(403).json({ error: "Origin not allowed" });
  if (isRateLimited(clientIp(req))) return res.status(429).json({ error: "Too many requests" });

  const message = String(req.body?.message || "").trim().slice(0, MAX_MESSAGE_LENGTH);
  // user_id do trình duyệt tự sinh (UUID ngẫu nhiên), không phải thông tin cá nhân.
  const userId = String(req.body?.user_id || "").slice(0, 64) || "web-anonymous";
  // Mã phiên chỉ nhận chữ, số, gạch — chuỗi lạ thì coi như chưa có, tạo phiên mới.
  let sessionId = String(req.body?.session_id || "");
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(sessionId)) sessionId = "";
  if (!message) return res.status(400).json({ error: "Empty message" });

  // Phiên đã quá dài: từ chối, khung chat sẽ hiện câu báo lỗi kèm số Zalo.
  const turns = sessionId ? turnsBySession.get(sessionId) : null;
  if (turns && turns.count >= MAX_TURNS_PER_SESSION) {
    return res.status(429).json({ error: "Session too long" });
  }

  try {
    if (!sessionId) sessionId = await createSession(userId);
    let reply;
    try {
      reply = await streamQuery(userId, sessionId, message);
    } catch (err) {
      console.warn("Hỏi lại một lần:", err.message);
      // Phiên cũ hết hạn phía agent thì tạo phiên mới rồi hỏi lại. Lỗi khác
      // (agent thỉnh thoảng không đọc được tài liệu) thì hỏi lại đúng phiên
      // đó — lần hai thường qua.
      if (err.status === 400 || err.status === 404) sessionId = await createSession(userId);
      reply = await streamQuery(userId, sessionId, message);
    }
    if (!reply) throw new Error("Agent không trả về chữ nào");
    const t = turnsBySession.get(sessionId) || { count: 0, last: 0 };
    turnsBySession.set(sessionId, { count: t.count + 1, last: Date.now() });
    res.json({ reply, session_id: sessionId });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Agent error" });
  }
});
