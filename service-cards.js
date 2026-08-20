// Thẻ dịch vụ dùng chung cho toàn site.
// Cùng một mẫu thẻ được dùng ở hai nơi, nên sửa tên / mô tả / ảnh / chữ nút
// trong file này là đổi đồng thời cả ngoài trang chủ lẫn trong trang dịch vụ:
//
//   1. Trang chủ — khối "Dịch vụ", hiện đủ cả 3 dịch vụ. Trong HTML để sẵn:
//        <div class="offer-grid service-cards"></div>
//
//   2. Ba trang dịch vụ — khối "Xem thêm" ở cuối trang, hiện 2 dịch vụ còn
//      lại (trang đang mở tự loại chính nó ra). Trong HTML để sẵn:
//        <section class="section service-related"></section>
//
// Nạp <script src="service-cards.js"></script> sau site-footer.js và TRƯỚC
// script.js / sticky-cta.js, để hai file đó nhìn thấy các thẻ vừa dựng.
(function () {
  // ——— Nội dung, sửa ở đây ———
  // Số Zalo lấy từ thong-tin.js — nguồn duy nhất cho toàn site.
  var ZALO = window.THONG_TIN.ZALO;
  var CHU_NUT_XEM = "Tìm hiểu thêm";

  // Tiêu đề khối "Xem thêm" ở cuối các trang dịch vụ
  var XEM_THEM_NHAN = "Xem thêm";
  var XEM_THEM_TIEU_DE = "Các dịch vụ khác mình cung cấp";

  var DICH_VU = [
    {
      href: "y-te-su-kien",
      ten: "Y tế sự kiện thể thao",
      mo_ta:
        "Hỗ trợ y tế, sơ cứu chấn thương cho các giải chạy, giải đấu thể thao phong trào.",
      anh: "assets/img/sports-seagames31.jpg",
      alt: "Y tế sự kiện thể thao",
      chu_nut_lien_he: "Liên hệ hợp tác",
    },
    {
      href: "dien-gia-seminar",
      ten: "Diễn giả tại seminar",
      mo_ta:
        "Chia sẻ chuyên môn tại workshop, seminar chăm sóc sức khỏe cho doanh nghiệp, trường học.",
      anh: "assets/img/offer-dien-gia-tigren.jpg",
      alt: "Diễn giả tại seminar sức khỏe",
      chu_nut_lien_he: "Liên hệ hợp tác",
    },
    {
      href: "dieu-tri",
      ten: "Thăm khám & điều trị",
      mo_ta:
        "Châm cứu, vật lý trị liệu cho đau cơ xương khớp và chấn thương thể thao.",
      anh: "assets/img/offer-dien-cham-phong-dieu-tri.jpg",
      alt: "Bác sĩ Lê Trung Kiên điều chỉnh máy điện châm cho người bệnh tại phòng điều trị, kết hợp đèn hồng ngoại",
      chu_nut_lien_he: "Tư vấn điều trị",
    },
  ];

  function thoat(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ——— Mẫu thẻ dịch vụ: chỉ có ở đây, mọi nơi đều dùng lại ———
  function theDichVu(dv) {
    return [
      '<div class="offer-card service-card">',
      '  <div class="offer-img"><img src="' + thoat(dv.anh) + '" alt="' + thoat(dv.alt) + '" loading="lazy"></div>',
      "  <h3>" + thoat(dv.ten) + "</h3>",
      "  <p>" + thoat(dv.mo_ta) + "</p>",
      '  <div class="offer-actions">',
      '    <a class="btn btn-main btn-sm" href="' + ZALO + '" target="_blank" rel="noopener">' + thoat(dv.chu_nut_lien_he) + "</a>",
      '    <a class="btn btn-outline btn-sm" href="' + thoat(dv.href) + '">' + thoat(CHU_NUT_XEM) + "</a>",
      "  </div>",
      "</div>",
    ].join("\n");
  }

  // Tên trang, bỏ đuôi .html vì có host phục vụ địa chỉ gọn (/dieu-tri thay vì
  // /dieu-tri.html) — so phần tên là khớp được cả hai kiểu.
  function tenTrang(duongDan) {
    var cuoi = duongDan.split("/").pop() || "index.html";
    return cuoi.replace(/\.html?$/i, "").toLowerCase();
  }

  // ——— 1. Lưới đủ 3 dịch vụ (trang chủ) ———
  var luoi = document.querySelector(".service-cards");
  if (luoi) {
    luoi.innerHTML = DICH_VU.map(theDichVu).join("\n");
  }

  // ——— 2. Khối "Xem thêm" ở cuối trang dịch vụ ———
  var khoi = document.querySelector("section.service-related");
  if (!khoi) return;

  var trangHienTai = tenTrang(window.location.pathname);
  var khac = DICH_VU.filter(function (dv) {
    return tenTrang(dv.href) !== trangHienTai;
  });
  if (khac.length === 0) {
    khoi.remove();
    return;
  }

  khoi.innerHTML = [
    '<div class="container">',
    '  <div class="section-title text-center">',
    '    <p class="section-label">' + thoat(XEM_THEM_NHAN) + "</p>",
    "    <h2>" + thoat(XEM_THEM_TIEU_DE) + "</h2>",
    '    <div class="divider mx-auto"></div>',
    "  </div>",
    '  <div class="offer-grid service-cards-related">',
    khac.map(theDichVu).join("\n"),
    "  </div>",
    "</div>",
  ].join("\n");

  // Nền xen kẽ: section ngay trên đã là nền xanh nhạt thì khối này để trắng,
  // và ngược lại — khỏi phải nhớ đặt class khác nhau cho từng trang.
  var truoc = khoi.previousElementSibling;
  var trenLaAlt = truoc && truoc.classList.contains("section-alt");
  khoi.classList.toggle("section-alt", !trenLaAlt);
})();
