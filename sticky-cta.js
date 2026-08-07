// Thanh CTA dính đáy màn hình trên mobile cho các trang dịch vụ.
// Nút được nhân bản từ chính CTA trong phần mở đầu của trang, nên chỉ cần
// sửa chữ ở một chỗ trong HTML là thanh dính cũng đổi theo.
(function () {
  var source = document.querySelector(".cv-hero .offer-actions .btn");
  if (!source) return;

  var bar = document.createElement("div");
  bar.className = "sticky-cta";

  var clone = source.cloneNode(true);
  clone.removeAttribute("id");
  bar.appendChild(clone);
  document.body.appendChild(bar);
  document.body.classList.add("has-sticky-cta");

  // Mọi CTA thật trên trang. Thanh dính chỉ hiện khi không còn cái nào
  // trong tầm nhìn, tránh hai nút giống hệt nhau cùng lúc trên màn hình.
  var ctas = [].slice.call(document.querySelectorAll('main a.btn[href*="zalo.me"]'));
  if (ctas.length === 0) return;

  function coCTAtrongTam() {
    var cao = window.innerHeight || document.documentElement.clientHeight;
    return ctas.some(function (cta) {
      var r = cta.getBoundingClientRect();
      return r.bottom > 0 && r.top < cao;
    });
  }

  function capNhat() {
    document.body.classList.toggle("sticky-cta-on", !coCTAtrongTam());
  }

  window.addEventListener("scroll", capNhat, { passive: true });
  window.addEventListener("resize", capNhat);
  window.addEventListener("load", capNhat);
  capNhat();
})();
