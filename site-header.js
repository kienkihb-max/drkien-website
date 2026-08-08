// Header + thanh navigation dùng chung cho toàn bộ site.
// Mọi trang đều lấy header từ đây, nên thêm/bớt mục menu ở file này là đổi
// đồng thời trên tất cả các trang.
//
// Cách dùng trong HTML: để sẵn <header class="site-header"></header> rồi nạp
// <script src="site-header.js"></script> trước các script khác.
(function () {
  // ——— Nội dung menu, sửa ở đây ———
  var TRANG_CHU = "/";
  // Số Zalo lấy từ thong-tin.js — nguồn duy nhất cho toàn site.
  var ZALO = window.THONG_TIN.ZALO;

  // "Trang chủ" nay là một liên kết thẳng, không còn menu con nhảy tới từng
  // phần trong trang. Muốn dựng lại thì thêm danh sách neo ở đây và bọc lại
  // trong .nav-dropdown như mục Dịch vụ bên dưới.

  // Các trang dịch vụ.
  var MUC_DICH_VU = [
    { trang: "y-te-su-kien", chu: "Y tế sự kiện" },
    { trang: "dien-gia-seminar", chu: "Diễn giả" },
    { trang: "dieu-tri", chu: "Điều trị" },
  ];

  // ——— Từ đây trở xuống là phần dựng menu ———
  var header = document.querySelector("header.site-header");
  if (!header) return;

  // Liên kết trong site không còn đuôi .html, nên URL có thể là "/", "/blog"
  // hoặc "/blog.html" (link cũ đã chia sẻ ra ngoài vẫn chạy). Chuẩn hoá về
  // dạng "ten-trang.html" để mọi phép so sánh bên dưới chỉ cần viết một kiểu.
  var tenTrang = location.pathname.split("/").pop();
  var laTrangChu = tenTrang === "" || tenTrang === "index" || tenTrang === "index.html";
  var trang = laTrangChu
    ? "index.html"
    : tenTrang.indexOf(".") === -1
      ? tenTrang + ".html"
      : tenTrang;

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
    '    <a href="' + (laTrangChu ? "#top" : TRANG_CHU) + '">Trang chủ</a>',
    '    <div class="nav-dropdown">',
    '      <a href="' + toiTrangChu("#offerings") + '">Dịch vụ ' + CHEVRON + "</a>",
    '      <div class="nav-dropdown-menu">',
    MUC_DICH_VU.map(function (m) {
      return '        <a href="' + m.trang + '">' + m.chu + "</a>";
    }).join("\n"),
    "      </div>",
    "    </div>",
    '    <a href="bac-si-le-trung-kien">Giới thiệu</a>',
    '    <a href="blog">Blog</a>',
    '    <a href="' + ZALO + '" target="_blank" rel="noopener" class="nav-cta">Liên hệ</a>',
    "  </nav>",
    "</div>",
  ].join("\n");

  // Icon menu cần. Trang nào chưa có sẵn trong sprite thì thêm vào, để không
  // phải nhớ chép symbol mỗi lần tạo trang mới.
  var ICONS = {
    "ic-chevron-down":
      '<symbol id="ic-chevron-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></symbol>',
    "ic-home":
      '<symbol id="ic-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/></symbol>',
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

  // ——— Breadcrumb trang phụ ———
  // Biến dòng nhãn <p class="section-label"> trên cùng của trang phụ thành
  // breadcrumb: icon nhà (về trang chủ) › Blog (nếu là bài viết) › mục hiện
  // tại. Các trang giữ nguyên markup nhãn cũ — script tự đổi, nên tạo trang
  // mới không cần nhớ thêm gì; nhãn dạng "Blog · Chuyên mục" tách theo "·".
  function bocChu(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  var nhan = document.querySelector(".cv-hero .section-label");
  if (nhan) {
    var manh = nhan.textContent.split("·").map(function (s) {
      return s.trim();
    });
    var crumbs = [
      '<a class="breadcrumb-home" href="' +
        TRANG_CHU +
        '" aria-label="Trang chủ"><svg class="icon icon-sm"><use href="#ic-home"/></svg></a>',
    ];
    manh.forEach(function (chu, i) {
      crumbs.push('<span class="breadcrumb-sep" aria-hidden="true">›</span>');
      if (chu === "Blog" && trang !== "blog.html") {
        crumbs.push('<a href="blog">' + bocChu(chu) + "</a>");
      } else if (i === manh.length - 1) {
        crumbs.push('<span aria-current="page">' + bocChu(chu) + "</span>");
      } else {
        crumbs.push("<span>" + bocChu(chu) + "</span>");
      }
    });
    var duongDan = document.createElement("nav");
    duongDan.className = "breadcrumb";
    duongDan.setAttribute("aria-label", "Breadcrumb");
    duongDan.innerHTML = crumbs.join("");
    nhan.replaceWith(duongDan);
  }

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
