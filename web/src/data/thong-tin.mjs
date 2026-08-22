// Thông tin phòng khám — NGUỒN DUY NHẤT cho toàn bộ site.
//
// Sửa địa chỉ, giờ làm việc, số Zalo, Facebook ở đây là đổi đồng thời:
//   - header, footer, trang bài (component Astro import thẳng file này)
//   - web/public/thong-tin.js (do dong-bo-tinh.mjs SINH RA từ file này,
//     cho mấy script còn chạy phía trình duyệt như seo-schema.js và
//     service-cards.js dùng qua window.THONG_TIN)
//
// Để đuôi .mjs chứ không phải .ts vì cả Astro lẫn script build đều phải
// đọc được nó. Đây là điểm mấu chốt: có đúng một chỗ chứa số điện thoại,
// không có bản thứ hai để lệch.

export const DIA_CHI = "Ngõ 8, Ngô Quyền, Hà Đông, Hà Nội";
export const SO_ZALO = "034 590 1772";
export const ZALO = "https://zalo.me/0345901772";
export const FACEBOOK = "https://www.facebook.com/bskienyhcthn/";

export const GIO = [
  { ngay: "Thứ 2 – Thứ 6", gio: "17h30 – 19h30" },
  { ngay: "Thứ 7 – Chủ nhật", gio: "9h00 – 17h00" },
];

// Bản đồ suy ra từ địa chỉ, nên đổi địa chỉ là bản đồ đổi theo.
export const BAN_DO =
  "https://www.google.com/maps?q=" + encodeURIComponent(DIA_CHI) + "&output=embed";

export const TEN_BAC_SI = "ThS.BS Lê Trung Kiên";
export const TEN_SITE = "Bác sĩ Lê Trung Kiên";
export const GOC = "https://bacsikien.com";
