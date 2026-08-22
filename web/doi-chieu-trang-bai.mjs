// Đối chiếu 13 trang bài do Astro sinh với 13 file bài gốc.
//
// Bộ trước so DỮ LIỆU bóc ra từ file. Bộ này so TRANG THÀNH PHẨM: sau khi
// qua database rồi dựng lại thành .html, trang mới có còn giống trang cũ
// không — cả thẻ SEO lẫn giao diện.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

// Gốc kho mã, suy ra từ chỗ đặt file này — đừng ghi đường dẫn cứng, kho
// mã còn được chép sang máy khác, sang ổ khác.
const GOC = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(GOC, "web/dist");

const dom = new JSDOM("<!doctype html><body>");
global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;
new Function(readFileSync(join(GOC, "admin-bai-viet.js"), "utf8"))();
const danh_sach = dom.window.BaiViet.docDanhSach(
  readFileSync(join(GOC, "blog-cards.js"), "utf8")
);

const THE = {
  "<title>": /<title>([\s\S]*?)<\/title>/,
  description: /<meta name="description" content="([\s\S]*?)">/,
  canonical: /<link rel="canonical" href="([^"]*)">/,
  "og:type": /<meta property="og:type" content="([^"]*)">/,
  "og:title": /<meta property="og:title" content="([\s\S]*?)">/,
  "og:description": /<meta property="og:description" content="([\s\S]*?)">/,
  "og:url": /<meta property="og:url" content="([^"]*)">/,
  "og:image": /<meta property="og:image" content="([^"]*)">/,
  "og:image:width": /<meta property="og:image:width" content="([^"]*)">/,
  "og:image:height": /<meta property="og:image:height" content="([^"]*)">/,
  "og:image:alt": /<meta property="og:image:alt" content="([\s\S]*?)">/,
  "article:published_time": /<meta property="article:published_time" content="([^"]*)">/,
};

let hong = 0;
for (const muc of danh_sach) {
  const ten = muc.href.replace(/\.html?$/i, "");
  const goc = readFileSync(join(GOC, ten + ".html"), "utf8");
  const moi = readFileSync(join(DIST, ten + ".html"), "utf8");
  const sai = [];

  for (const [nhan, re] of Object.entries(THE)) {
    const a = (goc.match(re) ?? [])[1] ?? "(không có)";
    const b = (moi.match(re) ?? [])[1] ?? "(không có)";
    if (a !== b) sai.push(`  ${nhan}\n      cũ : ${a}\n      mới: ${b}`);
  }

  // —— Giao diện: đếm đúng những thứ style.css bám vào ——
  const dg = new JSDOM(goc).window.document;
  const dm = new JSDOM(moi).window.document;
  const dem = [
    ["ul.list-check", "danh sách vòng tròn xanh"],
    [".article-body li", "mục danh sách trong bài"],
    [".article-refs ol li", "mục tài liệu tham khảo"],
    [".article-body h2", "tiêu đề mục"],
    [".article-body h3", "tiêu đề phụ"],
    [".article-body p", "đoạn văn"],
    [".article-body figure", "ảnh minh hoạ"],
    [".article-hero-img img", "ảnh mở đầu"],
  ];
  for (const [chon, ten_viet] of dem) {
    const a = dg.querySelectorAll(chon).length;
    const b = dm.querySelectorAll(chon).length;
    if (a !== b) sai.push(`  ${ten_viet} (${chon}): cũ ${a}, mới ${b}`);
  }

  // Hai thứ này bản cũ KHÔNG có trong HTML tĩnh vì do JS chèn lúc chạy, còn
  // bản mới in sẵn phía máy chủ. Chênh lệch ở đây là cải thiện, không phải
  // lỗi — nhưng vẫn phải kiểm, vì thiếu chúng mới là lỗi thật.
  for (const [chon, ten_viet] of [
    [".article-byline", "dòng tác giả"],
    [".breadcrumb", "breadcrumb"],
  ]) {
    if (dm.querySelectorAll(chon).length === 0) {
      sai.push(`  THIẾU ${ten_viet} (${chon}) ở bản mới`);
    }
  }

  // —— Chữ trong thân bài phải y nguyên ——
  const chu = (d) => {
    const el = d.querySelector(".article-body");
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  };
  if (chu(dg) !== chu(dm)) {
    sai.push(`  CHỮ thân bài lệch: cũ ${chu(dg).length} ký tự, mới ${chu(dm).length}`);
  }

  if (sai.length) {
    hong++;
    console.log(`✗ ${ten}`);
    sai.forEach((s) => console.log(s));
  } else {
    console.log(`✓ ${ten.padEnd(62)} ${chu(dm).length} ký tự khớp`);
  }
}

console.log(hong === 0 ? `\nTẤT CẢ ${danh_sach.length} TRANG BÀI KHỚP` : `\n${hong} trang lệch`);
process.exit(hong ? 1 : 0);
