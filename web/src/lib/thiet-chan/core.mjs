// Các hàm thuần của app đọc lưỡi (không đụng DOM) — chuyển nguyên logic suy
// luận/ngưỡng từ app cũ; chỉ thêm cropBox và deriveConclusion.
import { FEATURES, GROUP, NORMAL, WEAK, RULES, KET_LUAN_TRONG, GOI_Y_TRONG, CAU_KHONG_PHAI_CHAN_DOAN } from "../../data/thiet-chan-dac-diem.mjs";

export const SIZE = 640, FLOOR = 0.2, IOU = 0.45, NO_TONGUE = 0.25;
// Nhãn 13-19 của mô hình là 7 lớp vùng tạng (thận, gan đởm, tỳ vị, tâm phế): chúng
// phủ cả khi ảnh không có lưỡi nên không dùng để quyết định "có lưỡi".
export const ZONE_FROM = 13;
// Nới khung crop 12% mỗi bên (trong khoảng 10-15%).
export const CROP_PAD = 0.12;
// Ba màu rêu loại trừ nhau; rêu bong là đặc điểm riêng.
export const COAT_COLORS = [9, 10, 11];

// Đầu ra YOLO11: mảng phẳng [1, 4 + số nhãn, số ô neo]; mỗi ô neo: cx, cy, w, h rồi điểm từng nhãn.
export function decode(data, dims, floor, zoneFrom = ZONE_FROM) {
  const C = dims[1], N = dims[2], nc = C - 4, out = [];
  let top = 0;
  const perClass = new Array(nc).fill(0);
  for (let i = 0; i < N; i++) {
    for (let c = 0; c < nc; c++) {
      const s = data[(4 + c) * N + i];
      if (c < zoneFrom && s > top) top = s;
      if (s > perClass[c]) perClass[c] = s;
      if (s < floor) continue;
      const cx = data[i], cy = data[N + i], w = data[2 * N + i], h = data[3 * N + i];
      out.push({ cls: c, score: s, x1: cx - w / 2, y1: cy - h / 2, x2: cx + w / 2, y2: cy + h / 2 });
    }
  }
  return { boxes: out, top, perClass };
}

// Trung bình điểm theo lớp giữa ảnh gốc và ảnh lật ngang (theo cấp ảnh: điểm cao nhất
// của mỗi lớp). Khung giữ nguyên từ ảnh không lật; mọi khung của lớp dời cùng một lượng
// (điểm cao nhất của lớp thành điểm trung bình). Không có khung thì không thêm lớp mới.
export function averageFlip(boxes, perClass, perClassFlip) {
  return boxes.map((b) => {
    const d = ((perClassFlip[b.cls] ?? 0) - (perClass[b.cls] ?? 0)) / 2;
    return { ...b, score: Math.max(0, b.score + d) };
  });
}

export function iou(a, b) {
  const x1 = Math.max(a.x1, b.x1), y1 = Math.max(a.y1, b.y1), x2 = Math.min(a.x2, b.x2), y2 = Math.min(a.y2, b.y2);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const u = (a.x2 - a.x1) * (a.y2 - a.y1) + (b.x2 - b.x1) * (b.y2 - b.y1) - inter;
  return u > 0 ? inter / u : 0;
}

export function nms(boxes, thr) {
  const keep = [];
  boxes.slice().sort((a, b) => b.score - a.score).forEach((b) => {
    if (!keep.some((k) => k.cls === b.cls && iou(k, b) > thr)) keep.push(b);
  });
  return keep;
}

// Từ các khung đã lọc -> danh sách đặc điểm để hiển thị (mỗi nhãn một dòng, điểm cao nhất)
export function interpret(boxes) {
  const best = new Map();
  boxes.forEach((b) => {
    const f = FEATURES[b.cls];
    if (!f || b.score < f.lo) return;
    if (!best.has(b.cls) || best.get(b.cls).score < b.score) best.set(b.cls, b);
  });
  // Chỉ giữ một màu rêu có điểm cao nhất.
  const coats = COAT_COLORS.filter((k) => best.has(k));
  if (coats.length > 1) {
    const win = coats.reduce((a, k) => (best.get(k).score > best.get(a).score ? k : a));
    coats.forEach((k) => { if (k !== win) best.delete(k); });
  }
  return [...best.values()].map((b) => {
    const f = FEATURES[b.cls];
    return { cls: b.cls, score: b.score, box: b, ...f, level: b.score >= f.hi ? "rõ" : "có thể" };
  }).sort((a, b) => (a.tier > b.tier) - (a.tier < b.tier) || b.score - a.score);
}

// Khung bao nguyên cái lưỡi: gộp mọi khung đủ tin cậy (kể cả nhãn "lưỡi bình
// thường" và vùng tạng phủ, vốn không hiển thị nhưng phủ đúng thân lưỡi), nới
// CROP_PAD mỗi bên cho khỏi cắt sát. Trả null nếu không có khung nào.
export function cropBox(boxes, width, height, minScore = NO_TONGUE, pad = CROP_PAD) {
  const hit = boxes.filter((b) => b.score >= minScore);
  if (!hit.length) return null;
  const x1 = Math.min(...hit.map((b) => b.x1)), y1 = Math.min(...hit.map((b) => b.y1));
  const x2 = Math.max(...hit.map((b) => b.x2)), y2 = Math.max(...hit.map((b) => b.y2));
  const px = (x2 - x1) * pad, py = (y2 - y1) * pad;
  const r = {
    x1: Math.max(0, x1 - px), y1: Math.max(0, y1 - py),
    x2: Math.min(width, x2 + px), y2: Math.min(height, y2 + py),
  };
  return r.x2 - r.x1 < 2 || r.y2 - r.y1 < 2 ? null : r;
}

// Kết luận ngắn + gợi ý biện chứng từ các đặc điểm đã đọc (bảng RULES).
export function deriveConclusion(findings) {
  const left = new Set(findings.map((f) => f.cls));
  const used = [];
  [...RULES].sort((a, b) => b.can.length - a.can.length).forEach((r) => {
    if (r.can.every((c) => left.has(c))) { r.can.forEach((c) => left.delete(c)); used.push(r); }
  });
  if (!used.length) return { ketLuan: [KET_LUAN_TRONG], goiY: [GOI_Y_TRONG], coBatThuong: false };
  return { ketLuan: used.map((r) => r.ket_luan), goiY: used.map((r) => r.goi_y), coBatThuong: true };
}

export function buildReport(findings, quality, patient, when, version) {
  const L = [];
  const kl = deriveConclusion(findings);
  L.push("BÁO CÁO HÌNH ẢNH LƯỠI (AI mô tả, chờ bác sĩ xác nhận)");
  if (patient.name) L.push("Họ tên: " + patient.name);
  if (patient.year) L.push("Năm sinh: " + patient.year);
  L.push("Thời gian: " + when);
  L.push("Chất lượng ảnh: " + (quality.length ? quality.join("; ") : "đạt"));
  L.push("");
  L.push("AI mô tả:");
  Object.entries(GROUP).forEach(([g, label]) => {
    const fs = findings.filter((f) => f.group === g);
    if (!fs.length) L.push(`- ${label}: ${NORMAL[g]} (không thấy dấu hiệu bất thường)`);
    else fs.forEach((f) => L.push(`- ${label}: ${f.name} – ${f.level} (điểm ${f.score.toFixed(2).replace(".", ",")})${f.tier === "B" ? ", AI còn hay nhầm" : ""}`));
  });
  L.push("AI không đánh giá: " + WEAK.join(", ").toLowerCase());
  L.push("");
  L.push("Kết luận ngắn: " + kl.ketLuan.join("; "));
  L.push("Gợi ý biện chứng (để bác sĩ tham khảo):");
  kl.goiY.forEach((g) => L.push("- " + g));
  L.push(CAU_KHONG_PHAI_CHAN_DOAN);
  if (patient.note) { L.push(""); L.push("Câu hỏi của người bệnh: " + patient.note); }
  L.push("");
  L.push("Mô hình " + version + ", học từ bộ TCM-Tongue. Đây không phải chẩn đoán.");
  return L.join("\n");
}
