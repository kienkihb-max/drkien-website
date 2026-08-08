// Thông tin phòng khám — NGUỒN DUY NHẤT cho toàn bộ site.
//
// Địa chỉ, giờ làm việc, số Zalo, Facebook trước đây nằm rải rác ở nhiều
// file; đổi số điện thoại là phải nhớ sửa 8 chỗ. Nay sửa ở đây là đổi
// đồng thời mọi trang, mọi thành phần.
//
// Cách dùng trong HTML — nạp file này TRƯỚC các script khác:
//   <script src="thong-tin.js"></script>
//
// Rồi đánh dấu chỗ cần điền, không viết lại nội dung:
//   <div data-tt="dia-chi"></div>          → dòng địa chỉ
//   <div data-tt="dia-chi-ban-do"></div>   → dòng địa chỉ kèm bản đồ
//   <div data-tt="gio"></div>              → bảng giờ làm việc
//   <a data-tt-href="zalo">Nhắn Zalo</a>   → tự điền href
//   <a data-tt-href="facebook">…</a>
//
// Các component khác (site-header.js, site-footer.js, service-cards.js)
// đọc thẳng từ window.THONG_TIN.
(function () {
  // ——— Sửa nội dung ở đây ———
  var TT = {
    DIA_CHI: "Ngõ 8, Ngô Quyền, Hà Đông, Hà Nội",
    SO_ZALO: "034 590 1772",
    ZALO: "https://zalo.me/0345901772",
    FACEBOOK: "https://www.facebook.com/bskienyhcthn/",
    GIO: [
      { ngay: "Thứ 2 – Thứ 6", gio: "17h30 – 19h30" },
      { ngay: "Thứ 7 – Chủ nhật", gio: "9h00 – 17h00" },
    ],
  };

  // ——— Từ đây trở xuống là phần dựng ———
  // Bản đồ suy ra từ địa chỉ, nên đổi địa chỉ là bản đồ đổi theo.
  TT.BAN_DO =
    "https://www.google.com/maps?q=" + encodeURIComponent(TT.DIA_CHI) + "&output=embed";

  window.THONG_TIN = TT;

  TT.htmlBanDo = function () {
    return (
      '<div class="footer-map"><iframe src="' +
      TT.BAN_DO +
      '" title="Bản đồ tới phòng khám" loading="lazy" ' +
      'referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>'
    );
  };

  TT.htmlGio = function () {
    return (
      '<ul class="footer-hours">' +
      TT.GIO.map(function (d) {
        return "<li><span>" + d.ngay + "</span><span>" + d.gio + "</span></li>";
      }).join("") +
      "</ul>"
    );
  };

  var MAU = {
    "dia-chi": function () {
      return TT.DIA_CHI;
    },
    "dia-chi-ban-do": function () {
      return "<p>" + TT.DIA_CHI + "</p>" + TT.htmlBanDo();
    },
    "ban-do": function () {
      return TT.htmlBanDo();
    },
    gio: function () {
      return TT.htmlGio();
    },
    "so-zalo": function () {
      return TT.SO_ZALO;
    },
  };

  document.querySelectorAll("[data-tt]").forEach(function (el) {
    var mau = MAU[el.getAttribute("data-tt")];
    if (mau) el.innerHTML = mau();
  });

  document.querySelectorAll("[data-tt-href]").forEach(function (el) {
    var dich = el.getAttribute("data-tt-href") === "facebook" ? TT.FACEBOOK : TT.ZALO;
    el.setAttribute("href", dich);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });
})();
