// Danh sách sản phẩm — NGUỒN DUY NHẤT cho trang /san-pham.
//
// Sửa chữ nghĩa, thêm hay bớt một món thì sửa đúng file này, không đụng vào
// san-pham.astro. Trang tự dựng lại theo danh sách bên dưới.
//
// LUẬT QUAN TRỌNG NHẤT — chủ site đã chốt:
// Mỗi món CHỈ GHI TÊN. Không ghi công dụng, không ghi cách dùng, không ghi
// mô tả. Lý do có hai:
//   1. Đây là chế phẩm hỗ trợ, không phải thuốc đã đăng ký. Quảng cáo ở Việt
//      Nam cấm gán công dụng chữa bệnh cho loại này.
//   2. Công dụng và liều dùng là việc của buổi khám, không phải của một
//      trang giới thiệu — mỗi người một thể trạng.
// Ai cần biết thêm thì nhắn Zalo hỏi. Đừng thêm trường mô tả trở lại.
//
// CÁCH THÊM MỘT MÓN MỚI
//   1. Chép một khối { ten, icon, anh, anh_alt } có sẵn xuống dưới.
//   2. "icon" lấy tên trên lucide.dev, viết kiểu PascalCase ("Leaf"). Icon
//      chưa có trong danh sách thì phải khai thêm một dòng trong phần ICON
//      ở đầu san-pham.astro, nếu không thẻ sẽ dựng thiếu hình.
//   3. "anh" là tên file trong web/public/assets/img. Ảnh cắt khổ 4:3, rộng
//      900px, JPEG chất lượng 85 — cùng khổ thì lưới thẻ mới đều.
//   4. "anh_alt" bắt buộc có: Google và trình đọc màn hình dựa vào đó.
//
// Tên file ảnh đặt theo THỨ CÓ TRONG ẢNH chứ không theo tên món, để sau này
// đổi món nào dùng ảnh nào thì nhìn tên vẫn biết ảnh chụp gì.
//
// GIÁ: chủ site đã chốt KHÔNG hiện giá trên trang, ai hỏi thì nhắn Zalo.
// Đừng thêm trường giá vào đây — giá đổi mà trang quên sửa còn tệ hơn là
// không ghi.

/**
 * @typedef {object} SanPham
 * @property {string} ten       Tên món — thứ duy nhất hiện trên thẻ
 * @property {string} icon      Tên icon Lucide, PascalCase
 * @property {string} anh       Tên file ảnh trong assets/img
 * @property {string} anh_alt   Mô tả ảnh cho Google và trình đọc màn hình
 * @property {boolean} [noi_bat] Món nổi bật: xếp thành hàng trên, thẻ to
 *                               hơn. Hiện đang để HAI món — hàng trên hai
 *                               thẻ, hàng dưới ba thẻ, cân nhau.
 *                               Đổi số lượng thì nhớ sửa luôn số cột của
 *                               .luoi-noi-bat và .luoi-mon trong
 *                               san-pham.astro, nếu không hàng sẽ hụt ô.
 */

/** Nhãn nhỏ, tiêu đề và đoạn dẫn của khối sản phẩm tự bào chế. */
export const TU_BAO_CHE = {
  ma: "tu-bao-che",
  nhan: "Tự bào chế",
  tieu_de: "Chế phẩm mình tự bào chế",
};

/** @type {SanPham[]} */
export const SAN_PHAM = [
  {
    ten: "Bột tam thất",
    icon: "Leaf",
    anh: "product-bot-tam-that-nb.jpg",
    anh_alt: "Các túi bột tam thất đang cân trên cân điện tử",
    noi_bat: true,
  },
  {
    ten: "Thuốc thang, thuốc sắc",
    icon: "FlaskConical",
    anh: "product-thuoc-sac-nb.jpg",
    anh_alt: "Túi thuốc đã sắc sẵn, nước thuốc màu nâu",
    noi_bat: true,
  },
  {
    ten: "Bột ngâm chân",
    icon: "Footprints",
    anh: "product-bot-ngam-chan.jpg",
    anh_alt: "Túi bột ngâm chân thảo dược đóng gói sẵn",
  },
  {
    ten: "Cồn xoa bóp",
    icon: "Droplets",
    anh: "product-con-xoa-bop.jpg",
    anh_alt: "Chai cồn xoa bóp dạng xịt do bác sĩ Lê Trung Kiên bào chế",
  },
  {
    ten: "Thuốc ngâm rượu",
    icon: "BottleWine",
    anh: "product-thang-goi-giay.jpg",
    anh_alt: "Xấp thang thuốc gói giấy buộc dây",
  },
];

/**
 * Khối "nhận đặt hộ". Chủ site chốt để gọn: một dòng nói nhận đặt những gì,
 * rồi mời nhắn Zalo — không liệt kê thành thẻ, vì hàng đặt hộ mỗi đợt mỗi
 * khác, ghi cụ thể ra là trang sai ngay tháng sau.
 */
export const DAT_HO = {
  ma: "dat-ho",
  nhan: "Nhận đặt hộ",
  tieu_de: "Đặt hộ chế phẩm Đông y, dược liệu, trà dưỡng sinh",
  dan: "Mình nhận đặt hộ chế phẩm Đông y từ các nhà thuốc Trung Quốc như Đồng Nhân Đường, cùng dược liệu và trà dưỡng sinh. Cần món gì thì nhắn Zalo cho mình.",
};

/** Chữ trên nút liên hệ dùng khắp trang. */
export const CHU_NUT_HOI = "Hỏi về sản phẩm";
