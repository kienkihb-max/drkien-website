// Sinh và đọc ngược file bài viết — phần lõi của trang admin.
//
// Mỗi bài viết trên site là một file HTML tự đứng được, trong đó khoảng 25
// dòng đầu là thẻ SEO và thẻ chia sẻ mạng xã hội. Chép tay từng ấy dòng cho
// mỗi bài là chỗ dễ sai nhất: sai canonical thì Google gộp nhầm hai trang,
// thiếu og:image thì link chia sẻ lên Facebook trơ trụi không ảnh.
//
// File này giữ ĐÚNG MỘT khuôn mẫu cho mọi bài, và cũng biết đọc ngược một
// file bài viết đã có về lại thành dữ liệu để sửa. Nhờ đọc ngược được nên 5
// bài viết cũ không phải chuyển đổi gì cả — trang admin mở thẳng chúng ra.
//
// Đổi bố cục bài viết thì sửa hàm sinhHTML() ở đây, và nhớ sửa cả docHTML()
// cho khớp.
window.BaiViet = (function () {
  // ——— Những thứ cố định của site, sửa ở đây ———
  var GOC_SITE = "https://bacsikien.com";
  var TEN_SITE = "Bác sĩ Lê Trung Kiên";
  var TAC_GIA = "Bác sĩ Lê Trung Kiên";
  var DUOI_TIEU_DE = " — Bác sĩ Lê Trung Kiên"; // tự thêm vào cuối thẻ <title>
  var GIO_DANG = "T08:00:00+07:00"; // giờ ghi vào article:published_time
  var THU_MUC_ANH = "assets/img";
  var FONT =
    "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@600;700&family=Inter:wght@400;500;600;700&display=swap";

  // Các script mỗi bài viết nạp, đúng thứ tự — thong-tin.js phải đứng trước
  // seo-schema.js vì schema đọc địa chỉ và giờ làm việc từ đó.
  var SCRIPT = [
    "icons.js",
    "thong-tin.js",
    "seo-schema.js",
    "blog-byline.js",
    "site-header.js",
    "site-footer.js",
    "blog-cards.js",
  ];

  // ——— Tiện ích ———
  function thoat(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function thoatRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Bỏ dấu tiếng Việt để làm đường dẫn: "Chuột rút khi chạy bộ" →
  // "chuot-rut-khi-chay-bo". Đường dẫn không dấu vừa gọn khi chia sẻ, vừa
  // tránh bị mã hóa thành chuỗi %C3%A1 dài ngoằng trên thanh địa chỉ.
  function boDau(s) {
    return String(s)
      .normalize("NFD")
      .replace(new RegExp("[\u0300-\u036f]", "g"), "") // dấu thanh, dấu mũ tách ra sau NFD
      .replace(/đ/g, "d") // chữ đ không tách được bằng NFD nên xử lý riêng
      .replace(/Đ/g, "D");
  }

  function tenFile(tieu_de) {
    return boDau(tieu_de)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/, "");
  }

  function homNay() {
    var d = new Date();
    return (
      d.getFullYear() +
      "-" +
      ("0" + (d.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + d.getDate()).slice(-2)
    );
  }

  // ——— Dàn lại thân bài cho thẳng hàng ———
  // Trình soạn thảo trả về HTML dồn một cục. Dàn lại theo đúng cách thụt lề
  // của các bài viết cũ để mở file trên GitHub còn đọc được bằng mắt, và để
  // khi so sánh hai phiên bản chỉ hiện đúng dòng đã sửa.
  var LONG_NHAU = { UL: 1, OL: 1, FIGURE: 1, BLOCKQUOTE: 1 };
  var TU_DONG = { IMG: 1, BR: 1, HR: 1 };

  function thuocTinh(el) {
    var ra = "";
    for (var i = 0; i < el.attributes.length; i++) {
      var a = el.attributes[i];
      ra += " " + a.name + '="' + thoat(a.value) + '"';
    }
    return ra;
  }

  function danNut(el, lui) {
    var ten = el.tagName.toLowerCase();
    var mo = "<" + ten + thuocTinh(el) + ">";
    if (TU_DONG[el.tagName]) return lui + mo;

    if (LONG_NHAU[el.tagName]) {
      var con = [];
      for (var i = 0; i < el.children.length; i++) {
        con.push(danNut(el.children[i], lui + "  "));
      }
      return lui + mo + "\n" + con.join("\n") + "\n" + lui + "</" + ten + ">";
    }

    // Thẻ chứa chữ (p, h2, h3, li, figcaption): để gọn trên một dòng.
    return lui + mo + el.innerHTML.replace(/\s+/g, " ").trim() + "</" + ten + ">";
  }

  function danThanBai(html, lui) {
    var hop = document.createElement("div");
    hop.innerHTML = html;
    var dong = [];
    for (var i = 0; i < hop.children.length; i++) {
      var el = hop.children[i];
      // Dòng trống trước mỗi mục lớn và mỗi ảnh — giống cách các bài viết
      // tay đang trình bày, để file dễ đọc và diff không nhiễu.
      if (i > 0 && (el.tagName === "H2" || el.tagName === "H3" || el.tagName === "FIGURE"))
        dong.push("");
      dong.push(danNut(el, lui));
    }
    return dong.join("\n");
  }

  // ——— Sinh file bài viết ———
  //
  // d = {
  //   ten_file, tieu_de_trang, mo_ta_trang, nhan, h1,
  //   anh, anh_alt, anh_rong, anh_cao,
  //   lead, than, tai_lieu: [], ngay, ngay_sua
  // }
  function sinhHTML(d) {
    var url = GOC_SITE + "/" + d.ten_file;
    var than = [];

    if (d.lead) than.push('        <p class="lead">' + d.lead.replace(/\s+/g, " ").trim() + "</p>");
    var con_lai = danThanBai(d.than || "", "        ");
    if (con_lai) than.push(con_lai);

    var refs = "";
    var tl = (d.tai_lieu || []).filter(function (t) {
      return String(t).trim();
    });
    if (tl.length) {
      refs =
        "\n" +
        [
          '      <div class="article-refs">',
          "        <h2>Tài liệu tham khảo</h2>",
          "        <ol>",
          tl
            .map(function (t) {
              return "          <li>" + String(t).replace(/\s+/g, " ").trim() + "</li>";
            })
            .join("\n"),
          "        </ol>",
          "      </div>",
        ].join("\n");
    }

    // data-ngay-sua chỉ ghi khi bài được sửa vào ngày khác ngày đăng —
    // seo-schema.js đọc nó để báo cho Google là nội dung mới được cập nhật.
    var sua = d.ngay_sua && d.ngay_sua !== d.ngay ? ' data-ngay-sua="' + thoat(d.ngay_sua) + '"' : "";

    return [
      "<!DOCTYPE html>",
      '<html lang="vi" data-page="article" data-ngay-dang="' + thoat(d.ngay) + '"' + sua + ">",
      "<head>",
      '<meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      "<title>" + thoat(d.tieu_de_trang) + "</title>",
      '<meta name="description" content="' + thoat(d.mo_ta_trang) + '">',
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      "<!-- Tải font không chặn hiển thị: trình duyệt vẽ chữ bằng font hệ thống trước,",
      "     đổi sang font riêng khi tải xong. Chữ hiện sớm hơn trên mạng chậm. -->",
      '<link rel="preload" as="style" href="' + FONT + '">',
      '<link rel="stylesheet" href="' + FONT + '" media="print" onload="this.media=\'all\'">',
      '<noscript><link rel="stylesheet" href="' + FONT + '"></noscript>',
      '<link rel="canonical" href="' + thoat(url) + '">',
      '<link rel="icon" href="/favicon.ico" sizes="any">',
      '<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">',
      '<meta property="og:type" content="article">',
      '<meta property="og:site_name" content="' + thoat(TEN_SITE) + '">',
      '<meta property="og:locale" content="vi_VN">',
      '<meta property="og:title" content="' + thoat(d.tieu_de_trang) + '">',
      '<meta property="og:description" content="' + thoat(d.mo_ta_trang) + '">',
      '<meta property="og:url" content="' + thoat(url) + '">',
      '<meta property="og:image" content="' + thoat(GOC_SITE + "/" + d.anh) + '">',
      '<meta property="og:image:width" content="' + thoat(d.anh_rong || 1600) + '">',
      '<meta property="og:image:height" content="' + thoat(d.anh_cao || 900) + '">',
      '<meta property="og:image:alt" content="' + thoat(d.anh_alt) + '">',
      '<meta property="article:published_time" content="' + thoat(d.ngay + GIO_DANG) + '">',
      '<meta property="article:author" content="' + thoat(TAC_GIA) + '">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<link rel="stylesheet" href="style.css">',
      "</head>",
      '<body class="subpage">',
      "",
      '<header class="site-header"></header>',
      "",
      "<main>",
      '  <section class="section cv-hero">',
      '    <div class="container">',
      '      <p class="section-label">' + thoat(d.nhan) + "</p>",
      "      <h1>" + thoat(d.h1) + "</h1>",
      "    </div>",
      "  </section>",
      "",
      '  <section class="section section-article">',
      '    <div class="container">',
      '      <div class="article-hero-img">',
      '        <img src="' + thoat(d.anh) + '" alt="' + thoat(d.anh_alt) + '" loading="lazy">',
      "      </div>",
      '      <div class="article-body">',
      than.join("\n"),
      "      </div>" + refs,
      "    </div>",
      "  </section>",
      "",
      '  <!-- Khoi "Bai viet khac" do blog-cards.js dung - sua danh sach trong file do -->',
      '  <section class="section blog-related"></section>',
      "</main>",
      "",
      '<footer class="site-footer"></footer>',
      "",
      SCRIPT.map(function (s) {
        return '<script src="' + s + '"></script>';
      }).join("\n"),
      "</body>",
      "</html>",
      "",
    ].join("\n");
  }

  // ——— Đọc ngược một file bài viết đã có ———
  // Dùng chính bộ phân tích HTML của trình duyệt thay vì bắt biểu thức chính
  // quy, nên vẫn đọc được cả những bài viết tay hơi lệch khuôn.
  function docHTML(html, ten_file) {
    var tl = new DOMParser().parseFromString(html, "text/html");

    function noiDung(chon, thuoc) {
      var el = tl.querySelector(chon);
      if (!el) return "";
      return thuoc ? el.getAttribute(thuoc) || "" : el.textContent.trim();
    }

    var than = tl.querySelector(".article-body");
    var lead = "";
    if (than) {
      var p_lead = than.querySelector("p.lead");
      if (p_lead) {
        lead = p_lead.innerHTML.trim();
        p_lead.remove();
      }
    }

    var tai_lieu = [];
    tl.querySelectorAll(".article-refs ol li").forEach(function (li) {
      tai_lieu.push(li.innerHTML.trim());
    });

    var goc = tl.documentElement;
    var anh = tl.querySelector(".article-hero-img img");

    return {
      ten_file: ten_file,
      tieu_de_trang: noiDung("title"),
      mo_ta_trang: noiDung('meta[name="description"]', "content"),
      nhan: noiDung(".cv-hero .section-label"),
      h1: noiDung(".cv-hero h1"),
      anh: anh ? anh.getAttribute("src") : "",
      anh_alt: anh ? anh.getAttribute("alt") : "",
      anh_rong: noiDung('meta[property="og:image:width"]', "content"),
      anh_cao: noiDung('meta[property="og:image:height"]', "content"),
      lead: lead,
      than: than ? than.innerHTML.trim() : "",
      tai_lieu: tai_lieu,
      ngay: goc.getAttribute("data-ngay-dang") || "",
      ngay_sua: goc.getAttribute("data-ngay-sua") || "",
    };
  }

  // ——— Danh sách bài trong blog-cards.js ———
  // Chỉ đụng vào vùng nằm giữa hai dòng mốc, phần code còn lại của file
  // không bị chạm tới.
  var MOC_DAU = "/* DANH_SACH:BAT_DAU */";
  var MOC_CUOI = "/* DANH_SACH:KET_THUC */";

  function docDanhSach(nguon) {
    var i = nguon.indexOf(MOC_DAU);
    var j = nguon.indexOf(MOC_CUOI);
    if (i < 0 || j < 0) {
      throw new Error(
        "Không tìm thấy dòng mốc DANH_SACH trong blog-cards.js. Có ai đó đã xóa mất " +
          "dòng ghi chú /* DANH_SACH:BAT_DAU */ hoặc /* DANH_SACH:KET_THUC */."
      );
    }
    var giua = nguon.slice(i + MOC_DAU.length, j);
    var m = giua.match(/var\s+DANH_SACH\s*=\s*(\[[\s\S]*\])\s*;/);
    if (!m) throw new Error("Vùng DANH_SACH trong blog-cards.js không đúng dạng mong đợi.");
    try {
      return JSON.parse(m[1]);
    } catch (e) {
      throw new Error(
        "Danh sách bài trong blog-cards.js không phải JSON hợp lệ (thường do sửa tay để " +
          "sót dấu phẩy hoặc dùng nháy đơn). Sửa lại rồi thử lại."
      );
    }
  }

  function ghiDanhSach(nguon, danh_sach) {
    var i = nguon.indexOf(MOC_DAU);
    var j = nguon.indexOf(MOC_CUOI);
    if (i < 0 || j < 0) throw new Error("Không tìm thấy dòng mốc DANH_SACH trong blog-cards.js.");

    var json = JSON.stringify(danh_sach, null, 2)
      .split("\n")
      .map(function (d) {
        return "  " + d;
      })
      .join("\n")
      .trimStart();

    return (
      nguon.slice(0, i + MOC_DAU.length) +
      "\n  var DANH_SACH = " +
      json +
      ";\n  " +
      nguon.slice(j)
    );
  }

  // ——— sitemap.xml ———
  // Luôn gỡ khối cũ rồi thêm lại, nên gọi bao nhiêu lần cũng không sinh ra
  // hai khối trùng địa chỉ.
  function khoiSitemap(ten_file, ngay) {
    return [
      "  <url>",
      "    <loc>" + GOC_SITE + "/" + ten_file + "</loc>",
      "    <lastmod>" + ngay + "</lastmod>",
      "    <changefreq>yearly</changefreq>",
      "    <priority>0.6</priority>",
      "  </url>",
    ].join("\n");
  }

  function xoaSitemap(xml, ten_file) {
    var re = new RegExp(
      "\\n*[ \\t]*<url>(?:(?!<\\/url>)[\\s\\S])*?<loc>[^<]*\\/" +
        thoatRegex(ten_file) +
        "<\\/loc>[\\s\\S]*?<\\/url>",
      ""
    );
    return xml.replace(re, "");
  }

  function themSitemap(xml, ten_file, ngay) {
    return xoaSitemap(xml, ten_file).replace(
      /\s*<\/urlset>\s*$/,
      "\n\n" + khoiSitemap(ten_file, ngay) + "\n\n</urlset>\n"
    );
  }

  // Trang blog vừa đổi nội dung thì báo cho Google biết là nó mới.
  function moiLastmod(xml, ten_file, ngay) {
    var re = new RegExp(
      "(<loc>[^<]*\\/" + thoatRegex(ten_file) + "<\\/loc>\\s*<lastmod>)[^<]*(<\\/lastmod>)"
    );
    return xml.replace(re, "$1" + ngay + "$2");
  }

  return {
    GOC_SITE: GOC_SITE,
    THU_MUC_ANH: THU_MUC_ANH,
    DUOI_TIEU_DE: DUOI_TIEU_DE,
    thoat: thoat,
    tenFile: tenFile,
    homNay: homNay,
    sinhHTML: sinhHTML,
    docHTML: docHTML,
    docDanhSach: docDanhSach,
    ghiDanhSach: ghiDanhSach,
    themSitemap: themSitemap,
    xoaSitemap: xoaSitemap,
    moiLastmod: moiLastmod,
  };
})();
