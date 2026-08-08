// Danh sách bài blog dùng chung cho toàn site.
//
// Trước đây mỗi bài viết tự chép tay 4 thẻ "Bài viết khác" ở cuối trang, còn
// trang blog chép thêm một bộ nữa. Đổi tiêu đề hay ảnh một bài là phải sửa 6
// chỗ, sót một chỗ thì lệch mà không ai biết. Nay sửa ở đây là đổi hết.
//
// Cách dùng trong HTML:
//   Trang blog:   <div class="blog-list"></div>
//   Cuối bài viết: <section class="section blog-related"></section>
//   rồi nạp <script src="blog-cards.js"></script>
//
// Thêm bài mới: thêm một mục vào DANH_SACH bên dưới, đặt noi_bat: true nếu
// muốn bài đó nằm ở khối nổi bật đầu trang blog.
(function () {
  // ——— Danh sách bài viết, sửa ở đây ———
  // Thứ tự trong mảng là thứ tự hiển thị.
  var DANH_SACH = [
    {
      href: "chuot-rut-khi-chay-bo",
      tieu_de: "Chuột rút khi chạy bộ: Chuối hay tập tạ?",
      mo_ta: "Nghiên cứu trên 98 vận động viên marathon cho thấy điều khác biệt không nằm ở nước hay điện giải.",
      anh: "assets/img/sports-marathon-expert.jpg",
      alt: "ThS.BS Lê Trung Kiên cùng chuyên gia Karl Gunter Lange tại Viettel Marathon Hà Nội 2024",
      noi_bat: true,
    },
    {
      href: "van-dong-phuc-hoi-cot-song",
      tieu_de: "Thoát vị đĩa đệm: 6 sự thật",
      mo_ta: 'Đĩa đệm không hề "trượt", MRI bất thường gặp cả ở người không đau, và khối thoát vị có thể tự tiêu biến.',
      anh: "assets/img/offer-treatment.jpg",
      alt: "Điện châm vùng thắt lưng kết hợp đèn hồng ngoại tại khoa Y học cổ truyền",
      noi_bat: true,
    },
    {
      href: "chuot-rut-khi-van-dong",
      tieu_de: "Chạy lại sau tái tạo dây chằng chéo trước",
      mo_ta: "Vì sao mốc 12 tuần không đủ để quyết định cho chạy lại, và những tiêu chí chức năng cần đạt trước đó.",
      anh: "assets/img/sports-football-injury.jpg",
      alt: "Bác sĩ xử trí chấn thương chân cho cầu thủ ngay trên sân bóng",
    },
    {
      href: "shin-splints-dau-xuong-chay",
      tieu_de: "Hiểu đúng về hội chứng quá tải thường gặp ở người chạy bộ",
      mo_ta: "Nhận diện hội chứng quá tải thường gặp ở người chạy bộ, và vì sao điều chỉnh tải vận động quan trọng hơn nghỉ ngơi đơn thuần.",
      anh: "assets/img/blog-run-with-me-cong-dong-khoe.jpg",
      alt: "Nhóm vận động viên phong trào tại giải chạy Run With Me — Cộng đồng khỏe, Hà Nội",
    },
    {
      href: "xu-huong-phat-trien-yhct",
      tieu_de: "Đi làm cả ngày đã đủ vận động chưa?",
      mo_ta: "Nghịch lý hoạt động thể chất: vì sao lao động chân tay cả ngày không thay được một buổi tập có chủ đích.",
      anh: "assets/img/sports-run-to-future.jpg",
      alt: "ThS.BS Lê Trung Kiên trực y tế tại một giải chạy phong trào",
    },
  ];

  // Chữ trên nút và tiêu đề khối "Xem thêm" ở cuối bài viết
  var CHU_NUT = "Đọc bài viết";
  var XEM_THEM_NHAN = "Xem thêm";
  var XEM_THEM_TIEU_DE = "Bài viết khác";
  var XEM_TAT_CA = "Xem tất cả";

  // ——— Từ đây trở xuống là phần dựng ———
  function thoat(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var MUI_TEN = '<svg class="icon icon-sm"><use href="#ic-arrow"/></svg>';

  // ——— Mẫu thẻ bài viết: chỉ có ở đây, mọi nơi đều dùng lại ———
  function theBai(bai, themClass) {
    return [
      '<a class="event-card event-card-link' + (themClass ? " " + themClass : "") + '" href="' + thoat(bai.href) + '">',
      themClass === "event-card-featured" ? '  <span class="event-badge">Nổi bật</span>' : null,
      '  <div class="event-img"><img src="' + thoat(bai.anh) + '" alt="' + thoat(bai.alt) + '" loading="lazy"></div>',
      "  <h4>" + thoat(bai.tieu_de) + "</h4>",
      "  <p>" + thoat(bai.mo_ta) + "</p>",
      '  <span class="related-more">' + thoat(CHU_NUT) + " " + MUI_TEN + "</span>",
      "</a>",
    ]
      .filter(Boolean)
      .join("\n");
  }

  // Tên trang, bỏ đuôi .html vì host phục vụ cả địa chỉ gọn lẫn địa chỉ cũ.
  function tenTrang(duongDan) {
    var cuoi = duongDan.split("/").pop() || "index";
    return cuoi.replace(/\.html?$/i, "").toLowerCase();
  }

  // ——— 1. Trang blog: khối nổi bật + lưới còn lại ———
  var danhSach = document.querySelector(".blog-list");
  if (danhSach) {
    var noiBat = DANH_SACH.filter(function (b) {
      return b.noi_bat;
    });
    var conLai = DANH_SACH.filter(function (b) {
      return !b.noi_bat;
    });

    danhSach.innerHTML = [
      noiBat.length
        ? '<div class="events-featured-grid">' +
          noiBat
            .map(function (b) {
              return theBai(b, "event-card-featured");
            })
            .join("\n") +
          "</div>"
        : "",
      conLai.length
        ? '<div class="events-grid">' + conLai.map(function (b) { return theBai(b); }).join("\n") + "</div>"
        : "",
    ].join("\n");
  }

  // ——— 2. Khối "Bài viết khác" ở cuối bài viết ———
  var khoi = document.querySelector("section.blog-related");
  if (!khoi) return;

  var trangHienTai = tenTrang(window.location.pathname);
  var khac = DANH_SACH.filter(function (b) {
    return tenTrang(b.href) !== trangHienTai;
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
    '  <div class="related-scroller">',
    khac
      .map(function (b) {
        return theBai(b, "related-card");
      })
      .join("\n"),
    "  </div>",
    '  <p class="cv-link-wrap">',
    '    <a class="cv-link" href="blog">' + thoat(XEM_TAT_CA) + " " + MUI_TEN + "</a>",
    "  </p>",
    "</div>",
  ].join("\n");

  // Nền xen kẽ giống service-cards.js: khối trên là nền xanh nhạt thì khối
  // này để trắng, và ngược lại.
  var truoc = khoi.previousElementSibling;
  var trenLaAlt = truoc && truoc.classList.contains("section-alt");
  khoi.classList.toggle("section-alt", !trenLaAlt);
})();
