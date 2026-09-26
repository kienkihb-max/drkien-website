// Sinh mục "KIẾN THỨC WEBSITE" cho lời dặn của agent MVP1.
//
// Vì sao: agent từng phải tự lên Google tìm và đọc trang bacsikien.com cho
// mỗi câu hỏi — mất ~20 giây một câu. Nạp sẵn nội dung website vào lời dặn
// thì agent trả lời ngay (~3–6 giây) và không phải bật Google Search /
// URL Context nữa.
//
// Cách dùng (chạy ở gốc kho, cần mạng):
//   node agent-proxy/sinh-kien-thuc.mjs
// Lệnh đọc các trang đang chạy thật trên bacsikien.com, ghi ra
// agent-proxy/kien-thuc-website.md. Sau đó dán lại lời dặn đầy đủ lên agent
// (prompt-mvp1.md + kien-thuc-website.md) — xem HUONG-DAN.md.
//
// Chạy lại mỗi khi website đổi nội dung: đăng bài blog mới, đổi dịch vụ,
// thêm sự kiện, đổi giờ khám...

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const GOC = "https://bacsikien.com";
const RA = join(dirname(fileURLToPath(import.meta.url)), "kien-thuc-website.md");

// Các trang lấy nội dung, theo thứ tự xuất hiện trong mục kiến thức.
const TRANG = [
  { duong_dan: "/bac-si-le-trung-kien", tieu_de: "Hồ sơ bác sĩ" },
  { duong_dan: "/dieu-tri", tieu_de: "Dịch vụ: Thăm khám & điều trị" },
  { duong_dan: "/y-te-su-kien", tieu_de: "Dịch vụ: Y tế sự kiện thể thao" },
  { duong_dan: "/dien-gia-seminar", tieu_de: "Dịch vụ: Diễn giả workshop" },
];

const giaiMa = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

/**
 * Lấy chữ đọc được trong <main> của một trang: bỏ script/style/svg, giữ
 * xuống dòng ở các thẻ khối để mục kiến thức còn đọc ra đầu ra đuôi.
 * Phần phản hồi của người bệnh bị bỏ hẳn — lời dặn cấm agent nhắc tên và ca
 * bệnh cụ thể, không đưa vào thì khỏi lo lỡ lời.
 */
const layChu = (html) => {
  let m = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html;
  m = m
    .replace(/<(script|style|svg|noscript|iframe)[\s\S]*?<\/\1>/gi, "")
    .replace(/<section[^>]*id="stories"[\s\S]*?<\/section>/gi, "")
    .replace(/<(br|\/p|\/h[1-6]|\/li|\/div|\/section|\/tr)[^>]*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<[^>]+>/g, " ");
  return giaiMa(m)
    .split("\n")
    .map((d) => d.replace(/\s+/g, " ").trim())
    .filter((d) => d && d !== "-")
    .join("\n");
};

/** Danh sách bài blog: tiêu đề + link, đọc từ trang /blog. */
const layBaiBlog = (html) => {
  const bai = [];
  const re = /<a[^>]*class="[^"]*event-card[^"]*"[^>]*href="([^"]+)"[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  for (const [, href, h3] of html.matchAll(re)) {
    const ten = giaiMa(h3.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    if (ten && !bai.some((b) => b.href === href)) bai.push({ ten, href: GOC + href });
  }
  return bai;
};

const tai = async (duong_dan) => {
  const res = await fetch(GOC + duong_dan);
  if (!res.ok) throw new Error(`${duong_dan}: HTTP ${res.status}`);
  return res.text();
};

/**
 * Bỏ khối "Ca lâm sàng … Phản hồi từ người bệnh" ở trang Thăm khám: đó là
 * ca bệnh cụ thể, lời dặn cấm agent kể lại, nên không nạp vào cho chắc.
 */
const boCaBenh = (chu) => chu.replace(/\nCa lâm sàng\n[\s\S]*?\nPhản hồi từ người bệnh\n/, "\n");

const phan = [];
for (const t of TRANG) {
  const chu = boCaBenh(layChu(await tai(t.duong_dan)));
  phan.push(`## ${t.tieu_de} — ${GOC}${t.duong_dan}\n${chu}`);
}

const bai = layBaiBlog(await tai("/blog"));
if (!bai.length) throw new Error("Không đọc được bài nào ở /blog — cấu trúc trang có thể đã đổi.");
phan.push(
  `## Bài viết trên blog — ${GOC}/blog\n` +
    "Tên bài chép đúng nguyên văn, link là link thật của bài:\n" +
    bai.map((b) => `- ${b.ten} — ${b.href}`).join("\n")
);

const noiDung =
  `# KIẾN THỨC WEBSITE (sinh tự động ngày ${new Date().toISOString().slice(0, 10)} từ ${GOC} — đừng sửa tay)\n\n` +
  phan.join("\n\n") +
  "\n";

writeFileSync(RA, noiDung);
console.log(`Đã ghi ${RA}: ${noiDung.length} ký tự, ${bai.length} bài blog.`);
