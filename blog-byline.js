// Dòng tác giả đầu mỗi bài blog — dùng chung cho mọi bài viết.
//
// Với nội dung y tế, Google chấm rất nặng việc "ai viết bài này, họ có
// chuyên môn gì". Dòng này vừa trả lời câu đó cho người đọc, vừa gắn tên
// bác sĩ vào từng bài và trỏ ngược về trang hồ sơ.
//
// Cách dùng trong HTML — bài viết cần có ngày đăng trên thẻ <html>:
//   <html lang="vi" data-page="article" data-ngay-dang="2026-08-08">
// rồi nạp <script src="blog-byline.js"></script>
//
// Trang blog (danh sách) và trang hồ sơ tự động bị bỏ qua.
(function () {
  // ——— Nội dung, sửa ở đây ———
  var TEN = "Bác sĩ Lê Trung Kiên";
  var CHUC_DANH = "ThS. Y học cổ truyền · Bệnh viện Đa khoa Y học cổ truyền Hà Nội";
  var TRANG_HO_SO = "bac-si-le-trung-kien";
  var ANH = "assets/img/portrait.jpg";
  var CHU_NGAY = "Đăng ngày";

  // ——— Từ đây trở xuống là phần dựng ———
  var goc = document.documentElement;
  var ngay = goc.getAttribute("data-ngay-dang");
  if (!ngay) return;

  var ten_tap = location.pathname.split("/").pop().replace(/\.html?$/i, "");
  if (ten_tap === "blog" || ten_tap === "bac-si-le-trung-kien") return;

  var hero = document.querySelector(".cv-hero .container");
  var h1 = hero && hero.querySelector("h1");
  if (!h1) return;

  // "2026-08-08" → "08/08/2026". Tự ghép chuỗi thay vì dùng Date để khỏi
  // lệch ngày do múi giờ của máy người đọc.
  var manh = ngay.split("-");
  var ngayHienThi = manh.length === 3 ? manh[2] + "/" + manh[1] + "/" + manh[0] : ngay;

  var khoi = document.createElement("div");
  khoi.className = "article-byline";
  khoi.innerHTML = [
    '<img class="article-byline-avatar" src="' + ANH + '" alt="" width="48" height="48" loading="lazy">',
    '<div class="article-byline-text">',
    '  <p class="article-byline-name"><a href="' + TRANG_HO_SO + '" rel="author">' + TEN + "</a></p>",
    '  <p class="article-byline-meta">' + CHUC_DANH + "</p>",
    '  <p class="article-byline-meta">' +
      CHU_NGAY +
      ' <time datetime="' + ngay + '">' + ngayHienThi + "</time></p>",
    "</div>",
  ].join("\n");

  h1.insertAdjacentElement("afterend", khoi);
})();
