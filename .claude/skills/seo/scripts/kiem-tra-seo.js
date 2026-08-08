#!/usr/bin/env node
// Kiểm tra SEO toàn site — chạy: node .claude/skills/seo/scripts/kiem-tra-seo.js
//
// Soát lại những thứ dễ quên khi thêm hoặc sửa trang: thẻ tiêu đề, canonical,
// Open Graph, thứ bậc heading, ngày đăng bài, sitemap. Không sửa gì cả, chỉ
// báo cáo — đọc rồi tự sửa, hoặc nhờ Claude sửa.
//
// Mã thoát 0 nếu không có lỗi, 1 nếu có. NHẮC là gợi ý, không tính là lỗi.

"use strict";
const fs = require("fs");
const path = require("path");

const TEN_BAC_SI = "Bác sĩ Lê Trung Kiên";
const MIEN = "https://bacsikien.com";
const TITLE_TOI_DA = 68; // quá dài thì Google cắt mất tên ở cuối
const MOTA_TOI_THIEU = 100;
const MOTA_TOI_DA = 175;

// ——— Tìm thư mục gốc của site (chỗ có index.html và sitemap.xml) ———
function timGoc() {
  let d = __dirname;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(d, "index.html")) && fs.existsSync(path.join(d, "sitemap.xml"))) return d;
    const cha = path.dirname(d);
    if (cha === d) break;
    d = cha;
  }
  return process.cwd();
}
const GOC = timGoc();

// ——— Gom lỗi theo từng file ———
const baoCao = new Map();
let soLoi = 0, soNhac = 0;
function ghi(file, muc, loai) {
  if (!baoCao.has(file)) baoCao.set(file, []);
  baoCao.get(file).push({ muc, loai });
  if (loai === "LỖI") soLoi++; else soNhac++;
}
const loi = (f, m) => ghi(f, m, "LỖI");
const nhac = (f, m) => ghi(f, m, "NHẮC");

// ——— Đọc kích thước ảnh mà không cần thư viện ngoài ———
function kichThuocAnh(duong) {
  let b;
  try { b = fs.readFileSync(duong); } catch { return null; }
  // PNG: rộng/cao nằm ngay sau khối IHDR
  if (b.length > 24 && b.toString("hex", 0, 8) === "89504e470d0a1a0a") {
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  }
  // JPEG: dò tới khung SOF rồi đọc kích thước trong đó
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) { i++; continue; }
      const dau = b[i + 1];
      const dai = b.readUInt16BE(i + 2);
      if (dau >= 0xc0 && dau <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(dau)) {
        return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      }
      i += 2 + dai;
    }
  }
  return null;
}

// ——— Vài hàm bóc thẻ. Đủ dùng cho site viết tay này. ———
const bocThe = (html, re) => { const m = html.match(re); return m ? m[1].trim() : null; };
const meta = (html, ten) =>
  bocThe(html, new RegExp('<meta\\s+name="' + ten + '"\\s+content="([^"]*)"', "i"));
const og = (html, ten) =>
  bocThe(html, new RegExp('<meta\\s+property="' + ten + '"\\s+content="([^"]*)"', "i"));

function boDauHtml(s) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
}

// ——— Nạp sitemap ———
const duongSitemap = path.join(GOC, "sitemap.xml");
const sitemap = fs.readFileSync(duongSitemap, "utf8");
const locSitemap = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
const daGapTrongSitemap = new Set();

// ——— Duyệt từng trang ———
const cacTrang = fs.readdirSync(GOC).filter((f) => f.endsWith(".html")).sort();

for (const ten of cacTrang) {
  const html = fs.readFileSync(path.join(GOC, ten), "utf8");
  const canonical = bocThe(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i);

  // Trang chuyển hướng (giữ link cũ còn chạy) chỉ cần noindex + canonical,
  // và tuyệt đối không được nằm trong sitemap.
  if (/http-equiv="refresh"/i.test(html)) {
    if (!/name="robots"[^>]*noindex/i.test(html)) loi(ten, "Trang chuyển hướng thiếu <meta name=\"robots\" content=\"noindex, follow\">");
    if (!canonical) loi(ten, "Trang chuyển hướng thiếu canonical trỏ sang địa chỉ mới");
    if (canonical && locSitemap.includes(canonical) && canonical.endsWith(ten.replace(/\.html$/, ""))) {
      loi(ten, "Trang chuyển hướng không được nằm trong sitemap.xml");
    }
    continue;
  }

  // 1. Thẻ <html>
  const dataPage = bocThe(html, /<html[^>]*\sdata-page="([^"]+)"/i);
  if (!/<html[^>]*\slang="vi"/i.test(html)) loi(ten, 'Thẻ <html> thiếu lang="vi"');
  if (!dataPage) loi(ten, 'Thẻ <html> thiếu data-page="home|service|article"');
  else if (!["home", "service", "article"].includes(dataPage)) loi(ten, `data-page="${dataPage}" không hợp lệ (chỉ home, service hoặc article)`);

  // 2. Tiêu đề
  const title = bocThe(html, /<title>([\s\S]*?)<\/title>/i);
  if (!title) loi(ten, "Thiếu <title>");
  else {
    const chu = boDauHtml(title);
    if (!chu.includes(TEN_BAC_SI) && !chu.includes("bác sĩ Lê Trung Kiên")) {
      loi(ten, `<title> không chứa "${TEN_BAC_SI}" — đây là từ khóa đang đẩy, viết đủ chữ chứ đừng viết tắt ThS.BS`);
    }
    if (chu.length > TITLE_TOI_DA) {
      nhac(ten, `<title> dài ${chu.length} ký tự (nên ≤ ${TITLE_TOI_DA}) — dài quá Google cắt mất phần tên ở cuối`);
    }
  }

  // 3. Mô tả
  const mota = meta(html, "description");
  if (!mota) loi(ten, 'Thiếu <meta name="description">');
  else {
    const chu = boDauHtml(mota);
    if (chu.length < MOTA_TOI_THIEU) nhac(ten, `Mô tả hơi ngắn (${chu.length} ký tự, nên ${MOTA_TOI_THIEU}–${MOTA_TOI_DA})`);
    if (chu.length > MOTA_TOI_DA) nhac(ten, `Mô tả hơi dài (${chu.length} ký tự, nên ${MOTA_TOI_THIEU}–${MOTA_TOI_DA}) — Google sẽ cắt bớt`);
    // Trang giới thiệu và trang dịch vụ nên nhắc tên trong mô tả. Bài blog thì
    // không ép — mô tả bài nên nói về nội dung bài, nhồi tên vào trông như spam,
    // mà tên tác giả đã có sẵn ở dòng byline và trong schema rồi.
    if (dataPage !== "article" && !/[Bb]ác sĩ Lê Trung Kiên/.test(chu)) {
      nhac(ten, 'Mô tả chưa nhắc tên "Bác sĩ Lê Trung Kiên"');
    }
  }

  // 4. Canonical
  if (!canonical) {
    loi(ten, "Thiếu <link rel=\"canonical\"> — thiếu là /trang và /trang.html cạnh tranh nhau trên Google");
  } else {
    if (!canonical.startsWith(MIEN)) loi(ten, `canonical phải là địa chỉ đầy đủ bắt đầu bằng ${MIEN}`);
    if (canonical.endsWith(".html")) loi(ten, "canonical không được có đuôi .html (link nội bộ toàn site đã bỏ đuôi)");
    const mong = ten === "index.html" ? MIEN + "/" : MIEN + "/" + ten.replace(/\.html$/, "");
    if (canonical !== mong) loi(ten, `canonical là "${canonical}" nhưng theo tên file phải là "${mong}"`);
    if (!locSitemap.includes(canonical)) loi(ten, `Địa chỉ "${canonical}" chưa có trong sitemap.xml`);
    else daGapTrongSitemap.add(canonical);
  }

  // 5. Open Graph — bắt buộc là HTML tĩnh, vì trình thu thập của Facebook
  //    và Zalo không chạy JavaScript như Google.
  for (const t of ["og:type", "og:title", "og:description", "og:url", "og:image", "og:image:width", "og:image:height", "og:image:alt"]) {
    if (!og(html, t)) loi(ten, `Thiếu thẻ <meta property="${t}">`);
  }
  if (!meta(html, "twitter:card")) nhac(ten, 'Thiếu <meta name="twitter:card" content="summary_large_image">');
  const ogUrl = og(html, "og:url");
  if (ogUrl && canonical && ogUrl !== canonical) loi(ten, `og:url ("${ogUrl}") khác canonical ("${canonical}") — phải giống nhau`);

  const ogImg = og(html, "og:image");
  if (ogImg) {
    if (!ogImg.startsWith("http")) loi(ten, "og:image phải là địa chỉ đầy đủ (có https://), không dùng đường dẫn tương đối");
    const tuongDoi = ogImg.replace(MIEN + "/", "");
    const duongAnh = path.join(GOC, tuongDoi);
    if (!fs.existsSync(duongAnh)) {
      loi(ten, `og:image trỏ tới "${tuongDoi}" nhưng không có file đó`);
    } else {
      const kt = kichThuocAnh(duongAnh);
      const w = og(html, "og:image:width"), h = og(html, "og:image:height");
      if (kt && w && h && (String(kt.w) !== w || String(kt.h) !== h)) {
        loi(ten, `og:image:width/height ghi ${w}x${h} nhưng ảnh thật là ${kt.w}x${kt.h}`);
      }
      if (kt && (kt.w < 600 || kt.h < 315)) nhac(ten, `Ảnh chia sẻ hơi nhỏ (${kt.w}x${kt.h}) — Facebook hiển thị đẹp nhất từ 1200x630`);
    }
  }

  // 6. Favicon
  if (!/<link\s+rel="icon"/i.test(html)) nhac(ten, 'Thiếu <link rel="icon" href="/favicon.ico" sizes="any">');
  if (!/rel="apple-touch-icon"/i.test(html)) nhac(ten, 'Thiếu <link rel="apple-touch-icon">');

  // 7. Thứ tự script — seo-schema.js đọc dữ liệu từ thong-tin.js nên phải nạp sau
  const viTriTT = html.indexOf('src="thong-tin.js"');
  const viTriSchema = html.indexOf('src="seo-schema.js"');
  if (viTriSchema === -1) loi(ten, "Chưa nạp <script src=\"seo-schema.js\"> — thiếu là trang không có dữ liệu có cấu trúc cho Google");
  else if (viTriTT === -1) loi(ten, 'Chưa nạp <script src="thong-tin.js">');
  else if (viTriTT > viTriSchema) loi(ten, "thong-tin.js phải nạp TRƯỚC seo-schema.js");

  // 8. Font không chặn hiển thị
  if (!/rel="preload"\s+as="style"/i.test(html)) nhac(ten, "Font đang chặn hiển thị — xem mẫu <head> trong references/mau-trang.md");

  // 9. Thứ bậc heading
  const bac = [...html.matchAll(/<h([1-6])[\s>]/gi)].map((m) => Number(m[1]));
  const soH1 = bac.filter((b) => b === 1).length;
  if (soH1 === 0) loi(ten, "Trang không có <h1>");
  else if (soH1 > 1) loi(ten, `Trang có ${soH1} thẻ <h1> — mỗi trang chỉ được một`);
  for (let i = 1; i < bac.length; i++) {
    if (bac[i] > bac[i - 1] + 1) {
      loi(ten, `Nhảy bậc heading h${bac[i - 1]} → h${bac[i]} — không được bỏ qua bậc nào ở giữa`);
      break;
    }
  }

  // 10. Riêng bài blog
  const laBaiViet = dataPage === "article" && !["blog.html", "bac-si-le-trung-kien.html"].includes(ten);
  const ngay = bocThe(html, /<html[^>]*\sdata-ngay-dang="([^"]+)"/i);
  if (laBaiViet) {
    if (!ngay) loi(ten, 'Bài blog thiếu data-ngay-dang="NĂM-THÁNG-NGÀY" trên thẻ <html> — dòng tác giả và schema đều lấy ngày từ đây');
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) loi(ten, `data-ngay-dang="${ngay}" sai định dạng, phải là NĂM-THÁNG-NGÀY (ví dụ 2026-08-08)`);
    if (!/src="blog-byline\.js"/.test(html)) loi(ten, 'Bài blog chưa nạp <script src="blog-byline.js"> — thiếu là bài không có dòng tác giả');
    if (og(html, "og:type") !== "article") loi(ten, 'Bài blog phải có og:type="article"');
    if (!og(html, "article:published_time")) nhac(ten, 'Bài blog nên có <meta property="article:published_time">');
    const dsBlog = path.join(GOC, "blog-cards.js");
    if (fs.existsSync(dsBlog)) {
      const slug = ten.replace(/\.html$/, "");
      if (!fs.readFileSync(dsBlog, "utf8").includes(`"${slug}"`)) {
        loi(ten, `Bài này chưa có trong danh sách của blog-cards.js — sẽ không hiện ở trang blog lẫn mục "Bài viết khác"`);
      }
    }
  } else if (ngay) {
    nhac(ten, "Trang không phải bài blog nhưng lại có data-ngay-dang");
  }

  // 11. Xuống dòng lọt vào trong thuộc tính href/content/src. Trình duyệt
  //     thường vẫn chạy được vì nó tự cắt khoảng trắng thừa, nên loại lỗi
  //     này rất dễ sống sót cho tới lúc gặp công cụ khó tính hơn.
  if (/(?:href|src|content)="[^"]*\n/.test(html)) {
    loi(ten, "Có thuộc tính href/src/content bị xuống dòng ở giữa — giá trị phải nằm gọn trên một dòng");
  }

  // 12. Ảnh thiếu alt
  const thieuAlt = [...html.matchAll(/<img\s[^>]*>/gi)].filter((m) => !/\salt=/i.test(m[0]));
  if (thieuAlt.length) loi(ten, `${thieuAlt.length} thẻ <img> không có thuộc tính alt`);

  // 13. Trang mới phải có mặt trong khối dự phòng ở trang chủ
  if (ten !== "index.html") {
    const trangChu = fs.readFileSync(path.join(GOC, "index.html"), "utf8");
    // Chỉ xét khối điều hướng dự phòng, không phải thẻ <noscript> của font.
    const khoi = trangChu.match(/<nav class="fallback-nav"[\s\S]*?<\/nav>/);
    const slug = ten.replace(/\.html$/, "");
    if (khoi && !khoi[0].includes(`href="${slug}"`)) {
      nhac(ten, `Chưa có trong khối <noscript> ở trang chủ — trình thu thập không chạy JavaScript sẽ không tìm ra trang này`);
    }
  }
}

// ——— Soát ngược sitemap ———
for (const loc of locSitemap) {
  if (daGapTrongSitemap.has(loc)) continue;
  const slug = loc.replace(MIEN, "").replace(/^\//, "");
  const file = slug === "" ? "index.html" : slug + ".html";
  if (!fs.existsSync(path.join(GOC, file))) {
    loi("sitemap.xml", `Có địa chỉ "${loc}" nhưng không tìm thấy file ${file}`);
  } else {
    loi("sitemap.xml", `Địa chỉ "${loc}" không khớp canonical của bất kỳ trang nào`);
  }
}
if (!fs.existsSync(path.join(GOC, "robots.txt"))) loi("robots.txt", "Không có file robots.txt");
else if (!fs.readFileSync(path.join(GOC, "robots.txt"), "utf8").includes("sitemap.xml")) {
  loi("robots.txt", "robots.txt chưa khai báo dòng Sitemap:");
}

// ——— In kết quả ———
const soTrang = cacTrang.length;
console.log(`\nKiểm tra SEO — ${soTrang} trang trong ${GOC}\n`);
if (baoCao.size === 0) {
  console.log("  Không phát hiện vấn đề nào.\n");
} else {
  for (const [file, dsMuc] of [...baoCao.entries()].sort()) {
    console.log(`  ${file}`);
    for (const { muc, loai } of dsMuc) console.log(`    [${loai}] ${muc}`);
    console.log("");
  }
}
console.log(`Tổng: ${soLoi} lỗi, ${soNhac} nhắc nhở.`);
if (soLoi > 0) console.log("Sửa hết phần [LỖI] rồi chạy lại lệnh này.\n");
else console.log("");
process.exit(soLoi > 0 ? 1 : 0);
