// Chép tài nguyên tĩnh từ gốc repo sang web/public trước mỗi lần chạy.
//
// Vì sao phải có file này: ảnh, style.css, favicon… đã nằm sẵn ở gốc repo
// (site cũ đang chạy bằng chúng). Astro thì đòi tài nguyên nằm trong
// web/public. Chép tay một bản thứ hai rồi commit cả hai là kho phình thêm
// 36MB và từ đó có HAI bản của mỗi tấm ảnh — sửa một bản thì bản kia lệch,
// đúng cái lỗi mà CLAUDE.md cấm.
//
// Nên: gốc repo là nguồn duy nhất, web/public chỉ là bản sao tạm do máy tạo
// và đã bị .gitignore bỏ qua.
//
// Chạy tự động qua "predev" và "prebuild" trong package.json.

import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const THU_MUC_WEB = dirname(fileURLToPath(import.meta.url));
const GOC = join(THU_MUC_WEB, "..");
const DICH = join(THU_MUC_WEB, "public");

// Thứ cần chép sang. Thêm tài nguyên mới thì khai báo ở đây.
const CAN_CHEP = [
  "style.css",
  "admin.css",
  "favicon.ico",
  "favicon.svg",
  "robots.txt",
  "CNAME",
  "googlea4e3191517fb9432.html",
  "assets",
  "image",
  // Mấy file JS còn chạy phía trình duyệt, chưa chuyển thành component Astro.
  "lightbox.js",
  "script.js",
  "icons.js",
  "doc-them.js",
  "sticky-cta.js",
  "blog-byline.js",
  // Trình soạn thảo của trang quản trị, dùng lại nguyên xi.
  "admin-soan-thao.js",
  "admin-bai-viet.js",
];

await mkdir(DICH, { recursive: true });

let chep = 0;
let thieu = [];
for (const ten of CAN_CHEP) {
  const tu = join(GOC, ten);
  if (!existsSync(tu)) {
    thieu.push(ten);
    continue;
  }
  await cp(tu, join(DICH, ten), { recursive: true });
  chep++;
}

console.log(`[đồng bộ tĩnh] đã chép ${chep} mục sang web/public`);
if (thieu.length) {
  // Không dừng build: thiếu một file lẻ thì trang vẫn chạy, chỉ hỏng đúng
  // chỗ dùng nó. Nhưng phải kêu lên, kẻo lỗi 404 âm thầm.
  console.warn(`[đồng bộ tĩnh] KHÔNG TÌM THẤY: ${thieu.join(", ")}`);
}
