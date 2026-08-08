// SEO — dữ liệu có cấu trúc (JSON-LD) dùng chung cho toàn site.
//
// Đây là phần giúp Google hiểu "Lê Trung Kiên" là một bác sĩ có thật, gắn với
// phòng khám nào, học ở đâu, có giải thưởng gì — thay vì chỉ là một chuỗi chữ
// trên trang. Nhờ vậy khi ai đó tìm "Bác sĩ Lê Trung Kiên", Google có đủ căn
// cứ để hiện đúng trang và hiện khối thông tin bên phải kết quả tìm kiếm.
//
// Cách dùng trong HTML — nạp SAU thong-tin.js (file này đọc địa chỉ, giờ làm
// việc, Zalo, Facebook từ đó nên không bao giờ lệch với footer):
//   <script src="thong-tin.js"></script>
//   <script src="seo-schema.js"></script>
//
// Trang cần có sẵn <link rel="canonical"> trong <head> — file này lấy địa chỉ
// trang từ đó.
//
// Với bài blog, ghi thêm ngày đăng lên thẻ <html>:
//   <html lang="vi" data-page="article" data-ngay-dang="2026-08-08">
// Nếu sau này sửa nội dung bài thì thêm data-ngay-sua="…" (không bắt buộc).
(function () {
  var TT = window.THONG_TIN;
  if (!TT) return;

  // ——— Thông tin về bác sĩ, sửa ở đây ———
  var BAC_SI = {
    ten: "Lê Trung Kiên",
    hoc_vi: "ThS.BS",
    // Các cách gọi khác mà người tìm kiếm hay gõ.
    ten_khac: [
      "Bác sĩ Lê Trung Kiên",
      "ThS.BS Lê Trung Kiên",
      "BS Lê Trung Kiên",
      "Bác sĩ Kiên Y học cổ truyền",
    ],
    chuc_danh: "Bác sĩ Y học cổ truyền",
    gioi_thieu:
      "Bác sĩ Lê Trung Kiên là Thạc sĩ Y học cổ truyền, công tác tại Bệnh viện " +
      "Đa khoa Y học cổ truyền Hà Nội. Bác sĩ điều trị đau cơ xương khớp và " +
      "chấn thương thể thao bằng châm cứu, vật lý trị liệu và vận động trị " +
      "liệu; đồng thời làm y tế sự kiện tại các giải chạy, giải đấu thể thao " +
      "và là diễn giả tại các seminar sức khỏe.",
    anh: "/assets/img/portrait.jpg",
    noi_cong_tac: "Bệnh viện Đa khoa Y học cổ truyền Hà Nội",
    truong_da_hoc: [
      "Đại học Y Hà Nội",
      "Học viện Y Dược học cổ truyền Việt Nam",
    ],
    hoi_thanh_vien: [
      "Hội Đông y Thành phố Hà Nội",
      "Hội Châm cứu Thành phố Hà Nội",
      "Hội Châm cứu Việt Nam",
      "Hội Vật lý trị liệu Việt Nam",
    ],
    bang_cap: [
      "Thạc sĩ Y học cổ truyền — Đại học Y Hà Nội (2025)",
      "Bác sĩ Y học cổ truyền — Học viện Y Dược học cổ truyền Việt Nam (2018)",
      "Chứng chỉ hành nghề khám chữa bệnh — Sở Y tế Hà Nội (2022)",
      "Chứng chỉ Siêu âm cơ xương khớp — Đại học Y Hải Phòng (2025)",
    ],
    giai_thuong: [
      'Danh hiệu "Người tốt, việc tốt" — Sở Y tế Hà Nội, 2025',
      "Bằng khen UBND TP. Hà Nội — Hội thi Kỹ thuật sáng tạo tuổi trẻ ngành Y tế, 2025",
      "Giấy khen — Hội Đông y Thành phố Hà Nội, 2023",
    ],
    chuyen_mon: [
      "Y học cổ truyền",
      "Châm cứu",
      "Y học thể thao",
      "Chấn thương thể thao",
      "Phục hồi chức năng",
      "Đau cơ xương khớp",
      "Siêu âm cơ xương khớp",
    ],
  };

  // Tên phòng khám hiện trên bản đồ / kết quả tìm kiếm.
  var TEN_PHONG_KHAM = "Phòng khám Bác sĩ Lê Trung Kiên";
  var TEN_SITE = "Bác sĩ Lê Trung Kiên";

  // ——— Từ đây trở xuống là phần dựng, không cần sửa ———

  // Địa chỉ trang lấy từ thẻ canonical, để chỉ có một nguồn duy nhất.
  var the = document.querySelector('link[rel="canonical"]');
  if (!the || !the.href) return;
  var URL_TRANG = the.href;
  var GOC = new URL(URL_TRANG).origin;

  function id(neo) {
    return GOC + "/#" + neo;
  }
  function tuyetDoi(duong) {
    return new URL(duong, GOC).href;
  }
  function chu(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }

  // Giờ làm việc: đổi "Thứ 2 – Thứ 6 / 17h30 – 19h30" trong thong-tin.js sang
  // dạng máy đọc được. Nhờ vậy sửa giờ ở thong-tin.js là schema đổi theo, không
  // phải nhớ sửa hai chỗ.
  var TUAN = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  function thuThanhSo(s) {
    var t = s.trim().toLowerCase();
    if (/chủ\s*nhật|^cn$/.test(t)) return 6;
    var m = t.match(/thứ\s*([2-7])/);
    return m ? Number(m[1]) - 2 : -1;
  }
  function gioThanhChuan(s) {
    var m = s.trim().match(/(\d{1,2})\s*[h:]\s*(\d{1,2})?/);
    if (!m) return null;
    return ("0" + m[1]).slice(-2) + ":" + ("0" + (m[2] || "0")).slice(-2);
  }
  function tachDoi(s) {
    return s.split(/[–—-]/);
  }
  function gioLamViec() {
    var ra = [];
    (TT.GIO || []).forEach(function (d) {
      var ngay = tachDoi(d.ngay).map(thuThanhSo);
      var gio = tachDoi(d.gio).map(gioThanhChuan);
      if (ngay[0] < 0 || !gio[0] || !gio[1]) return;
      var den = ngay.length > 1 && ngay[1] >= 0 ? ngay[1] : ngay[0];
      var cac = [];
      for (var i = ngay[0]; i <= den; i++) cac.push(TUAN[i]);
      if (!cac.length) return;
      ra.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: cac,
        opens: gio[0],
        closes: gio[1],
      });
    });
    return ra;
  }

  // ——— Các nút dùng chung, trang nào cũng có ———
  var NGUOI = {
    "@type": "Person",
    "@id": id("bacsi"),
    name: BAC_SI.ten,
    alternateName: BAC_SI.ten_khac,
    honorificPrefix: BAC_SI.hoc_vi,
    jobTitle: BAC_SI.chuc_danh,
    description: BAC_SI.gioi_thieu,
    image: tuyetDoi(BAC_SI.anh),
    url: GOC + "/",
    gender: "Male",
    nationality: { "@type": "Country", name: "Việt Nam" },
    knowsLanguage: ["vi", "en"],
    knowsAbout: BAC_SI.chuyen_mon,
    award: BAC_SI.giai_thuong,
    sameAs: [TT.FACEBOOK],
    worksFor: {
      "@type": "MedicalOrganization",
      name: BAC_SI.noi_cong_tac,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Hà Nội",
        addressCountry: "VN",
      },
    },
    alumniOf: BAC_SI.truong_da_hoc.map(function (t) {
      return { "@type": "CollegeOrUniversity", name: t };
    }),
    memberOf: BAC_SI.hoi_thanh_vien.map(function (t) {
      return { "@type": "Organization", name: t };
    }),
    hasCredential: BAC_SI.bang_cap.map(function (t) {
      return {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "degree",
        name: t,
      };
    }),
    workLocation: { "@id": id("phongkham") },
  };

  var PHONG_KHAM = {
    "@type": "MedicalClinic",
    "@id": id("phongkham"),
    name: TEN_PHONG_KHAM,
    description:
      "Châm cứu, vật lý trị liệu và phục hồi chức năng cho đau cơ xương khớp, " +
      "chấn thương thể thao.",
    url: GOC + "/dieu-tri",
    image: tuyetDoi(BAC_SI.anh),
    address: {
      "@type": "PostalAddress",
      streetAddress: TT.DIA_CHI,
      addressLocality: "Hà Đông",
      addressRegion: "Hà Nội",
      addressCountry: "VN",
    },
    areaServed: { "@type": "City", name: "Hà Nội" },
    telephone: "+84" + TT.SO_ZALO.replace(/\D/g, "").replace(/^0/, ""),
    openingHoursSpecification: gioLamViec(),
    medicalSpecialty: ["PhysicalTherapy", "Physiotherapy", "SportsMedicine"],
    availableService: [
      { "@type": "MedicalTherapy", name: "Châm cứu" },
      { "@type": "MedicalTherapy", name: "Vật lý trị liệu" },
      { "@type": "MedicalTherapy", name: "Vận động trị liệu" },
      { "@type": "MedicalTest", name: "Siêu âm cơ xương khớp" },
    ],
    employee: { "@id": id("bacsi") },
    founder: { "@id": id("bacsi") },
    sameAs: [TT.FACEBOOK],
  };

  var TRANG_WEB = {
    "@type": "WebSite",
    "@id": id("website"),
    url: GOC + "/",
    name: TEN_SITE,
    inLanguage: "vi-VN",
    publisher: { "@id": id("bacsi") },
    about: { "@id": id("bacsi") },
  };

  // ——— Phần riêng của từng trang ———
  var goc = document.documentElement;
  var ten_tap = new URL(URL_TRANG).pathname.replace(/\/$/, "").split("/").pop();
  var la_trang_chu = ten_tap === "" || ten_tap === "index";
  var loai_trang = goc.getAttribute("data-page");

  var h1 = chu(document.querySelector("h1"));
  var mo_ta = (document.querySelector('meta[name="description"]') || {}).content || "";
  var anh_bai = document.querySelector(".article-hero-img img, .cv-photo img, .hero-media img");

  // Bài blog: là trang bài viết nhưng không phải trang danh sách hay hồ sơ.
  var la_bai_viet =
    loai_trang === "article" && ten_tap !== "blog" && ten_tap !== "bac-si-le-trung-kien";

  var kieu_trang = la_trang_chu
    ? "WebPage"
    : ten_tap === "bac-si-le-trung-kien"
      ? "ProfilePage"
      : ten_tap === "blog"
        ? "CollectionPage"
        : la_bai_viet
          ? "MedicalWebPage"
          : "WebPage";

  var TRANG = {
    "@type": kieu_trang,
    "@id": URL_TRANG + "#trang",
    url: URL_TRANG,
    name: document.title,
    description: mo_ta,
    inLanguage: "vi-VN",
    isPartOf: { "@id": id("website") },
    about: { "@id": id("bacsi") },
  };
  if (la_trang_chu || ten_tap === "bac-si-le-trung-kien") TRANG.mainEntity = { "@id": id("bacsi") };
  if (anh_bai) TRANG.primaryImageOfPage = tuyetDoi(anh_bai.getAttribute("src"));

  var DO_THI = [NGUOI, PHONG_KHAM, TRANG_WEB, TRANG];

  // Breadcrumb — dựng lại từ chính đường dẫn header đã hiện trên trang, để
  // những gì Google đọc khớp với những gì người dùng nhìn thấy.
  if (!la_trang_chu) {
    var duong = [{ ten: "Trang chủ", url: GOC + "/" }];
    if (la_bai_viet) duong.push({ ten: "Blog", url: GOC + "/blog" });
    duong.push({ ten: h1 || document.title, url: URL_TRANG });
    DO_THI.push({
      "@type": "BreadcrumbList",
      "@id": URL_TRANG + "#breadcrumb",
      itemListElement: duong.map(function (m, i) {
        return {
          "@type": "ListItem",
          position: i + 1,
          name: m.ten,
          item: m.url,
        };
      }),
    });
  }

  // Bài blog — gắn tác giả về đúng nút Person ở trên.
  if (la_bai_viet) {
    var ngay_dang = goc.getAttribute("data-ngay-dang");
    var bai = {
      "@type": "MedicalScholarlyArticle",
      "@id": URL_TRANG + "#baiviet",
      headline: (h1 || document.title).slice(0, 110),
      name: h1 || document.title,
      description: mo_ta,
      inLanguage: "vi-VN",
      author: { "@id": id("bacsi") },
      publisher: { "@id": id("bacsi") },
      mainEntityOfPage: { "@id": URL_TRANG + "#trang" },
      isPartOf: { "@id": id("website") },
    };
    if (anh_bai) bai.image = tuyetDoi(anh_bai.getAttribute("src"));
    if (ngay_dang) {
      bai.datePublished = ngay_dang;
      bai.dateModified = goc.getAttribute("data-ngay-sua") || ngay_dang;
    }
    DO_THI.push(bai);
  }

  // Trang dịch vụ — nói rõ ai là người cung cấp dịch vụ đó.
  if (loai_trang === "service") {
    DO_THI.push({
      "@type": "Service",
      "@id": URL_TRANG + "#dichvu",
      name: h1 || document.title,
      description: mo_ta,
      serviceType: h1 || document.title,
      provider: { "@id": id("bacsi") },
      areaServed: { "@type": "City", name: "Hà Nội" },
      availableChannel: {
        "@type": "ServiceChannel",
        serviceUrl: URL_TRANG,
        servicePhone: PHONG_KHAM.telephone,
      },
    });
  }

  var the_script = document.createElement("script");
  the_script.type = "application/ld+json";
  the_script.textContent = JSON.stringify(
    { "@context": "https://schema.org", "@graph": DO_THI },
    null,
    2
  );
  document.head.appendChild(the_script);
})();
