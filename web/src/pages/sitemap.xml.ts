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
import { GOC } from "../data/thong-tin.mjs";

// Trang tĩnh — sửa tay ở đây khi thêm trang mới.
// changefreq và priority chỉ là gợi ý cho Google, giữ đúng như sitemap cũ.
const TRANG_TINH = [
  { duong_dan: "", lastmod: "2026-08-08", tan_suat: "weekly", uu_tien: "1.0" },
  { duong_dan: "bac-si-le-trung-kien", lastmod: "2026-08-08", tan_suat: "monthly", uu_tien: "0.9" },
  { duong_dan: "dieu-tri", lastmod: "2026-08-08", tan_suat: "monthly", uu_tien: "0.8" },
  { duong_dan: "y-te-su-kien", lastmod: "2026-08-08", tan_suat: "monthly", uu_tien: "0.8" },
  { duong_dan: "dien-gia-seminar", lastmod: "2026-08-08", tan_suat: "monthly", uu_tien: "0.8" },
];

export const GET: APIRoute = async () => {
  const bai = await layBaiHienLen();

  // Trang blog đổi mỗi khi có bài mới, nên lấy ngày của bài mới nhất.
  const moi_nhat = bai[0]?.ngay_sua || bai[0]?.ngay_dang || "2026-08-08";

  const muc = [
    ...TRANG_TINH,
    { duong_dan: "blog", lastmod: moi_nhat, tan_suat: "weekly", uu_tien: "0.7" },
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
