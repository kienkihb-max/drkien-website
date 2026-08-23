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

import { cp, mkdir, readdir, rename, writeFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const THU_MUC_WEB = dirname(fileURLToPath(import.meta.url));
const GOC = join(THU_MUC_WEB, "..");
const DICH = join(THU_MUC_WEB, "public");

// Thứ cần chép sang. Thêm tài nguyên mới thì khai báo ở đây.
const CAN_CHEP = [
  "style.css",
  "admin.css",
  // Hai file này còn chạy phía trình duyệt và cần window.THONG_TIN, do
  // thong-tin.js sinh ra bên dưới cấp cho.
  "seo-schema.js",
  "service-cards.js",
  "favicon.ico",
  "robots.txt",
  // Không còn CNAME: file đó là cách GitHub Pages nhận tên miền riêng. Web
  // nay chạy trên Cloudflare Pages, tên miền khai trong bảng điều khiển của
  // Cloudflare chứ không phải bằng file trong kho mã.
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

/**
 * Chỉ chép file nào thật sự đổi.
 *
 * KHÔNG phải để chạy nhanh hơn — mà vì ghi đè một file y hệt cũng đủ làm gãy
 * "astro dev" đang chạy: Vite đang theo dõi file đó, ghi đè lên nó thì nó
 * ném "EBUSY: resource busy or locked, watch ...", rồi từ đó không phục vụ
 * file ấy nữa. Trình duyệt nhận 404, mà 404 của một file .css thì trang chỉ
 * mất giao diện chứ chẳng báo lỗi gì — mất cả buổi mới lần ra.
 *
 * So bằng cỡ file và giờ sửa, không đọc nội dung: thư mục image/ 31MB, băm
 * nội dung mỗi lần build là chậm hơn hẳn cái nó tiết kiệm được.
 */
function canChep(tu, den) {
  try {
    const a = statSync(tu);
    if (a.isDirectory()) return true;
    const b = statSync(den);
    return !(a.size === b.size && Math.abs(a.mtimeMs - b.mtimeMs) < 1000);
  } catch {
    // Bên đích chưa có gì thì cứ chép.
    return true;
  }
}

/**
 * Chép một file bằng cách ghi ra file tạm rồi ĐỔI TÊN đè lên.
 *
 * Ghi thẳng đè lên file cũ là ghi từng phần vào đúng cái file mà Vite đang
 * theo dõi — nó ném EBUSY rồi bỏ luôn không phục vụ file đó nữa. Đổi tên là
 * một thao tác duy nhất, không đụng vào file cũ trong lúc ghi, nên Vite chỉ
 * thấy "file này vừa thay" và theo dõi tiếp bình thường.
 */
async function chepMotFile(tu, den) {
  const tam = den + ".dang-chep";
  await cp(tu, tam, { preserveTimestamps: true });
  await rename(tam, den);
}

/** Chép cả cây thư mục, mỗi file đi qua chepMotFile. */
async function chepCay(tu, den) {
  if (!statSync(tu).isDirectory()) {
    if (canChep(tu, den)) await chepMotFile(tu, den);
    return;
  }
  await mkdir(den, { recursive: true });
  for (const muc of await readdir(tu, { withFileTypes: true })) {
    await chepCay(join(tu, muc.name), join(den, muc.name));
  }
}

let chep = 0;
let thieu = [];
for (const ten of CAN_CHEP) {
  const tu = join(GOC, ten);
  if (!existsSync(tu)) {
    thieu.push(ten);
    continue;
  }
  await chepCay(tu, join(DICH, ten));
  chep++;
}

// ——— Sinh thong-tin.js cho trình duyệt ———
// KHÔNG chép thong-tin.js của site cũ sang: file đó chứa sẵn số Zalo và địa
// chỉ, chép qua là có hai bản cùng một thông tin, sửa một bản thì bản kia
// lệch mà không ai biết. Thay vào đó sinh nó ra từ src/data/thong-tin.mjs —
// nguồn duy nhất mà header, footer và các trang Astro cũng đang dùng.
const TT = await import("./src/data/thong-tin.mjs");

const js_thong_tin = `// FILE NÀY DO MÁY SINH RA — đừng sửa ở đây.
// Sửa nội dung tại web/src/data/thong-tin.mjs rồi chạy lại build.
//
// Có mặt là để mấy script còn chạy phía trình duyệt (seo-schema.js,
// service-cards.js) đọc được thông tin phòng khám qua window.THONG_TIN.
(function () {
  var TT = ${JSON.stringify(
    {
      DIA_CHI: TT.DIA_CHI,
      SO_ZALO: TT.SO_ZALO,
      ZALO: TT.ZALO,
      FACEBOOK: TT.FACEBOOK,
      GIO: TT.GIO,
      BAN_DO: TT.BAN_DO,
    },
    null,
    2
  ).replace(/\n/g, "\n  ")};

  window.THONG_TIN = TT;

  TT.htmlBanDo = function () {
    return '<div class="footer-map"><iframe src="' + TT.BAN_DO +
      '" title="Bản đồ tới phòng khám" loading="lazy" ' +
      'referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>';
  };

  TT.htmlGio = function () {
    return '<ul class="footer-hours">' + TT.GIO.map(function (d) {
      return "<li><span>" + d.ngay + "</span><span>" + d.gio + "</span></li>";
    }).join("") + "</ul>";
  };

  var MAU = {
    "dia-chi": function () { return TT.DIA_CHI; },
    "dia-chi-ban-do": function () { return "<p>" + TT.DIA_CHI + "</p>" + TT.htmlBanDo(); },
    "ban-do": function () { return TT.htmlBanDo(); },
    "gio": function () { return TT.htmlGio(); },
    "so-zalo": function () { return TT.SO_ZALO; },
  };

  document.querySelectorAll("[data-tt]").forEach(function (el) {
    var mau = MAU[el.getAttribute("data-tt")];
    if (mau) el.innerHTML = mau();
  });

  document.querySelectorAll("[data-tt-href]").forEach(function (el) {
    el.setAttribute("href", el.getAttribute("data-tt-href") === "facebook" ? TT.FACEBOOK : TT.ZALO);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });
})();
`;

await writeFile(join(DICH, "thong-tin.js"), js_thong_tin, "utf8");

console.log(`[đồng bộ tĩnh] đã chép ${chep} mục sang web/public, và sinh thong-tin.js`);
if (thieu.length) {
  // Không dừng build: thiếu một file lẻ thì trang vẫn chạy, chỉ hỏng đúng
  // chỗ dùng nó. Nhưng phải kêu lên, kẻo lỗi 404 âm thầm.
  console.warn(`[đồng bộ tĩnh] KHÔNG TÌM THẤY: ${thieu.join(", ")}`);
}
