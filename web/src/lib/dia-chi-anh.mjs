// Đường dẫn ảnh — phần dùng được ở CẢ hai phía.
//
// Tách khỏi co-anh.mjs vì file đó "import node:fs" để đo ảnh lúc build, mà
// trình duyệt không có node:fs. Trang /admin/bai chỉ cần đúng hàm
// duongDanAnh() để vẽ ảnh xem trước, nhưng nạp cả co-anh.mjs vào là script
// chết ngay dòng đầu — không có lỗi nào hiện trên trang, chỉ thấy trang
// treo mãi ở "Đang tải…". Đã mất một buổi vì đúng chỗ này.
//
// Quy tắc: file này KHÔNG được import bất cứ thứ gì của Node.

/**
 * Đường dẫn để đặt vào thẻ <img src>.
 *
 * Site đang có hai loại ảnh sống chung: ảnh cũ nằm trong repo
 * ("assets/img/a.jpg") và ảnh tải lên qua CMS nằm ở Supabase Storage
 * ("https://…"). Gắn cứng dấu "/" vào đầu như trước là biến địa chỉ
 * Storage thành "/https://…" và ảnh chết.
 */
export function duongDanAnh(anh) {
  if (!anh) return "";
  return /^https?:\/\//i.test(anh) ? anh : "/" + anh.replace(/^\//, "");
}

/** Ảnh nằm ngoài site thì không đo được từ file trên đĩa. */
export function laAnhNgoai(anh) {
  return /^https?:\/\//i.test(anh || "");
}
