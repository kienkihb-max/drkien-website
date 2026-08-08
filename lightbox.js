// Lightbox xem ảnh phóng to, dùng chung cho mọi trang.
//
// Cách dùng: chỉ cần nạp <script src="lightbox.js"></script> ở cuối trang.
// Không phải chép markup gì vào HTML — file này tự dựng lớp phủ và tự chèn
// các icon còn thiếu vào sprite, nên thêm trang mới không cần nhớ gì thêm.
//
// Ảnh nào được bấm để phóng to: mọi <img> nằm trong <main> ... </main>, gom
// theo từng <section> để hai nút chuyển ảnh chỉ chạy trong cùng một khối.
// Chú thích lấy từ <figcaption> nếu ảnh nằm trong <figure>, không thì lấy alt.
(function () {
  var main = document.querySelector("main");
  if (!main) return;

  var anhTrongTrang = main.querySelectorAll("section img");
  if (anhTrongTrang.length === 0) return;

  // ——— Icon lightbox cần. Trang nào chưa có thì chèn vào sprite ———
  var ICONS = {
    "ic-close":
      '<symbol id="ic-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></symbol>',
    "ic-chevron-left":
      '<symbol id="ic-chevron-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></symbol>',
    "ic-chevron-right":
      '<symbol id="ic-chevron-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></symbol>',
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

  // ——— Dựng lớp phủ nếu trang chưa có ———
  var lightbox = document.getElementById("lightbox");
  if (!lightbox) {
    document.body.insertAdjacentHTML(
      "beforeend",
      [
        '<div class="lightbox" id="lightbox" aria-hidden="true">',
        '  <button class="lightbox-close" id="lightboxClose" aria-label="Đóng">',
        '    <svg class="icon"><use href="#ic-close"/></svg>',
        "  </button>",
        '  <button class="lightbox-nav lightbox-prev" id="lightboxPrev" aria-label="Ảnh trước">',
        '    <svg class="icon"><use href="#ic-chevron-left"/></svg>',
        "  </button>",
        '  <figure class="lightbox-content">',
        '    <img id="lightboxImg" src="" alt="">',
        '    <figcaption id="lightboxCaption"></figcaption>',
        "  </figure>",
        '  <button class="lightbox-nav lightbox-next" id="lightboxNext" aria-label="Ảnh sau">',
        '    <svg class="icon"><use href="#ic-chevron-right"/></svg>',
        "  </button>",
        "</div>",
      ].join("\n")
    );
    lightbox = document.getElementById("lightbox");
  }

  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxCaption = document.getElementById("lightboxCaption");
  var danhSach = [];
  var viTri = 0;

  function hienAnh(index) {
    viTri = (index + danhSach.length) % danhSach.length;
    var anh = danhSach[viTri];
    lightboxImg.src = anh.src;
    lightboxImg.alt = anh.alt;
    lightboxCaption.textContent = anh.caption;
  }

  function mo(ds, index) {
    danhSach = ds;
    hienAnh(index);
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function dong() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  main.querySelectorAll("section").forEach(function (khoi) {
    var imgs = Array.prototype.slice
      .call(khoi.querySelectorAll("img"))
      .filter(function (img) {
        return !img.closest('[aria-hidden="true"]');
      });
    if (imgs.length === 0) return;

    var ds = imgs.map(function (img) {
      var figure = img.closest("figure");
      var figcaption = figure ? figure.querySelector("figcaption") : null;
      return {
        // data-full: bản lớn dùng riêng cho lightbox, nếu trang có tách
        // thumbnail nhỏ cho phần hiển thị. Không có thì dùng luôn src.
        src: img.getAttribute("data-full") || img.src,
        alt: img.alt,
        caption: figcaption ? figcaption.textContent.trim() : img.alt,
      };
    });

    imgs.forEach(function (img, index) {
      img.classList.add("zoomable");
      img.addEventListener("click", function () {
        mo(ds, index);
      });
    });
  });

  document.getElementById("lightboxClose").addEventListener("click", dong);
  document.getElementById("lightboxPrev").addEventListener("click", function () {
    hienAnh(viTri - 1);
  });
  document.getElementById("lightboxNext").addEventListener("click", function () {
    hienAnh(viTri + 1);
  });

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) dong();
  });

  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") dong();
    if (e.key === "ArrowLeft") hienAnh(viTri - 1);
    if (e.key === "ArrowRight") hienAnh(viTri + 1);
  });
})();
