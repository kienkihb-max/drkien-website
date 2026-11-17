// Chấm chất lượng ảnh lưỡi: độ nét, độ sáng, cháy sáng, độ phân giải.
//
// File này THUẦN TÍNH TOÁN — không đụng DOM, không đụng OpenCV — để chạy được
// cả trong trình duyệt lẫn trong `npm test`. Phần đo bằng OpenCV.js nằm ở
// analyze-image.mjs; nó chỉ việc đo ra số rồi đưa vào evaluateQuality() ở đây.
//
// NGƯỠNG DƯỚI ĐÂY LÀ NGƯỠNG TẠM, chỉnh theo ảnh tổng hợp. Cần chỉnh lại sau
// khi có ảnh lưỡi thật (đã được đồng ý) chụp bằng nhiều dòng điện thoại — đổi
// số ở đây là xong, không phải sửa chỗ nào khác.

/** Mọi phép đo độ nét đều làm trên ảnh đã thu về cạnh dài này, để số không phụ thuộc cỡ ảnh gốc. */
export const ANALYSIS_SIZE = 640;

export const THRESHOLDS = {
  // Phương sai Laplacian (càng cao càng nét).
  blur: { retake: 40, warning: 90 },
  // Độ sáng trung bình 0–255.
  brightnessLow: { retake: 55, warning: 85 },
  brightnessHigh: { retake: 225, warning: 200 },
  // Tỉ lệ điểm ảnh gần trắng tuyệt đối (cháy sáng).
  // Hạ từ 0.3/0.1: ca thử có 28% cháy sáng mà chỉ bị WARNING, trong khi vùng
  // cháy là vùng mất hẳn màu lưỡi nên phải chặn sớm hơn.
  overexposedFraction: { retake: 0.2, warning: 0.08 },
  // Cạnh ngắn của ảnh gốc, tính bằng px.
  resolution: { retake: 480, warning: 720 },
};

/** Điểm ảnh xám từ mức này trở lên coi là cháy sáng. */
export const OVEREXPOSED_LEVEL = 245;

const ORDER = { PASS: 0, WARNING: 1, RETAKE: 2 };

/** Lấy mức xấu nhất trong danh sách. */
export function worstLevel(levels) {
  return levels.reduce((a, b) => (ORDER[b] > ORDER[a] ? b : a), "PASS");
}

/**
 * Đo thuần JS trên ảnh xám. Dùng khi OpenCV.js chưa tải được (mạng yếu, bị
 * chặn) — cùng công thức nên kết quả gần như trùng với OpenCV.
 * @param {Uint8Array|Uint8ClampedArray} gray  w*h giá trị 0–255
 * @returns {{laplacianVariance:number, brightness:number, overexposedFraction:number}}
 */
export function measureGray(gray, w, h) {
  let sum = 0;
  let over = 0;
  for (let i = 0; i < gray.length; i++) {
    sum += gray[i];
    if (gray[i] >= OVEREXPOSED_LEVEL) over++;
  }

  // Laplacian 4 hàng xóm, bỏ viền 1px; phương sai của đáp ứng.
  let lSum = 0;
  let lSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v = gray[i - w] + gray[i + w] + gray[i - 1] + gray[i + 1] - 4 * gray[i];
      lSum += v;
      lSq += v * v;
      n++;
    }
  }
  const mean = n ? lSum / n : 0;
  return {
    laplacianVariance: n ? lSq / n - mean * mean : 0,
    brightness: sum / gray.length,
    overexposedFraction: over / gray.length,
  };
}

/** Mức theo ngưỡng "càng thấp càng xấu". */
function levelLow(value, t) {
  return value < t.retake ? "RETAKE" : value < t.warning ? "WARNING" : "PASS";
}
/** Mức theo ngưỡng "càng cao càng xấu". */
function levelHigh(value, t) {
  return value > t.retake ? "RETAKE" : value > t.warning ? "WARNING" : "PASS";
}

/**
 * Từ các số đo ra kết luận PASS / WARNING / RETAKE kèm lý do cụ thể.
 * @param {{laplacianVariance:number, brightness:number, overexposedFraction:number,
 *          width:number, height:number}} m
 * @returns {{verdict:"PASS"|"WARNING"|"RETAKE", checks:Array, reasons:string[]}}
 */
export function evaluateQuality(m) {
  const T = THRESHOLDS;
  const shortSide = Math.min(m.width, m.height);

  // Độ sáng xét cả hai phía: thiếu sáng và quá sáng là hai lỗi khác nhau,
  // lời khuyên cũng khác nhau.
  const lowLevel = levelLow(m.brightness, T.brightnessLow);
  const highLevel = levelHigh(m.brightness, T.brightnessHigh);
  const brightnessLevel = worstLevel([lowLevel, highLevel]);
  const brightnessTooLow = ORDER[lowLevel] >= ORDER[highLevel];

  // Ảnh tối thì chênh lệch điểm ảnh nhỏ theo, phương sai Laplacian thấp dù ảnh
  // không hề mờ. Khi đã phải chụp lại vì thiếu sáng thì bỏ qua độ nét, để người
  // dùng chỉ nhận một lời khuyên đúng (thêm sáng) thay vì thêm lời "mờ" oan.
  const darkRetake = lowLevel === "RETAKE";

  const checks = [
    {
      id: "blur",
      label: "Độ nét",
      level: darkRetake ? "PASS" : levelLow(m.laplacianVariance, T.blur),
      value: Math.round(m.laplacianVariance),
      okText: darkRetake ? "Chưa đo được độ nét vì ảnh quá tối." : "Ảnh nét.",
      badText: `Ảnh bị mờ (độ nét ${Math.round(m.laplacianVariance)}, cần từ ${T.blur.warning}). Giữ máy thật vững, chạm vào lưỡi trên màn hình để lấy nét rồi chụp lại.`,
    },
    {
      id: "brightness",
      label: "Độ sáng",
      level: brightnessLevel,
      value: Math.round(m.brightness),
      okText: "Đủ sáng.",
      badText: brightnessTooLow
        ? `Ảnh thiếu sáng (độ sáng ${Math.round(m.brightness)}/255). Ra chỗ có ánh sáng ban ngày hoặc bật đèn rồi chụp lại.`
        : `Ảnh quá sáng (độ sáng ${Math.round(m.brightness)}/255). Tránh đèn chiếu thẳng vào mặt, giảm ánh sáng rồi chụp lại.`,
    },
    {
      id: "overexposure",
      label: "Cháy sáng",
      level: levelHigh(m.overexposedFraction, T.overexposedFraction),
      value: Math.round(m.overexposedFraction * 100),
      okText: "Không có vùng cháy sáng.",
      badText: `${Math.round(m.overexposedFraction * 100)}% ảnh bị cháy sáng (trắng xóa, mất màu lưỡi). Tắt đèn flash, tránh phản chiếu ánh sáng rồi chụp lại.`,
    },
    {
      id: "resolution",
      label: "Độ phân giải",
      level: levelLow(shortSide, T.resolution),
      value: shortSide,
      okText: `Đủ chi tiết (${m.width}×${m.height}px).`,
      badText: `Ảnh quá nhỏ (${m.width}×${m.height}px, cạnh ngắn cần từ ${T.resolution.warning}px). Chụp lại ở chế độ ảnh gốc, đừng dùng ảnh đã bị nén qua Zalo/Messenger.`,
    },
  ];

  for (const c of checks) {
    c.message = c.level === "PASS" ? c.okText : c.badText;
    delete c.okText;
    delete c.badText;
  }

  return {
    verdict: worstLevel(checks.map((c) => c.level)),
    checks,
    reasons: checks.filter((c) => c.level !== "PASS").map((c) => c.message),
  };
}
