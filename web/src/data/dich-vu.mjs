// Ba dịch vụ của site — NGUỒN DUY NHẤT cho tên gọi, mô tả và ảnh.
//
// Trước đây tên mỗi dịch vụ nằm rải ở bốn chỗ và cả bốn nói khác nhau: thẻ
// trang chủ ghi "Diễn giả tại seminar", menu ghi "Diễn giả", chân trang ghi
// "Diễn giả seminar", breadcrumb lại ghi kiểu thứ tư. Người đọc bấm vào ba
// nhãn khác nhau rồi ra cùng một trang, tưởng là ba dịch vụ.
//
// Nay mọi nơi đọc từ đây:
//   - Header.astro, Footer.astro     — nhập thẳng file này
//   - breadcrumb các trang dịch vụ   — nhập thẳng file này
//   - service-cards.js (chạy ở trình duyệt) — đọc window.DICH_VU, do
//     dong-bo-tinh.mjs sinh ra từ chính file này lúc build
//
// Đổi tên một dịch vụ thì sửa đúng một dòng "ten" bên dưới.
//
// Đừng đặt tên rút gọn riêng cho menu: chủ site đã chốt dùng một tên duy
// nhất ở mọi nơi, tên ngắn khác nhau chính là thứ đã sinh ra mớ lộn xộn trên.

/**
 * @typedef {object} DichVu
 * @property {string} duong_dan  Địa chỉ trang, có gạch chéo đầu: "/dieu-tri"
 * @property {string} ten        Tên hiển thị — dùng ở MỌI nơi
 * @property {string} mo_ta      Một câu cho thẻ dịch vụ
 * @property {string} anh        Ảnh thẻ, đường dẫn trong site
 * @property {string} anh_alt    Mô tả ảnh
 * @property {string} chu_nut    Chữ trên nút liên hệ của thẻ
 * @property {string} icon       Id icon trong BoIcon.astro, ví dụ "ic-bone"
 */

/** @type {DichVu[]} */
export const DICH_VU = [
  {
    duong_dan: "/y-te-su-kien",
    icon: "ic-shield",
    ten: "Y tế sự kiện thể thao",
    mo_ta: "Hỗ trợ y tế, sơ cứu chấn thương cho các giải chạy, giải đấu thể thao phong trào.",
    anh: "assets/img/sports-seagames31.jpg",
    anh_alt: "Y tế sự kiện thể thao",
    chu_nut: "Liên hệ hợp tác",
  },
  {
    duong_dan: "/dien-gia-seminar",
    icon: "ic-chat",
    ten: "Diễn giả workshop",
    mo_ta: "Chia sẻ chuyên môn tại workshop, seminar chăm sóc sức khỏe cho doanh nghiệp, trường học.",
    anh: "assets/img/offer-dien-gia-tigren.jpg",
    anh_alt: "Diễn giả workshop, seminar sức khỏe",
    chu_nut: "Liên hệ hợp tác",
  },
  {
    duong_dan: "/dieu-tri",
    icon: "ic-bone",
    ten: "Thăm khám & điều trị",
    mo_ta: "Châm cứu, vật lý trị liệu cho đau cơ xương khớp và chấn thương thể thao.",
    anh: "assets/img/offer-dien-cham-phong-dieu-tri.jpg",
    anh_alt:
      "Bác sĩ Lê Trung Kiên điều chỉnh máy điện châm cho người bệnh tại phòng điều trị, kết hợp đèn hồng ngoại",
    chu_nut: "Tư vấn điều trị",
  },
];

/** Chữ trên nút phụ của thẻ dịch vụ. */
export const CHU_NUT_XEM = "Tìm hiểu thêm";

/** Tiêu đề khối "Xem thêm" ở cuối mỗi trang dịch vụ. */
export const XEM_THEM_NHAN = "Xem thêm";
export const XEM_THEM_TIEU_DE = "Các dịch vụ khác mình cung cấp";

/**
 * Tra một dịch vụ theo đuôi địa chỉ, ví dụ "dieu-tri" hay "/dieu-tri".
 * Trả về undefined nếu không có — nơi gọi tự quyết định làm gì.
 * @param {string} duong_dan
 * @returns {DichVu | undefined}
 */
export function timDichVu(duong_dan) {
  const sach = "/" + String(duong_dan || "").replace(/^\/+/, "");
  return DICH_VU.find((d) => d.duong_dan === sach);
}
