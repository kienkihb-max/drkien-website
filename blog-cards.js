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
// Thêm bài mới: dùng trang admin (admin.html) cho nhanh và khỏi sót, hoặc
// thêm tay một mục vào DANH_SACH bên dưới.
(function () {
  // ——— Danh sách bài viết, sửa ở đây ———
  // Thứ tự trong mảng là thứ tự hiển thị.
  //
  // Trang admin đọc và ghi đè vùng nằm giữa hai dòng mốc bên dưới, nên vùng
  // đó phải luôn là JSON hợp lệ: khóa và chuỗi đều dùng nháy kép, không có
  // dấu phẩy thừa ở phần tử cuối, và không chèn ghi chú vào giữa. Sửa tay
  // vẫn được, chỉ cần giữ đúng dạng đó và đừng xóa hai dòng mốc.
  //
  //   href     tên file bài viết, bỏ đuôi .html
  //   ngay     ngày đăng, dạng NĂM-THÁNG-NGÀY
  //   noi_bat  true thì bài nằm ở khối nổi bật đầu trang blog
  //   an       true thì bài biến khỏi mọi danh sách nhưng link cũ vẫn sống
  /* DANH_SACH:BAT_DAU */
  var DANH_SACH = [
    {
      "href": "y-hoc-co-truyen-tai-tuyen-co-so",
      "tieu_de": "Y học cổ truyền tại tuyến cơ sở",
      "mo_ta": "Những chuyến công tác, giúp mình thấy rõ: khi cán bộ được đào tạo tốt và người bệnh được điều trị hiệu quả, Y học cổ truyền sẽ tự tìm được chỗ đứng trong cộng đồng",
      "anh": "assets/img/1786592505991-5195923468930356018-5195923468930356018-f5f342-2026-08-13.jpg",
      "alt": "Kiểm tra tay nghề học viện tại Trạm Y tế",
      "ngay": "2026-08-13"
    },
    {
      "href": "vi-sao-ton-thuong-stress-xuong-ghe-dang-lo-ngai",
      "tieu_de": "Vì sao tổn thương stress xương ghe đáng lo ngại?",
      "mo_ta": "Các nghiên cứu cho thấy tổn thương stress xương ghe chiếm khoảng 14–35% tổng số tổn thương stress vùng bàn chân và cổ chân, thường gặp ở vận động viên điền kinh, nhảy xa, bóng rổ và đặc biệt là người chạy bộ.",
      "anh": "assets/img/benh-gay-xuong-ban-chan-4-800x450-2026-08-10.jpg",
      "alt": "Vì sao tổn thương stress xương ghe đáng lo ngại?",
      "ngay": "2026-08-10"
    },
    {
      "href": "chuot-rut-khi-chay-bo",
      "tieu_de": "Chuột rút khi chạy bộ: Chuối hay tập tạ?",
      "mo_ta": "Nghiên cứu trên 98 vận động viên marathon cho thấy điều khác biệt không nằm ở nước hay điện giải.",
      "anh": "assets/img/sports-marathon-expert.jpg",
      "alt": "ThS.BS Lê Trung Kiên cùng chuyên gia Karl Gunter Lange tại Viettel Marathon Hà Nội 2024",
      "ngay": "2026-08-08",
      "noi_bat": true
    },
    {
      "href": "van-dong-phuc-hoi-cot-song",
      "tieu_de": "6 Sự thật về Thoát vị đĩa đệm",
      "mo_ta": "Đĩa đệm không hề \"trượt\", MRI bất thường gặp cả ở người không đau, và khối thoát vị có thể tự tiêu biến.",
      "anh": "assets/img/offer-treatment.jpg",
      "alt": "Điện châm vùng thắt lưng kết hợp đèn hồng ngoại tại khoa Y học cổ truyền",
      "ngay": "2026-08-07",
      "noi_bat": true
    },
    {
      "href": "chuot-rut-khi-van-dong",
      "tieu_de": "Chạy lại sau tái tạo dây chằng chéo trước",
      "mo_ta": "Vì sao mốc 12 tuần không đủ để quyết định cho chạy lại, và những tiêu chí chức năng cần đạt trước đó.",
      "anh": "assets/img/sports-football-injury.jpg",
      "alt": "Bác sĩ xử trí chấn thương chân cho cầu thủ ngay trên sân bóng",
      "ngay": "2026-08-08"
    },
    {
      "href": "shin-splints-dau-xuong-chay",
      "tieu_de": "Hiểu đúng về hội chứng quá tải thường gặp ở người chạy bộ",
      "mo_ta": "Nhận diện hội chứng quá tải thường gặp ở người chạy bộ, và vì sao điều chỉnh tải vận động quan trọng hơn nghỉ ngơi đơn thuần.",
      "anh": "assets/img/blog-run-with-me-cong-dong-khoe.jpg",
      "alt": "Nhóm vận động viên phong trào tại giải chạy Run With Me — Cộng đồng khỏe, Hà Nội",
      "ngay": "2026-08-08"
    },
    {
      "href": "xu-huong-phat-trien-yhct",
      "tieu_de": "Đi làm cả ngày đã đủ vận động chưa?",
      "mo_ta": "Nghịch lý hoạt động thể chất: vì sao lao động chân tay cả ngày không thay được một buổi tập có chủ đích.",
      "anh": "assets/img/sports-run-to-future.jpg",
      "alt": "ThS.BS Lê Trung Kiên trực y tế tại một giải chạy phong trào",
      "ngay": "2026-08-07"
    }
  ];
  /* DANH_SACH:KET_THUC */

  // Bài đã "gỡ khỏi danh sách" thì không hiện ở đâu nữa, nhưng file vẫn còn
  // nên link cũ đã lỡ chia sẻ hoặc đã lên Google vẫn mở được — không thành
  // lỗi 404.
  DANH_SACH = DANH_SACH.filter(function (b) {
    return !b.an;
  });

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
      "  <h3>" + thoat(bai.tieu_de) + "</h3>",
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
