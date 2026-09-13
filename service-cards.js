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
  // ——— Dữ liệu: KHÔNG sửa ở đây ———
  // Tên, mô tả, ảnh của ba dịch vụ nằm ở web/src/data/dich-vu.mjs —
  // nguồn duy nhất mà header, footer và breadcrumb cũng đọc. File đó được
  // dong-bo-tinh.mjs nấu thành window.DICH_VU lúc build.
  //
  // Sửa tên một dịch vụ ở đây là tạo bản sao thứ hai, và bản sao đó sẽ
  // lệch với phần còn lại của site đúng vào lần sửa sau.
  var ZALO = window.THONG_TIN.ZALO;
  var DICH_VU = window.DICH_VU || [];
  var CHU = window.DICH_VU_CHU || {};
  var CHU_NUT_XEM = CHU.CHU_NUT_XEM;
  var XEM_THEM_NHAN = CHU.XEM_THEM_NHAN;
  var XEM_THEM_TIEU_DE = CHU.XEM_THEM_TIEU_DE;
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
      '  <div class="offer-img"><img src="' + thoat(dv.anh) + '" alt="' + thoat(dv.anh_alt) + '" loading="lazy"></div>',
      "  <h3>" + thoat(dv.ten) + "</h3>",
      "  <p>" + thoat(dv.mo_ta) + "</p>",
      '  <div class="offer-actions">',
      '    <a class="btn btn-main btn-sm" href="' + ZALO + '" target="_blank" rel="noopener">' + thoat(dv.chu_nut) + "</a>",
      '    <a class="btn btn-outline btn-sm" href="' + thoat(dv.duong_dan) + '">' + thoat(CHU_NUT_XEM) + "</a>",
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
    return tenTrang(dv.duong_dan) !== trangHienTai;
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
