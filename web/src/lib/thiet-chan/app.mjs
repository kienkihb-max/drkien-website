// Phần chạy trong trình duyệt của trang /thiet-chan: nạp mô hình, suy luận,
// crop lưỡi, vẽ kết quả, gửi bác sĩ. Hàm thuần nằm ở core.mjs.
import {
  SIZE, FLOOR, IOU, NO_TONGUE, decode, nms, interpret, cropBox, averageFlip, deriveConclusion, buildReport,
} from "./core.mjs";
import { measureGray, evaluateQuality, ANALYSIS_SIZE } from "../tongue/quality.mjs";
import { GROUP, NORMAL, CAU_KHONG_PHAI_CHAN_DOAN } from "../../data/thiet-chan-dac-diem.mjs";

const root = document.querySelector(".tc-app");
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const show = (id) => ["s-start", "s-busy", "s-nolip", "s-result"].forEach((s) => { $(s).hidden = s !== id; });
const status = (t, err) => { $("status").textContent = t; $("status").classList.toggle("err", !!err); };
const toast = (t) => {
  const e = $("toast"); e.textContent = t; e.hidden = false;
  clearTimeout(e._t); e._t = setTimeout(() => { e.hidden = true; }, 4500);
};
const MODEL = root.dataset.model, VERSION = root.dataset.version, ZALO = root.dataset.zalo;
const GROUP_COLOR = { chat: "#b4482b", hinh: "#5b52c4", reu: "#1a8a68" };

// Header cố định cao ~84px: cuộn để đầu khối đọc lưỡi nằm ngay dưới header.
const toTop = () => window.scrollTo({ top: $("doc-luoi").getBoundingClientRect().top + scrollY - 90, behavior: "instant" });

let session = null, state = null, showBoxes = true;

if (typeof ort === "undefined") {
  status("Không tải được thư viện xử lý ảnh. Kiểm tra kết nối mạng rồi tải lại trang.", true);
} else {
  ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/";
  ort.InferenceSession.create(MODEL, { executionProviders: ["wasm"] })
    .then((s) => { session = s; status("Sẵn sàng."); })
    .catch((e) => { console.error(e); status("Không tải được mô hình. Hãy tải lại trang; nếu vẫn lỗi, báo cho bác sĩ.", true); });
}

function letterbox(img) {
  const scale = Math.min(SIZE / img.width, SIZE / img.height);
  const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
  const padX = (SIZE - w) / 2, padY = (SIZE - h) / 2;
  const c = document.createElement("canvas"); c.width = c.height = SIZE;
  const g = c.getContext("2d");
  g.fillStyle = "rgb(114,114,114)"; g.fillRect(0, 0, SIZE, SIZE);
  g.drawImage(img, padX, padY, w, h);
  const px = g.getImageData(0, 0, SIZE, SIZE).data, area = SIZE * SIZE, t = new Float32Array(3 * area);
  for (let i = 0; i < area; i++) { t[i] = px[i * 4] / 255; t[area + i] = px[i * 4 + 1] / 255; t[2 * area + i] = px[i * 4 + 2] / 255; }
  return { tensor: new ort.Tensor("float32", t, [1, 3, SIZE, SIZE]), scale, padX, padY };
}

// Chấm ảnh bằng bộ đo của tính năng chụp ảnh lưỡi (độ nét, sáng, cháy sáng, phân giải).
// Đo thuần JS trên bản thu về cạnh dài ANALYSIS_SIZE; độ phân giải tính theo ảnh gốc.
function checkQuality(img, photo) {
  const k = Math.min(1, ANALYSIS_SIZE / Math.max(photo.width, photo.height));
  const w = Math.max(1, Math.round(photo.width * k)), h = Math.max(1, Math.round(photo.height * k));
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(photo, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data, gray = new Uint8ClampedArray(w * h);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) gray[j] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  return evaluateQuality({ ...measureGray(gray, w, h), width: img.width, height: img.height });
}

const NOLIP_DEFAULT = { title: $("nolip-title").textContent, text: $("nolip-text").textContent };
function showRetake(title, text) {
  $("nolip-title").textContent = title; $("nolip-text").textContent = text; show("s-nolip");
}

// Thu nhỏ ảnh gốc (cạnh dài tối đa 1600px) để vẽ và gửi
function normalize(img) {
  const k = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return c;
}

// Cắt ảnh theo khung lưỡi; dời các khung đặc điểm về hệ toạ độ ảnh đã cắt.
function cropPhoto(photo, box, findings) {
  if (!box) return { photo, findings };
  const x = Math.round(box.x1), y = Math.round(box.y1);
  const w = Math.round(box.x2 - box.x1), h = Math.round(box.y2 - box.y1);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  c.getContext("2d").drawImage(photo, x, y, w, h, 0, 0, w, h);
  const shifted = findings.map((f) => ({ ...f, box: {
    ...f.box, x1: Math.max(0, f.box.x1 - x), y1: Math.max(0, f.box.y1 - y),
    x2: Math.min(w, f.box.x2 - x), y2: Math.min(h, f.box.y2 - y),
  } }));
  return { photo: c, findings: shifted };
}

function draw() {
  const { photo, findings } = state, cv = $("cv"), ctx = cv.getContext("2d");
  cv.width = photo.width; cv.height = photo.height; ctx.drawImage(photo, 0, 0);
  $("boxBtn").textContent = showBoxes ? "Ẩn khung" : "Hiện khung";
  $("boxBtn").hidden = !findings.length;
  if (!showBoxes) return;
  const fs = Math.max(16, photo.width / 32), lh = fs + 10, lw = Math.max(3, photo.width / 250), placed = [];
  ctx.font = `600 ${fs}px system-ui, sans-serif`; ctx.lineWidth = lw;
  findings.forEach((f) => {
    const b = f.box, col = GROUP_COLOR[f.group];
    ctx.strokeStyle = col; ctx.setLineDash(f.level === "rõ" ? [] : [lw * 3, lw * 2]);
    ctx.strokeRect(b.x1, b.y1, b.x2 - b.x1, b.y2 - b.y1); ctx.setLineDash([]);
    const tw = ctx.measureText(f.name).width + 14;
    const x = Math.min(Math.max(0, b.x1), photo.width - tw);
    let top = Math.max(0, b.y1 - lh);
    while (placed.some((r) => x < r.x + r.w && r.x < x + tw && top < r.y + lh && r.y < top + lh)) top += lh;
    placed.push({ x, y: top, w: tw });
    ctx.fillStyle = col; ctx.fillRect(x, top, tw, lh);
    ctx.fillStyle = "#fff"; ctx.fillText(f.name, x + 7, top + lh - 8);
  });
}

function render() {
  const { findings, quality } = state;
  $("quality").hidden = !quality.length;
  $("quality").textContent = quality.length ? "Lưu ý về ảnh: " + quality.join(" ") + " Kết quả có thể kém chính xác, nên chụp lại nếu được." : "";
  const kl = deriveConclusion(findings);
  $("conclusion").textContent = kl.ketLuan.join(" · ");
  $("conclusion").parentElement.classList.toggle("tca-conclusion-ok", !kl.coBatThuong);
  $("bienChung").innerHTML = kl.goiY.map((g) => `<li>${esc(g)}</li>`).join("");
  $("disclaimer").textContent = CAU_KHONG_PHAI_CHAN_DOAN;
  $("summary").innerHTML = Object.entries(GROUP).map(([g, label]) => {
    const fs = findings.filter((f) => f.group === g);
    return `<dt>${label}</dt><dd>${fs.length
      ? fs.map((f) => `<span class="tca-chip tca-chip-${g}">${esc(f.name)} <small>· ${f.level === "rõ" ? "thấy rõ" : "có thể có"}</small>${f.tier === "B" ? '<em title="AI còn hay nhầm đặc điểm này, cần bác sĩ xác nhận">AI hay nhầm</em>' : ""}</span>`).join("")
      : `<span class="tca-chip tca-chip-normal">${NORMAL[g]}</span><small class="tca-none">không thấy bất thường</small>`}</dd>`;
  }).join("");
  draw();
}

// Chạy mô hình trên một ảnh; trả về khung (toạ độ ảnh đưa vào) và điểm cao nhất của các nhãn không phải vùng tạng.
async function detect(photo, flip = false) {
  let src = photo;
  if (flip) {
    src = document.createElement("canvas"); src.width = photo.width; src.height = photo.height;
    const x = src.getContext("2d"); x.translate(photo.width, 0); x.scale(-1, 1); x.drawImage(photo, 0, 0);
  }
  const { tensor, scale, padX, padY } = letterbox(src);
  const out = await session.run({ [session.inputNames[0]]: tensor });
  const o = out[session.outputNames[0]];
  const { boxes, top, perClass } = decode(o.data, o.dims, FLOOR);
  const mapped = nms(boxes, IOU).map((b) => ({ ...b,
    x1: Math.max(0, (b.x1 - padX) / scale), y1: Math.max(0, (b.y1 - padY) / scale),
    x2: Math.min(photo.width, (b.x2 - padX) / scale), y2: Math.min(photo.height, (b.y2 - padY) / scale) }));
  return { mapped, top, perClass };
}

async function analyze(file) {
  if (!file) return;
  if (!session) { status("Mô hình chưa tải xong, vui lòng đợi vài giây.", true); return; }
  show("s-busy");
  try {
    const img = new Image(); img.src = URL.createObjectURL(file); await img.decode();
    const photo = normalize(img);
    const q = checkQuality(img, photo);
    if (q.verdict === "RETAKE") { showRetake("Ảnh chưa đủ rõ để đọc", q.reasons.join(" ")); return; }
    const first = await detect(photo);
    if (first.top < NO_TONGUE) { showRetake(NOLIP_DEFAULT.title, NOLIP_DEFAULT.text); return; }
    // Lần 1 chỉ để tìm vùng lưỡi; lần 2 chạy trên ảnh đã cắt và là kết quả hiển thị.
    const box = cropBox(first.mapped, photo.width, photo.height);
    const t0 = performance.now();
    let cropped = cropPhoto(photo, box, interpret(first.mapped));
    if (box) {
      const second = await detect(cropped.photo);
      if (second.top >= NO_TONGUE) {
        // Lần 3: ảnh crop lật ngang, lấy trung bình điểm theo lớp; khung vẫn của ảnh không lật.
        const flipped = await detect(cropped.photo, true);
        const mapped = averageFlip(second.mapped, second.perClass, flipped.perClass);
        cropped = { photo: cropped.photo, findings: interpret(mapped) };
      }
      console.info("[thiet-chan] lần 2+lật trên ảnh crop: " + Math.round(performance.now() - t0) + " ms");
    }
    state = { photo: cropped.photo, findings: cropped.findings, quality: q.reasons, when: new Date() };
    showBoxes = true; render(); show("s-result");
    toTop();
  } catch (e) {
    console.error(e); show("s-start"); status("Có lỗi khi phân tích ảnh. Hãy thử ảnh khác.", true);
  }
}

function report() {
  const p = { name: $("pName").value.trim(), year: $("pYear").value.trim(), note: $("pNote").value.trim() };
  const when = state.when.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
  return buildReport(state.findings, state.quality, p, when, VERSION);
}

async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch {
    const a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select();
    const ok = document.execCommand("copy"); a.remove(); return ok;
  }
}

async function send() {
  const text = report(); await copyText(text);
  const blob = await new Promise((r) => state.photo.toBlob(r, "image/jpeg", 0.9));
  const file = new File([blob], "anh-luoi.jpg", { type: "image/jpeg" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text, title: "Báo cáo hình ảnh lưỡi" });
      toast("Bản mô tả cũng đã được sao chép. Nếu ứng dụng chỉ gửi ảnh, hãy dán thêm vào tin nhắn.");
    } catch (e) { if (e.name !== "AbortError") toast('Không gửi được. Hãy dùng nút "Sao chép bản mô tả".'); }
  } else {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "anh-luoi.jpg"; a.click();
    toast("Đã lưu ảnh và sao chép bản mô tả. Hãy gửi ảnh và dán bản mô tả cho bác sĩ qua Zalo.");
    setTimeout(() => window.open(ZALO, "_blank", "noopener"), 800);
  }
}

const onFile = (e) => { analyze(e.target.files[0]); e.target.value = ""; };
$("cam").addEventListener("change", onFile);
$("pick").addEventListener("change", onFile);
$("boxBtn").addEventListener("click", () => { showBoxes = !showBoxes; draw(); });
$("sendBtn").addEventListener("click", () => send().catch(console.error));
$("copyBtn").addEventListener("click", async () => toast(await copyText(report()) ? "Đã sao chép bản mô tả." : "Không sao chép được."));
document.querySelectorAll("[data-retake]").forEach((b) => b.addEventListener("click", () => {
  show("s-start"); toTop();
}));
