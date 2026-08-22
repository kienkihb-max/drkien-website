// Đối chiếu dữ liệu sắp nhập với file bài gốc — TỪNG KÝ TỰ.
//
// Câu hỏi cần trả lời: đưa bài qua database rồi dựng lại thì có còn đúng
// như bản gốc không. Nên không so bằng mắt, mà ghép ngược dữ liệu đã bóc
// thành đúng khối HTML của bài gốc rồi so chuỗi.
//
// Nếu khớp tuyệt đối thì không còn chỗ nào để định dạng lệch.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

// Gốc kho mã, suy ra từ chỗ đặt file này — đừng ghi đường dẫn cứng, kho
// mã còn được chép sang máy khác, sang ổ khác.
const GOC = fileURLToPath(new URL("..", import.meta.url));

const dom = new JSDOM("<!doctype html><body>");
global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;
new Function(readFileSync(join(GOC, "admin-bai-viet.js"), "utf8"))();
const Bai = dom.window.BaiViet;

const danh_sach = Bai.docDanhSach(readFileSync(join(GOC, "blog-cards.js"), "utf8"));

let hong = 0;
let tong_khoi = 0;

for (const muc of danh_sach) {
  const ten = muc.href.replace(/\.html?$/i, "");
  const html = readFileSync(join(GOC, ten + ".html"), "utf8");
  const d = Bai.docHTML(html, ten);

  const tl = new JSDOM(html).window.document;
  const sai = [];

  // —— 1. Thân bài: ghép lead + than lại, so với .article-body gốc ——
  const than_goc = tl.querySelector(".article-body");
  const ghep_lai = (d.lead ? `<p class="lead">${d.lead}</p>` : "") + d.than;
  // Bản gốc có xuống dòng và thụt lề giữa các thẻ; docHTML giữ nguyên phần
  // bên trong nên chỉ cần cắt khoảng trắng hai đầu là so được.
  // Khoảng trắng NẰM GIỮA hai thẻ khối không có nghĩa khi hiển thị — bản
  // gốc xuống dòng và thụt lề cho dễ đọc, còn dữ liệu lưu thì liền mạch.
  // Bỏ nó ở CẢ HAI bên rồi mới so, nên khác biệt thật vẫn lộ ra.
  const chuan = (s) => s.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();

  // Và so thêm một lần nữa chỉ trên CHỮ, bóc sạch thẻ: đây mới là thứ
  // người đọc thấy, mất một ký tự ở đây là mất thật.
  const chuChay = (s) =>
    s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (chuChay(ghep_lai) !== chuChay(than_goc.innerHTML)) {
    sai.push("CHỮ trong thân bài LỆCH — mất hoặc thừa nội dung");
  }

  if (chuan(ghep_lai) !== chuan(than_goc.innerHTML)) {
    sai.push("thân bài LỆCH");
    // In ra chỗ lệch đầu tiên để còn biết đường sửa.
    const a = chuan(ghep_lai), b = chuan(than_goc.innerHTML);
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    sai.push(`    lệch từ ký tự ${i}:`);
    sai.push(`      ghép lại: …${a.slice(Math.max(0, i - 40), i + 60)}`);
    sai.push(`      bản gốc : …${b.slice(Math.max(0, i - 40), i + 60)}`);
  }

  // —— 2. Tài liệu tham khảo ——
  const li_goc = [...tl.querySelectorAll(".article-refs ol li")].map((l) => l.innerHTML.trim());
  if (li_goc.length !== d.tai_lieu.length) {
    sai.push(`tài liệu: gốc ${li_goc.length} mục, bóc ra ${d.tai_lieu.length} mục`);
  } else {
    li_goc.forEach((m, i) => {
      if (m !== d.tai_lieu[i]) sai.push(`tài liệu mục ${i + 1} LỆCH`);
    });
  }

  // —— 3. Các trường lẻ ——
  const the = (chon, thuoc) => {
    const el = tl.querySelector(chon);
    if (!el) return "";
    return thuoc ? el.getAttribute(thuoc) || "" : el.textContent.trim();
  };
  const kiem = {
    tieu_de: [d.h1, the(".cv-hero h1")],
    nhan: [d.nhan, the(".cv-hero .section-label")],
    anh: [d.anh, the(".article-hero-img img", "src")],
    anh_alt: [d.anh_alt, the(".article-hero-img img", "alt")],
    seo_tieu_de: [d.tieu_de_trang, the("title")],
    seo_mo_ta: [d.mo_ta_trang, the('meta[name="description"]', "content")],
    ngay_dang: [d.ngay, tl.documentElement.getAttribute("data-ngay-dang")],
  };
  for (const [ten_truong, [a, b]] of Object.entries(kiem)) {
    if ((a || "") !== (b || "")) sai.push(`${ten_truong}: "${a}" ≠ "${b}"`);
  }

  // —— 3b. Class CSS: thứ quyết định GIAO DIỆN ——
  // Vòng tròn xanh của danh sách là do class "list-check" trong style.css.
  // Mất chữ đó là danh sách tụt về gạch đầu dòng mặc định, chữ vẫn đủ nhưng
  // trông khác hẳn. Tương tự với ảnh minh hoạ và đoạn mở đầu.
  const than_dom_class = new JSDOM(`<div>${d.than}</div>`).window.document;
  const CLASS_QUAN_TRONG = [
    "ul.list-check",
    "figure.article-inline-img",
    "figure.article-inline-img-doc",
    "p.lead",
  ];
  for (const chon of CLASS_QUAN_TRONG) {
    const a = than_dom_class.querySelectorAll(chon).length;
    const b = tl.querySelectorAll(".article-body " + chon).length
      - (chon === "p.lead" ? 1 : 0); // lead đã tách ra khỏi thân
    if (a !== b) sai.push(`class "${chon}": bóc ra ${a}, gốc ${b}`);
  }

  // —— 3c. Khối Tài liệu tham khảo: so nguyên khối HTML sẽ dựng lại ——
  // Trang bài mới dựng khối này từ mảng tai_lieu. Ghép thử ra rồi so với
  // khối trong file gốc, để chắc giao diện khối tham khảo không đổi.
  const refs_goc = tl.querySelector(".article-refs");
  if (refs_goc || d.tai_lieu.length) {
    const dung_lai =
      `<div class="article-refs"><h2>Tài liệu tham khảo</h2><ol>` +
      d.tai_lieu.map((m) => `<li>${m}</li>`).join("") +
      `</ol></div>`;
    if (chuan(dung_lai) !== chuan(refs_goc ? refs_goc.outerHTML : "")) {
      sai.push("khối Tài liệu tham khảo LỆCH");
    }
  }

  // —— 4. Đếm cấu trúc: không được rơi mất thẻ nào ——
  const dem = (chon) => tl.querySelectorAll(chon).length;
  const than_dom = new JSDOM(`<div>${d.than}</div>`).window.document;
  const demMoi = (t) => than_dom.querySelectorAll(t).length;
  const cau_truc = {
    h2: [demMoi("h2"), dem(".article-body h2")],
    h3: [demMoi("h3"), dem(".article-body h3")],
    p: [demMoi("p"), dem(".article-body p") - (d.lead ? 1 : 0)],
    ul: [demMoi("ul"), dem(".article-body ul")],
    ol: [demMoi("ol"), dem(".article-body ol")],
    li: [demMoi("li"), dem(".article-body li")],
    img: [demMoi("img"), dem(".article-body img")],
    a: [demMoi("a"), dem(".article-body a")],
    sup: [demMoi("sup"), dem(".article-body sup")],
    figure: [demMoi("figure"), dem(".article-body figure")],
  };
  for (const [t, [a, b]] of Object.entries(cau_truc)) {
    if (a !== b) sai.push(`số thẻ <${t}>: bóc ra ${a}, gốc ${b}`);
    tong_khoi += a;
  }

  if (sai.length) {
    hong++;
    console.log(`✗ ${ten}`);
    sai.forEach((s) => console.log("    " + s));
  } else {
    console.log(
      `✓ ${ten.padEnd(62)} ${d.than.length} ký tự · ${d.tai_lieu.length} tài liệu`
    );
  }
}

console.log(
  hong === 0
    ? `\nTẤT CẢ ${danh_sach.length} BÀI KHỚP TUYỆT ĐỐI — đã đối chiếu ${tong_khoi} thẻ`
    : `\n${hong} bài lệch`
);
process.exit(hong ? 1 : 0);
