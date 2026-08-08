// Header + thanh navigation dùng chung cho toàn bộ site.
// Mọi trang đều lấy header từ đây, nên thêm/bớt mục menu ở file này là đổi
// đồng thời trên tất cả các trang.
//
// Cách dùng trong HTML: để sẵn <header class="site-header"></header> rồi nạp
// <script src="site-header.js"></script> trước các script khác.
(function () {
  // ——— Nội dung menu, sửa ở đây ———
  var TRANG_CHU = "index.html";
  var ZALO = "https://zalo.me/0345901772";

  // Các mục nhảy tới từng phần trên trang chủ.
  var MUC_TRANG_CHU = [
    { neo: "#home", chu: "Giới thiệu" },
    { neo: "#offerings", chu: "Dịch vụ" },
    { neo: "#experience", chu: "Nền tảng chuyên môn" },
    { neo: "#stories", chu: "Chia sẻ từ bệnh nhân" },
    { neo: "#credibility", chu: "Uy tín chuyên môn" },
  ];

  // Các trang dịch vụ.
  var MUC_DICH_VU = [
    { trang: "y-te-su-kien.html", chu: "Y tế sự kiện" },
    { trang: "dien-gia-seminar.html", chu: "Diễn giả" },
    { trang: "dieu-tri.html", chu: "Điều trị" },
  ];

  // ——— Từ đây trở xuống là phần dựng menu ———
  var header = document.querySelector("header.site-header");
  if (!header) return;

  var trang = location.pathname.split("/").pop() || TRANG_CHU;
  var laTrangChu = trang === TRANG_CHU;

  // Trên trang chủ neo thẳng tới section; ở trang con phải quay về index trước.
  function toiTrangChu(neo) {
    return laTrangChu ? neo : TRANG_CHU + neo;
  }

  var CHEVRON =
    '<svg class="icon icon-sm nav-dropdown-arrow"><use href="#ic-chevron-down"/></svg>';

  var HEADER = [
    '<div class="container header-inner">',
    '  <a href="' + (laTrangChu ? "#top" : TRANG_CHU) + '" class="brand">',
    '    <img class="brand-mark" src="assets/img/logo-chay-bo-cung-bs-kien.jpg" alt="Logo Chạy bộ cùng bác sĩ Kiên">',
    '    <span class="brand-text">ThS.BS Lê Trung Kiên</span>',
    "  </a>",
    '  <button class="nav-toggle" id="navToggle" aria-label="Mở menu" aria-expanded="false">',
    "    <span></span><span></span><span></span>",
    "  </button>",
    '  <nav class="site-nav" id="siteNav">',
    '    <div class="nav-dropdown">',
    '      <a href="' + (laTrangChu ? "#top" : TRANG_CHU) + '">Trang chủ ' + CHEVRON + "</a>",
    '      <div class="nav-dropdown-menu">',
    MUC_TRANG_CHU.map(function (m) {
      return '        <a href="' + toiTrangChu(m.neo) + '">' + m.chu + "</a>";
    }).join("\n"),
    "      </div>",
    "    </div>",
    '    <div class="nav-dropdown">',
    '      <a href="' + toiTrangChu("#offerings") + '">Dịch vụ ' + CHEVRON + "</a>",
    '      <div class="nav-dropdown-menu">',
    MUC_DICH_VU.map(function (m) {
      return '        <a href="' + m.trang + '">' + m.chu + "</a>";
    }).join("\n"),
    "      </div>",
    "    </div>",
    '    <a href="blog.html">Blog</a>',
    '    <a href="' + ZALO + '" target="_blank" rel="noopener" class="nav-cta">Liên hệ</a>',
    "  </nav>",
    "</div>",
  ].join("\n");

  // Icon menu cần. Trang nào chưa có sẵn trong sprite thì thêm vào, để không
  // phải nhớ chép symbol mỗi lần tạo trang mới.
  var ICONS = {
    "ic-chevron-down":
      '<symbol id="ic-chevron-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></symbol>',
  };

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

  // Trang chủ có nút "lên đầu trang" trỏ tới #top.
  if (laTrangChu) header.id = "top";
  header.innerHTML = HEADER;

  // Nút hamburger trên mobile. Để ở đây thay vì script.js, vì script.js chỉ
  // được nạp ở trang chủ còn menu thì trang nào cũng có.
  var navToggle = header.querySelector("#navToggle");
  var siteNav = header.querySelector("#siteNav");
  if (!navToggle || !siteNav) return;

  navToggle.addEventListener("click", function () {
    var dangMo = siteNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", dangMo);
  });

  siteNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      siteNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
})();
