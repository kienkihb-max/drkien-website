// Máy chủ trung gian giữa khung chat trên web và Gemini (Vertex AI).
//
// Vì sao cần: gọi Gemini phải có quyền của tài khoản Google Cloud. Để quyền
// đó trong code web thì ai mở trang cũng lấy được và dùng Gemini bằng tiền
// của chủ site. File này chạy trên Cloud Run, tự lấy quyền từ tài khoản dịch
// vụ của Cloud Run — không có khoá nào nằm trong code hay trên trình duyệt.
//
// Trước đây máy chủ gọi agent dựng trong Agent Studio. Agent đó tự lên Google
// tìm và đọc trang web cho mỗi câu hỏi nên mất 20 giây đến vài phút một câu.
// Nay lời dặn và kiến thức website nằm ngay trong kho (prompt-mvp1.md,
// kien-thuc-website.md), máy chủ gửi thẳng cho Gemini: vài giây, rẻ hơn, và
// sửa lời dặn không phải bấm trên giao diện Google nữa.

import functions from "@google-cloud/functions-framework";
import { GoogleAuth } from "google-auth-library";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT = process.env.GEMINI_PROJECT || "warm-gantry-z0w9t";

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
// Một cuộc trò chuyện dài bao nhiêu câu (đếm theo lịch sử trình duyệt gửi
// lên). Chặn để một cửa sổ chat không bị dùng hỏi liên tục vô hạn. Người thật hiếm khi hỏi
// quá vài chục câu; muốn hỏi tiếp thì bấm "Đoạn chat mới".
const MAX_TURNS_PER_SESSION = Number(process.env.MAX_TURNS_PER_SESSION) || 30;

const hitsByIp = new Map(); // ip → [thời điểm các lần hỏi gần đây]

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

// --- Gọi Gemini ---------------------------------------------------------------
// Lời dặn = prompt-mvp1.md (bỏ khung chú thích đầu file) + kiến thức website
// sinh sẵn. Đọc một lần lúc máy chủ khởi động; sửa lời dặn thì đưa máy chủ
// lên lại. Hai file này PHẢI được gửi kèm khi deploy (xem .gcloudignore).
const HERE = dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT =
  readFileSync(join(HERE, "prompt-mvp1.md"), "utf8").replace(/^<!--[\s\S]*?-->\s*/, "").trim() +
  "\n\n" +
  readFileSync(join(HERE, "kien-thuc-website.md"), "utf8").trim();

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
// Mẫu dự phòng khi mẫu chính báo 429 "Resource exhausted" (quá tải/hết hạn
// mức — đã gặp trên web thật): cùng dòng, rẻ hơn, hạn mức tính riêng.
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";
const geminiUrl = (model) =>
  `https://aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/global` +
  `/publishers/google/models/${model}:streamGenerateContent?alt=sse`;

// Chỉ gửi kèm chừng này tin nhắn gần nhất làm ngữ cảnh. Gemini đọc lại cả
// lịch sử mỗi lần trả lời, gửi dài thì chậm và tốn tiền mà không giúp thêm.
const MAX_HISTORY_MESSAGES = 12;
const MAX_HISTORY_TEXT = 2000;

/** Lịch sử do trình duyệt gửi lên → định dạng của Gemini. Không tin dữ liệu
 *  gửi lên: chỉ nhận đúng hai vai, cắt độ dài, bỏ mục lạ. */
const toContents = (history, message) => {
  const contents = history
    .filter((m) => m && (m.role === "user" || m.role === "bot") && typeof m.text === "string")
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({
      role: m.role === "bot" ? "model" : "user",
      parts: [{ text: m.text.slice(0, MAX_HISTORY_TEXT) }],
    }));
  contents.push({ role: "user", parts: [{ text: message }] });
  return contents;
};

/**
 * Hỏi Gemini, gọi onText(đoạn chữ) mỗi khi có chữ mới về — để khung chat hiện
 * chữ dần, người đọc không phải nhìn ba chấm suốt cả câu trả lời.
 */
const askGemini = async (contents, onText) => {
  // Gemini thỉnh thoảng treo, không trả chữ nào (đã gặp khi chạy bộ câu thử:
  // treo tới hết 35 giây). Thường chữ đầu tiên về sau 2–6 giây, nên quá 9
  // giây chưa có chữ thì bỏ lần đó và hỏi lại ngay một lần — lần hai thường
  // trôi. Đã gửi chữ cho người đọc rồi thì không hỏi lại (sẽ lặp chữ).
  let sent = false;
  const relay = (text) => {
    sent = true;
    onText(text);
  };
  try {
    return await askGeminiOnce(MODEL, contents, relay, 9000);
  } catch (err) {
    if (sent) throw err;
    console.warn("Gemini chưa trả lời, hỏi lại một lần:", err.message);
    // Lỗi 429 "Resource exhausted": mẫu chính đang quá tải hoặc hết hạn mức
    // — hỏi lại mẫu đó thì dính tiếp, chuyển sang mẫu dự phòng.
    const model = /gemini 429/.test(err.message) ? FALLBACK_MODEL : MODEL;
    return await askGeminiOnce(model, contents, relay, 15000);
  }
};

/** Một lần hỏi Gemini. Hẹn giờ: quá firstWordMs mà chưa có chữ, hoặc cả
 *  câu quá 35 giây, thì bỏ. */
const askGeminiOnce = async (model, contents, onText, firstWordMs) => {
  const ctrl = new AbortController();
  const firstTimer = setTimeout(() => ctrl.abort(new Error("no first word")), firstWordMs);
  const totalTimer = setTimeout(() => ctrl.abort(new Error("total timeout")), 35000);
  try {
    return await streamGemini(model, contents, (text) => {
      clearTimeout(firstTimer);
      onText(text);
    }, ctrl.signal);
  } finally {
    clearTimeout(firstTimer);
    clearTimeout(totalTimer);
  }
};

const streamGemini = async (model, contents, onText, signal) => {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: {
      // Thấp để bám sát lời dặn, bớt bịa.
      temperature: 0.3,
      maxOutputTokens: 2048,
      // Nghĩ ít: câu hỏi của trang này đơn giản, nghĩ nhiều chỉ chậm thêm.
      thinkingConfig: { thinkingLevel: "LOW" },
    },
  });
  const call = async () =>
    fetch(geminiUrl(model), {
      method: "POST",
      signal,
      headers: await authHeaders(),
      body,
    });

  let res = await call();
  // Mã đăng nhập hết hạn hoặc hỏng (đã gặp khi chạy thử trên máy: giữ mã cũ
  // nên Google trả 401) — bỏ mã đang giữ, lấy mã mới, hỏi lại đúng một lần.
  if (res.status === 401) {
    localToken = { value: "", expires: 0 };
    res = await call();
  }
  if (!res.ok || !res.body) throw new Error(`gemini ${res.status}: ${await res.text()}`);

  const decoder = new TextDecoder();
  let buffer = "";
  let total = "";
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let nl;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      let event;
      try {
        event = JSON.parse(line.slice(5));
      } catch {
        continue;
      }
      for (const part of event.candidates?.[0]?.content?.parts || []) {
        // part.thought là phần "suy nghĩ" nội bộ của mô hình, không cho người đọc thấy.
        if (typeof part.text === "string" && part.text && !part.thought) {
          total += part.text;
          onText(part.text);
        }
      }
    }
  }
  if (!total.trim()) throw new Error("Gemini không trả về chữ nào");
  return total;
};

// --- Nhận câu hỏi ---------------------------------------------------------------
// Khuôn nói chuyện với khung chat (ChatWidget.astro):
//   gửi   POST { message, history: [{ role: "user" | "bot", text }], stream: true }
//   nhận  stream: true → chữ thô (text/plain) chảy dần tới khi xong
//         không có stream → JSON { reply } (khung chat bản cũ vẫn dùng được)
// Máy chủ không nhớ gì giữa các lần hỏi: trình duyệt tự gửi lại lịch sử.
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
  if (!message) return res.status(400).json({ error: "Empty message" });

  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  // Cuộc trò chuyện đã quá dài: từ chối, khung chat hiện câu báo lỗi kèm Zalo.
  if (history.filter((m) => m?.role === "user").length >= MAX_TURNS_PER_SESSION) {
    return res.status(429).json({ error: "Session too long" });
  }

  const contents = toContents(history, message);

  if (req.body?.stream !== true) {
    try {
      const reply = await askGemini(contents, () => {});
      return res.json({ reply: reply.trim() });
    } catch (err) {
      console.error(err);
      return res.status(502).json({ error: "Agent error" });
    }
  }

  let started = false;
  try {
    await askGemini(contents, (text) => {
      if (!started) {
        started = true;
        res.status(200);
        res.set("Content-Type", "text/plain; charset=utf-8");
        res.set("Cache-Control", "no-store");
        // Không để lớp trung gian nào gom chữ lại rồi mới gửi một lần.
        res.set("X-Accel-Buffering", "no");
      }
      res.write(text);
    });
    res.end();
  } catch (err) {
    console.error(err);
    // Chưa gửi chữ nào thì còn báo lỗi được; đã gửi dở thì chỉ đóng lại.
    if (!started) res.status(502).json({ error: "Agent error" });
    else res.end();
  }
});

