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

  if (!("IntersectionObserver" in window)) {
    document.body.classList.add("sticky-cta-on");
    return;
  }

  var onScreen = [];
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        var at = onScreen.indexOf(entry.target);
        if (entry.isIntersecting && at === -1) onScreen.push(entry.target);
        if (!entry.isIntersecting && at !== -1) onScreen.splice(at, 1);
      });
      document.body.classList.toggle("sticky-cta-on", onScreen.length === 0);
    },
    { threshold: 0 }
  );

  ctas.forEach(function (cta) {
    observer.observe(cta);
  });
})();
