#!/usr/bin/env node
// Kiểm tra SEO toàn site.
//
//   node .claude/skills/seo/scripts/kiem-tra-seo.js                  (máy chủ dev)
//   node .claude/skills/seo/scripts/kiem-tra-seo.js https://bacsikien.com
//
// Soát lại những thứ dễ quên khi thêm hoặc sửa trang: thẻ tiêu đề, mô tả,
// canonical, Open Graph, thứ bậc heading, ảnh thiếu alt, sitemap, robots.txt,
// và trang mồ côi (không có trang nào trong site trỏ tới).
//
// Không sửa gì cả, chỉ báo cáo. Mã thoát 0 nếu sạch, 1 nếu có LỖI.
// NHẮC là gợi ý, không tính là lỗi.
//
// ——— Vì sao bản này đọc qua mạng chứ không đọc file ———
//
// Bản trước duyệt các file .html ở gốc kho mã. Từ lúc site chuyển sang Astro
// thì không còn file .html nào ở đó nữa, và nội dung bài viết nằm trong
// database chứ không nằm trong kho — nên bản cũ chạy là ném ENOENT ngay dòng
// đầu, suốt mấy tuần không ai kiểm được gì.
//
// Nay nó đọc đúng thứ mà người dùng và Google nhận được: gọi sitemap.xml của
// site đang chạy, rồi mở từng địa chỉ trong đó. Nhờ vậy chạy được cả với máy
// chủ dev lẫn bản live, và không cần biết trang được sinh ra kiểu gì.

"use strict";
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const GOC_MAC_DINH = "http://localhost:4321";
const TEN_BAC_SI = "Bác sĩ Lê Trung Kiên";
const MIEN_THAT = "https://bacsikien.com";
const TITLE_TOI_DA = 68; // dài hơn thì Google cắt mất phần tên ở cuối
const MOTA_TOI_THIEU = 100;
const MOTA_TOI_DA = 175;

const goc = (process.argv[2] || GOC_MAC_DINH).replace(/\/+$/, "");

// ——— Gom lỗi theo từng trang ———
const baoCao = new Map();
let soLoi = 0;
let soNhac = 0;
function ghi(trang, muc, loai) {
  if (!baoCao.has(trang)) baoCao.set(trang, []);
  baoCao.get(trang).push({ muc, loai });
  if (loai === "LỖI") soLoi++;
  else soNhac++;
}
const loi = (t, m) => ghi(t, m, "LỖI");
const nhac = (t, m) => ghi(t, m, "NHẮC");

// ——— Bóc thẻ. Đủ dùng, không cần thư viện phân tích HTML ———
const bocThe = (html, re) => {
  const m = html.match(re);
  return m ? m[1].trim() : null;
};
const meta = (html, ten) =>
  bocThe(html, new RegExp('<meta[^>]*name="' + ten + '"[^>]*content="([^"]*)"', "i")) ||
  bocThe(html, new RegExp('<meta[^>]*content="([^"]*)"[^>]*name="' + ten + '"', "i"));
const og = (html, ten) =>
  bocThe(html, new RegExp('<meta[^>]*property="' + ten + '"[^>]*content="([^"]*)"', "i")) ||
  bocThe(html, new RegExp('<meta[^>]*content="([^"]*)"[^>]*property="' + ten + '"', "i"));

const boDauHtml = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

// ——— Đọc kích thước ảnh từ vài byte đầu, không cần thư viện ngoài ———
function kichThuocAnh(buf) {
  const b = Buffer.from(buf);
  if (b.length > 24 && b.toString("hex", 0, 8) === "89504e470d0a1a0a") {
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  }
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) {
        i++;
        continue;
      }
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

// Địa chỉ trong sitemap luôn là tên miền thật; khi soi máy chủ dev thì phải
// đổi về gốc đang chạy mới gọi được.
const veGocDangChay = (u) => u.replace(MIEN_THAT, goc);
const veMienThat = (u) => u.replace(goc, MIEN_THAT);

async function tai(u) {
  const r = await fetch(u, { redirect: "manual" });
  return { status: r.status, html: r.status === 200 ? await r.text() : "" };
}

(async () => {
  // ——— 1. Sitemap ———
  let sitemap;
  try {
    const r = await fetch(goc + "/sitemap.xml");
    if (r.status !== 200) throw new Error("HTTP " + r.status);
    sitemap = await r.text();
  } catch (e) {
    console.error(`\nKhông đọc được ${goc}/sitemap.xml — ${e.message}`);
    console.error("Máy chủ dev chưa chạy? Mở nó bằng: npm --prefix web run dev\n");
    process.exit(1);
  }

  const dsLoc = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const lastmodTheoLoc = new Map(
    [...sitemap.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map((m) => [
      m[1].trim(),
      m[2].trim(),
    ])
  );
  if (dsLoc.length === 0) {
    loi("sitemap.xml", "Sitemap không có địa chỉ nào");
  }

  // ——— 2. robots.txt ———
  try {
    const r = await fetch(goc + "/robots.txt");
    if (r.status !== 200) {
      loi("robots.txt", `Không mở được (HTTP ${r.status})`);
    } else {
      const t = await r.text();
      if (!/^\s*Sitemap:/im.test(t)) {
        loi("robots.txt", "Chưa khai báo dòng Sitemap: — Google mất một đường tìm ra sitemap");
      }
      // Chỉ xét nhóm dành cho mọi bot; mấy nhóm chặn bot huấn luyện AI
      // (GPTBot, ClaudeBot, Google-Extended…) không ảnh hưởng tìm kiếm.
      const nhomChung = t
        .split(/^\s*User-agent:/im)
        .filter((k) => /^\s*\*/.test(k))
        .join("\n");
      if (/^\s*Disallow:\s*\/\s*$/im.test(nhomChung)) {
        loi("robots.txt", "Đang chặn TOÀN BỘ site với mọi bot (Disallow: /) — Google không đọc được gì");
      }
    }
  } catch (e) {
    loi("robots.txt", "Không đọc được — " + e.message);
  }

  // ——— 3. Từng trang trong sitemap ———
  const canonicalDaGap = new Set();
  const linkNoiBoTheoTrang = new Map(); // trang -> các địa chỉ nội bộ nó trỏ tới

  for (const locGoc of dsLoc) {
    const ten = locGoc.replace(MIEN_THAT, "") || "/";
    const { status, html } = await tai(veGocDangChay(locGoc));

    if (status !== 200) {
      loi(ten, `Địa chỉ trong sitemap trả về HTTP ${status} — Google gặp lỗi này sẽ bỏ trang`);
      continue;
    }

    // Ngôn ngữ
    if (!/<html[^>]*\slang="vi"/i.test(html)) loi(ten, 'Thẻ <html> thiếu lang="vi"');

    // Tiêu đề
    const title = bocThe(html, /<title>([\s\S]*?)<\/title>/i);
    if (!title) {
      loi(ten, "Thiếu <title>");
    } else {
      const chu = boDauHtml(title);
      if (!/bác sĩ lê trung kiên/i.test(chu)) {
        loi(ten, `<title> không chứa "${TEN_BAC_SI}" — đây là từ khóa đang đẩy, viết đủ chữ chứ đừng viết tắt ThS.BS`);
      }
      if (chu.length > TITLE_TOI_DA) {
        nhac(ten, `<title> dài ${chu.length} ký tự (nên ≤ ${TITLE_TOI_DA}) — dài quá Google cắt mất phần tên ở cuối`);
      }
    }

    // Mô tả
    const mota = meta(html, "description");
    const laBaiViet = og(html, "og:type") === "article" && !/\/blog/.test(ten) && ten !== "/";
    if (!mota) {
      loi(ten, 'Thiếu <meta name="description">');
    } else {
      const chu = boDauHtml(mota);
      if (chu.length < MOTA_TOI_THIEU) nhac(ten, `Mô tả hơi ngắn (${chu.length} ký tự, nên ${MOTA_TOI_THIEU}–${MOTA_TOI_DA})`);
      if (chu.length > MOTA_TOI_DA) nhac(ten, `Mô tả hơi dài (${chu.length} ký tự, nên ${MOTA_TOI_THIEU}–${MOTA_TOI_DA}) — Google sẽ cắt bớt`);
      if (/…$/.test(chu.trim())) {
        nhac(ten, "Mô tả kết thúc bằng dấu ba chấm — đang bị cắt ngang câu, nên viết lại đoạn mở đầu cho trọn ý trong 160 ký tự");
      }
      if (!laBaiViet && !/bác sĩ lê trung kiên/i.test(chu)) {
        nhac(ten, 'Mô tả chưa nhắc tên "Bác sĩ Lê Trung Kiên"');
      }
    }

    // Canonical
    const canonical = bocThe(html, /<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i);
    if (!canonical) {
      loi(ten, "Thiếu <link rel=\"canonical\">");
    } else {
      if (!canonical.startsWith(MIEN_THAT)) {
        loi(ten, `canonical phải là địa chỉ đầy đủ bắt đầu bằng ${MIEN_THAT}, đang là "${canonical}"`);
      }
      if (canonical.replace(/\/$/, "") !== locGoc.replace(/\/$/, "")) {
        loi(ten, `canonical trỏ về "${canonical}" chứ không phải chính nó ("${locGoc}") — Google sẽ bỏ qua trang này`);
      }
      canonicalDaGap.add(canonical.replace(/\/$/, ""));
    }

    // Chặn index
    const robotsMeta = meta(html, "robots");
    if (robotsMeta && /noindex/i.test(robotsMeta)) {
      loi(ten, `Trang nằm trong sitemap nhưng lại có <meta name="robots" content="${robotsMeta}"> — vừa mời Google vào vừa cấm nó lập chỉ mục`);
    }

    // Open Graph. Bắt buộc là HTML tĩnh vì trình thu thập của Facebook và
    // Zalo không chạy JavaScript.
    for (const t of ["og:type", "og:title", "og:description", "og:url", "og:image"]) {
      if (!og(html, t)) loi(ten, `Thiếu thẻ <meta property="${t}">`);
    }
    for (const t of ["og:image:width", "og:image:height", "og:image:alt"]) {
      if (!og(html, t)) nhac(ten, `Thiếu thẻ <meta property="${t}">`);
    }
    if (!meta(html, "twitter:card")) nhac(ten, 'Thiếu <meta name="twitter:card" content="summary_large_image">');

    const ogUrl = og(html, "og:url");
    if (ogUrl && canonical && ogUrl.replace(/\/$/, "") !== canonical.replace(/\/$/, "")) {
      loi(ten, `og:url ("${ogUrl}") khác canonical ("${canonical}") — phải giống nhau`);
    }

    // Ảnh chia sẻ
    const ogImg = og(html, "og:image");
    if (ogImg) {
      if (!/^https?:\/\//.test(ogImg)) {
        loi(ten, "og:image phải là địa chỉ đầy đủ (có https://), không dùng đường dẫn tương đối");
      } else {
        try {
          const r = await fetch(veGocDangChay(ogImg));
          if (r.status !== 200) {
            loi(ten, `og:image trỏ tới "${ogImg}" nhưng trả về HTTP ${r.status} — chia sẻ lên Facebook sẽ không có ảnh`);
          } else {
            const kt = kichThuocAnh(await r.arrayBuffer());
            const w = og(html, "og:image:width");
            const h = og(html, "og:image:height");
            if (kt && w && h && (String(kt.w) !== w || String(kt.h) !== h)) {
              loi(ten, `og:image:width/height ghi ${w}x${h} nhưng ảnh thật là ${kt.w}x${kt.h} — Facebook dựng khung xem trước sai`);
            }
            if (kt && (kt.w < 600 || kt.h < 315)) {
              nhac(ten, `Ảnh chia sẻ hơi nhỏ (${kt.w}x${kt.h}) — Facebook hiển thị đẹp nhất từ 1200x630`);
            }
          }
        } catch (e) {
          nhac(ten, `Không kiểm được og:image — ${e.message}`);
        }
      }
    }

    // Thứ bậc heading
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

    // Ảnh thiếu alt. Ảnh trang trí thì để alt="" là hợp lệ, nên chỉ bắt khi
    // không có thuộc tính alt.
    const thieuAlt = [...html.matchAll(/<img\s[^>]*>/gi)].filter((m) => !/\salt=/i.test(m[0]));
    if (thieuAlt.length) loi(ten, `${thieuAlt.length} thẻ <img> không có thuộc tính alt`);

    // Ảnh bìa bài viết để alt rỗng thì Google không biết ảnh chụp gì
    const anhBia = html.match(/<div class="article-hero-img"[\s\S]*?<img[^>]*>/);
    if (anhBia && /\salt=""/.test(anhBia[0])) {
      nhac(ten, 'Ảnh bìa đang để alt rỗng — điền ô "Mô tả ảnh bìa" trong trang quản trị');
    }

    // Gom link nội bộ để soát trang mồ côi ở bước sau
    const link = [...html.matchAll(/href="(\/[^"#?]*)"/g)]
      .map((m) => MIEN_THAT + (m[1] === "/" ? "/" : m[1].replace(/\/$/, "")))
      .filter((v, i, a) => a.indexOf(v) === i);
    linkNoiBoTheoTrang.set(locGoc, link);
  }

  // ——— 4. Trang mồ côi: có trong sitemap nhưng không trang nào trỏ tới ———
  //
  // Đây đúng là thứ Search Console gọi là "Referring page: None detected".
  // Google hiếm khi chịu khó đọc một trang mà cả site không ai dẫn tới.
  const duocTroToi = new Set();
  for (const ds of linkNoiBoTheoTrang.values()) {
    for (const u of ds) duocTroToi.add(u.replace(/\/$/, ""));
  }
  for (const locGoc of dsLoc) {
    const chuan = locGoc.replace(/\/$/, "");
    // Trang chủ luôn được coi là có đường vào (Google biết tên miền).
    if (chuan === MIEN_THAT || chuan === "") continue;
    if (!duocTroToi.has(chuan)) {
      loi(
        locGoc.replace(MIEN_THAT, "") || "/",
        "Không có trang nào trong site trỏ tới địa chỉ này — thêm một liên kết từ menu, chân trang, hoặc một bài liên quan"
      );
    }
  }

  // ——— 5. lastmod của trang tĩnh có bị bỏ quên không ———
  //
  // Chỉ chạy được khi có kho mã và lịch sử git đầy đủ, tức là trên máy người
  // phát triển. Trên máy build (Cloudflare clone nông) thì bỏ qua, không báo.
  const thuMucKho = path.resolve(__dirname, "..", "..", "..", "..");
  const trangTinh = {
    "/": "web/src/pages/index.astro",
    "/bac-si-le-trung-kien": "web/src/pages/bac-si-le-trung-kien.astro",
    "/dieu-tri": "web/src/pages/dieu-tri.astro",
    "/y-te-su-kien": "web/src/pages/y-te-su-kien.astro",
    "/dien-gia-seminar": "web/src/pages/dien-gia-seminar.astro",
  };
  for (const [duong, file] of Object.entries(trangTinh)) {
    const dayDu = path.join(thuMucKho, file);
    if (!fs.existsSync(dayDu)) continue;
    let ngayGit;
    try {
      ngayGit = execFileSync("git", ["log", "-1", "--format=%cs", "--", file], {
        cwd: thuMucKho,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      continue; // không có git hoặc clone nông — bỏ qua
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ngayGit)) continue;

    const loc = duong === "/" ? MIEN_THAT + "/" : MIEN_THAT + duong;
    const lastmod = lastmodTheoLoc.get(loc);
    if (!lastmod) continue;
    if (ngayGit > lastmod) {
      nhac(
        duong,
        `File ${file} có commit ngày ${ngayGit} nhưng sitemap vẫn ghi lastmod ${lastmod}. ` +
          `Nếu lần sửa đó có đổi nội dung thì cập nhật lastmod trong web/src/pages/sitemap.xml.ts`
      );
    }
  }

  // ——— In kết quả ———
  console.log(`\nKiểm tra SEO — ${dsLoc.length} địa chỉ trong sitemap của ${goc}\n`);
  if (baoCao.size === 0) {
    console.log("  Không phát hiện vấn đề nào.\n");
  } else {
    for (const [trang, dsMuc] of [...baoCao.entries()].sort()) {
      console.log(`  ${trang}`);
      for (const { muc, loai } of dsMuc) console.log(`    [${loai}] ${muc}`);
      console.log("");
    }
  }
  console.log(`Tổng: ${soLoi} lỗi, ${soNhac} nhắc nhở.`);
  console.log(soLoi > 0 ? "Sửa hết phần [LỖI] rồi chạy lại lệnh này.\n" : "");
  process.exit(soLoi > 0 ? 1 : 0);
})();
