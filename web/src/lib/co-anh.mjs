// Đo kích thước thật của ảnh chia sẻ, lúc build.
//
// Thẻ og:image:width / og:image:height phải khớp kích thước THẬT của ảnh.
// Ghi cứng một cỡ cho mọi trang là sai ở gần như mọi trang: bộ ảnh của site
// đang có đủ loại, từ 565x353 tới 1200x1448. Facebook dựa vào hai số này để
// dựng khung xem trước, lệch thì ảnh bị méo hoặc cắt sai chỗ.
//
// Đo từ file thay vì lưu vào database: chủ site đổi ảnh là số tự đúng theo,
// không có cách nào để hai thứ lệch nhau.

import { imageSize } from "image-size";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Bám vào thư mục chạy lệnh, KHÔNG dùng import.meta.url: lúc Astro build
// thì Vite đóng gói lại module này và import.meta.url trỏ sang chỗ khác,
// làm mọi phép đo trượt về cỡ mặc định mà chỉ có dòng cảnh báo báo cho biết.
const PUBLIC = join(process.cwd(), "public");

// Cỡ dùng khi không đo được. 1200x630 là tỉ lệ Facebook ưa nhất, nên nếu
// có sai thì cũng sai về phía an toàn.
const MAC_DINH = { rong: 1200, cao: 630 };

const nho = new Map();

// duongDanAnh() và laAnhNgoai() nay ở dia-chi-anh.mjs — trình duyệt cũng
// cần chúng, mà nạp file này vào trình duyệt thì chết vì node:fs bên trên.
// Xuất lại ở đây để mấy trang dựng phía máy chủ vẫn import một chỗ như cũ.
//
// CHỖ DÙNG PHÍA TRÌNH DUYỆT PHẢI IMPORT THẲNG "dia-chi-anh.mjs", đừng qua
// file này.
export { duongDanAnh, laAnhNgoai } from "./dia-chi-anh.mjs";

/**
 * @param {string} duong_dan Đường dẫn ảnh trong site, ví dụ "assets/img/a.jpg"
 * @returns {{rong: number, cao: number}}
 */
export function coAnh(duong_dan) {
  if (!duong_dan) return MAC_DINH;
  const sach = duong_dan.replace(/^\//, "");
  if (nho.has(sach)) return nho.get(sach);

  let ket = MAC_DINH;
  try {
    const { width, height } = imageSize(readFileSync(join(PUBLIC, sach)));
    if (width && height) ket = { rong: width, cao: height };
  } catch {
    // Ảnh thiếu hoặc định dạng lạ. Không dừng build vì một tấm ảnh, nhưng
    // phải kêu lên — thẻ og sai thì không có gì báo cho biết cả.
    console.warn(`[cỡ ảnh] không đo được "${sach}", dùng ${MAC_DINH.rong}x${MAC_DINH.cao}`);
  }

  nho.set(sach, ket);
  return ket;
}
