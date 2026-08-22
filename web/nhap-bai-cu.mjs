// Nhập 13 bài blog cũ (file .html ở gốc repo) vào database Supabase.
//
// Chạy MỘT LẦN, nhưng chạy lại nhiều lần vẫn an toàn: dùng upsert theo slug
// nên không sinh bài trùng.
//
//   node nhap-bai-cu.mjs --thu     xem trước, KHÔNG ghi gì
//   node nhap-bai-cu.mjs           ghi thật
//
// Nguyên tắc: KHÔNG tự viết bộ phân tích HTML mới. Dự án đã có docHTML()
// trong admin-bai-viet.js — chính hàm mà trang quản trị dùng để mở bài cũ
// ra sửa. Viết bộ thứ hai là có hai cách hiểu về cùng một file, và kiểu gì
// cũng có ngày lệch nhau.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const THU_MUC = dirname(fileURLToPath(import.meta.url));
const GOC = join(THU_MUC, "..");
const CHI_THU = process.argv.includes("--thu");

// ——— Nạp docHTML() và docDanhSach() của dự án ———
// Chúng chạy trong trình duyệt và cần DOMParser, nên dựng một DOM giả.
const dom = new JSDOM("<!doctype html><body>");
global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;
new Function(readFileSync(join(GOC, "admin-bai-viet.js"), "utf8"))();
const Bai = dom.window.BaiViet;

// ——— Danh sách bài, kèm mô tả thẻ và cờ nổi bật / đã gỡ ———
const danh_sach = Bai.docDanhSach(readFileSync(join(GOC, "blog-cards.js"), "utf8"));

// ——— Mốc ngày sửa trong sitemap cũ ———
// Nhiều bài không có data-ngay-sua trên thẻ <html>, nhưng sitemap lại ghi
// <lastmod> muộn hơn ngày đăng — tức là bài từng được biên tập lại. Bỏ qua
// là mất thông tin đó, và Google sẽ tưởng bài chưa từng cập nhật.
const lastmod_cu = Object.fromEntries(
  [...readFileSync(join(GOC, "sitemap.xml"), "utf8").matchAll(
    /<loc>https:\/\/bacsikien\.com\/([^<]*)<\/loc>\s*<lastmod>([^<]*)<\/lastmod>/g
  )].map((m) => [m[1], m[2]])
);

// ——— Đọc từng bài ———
const ban_ghi = [];
const canh_bao = [];

for (const muc of danh_sach) {
  const ten_file = muc.href.replace(/\.html?$/i, "");
  const html = readFileSync(join(GOC, ten_file + ".html"), "utf8");
  const d = Bai.docHTML(html, ten_file);

  // Mấy trường bắt buộc — thiếu là bài hỏng, phải biết ngay chứ không để
  // lặng lẽ đẩy dữ liệu rỗng lên database.
  if (!d.h1) canh_bao.push(`${ten_file}: thiếu <h1>`);
  if (!d.than) canh_bao.push(`${ten_file}: thân bài rỗng`);
  if (!d.ngay) canh_bao.push(`${ten_file}: thiếu data-ngay-dang`);
  if (!d.anh) canh_bao.push(`${ten_file}: thiếu ảnh mở đầu`);

  // Tiêu đề trong <title> có đuôi " — Bác sĩ Lê Trung Kiên"; giữ nguyên
  // vào seo_tieu_de, còn tiêu đề bài là phần <h1>.
  ban_ghi.push({
    slug: ten_file,
    tieu_de: d.h1,
    lead: d.lead || null,
    than_bai: d.than,
    nhan: d.nhan || null,
    tai_lieu: d.tai_lieu,
    anh: d.anh || null,
    anh_alt: d.anh_alt || null,
    // Chữ trên thẻ blog lấy từ DANH_SACH — đây là chữ chủ site đã tự biên
    // cho từng bài, khác với chữ dành cho Google.
    the_tieu_de: muc.tieu_de || null,
    the_mo_ta: muc.mo_ta || null,
    seo_tieu_de: d.tieu_de_trang || null,
    seo_mo_ta: d.mo_ta_trang || null,
    ngay_dang: d.ngay,
    // Ưu tiên data-ngay-sua ghi trong bài; không có thì lấy <lastmod> của
    // sitemap cũ, và chỉ nhận khi nó muộn hơn ngày đăng — bằng ngày đăng
    // thì coi như chưa sửa lần nào.
    ngay_sua:
      d.ngay_sua ||
      (lastmod_cu[ten_file] && lastmod_cu[ten_file] > d.ngay ? lastmod_cu[ten_file] : null),
    noi_bat: !!muc.noi_bat,
    an: !!muc.an,
    da_dang: true,
  });
}

// ——— Báo cáo ———
console.log(`Đọc được ${ban_ghi.length} bài từ ${danh_sach.length} mục trong DANH_SACH\n`);
for (const b of ban_ghi) {
  console.log(
    `  ${b.slug}`.padEnd(66) +
      `${b.ngay_dang} · ${b.than_bai.length} ký tự thân` +
      `${b.tai_lieu.length ? ` · ${b.tai_lieu.length} tài liệu` : ""}` +
      `${b.noi_bat ? " · nổi bật" : ""}${b.an ? " · đã gỡ" : ""}`
  );
}

if (canh_bao.length) {
  console.log("\nCẢNH BÁO:");
  canh_bao.forEach((c) => console.log("  " + c));
}

if (CHI_THU) {
  console.log("\n(chế độ xem trước — chưa ghi gì)");
  process.exit(canh_bao.length ? 1 : 0);
}

// ——— Sinh file SQL ———
// Không ghi thẳng qua API được, và đó là chuyện ĐÚNG: khoá công khai bị RLS
// chặn ghi, nên người lạ cầm khoá đó cũng không đăng bài được. Muốn ghi
// phải đăng nhập bằng tài khoản có quyền, hoặc chạy SQL trong bảng điều
// khiển Supabase — chỗ chủ site vốn đã có quyền quản trị.
//
// Sinh SQL cũng an toàn hơn: anh đọc được đúng những gì sắp ghi trước khi
// bấm chạy, thay vì phó thác cho một script.

// Dấu nháy đô-la để khỏi phải thoát dấu nháy đơn trong nội dung bài. Chọn
// một chuỗi chắc chắn không xuất hiện trong bài viết.
const NHAY = "$bai_cu$";
const cot = [
  "slug", "tieu_de", "lead", "than_bai", "nhan", "tai_lieu", "anh", "anh_alt",
  "the_tieu_de", "the_mo_ta", "seo_tieu_de", "seo_mo_ta",
  "ngay_dang", "ngay_sua", "noi_bat", "an", "da_dang",
];

function giaTri(ten, b) {
  const v = b[ten];
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (ten === "tai_lieu") return NHAY + JSON.stringify(v) + NHAY + "::jsonb";
  const chu = String(v);
  if (chu.includes(NHAY)) {
    throw new Error(`Bài "${b.slug}" có chứa chuỗi ${NHAY} — đổi dấu nháy trong script.`);
  }
  return NHAY + chu + NHAY;
}

const sql = `-- Nhập 13 bài blog cũ vào bảng bai_viet.
--
-- File này DO MÁY SINH RA từ chính các file .html ở gốc repo, bằng
-- nhap-bai-cu.mjs. Đừng sửa tay ở đây — sửa bài gốc rồi chạy lại script.
--
-- Cách chạy: Supabase → SQL Editor → dán toàn bộ → Run.
-- Chạy lại nhiều lần vẫn an toàn: khớp theo slug nên không sinh bài trùng,
-- lần sau chỉ cập nhật đè lên bài cùng đường dẫn.

insert into bai_viet (${cot.join(", ")}) values
${ban_ghi.map((b) => "  (" + cot.map((c) => giaTri(c, b)).join(", ") + ")").join(",\n")}
on conflict (slug) do update set
${cot.filter((c) => c !== "slug").map((c) => `  ${c} = excluded.${c}`).join(",\n")};

-- Kiểm tra lại sau khi chạy: phải ra 13 dòng (chưa kể bài test).
select slug, ngay_dang, noi_bat, an,
       length(than_bai) as do_dai_than,
       jsonb_array_length(tai_lieu) as so_tai_lieu
from bai_viet
order by ngay_dang desc;
`;

const duong_dan_sql = join(THU_MUC, "supabase/nhap-bai-cu.sql");
writeFileSync(duong_dan_sql, sql, "utf8");

console.log(`\nĐã sinh ${duong_dan_sql}`);
console.log(`  ${ban_ghi.length} bài · ${Math.round(sql.length / 1024)} KB`);
console.log("  Mở Supabase → SQL Editor → dán toàn bộ file → Run.");
