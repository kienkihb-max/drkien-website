// Thẻ một bài viết — CHỖ DUY NHẤT dựng ra khối HTML đó.
//
// Có ba nơi cần đúng một hình hài này: trang blog, khối "Bài viết khác" ở
// cuối mỗi bài, và ô xem trước trong trang soạn bài. Nếu mỗi nơi tự chép
// một bản thì sớm muộn ô xem trước sẽ nói dối — người viết thấy một đằng,
// người đọc thấy một nẻo, mà không có dấu hiệu gì.
//
// Component TheBai.astro chỉ là lớp vỏ mỏng gọi vào đây.
import { duongDanAnh } from "./dia-chi-anh.mjs";

export interface ThongTinThe {
  slug: string;
  tieu_de: string;
  mo_ta: string;
  anh?: string | null;
  anh_alt?: string | null;
}

/** Chữ do người viết gõ, phải thoát trước khi ghép vào HTML. */
function thoat(chu: unknown) {
  return String(chu ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param them_lop "event-card-featured" cho khối nổi bật đầu trang blog,
 *   "related-card" cho khối cuối bài.
 */
export function htmlTheBai(the: ThongTinThe, them_lop = ""): string {
  const lop = ["event-card", "event-card-link", them_lop].filter(Boolean).join(" ");
  const nhan =
    them_lop === "event-card-featured" ? '<span class="event-badge">Nổi bật</span>' : "";
  const anh = the.anh
    ? '<div class="event-img"><img src="' +
      thoat(duongDanAnh(the.anh)) +
      '" alt="' +
      thoat(the.anh_alt ?? "") +
      '" loading="lazy"></div>'
    : "";

  return (
    '<a class="' + lop + '" href="/' + thoat(the.slug) + '">' +
    nhan +
    anh +
    "<h3>" + thoat(the.tieu_de) + "</h3>" +
    "<p>" + thoat(the.mo_ta) + "</p>" +
    '<span class="related-more">Đọc bài viết ' +
    '<svg class="icon icon-sm"><use href="#ic-arrow"/></svg></span>' +
    "</a>"
  );
}
