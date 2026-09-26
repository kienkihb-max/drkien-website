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

// Nút gọi điện suy ra từ SO_ZALO — ở Việt Nam số Zalo cũng chính là số điện
// thoại, nên khai thêm một số thứ hai ở đây là tự tạo chỗ để hai số lệch
// nhau. Cùng lý do với BAN_DO suy ra từ DIA_CHI bên dưới.
export const GOI_DIEN = "tel:+84" + SO_ZALO.replace(/\D/g, "").replace(/^0/, "");

export const GIO = [
  { ngay: "Thứ 2 – Thứ 6", gio: "17h30 – 19h30" },
  { ngay: "Thứ 7 – Chủ nhật", gio: "9h00 – 17h00" },
];

// Link Google Maps của phòng khám (chủ site gửi 26/9/2026). Bấm vào là mở
// đúng điểm "Bác sĩ Lê Trung Kiên" trên Google Maps, có nút chỉ đường.
export const CHI_DUONG = "https://maps.app.goo.gl/s8rgHvPo5umnBPVh6";

// Toạ độ của đúng điểm đó. Bản đồ nhúng ghim theo toạ độ chứ không tìm theo
// chữ địa chỉ: tìm "Ngõ 8, Ngô Quyền" thì Google ghim vào đầu ngõ, lệch khỏi
// cửa phòng khám. Chuyển phòng khám thì sửa cả DIA_CHI, CHI_DUONG và dòng này.
const TOA_DO = "20.9747673,105.7733621";
export const BAN_DO = "https://www.google.com/maps?q=" + TOA_DO + "&z=17&output=embed";

export const TEN_BAC_SI = "ThS.BS Lê Trung Kiên";
export const TEN_SITE = "Bác sĩ Lê Trung Kiên";
export const GOC = "https://bacsikien.com";
