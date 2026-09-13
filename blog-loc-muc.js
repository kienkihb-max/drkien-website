// Đổi chuyên mục blog mà không dựng lại cả trang.
//
// Mỗi chuyên mục vẫn là một trang thật (/blog/y-te-the-thao) — phải thế thì
// Google mới có cửa vào riêng cho từng mục và link chia sẻ mới sống. File
// này chỉ lo phần cảm giác: bấm một nhãn thì nạp ngầm trang đó rồi thay
// đúng hai mảnh đang khác nhau — hàng nhãn và danh sách bài — thay vì để
// trình duyệt vứt cả trang đi dựng lại.
//
// Phần đầu trang (tựa "Bài viết cá nhân / Ghi chép & chia sẻ chuyên môn",
// hero, lời dẫn) đứng yên tuyệt đối. Hai trang dựng từ cùng một component
// BlogDau.astro nên chúng vốn giống hệt nhau; đây chỉ là không đụng vào.
//
// Không có JS thì mọi nhãn vẫn là thẻ <a> bình thường, bấm vẫn sang đúng
// trang — chỉ là chớp một cái. Fetch hỏng cũng rơi về đúng đường đó.
(function () {
  "use strict";

  // Những mảnh được phép thay. Thêm mảnh mới thì khai ở đây, và nhớ nó phải
  // tồn tại ở CẢ hai trang, nếu không lần thay sau sẽ mất hẳn mảnh đó.
  var CAN_THAY = ["nav.blog-muc", ".blog-list"];

  var nav = document.querySelector("nav.blog-muc");
  var danh_sach = document.querySelector(".blog-list");
  if (!nav || !danh_sach) return;

  // Nhớ trang đã nạp, để bấm qua bấm lại giữa hai mục là hiện ngay.
  var da_nap = {};

  function layDuongDan(a) {
    // Chỉ nhận link nội bộ trong khu blog. Nhãn nào trỏ ra ngoài (không nên
    // có, nhưng cứ chắc) thì để trình duyệt xử lý như link thường.
    var dich;
    try {
      dich = new URL(a.href, location.href);
    } catch (e) {
      return null;
    }
    if (dich.origin !== location.origin) return null;
    if (dich.pathname !== "/blog" && dich.pathname.indexOf("/blog/") !== 0) return null;
    return dich.pathname;
  }

  function thay(html, dia_chi) {
    var doc = new DOMParser().parseFromString(html, "text/html");

    // Thiếu bất kỳ mảnh nào thì bỏ cuộc và đi đường thường — thay nửa vời
    // để lại một trang lai hai mục, tệ hơn hẳn việc tải lại.
    var moi = [];
    for (var i = 0; i < CAN_THAY.length; i++) {
      var m = doc.querySelector(CAN_THAY[i]);
      var cu = document.querySelector(CAN_THAY[i]);
      if (!m || !cu) return false;
      moi.push([cu, m]);
    }
    for (var j = 0; j < moi.length; j++) {
      moi[j][0].replaceWith(moi[j][1]);
    }

    // Tiêu đề tab và canonical phải đi theo địa chỉ, nếu không trang đang
    // mở là mục này mà tab với thẻ canonical vẫn khai mục kia.
    if (doc.title) document.title = doc.title;
    var can_cu = document.querySelector('link[rel="canonical"]');
    var can_moi = doc.querySelector('link[rel="canonical"]');
    if (can_cu && can_moi) can_cu.setAttribute("href", can_moi.getAttribute("href"));

    // Breadcrumb nằm ngoài vùng thay nhưng vẫn phải nói đúng chỗ đang đứng.
    var duong_cu = document.querySelector("nav.breadcrumb");
    var duong_moi = doc.querySelector("nav.breadcrumb");
    if (duong_cu && duong_moi) duong_cu.replaceWith(duong_moi);

    return true;
  }

  function nap(dia_chi, them_lich_su) {
    var vung = document.querySelector(".blog-list");
    if (vung) vung.setAttribute("aria-busy", "true");

    var xong = function (html) {
      da_nap[dia_chi] = html;
      if (!thay(html, dia_chi)) {
        location.href = dia_chi;
        return;
      }
      if (them_lich_su) history.pushState({ blog_muc: true }, "", dia_chi);
    };

    if (da_nap[dia_chi]) {
      xong(da_nap[dia_chi]);
      return;
    }

    fetch(dia_chi, { credentials: "same-origin" })
      .then(function (ra) {
        if (!ra.ok) throw new Error("HTTP " + ra.status);
        return ra.text();
      })
      .then(xong)
      .catch(function () {
        // Mạng hỏng hay trang lỗi: đi đường thường, người đọc không phải
        // biết là vừa có một cú fetch trượt.
        location.href = dia_chi;
      });
  }

  // Bắt cú bấm ở document chứ không ở nav: nav bị thay mới mỗi lần đổi mục,
  // gắn thẳng vào nó thì lần thứ hai trở đi mất listener.
  document.addEventListener("click", function (su_kien) {
    // Bấm kèm Ctrl/Cmd/Shift hay bằng nút giữa là người đọc muốn mở tab
    // mới — đừng cướp lấy.
    if (su_kien.defaultPrevented) return;
    if (su_kien.button !== 0) return;
    if (su_kien.metaKey || su_kien.ctrlKey || su_kien.shiftKey || su_kien.altKey) return;

    var a = su_kien.target.closest ? su_kien.target.closest("a.blog-muc-nhan") : null;
    if (!a) return;

    var dia_chi = layDuongDan(a);
    if (!dia_chi) return;

    su_kien.preventDefault();
    if (dia_chi === location.pathname) return;
    nap(dia_chi, true);
  });

  // Nút Lùi của trình duyệt: cũng chỉ thay danh sách, cho khớp với lúc đi
  // tới. Chỉ nhận những nấc do file này đẩy vào, để không giành phần điều
  // hướng của các trang khác.
  window.addEventListener("popstate", function (su_kien) {
    if (!su_kien.state || !su_kien.state.blog_muc) return;
    nap(location.pathname, false);
  });

  // Nấc đầu tiên cũng phải mang dấu, nếu không lùi về nó sẽ bị bỏ qua ở
  // nhánh kiểm tra bên trên.
  history.replaceState({ blog_muc: true }, "", location.pathname);
})();
