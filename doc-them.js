// Thu gọn một khối văn bản dài xuống vài dòng, kèm nút "Đọc thêm".
//
// Cách dùng: thêm data-doc-them vào khối, giá trị là số dòng muốn hiện.
//   <div class="cv-bio" data-doc-them="5"> …nhiều đoạn văn… </div>
// rồi nạp <script src="doc-them.js"></script>
//
// VỀ SEO — điểm quan trọng nhất của file này:
// Toàn bộ chữ vẫn nằm nguyên trong HTML, không gỡ đi và cũng không tải thêm
// khi bấm. Phần dư chỉ bị che bằng max-height + overflow, nên Google đọc
// được đủ 100% nội dung ngay từ lần tải đầu. Đây là lý do phải làm bằng CSS
// chứ không phải cắt chuỗi bằng JS rồi chèn dần — cắt chuỗi thì phần bị cắt
// biến mất khỏi trang và mất luôn giá trị tìm kiếm.
//
// Không thu gọn nếu khối vốn đã ngắn hơn số dòng yêu cầu — hiện nút "Đọc
// thêm" cho một khối chỉ dài 3 dòng thì vô nghĩa.
(function () {
  var CHU_MO = "Đọc thêm";
  var CHU_DONG = "Thu gọn";

  document.querySelectorAll("[data-doc-them]").forEach(function (khoi) {
    var soDong = parseInt(khoi.getAttribute("data-doc-them"), 10);
    if (!soDong || soDong < 1) return;

    // Chiều cao một dòng lấy từ đoạn đầu tiên, vì đoạn mở đầu thường cỡ chữ
    // lớn hơn các đoạn sau — đo nhầm chỗ là cắt lệch vài chục pixel.
    var doanDau = khoi.querySelector("p") || khoi;
    var caoDong = parseFloat(getComputedStyle(doanDau).lineHeight);
    if (!caoDong) return;

    var caoToiDa = Math.round(caoDong * soDong);
    if (khoi.scrollHeight <= caoToiDa + 4) return; // vốn đã đủ ngắn

    khoi.classList.add("doc-them");
    khoi.style.maxHeight = caoToiDa + "px";

    var nut = document.createElement("button");
    nut.type = "button";
    nut.className = "doc-them-nut";
    nut.textContent = CHU_MO;
    nut.setAttribute("aria-expanded", "false");
    khoi.insertAdjacentElement("afterend", nut);

    nut.addEventListener("click", function () {
      var dangMo = khoi.classList.toggle("doc-them-mo");
      khoi.style.maxHeight = dangMo ? khoi.scrollHeight + "px" : caoToiDa + "px";
      nut.textContent = dangMo ? CHU_DONG : CHU_MO;
      nut.setAttribute("aria-expanded", String(dangMo));
    });
  });
})();
