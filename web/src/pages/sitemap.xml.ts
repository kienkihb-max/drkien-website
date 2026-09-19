// Sơ đồ trang gửi cho Google, sinh lúc build.
//
// Trước đây sitemap.xml là file chép tay: thêm bài mới phải nhớ chép thêm
// một khối <url>. Quên là bài không được Google tìm ra — và thực tế đã quên
// 2 bài (dau-cot-song-dan-van-phong-talkshow-tigren và
// so-cuu-tre-em-tap-huan-mai-dich), bộ kiểm tra SEO của dự án vẫn đang báo
// lỗi đó. Nay sinh thẳng từ database nên không còn cửa để quên.
//
// robots.txt trỏ tới /sitemap.xml, nên đường dẫn này phải giữ nguyên.

import type { APIRoute } from "astro";
import { layBaiHienLen } from "../lib/supabase";
import { gomChuyenMuc } from "../lib/chuyen-muc";
import { GOC } from "../data/thong-tin.mjs";

// Trang tĩnh — sửa tay ở đây khi thêm trang mới.
// changefreq và priority chỉ là gợi ý cho Google, giữ đúng như sitemap cũ.
//
// LUẬT CHO lastmod: ghi ngày NỘI DUNG của trang đổi lần gần nhất, không
// phải ngày build. Sửa chữ nghĩa, thêm bớt một mục trong trang thì mới đổi;
// còn đổi màu nút hay sửa menu chung thì không tính.
//
// Vì sao phải giữ cho đúng: Google dùng ngày này để đoán trang nào đáng ghé
// lại. Ghi ngày cũ trong khi trang vừa đổi là tự bảo Google 'không có gì
// mới'. Ngược lại, cứ đặt ngày hôm nay cho mọi lần build thì Google phát
// hiện ra là ngày giả và bỏ qua luôn trường này.
//
// Bộ kiểm tra SEO (.claude/skills/seo/scripts/kiem-tra-seo.js) có soát chỗ
// này: nếu file .astro của trang có commit mới hơn ngày ghi ở đây, nó sẽ
// nhắc — nên quên thì vẫn có nơi bắt lại.
const TRANG_TINH = [
  // 13/09: đổi tên và mô tả ba dịch vụ trên thẻ ở trang chủ.
  { duong_dan: "", lastmod: "2026-09-13", tan_suat: "weekly", uu_tien: "1.0" },
  // Nội dung trang hồ sơ chưa đổi kể từ lúc chuyển sang Astro.
  { duong_dan: "bac-si-le-trung-kien", lastmod: "2026-08-22", tan_suat: "monthly", uu_tien: "0.9" },
  // 13/09: ba trang dịch vụ được thêm khối "Bài viết liên quan".
  { duong_dan: "dieu-tri", lastmod: "2026-09-13", tan_suat: "monthly", uu_tien: "0.8" },
  { duong_dan: "y-te-su-kien", lastmod: "2026-09-13", tan_suat: "monthly", uu_tien: "0.8" },
  { duong_dan: "dien-gia-seminar", lastmod: "2026-09-13", tan_suat: "monthly", uu_tien: "0.8" },
  // 19/09: trang sản phẩm mới lập. Nội dung đọc từ data/san-pham.mjs, nên
  // thêm bớt một món trong file đó là phải sửa lastmod ở đây.
  { duong_dan: "san-pham", lastmod: "2026-09-19", tan_suat: "monthly", uu_tien: "0.8" },
];

export const GET: APIRoute = async () => {
  const bai = await layBaiHienLen();

  // Trang blog đổi mỗi khi có bài mới, nên lấy ngày của bài mới nhất.
  const moi_nhat = bai[0]?.ngay_sua || bai[0]?.ngay_dang || "2026-08-08";

  const muc = [
    ...TRANG_TINH,
    { duong_dan: "blog", lastmod: moi_nhat, tan_suat: "weekly", uu_tien: "0.7" },
    // Trang chuyên mục sinh từ chính chuyên mục các bài đang dùng, nên đặt
    // thêm mục mới trong CMS là sitemap có thêm địa chỉ — không phải nhớ
    // chép tay như sitemap đời trước.
    ...gomChuyenMuc(bai).map((m) => ({
      duong_dan: "blog/" + m.slug,
      lastmod: m.bai[0]?.ngay_sua || m.bai[0]?.ngay_dang || moi_nhat,
      tan_suat: "weekly",
      uu_tien: "0.65",
    })),
    // Bài đã gỡ khỏi danh sách (an = true) KHÔNG vào sitemap — trang vẫn
    // sống để link cũ không chết, nhưng không mời Google vào đọc nữa.
    ...bai.map((b) => ({
      duong_dan: b.slug,
      lastmod: b.ngay_sua || b.ngay_dang,
      tan_suat: "yearly",
      uu_tien: "0.6",
    })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!--\n` +
    `  File này do máy sinh ra lúc build, từ database. Đừng sửa tay.\n` +
    `  Thêm trang tĩnh mới thì sửa web/src/pages/sitemap.xml.ts.\n` +
    `-->\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    muc
      .map(
        (m) =>
          `  <url>\n` +
          `    <loc>${GOC}/${m.duong_dan}</loc>\n` +
          `    <lastmod>${m.lastmod}</lastmod>\n` +
          `    <changefreq>${m.tan_suat}</changefreq>\n` +
          `    <priority>${m.uu_tien}</priority>\n` +
          `  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
