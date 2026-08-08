// Nút "lên đầu trang" và cụm nút nổi ở góc phải — chỉ trang chủ có.
// Năm ở chân trang do site-footer.js lo, nút hamburger do site-header.js lo.
// Menu giờ nằm ở mọi trang còn script.js chỉ được nạp ở trang chủ, nên gắn
// lại ở đây sẽ toggle hai lần và nút thành vô hiệu.
//
// Lightbox xem ảnh phóng to đã tách sang lightbox.js để mọi trang dùng chung.

const backToTop = document.getElementById("backToTop");
const floatingActions = document.querySelector(".floating-actions");

if (floatingActions) {
  window.addEventListener("scroll", () => {
    floatingActions.classList.toggle("visible", window.scrollY > 400);
  });
}

if (backToTop) {
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
