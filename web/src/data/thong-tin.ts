// Thông tin phòng khám — NGUỒN DUY NHẤT cho toàn bộ site.
//
// Địa chỉ, giờ làm việc, số Zalo, Facebook chỉ có mặt ở đây. Sửa một chỗ này
// là đổi đồng thời header, footer, thẻ dịch vụ và mọi trang.
//
// Đây là bản chuyển từ thong-tin.js sang. Khác biệt duy nhất: chữ được Astro
// in thẳng vào HTML lúc build, thay vì JS điền vào lúc trang chạy — nên
// Google đọc được địa chỉ và giờ làm việc, điều trước đây nó không thấy.

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
