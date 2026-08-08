// Footer dùng chung cho toàn bộ site.
// Mọi trang đều lấy footer từ đây, nên sửa địa chỉ / giờ làm việc / số Zalo
// ở file này là đổi đồng thời trên tất cả các trang.
//
// Cách dùng trong HTML: để sẵn <footer class="site-footer"></footer> rồi nạp
// <script src="site-footer.js"></script> trước các script khác.
(function () {
  // ——— Nội dung footer, sửa ở đây ———
  var TRANG_CHU = "/";
  // Địa chỉ, giờ làm việc, Zalo, Facebook lấy từ thong-tin.js — nguồn duy
  // nhất cho toàn site. Sửa mấy thứ đó ở file kia, đừng viết lại ở đây.
  var TT = window.THONG_TIN;

  // Sơ đồ trang — hai cột cuối của hàng footer, ngang hàng với Địa chỉ,
  // Giờ làm việc và Liên hệ. Thêm/bớt cột hoặc mục thì sửa danh sách này;
  // nhớ sửa số cột của .footer-grid trong style.css nếu thêm cột mới.
  var SO_DO_TRANG = [
    {
      tieuDe: "Dịch vụ",
      muc: [
        { trang: "y-te-su-kien", chu: "Y tế sự kiện" },
        { trang: "dien-gia-seminar", chu: "Diễn giả seminar" },
        { trang: "dieu-tri", chu: "Thăm khám &amp; điều trị" },
      ],
    },
    {
      tieuDe: "Đọc thêm",
      muc: [
        { trang: "/#experience", chu: "Nền tảng chuyên môn" },
        { trang: "/#stories", chu: "Chia sẻ từ bệnh nhân" },
        { trang: "/#credibility", chu: "Uy tín chuyên môn" },
        { trang: "blog", chu: "Blog" },
      ],
    },
  ];

  var FOOTER = [
    '<div class="container footer-grid">',
    '  <div class="footer-brand">',
    '    <a href="' + TRANG_CHU + '" class="brand">',
    '      <img class="brand-mark" src="assets/img/logo-chay-bo-cung-bs-kien.jpg" alt="Logo Chạy bộ cùng bác sĩ Kiên">',
    '      <span class="brand-text">ThS.BS Lê Trung Kiên</span>',
    "    </a>",
    "    <p>Y học cổ truyền · Y tế thể thao · Diễn giả sức khỏe</p>",
    "  </div>",
    '  <div class="footer-col">',
    "    <h4>Địa chỉ phòng khám</h4>",
    '    <p><svg class="icon icon-sm"><use href="#ic-pin"/></svg> ' + TT.DIA_CHI + "</p>",
    "    " + TT.htmlBanDo(),
    "  </div>",
    '  <div class="footer-col">',
    "    <h4>Giờ làm việc</h4>",
    "    " + TT.htmlGio(),
    "  </div>",
    '  <div class="footer-col">',
    "    <h4>Liên hệ</h4>",
    '    <a class="footer-link" href="' + TT.ZALO + '" target="_blank" rel="noopener"><svg class="icon icon-sm"><use href="#ic-chat"/></svg> Zalo: ' + TT.SO_ZALO + "</a>",
    '    <a class="footer-link" href="' + TT.FACEBOOK + '" target="_blank" rel="noopener"><svg class="icon icon-sm"><use href="#ic-facebook"/></svg> Facebook</a>',
    "  </div>",
    SO_DO_TRANG.map(function (cot) {
      return [
        '  <div class="footer-col">',
        "    <h4>" + cot.tieuDe + "</h4>",
        '    <ul class="footer-sitemap-list">',
        cot.muc
          .map(function (m) {
            return '      <li><a href="' + m.trang + '">' + m.chu + "</a></li>";
          })
          .join("\n"),
        "    </ul>",
        "  </div>",
      ].join("\n");
    }).join("\n"),
    "</div>",
    '<div class="container footer-bottom">',
    '  <p>© <span id="year"></span> ThS.BS Lê Trung Kiên — Y học cổ truyền.</p>',
    "</div>",
  ].join("\n");

  // Icon footer cần. Trang nào chưa có sẵn trong sprite thì thêm vào, để không
  // phải nhớ chép symbol mỗi lần tạo trang mới.
  var ICONS = {
    "ic-chat":
      '<symbol id="ic-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></symbol>',
    "ic-pin":
      '<symbol id="ic-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></symbol>',
    "ic-facebook":
      '<symbol id="ic-facebook" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V5.5h-3C11.5 5.5 10 7 10 9.3V12H7.5v3.5H10V22h3.5v-6.5H16l.7-3.5h-3.2V9.7c0-.5.3-.7.7-.7z"/></symbol>',
  };

  var footer = document.querySelector("footer.site-footer");
  if (!footer) return;

  var thieu = Object.keys(ICONS).filter(function (id) {
    return !document.getElementById(id);
  });
  if (thieu.length) {
    var sprite = document.querySelector('svg[style*="display:none"]');
    if (!sprite) {
      sprite = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      sprite.setAttribute("style", "display:none");
      document.body.insertBefore(sprite, document.body.firstChild);
    }
    sprite.insertAdjacentHTML(
      "beforeend",
      thieu
        .map(function (id) {
          return ICONS[id];
        })
        .join("")
    );
  }

  footer.innerHTML = FOOTER;

  var year = footer.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
