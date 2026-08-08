// Trang quản trị blog — phần điều phối.
//
// Ba file kia mỗi file một vai: admin-github.js nói chuyện với GitHub,
// admin-bai-viet.js sinh/đọc file bài viết, admin-soan-thao.js là khung soạn
// chữ. File này nối chúng lại thành ba màn hình: đăng nhập → danh sách bài →
// soạn bài.
//
// Nguyên tắc ăn sâu vào mọi nút bấm ở đây: việc gì đã đẩy lên GitHub là
// người thật nhìn thấy, nên (1) mọi thay đổi của một lần đăng gộp vào MỘT
// commit, (2) việc không lùi được thì hỏi lại bằng câu nói rõ hậu quả,
// (3) lỗi hiện bằng tiếng Việt kèm việc cần làm tiếp.
(function () {
  var Kho = window.GitHubKho;
  var Bai = window.BaiViet;

  // Chuyên mục có sẵn — muốn thêm cố định thì thêm vào đây, còn tạo nhanh
  // thì dùng mục "Tạo chuyên mục mới" ngay trên form. Nhãn mới của bài nào
  // sẽ theo bài đó, và tự xuất hiện trong danh sách chọn khi mở lại bài.
  var NHAN_GOI_Y = [
    "Blog · Y học thể thao",
    "Blog · Cơ xương khớp & Phục hồi chức năng",
    "Blog · Y học cổ truyền",
  ];
  var NHAN_MOI = "__tao_moi__"; // giá trị đặc biệt của mục "Tạo chuyên mục mới"

  // ——— Bắt phần tử ———
  function o(id) {
    return document.getElementById(id);
  }

  var man_vao = o("man-vao");
  var man_chinh = o("man-chinh");
  var man_danh_sach = o("man-danh-sach");
  var man_soan = o("man-soan");

  // ——— Trạng thái ———
  var danh_sach = []; // danh sách bài đọc từ blog-cards.js
  var nguon_blog_cards = ""; // nội dung blog-cards.js lúc tải về
  var nguon_sitemap = "";
  var dang_sua = null; // null = bài mới; khác null = dữ liệu bài đang sửa

  // Ảnh vừa tải lên trong phiên soạn này, chưa có trên site. Gồm cả ảnh đại
  // diện lẫn ảnh chèn giữa bài. Lúc đăng, ảnh nào thật sự được bài dùng mới
  // đẩy lên kho — chọn thử rồi đổi ý thì không rác kho.
  var anh_cho_tai = []; // [{ base64, duong_dan, rong, cao }]
  var bo_soan = null; // trình soạn thảo thân bài
  var da_doi = false; // form có thay đổi chưa lưu không

  // ——— Thông báo ———
  var hen_bao = null;
  function bao(chu, kieu, lau) {
    var bang = o("bao");
    bang.innerHTML = chu;
    bang.className = "qt-bao" + (kieu ? " qt-bao-" + kieu : "");
    bang.hidden = false;
    clearTimeout(hen_bao);
    hen_bao = setTimeout(function () {
      bang.hidden = true;
    }, lau || 5000);
  }

  function cho(chu) {
    o("chu-cho").textContent = chu || "Đang lưu…";
    o("lop-cho").hidden = !chu;
  }

  // Hộp hỏi lại — trả về Promise, bấm Đồng ý thì true.
  function hoi(tieu_de, noi_dung_html, chu_nut) {
    return new Promise(function (xong) {
      o("hoi-tieu-de").textContent = tieu_de;
      o("hoi-noi-dung").innerHTML = noi_dung_html;
      o("nut-hoi-dong-y").textContent = chu_nut || "Đồng ý";
      o("lop-hoi").hidden = false;
      function dong(ket_qua) {
        o("lop-hoi").hidden = true;
        o("nut-hoi-dong-y").onclick = o("nut-hoi-thoi").onclick = null;
        xong(ket_qua);
      }
      o("nut-hoi-dong-y").onclick = function () {
        dong(true);
      };
      o("nut-hoi-thoi").onclick = function () {
        dong(false);
      };
    });
  }

  // ═════════ Màn 1: Đăng nhập ═════════

  o("ten-kho-huong-dan").textContent = Kho.CHU_KHO + "/" + Kho.TEN_KHO;

  o("form-vao").addEventListener("submit", function (e) {
    e.preventDefault();
    var token = o("o-token").value.trim();
    if (!token) return;
    o("nut-vao").disabled = true;
    o("loi-vao").hidden = true;
    Kho.datToken(token);
    vaoTrang().catch(function (l) {
      Kho.xoaToken();
      o("loi-vao").textContent = l.message;
      o("loi-vao").hidden = false;
      o("nut-vao").disabled = false;
    });
  });

  o("nut-ra").addEventListener("click", function () {
    hoi(
      "Đăng xuất?",
      "<p>Token sẽ bị xóa khỏi trình duyệt này. Lần sau vào lại sẽ phải dán token mới.</p>",
      "Đăng xuất"
    ).then(function (dong_y) {
      if (!dong_y) return;
      Kho.xoaToken();
      window.location.reload();
    });
  });

  function vaoTrang() {
    return Kho.kiemTra().then(function (kho) {
      o("nhan-kho").textContent = kho.ten;
      man_vao.hidden = true;
      man_chinh.hidden = false;
      return taiDanhSach();
    });
  }

  // ═════════ Màn 2: Danh sách bài ═════════

  function taiDanhSach() {
    cho("Đang tải danh sách bài…");
    return Promise.all([Kho.docFile("blog-cards.js"), Kho.docFile("sitemap.xml")])
      .then(function (kq) {
        if (!kq[0]) throw new Error("Không đọc được blog-cards.js trong kho.");
        nguon_blog_cards = kq[0].noi_dung;
        nguon_sitemap = kq[1] ? kq[1].noi_dung : "";
        danh_sach = Bai.docDanhSach(nguon_blog_cards);
        veDanhSach();
        cho(null);
      })
      .catch(function (l) {
        cho(null);
        bao(l.message, "loi", 9000);
        throw l;
      });
  }

  function veDanhSach() {
    var dang_hien = danh_sach.filter(function (b) {
      return !b.an;
    }).length;
    o("tom-tat-danh-sach").textContent =
      danh_sach.length + " bài, trong đó " + dang_hien + " bài đang hiện trên trang blog.";

    var bang = o("bang-bai");
    bang.innerHTML = "";

    danh_sach.forEach(function (b) {
      var the = document.createElement("div");
      the.className = "qt-bai";
      the.innerHTML = [
        '<img class="qt-bai-anh" src="/' + Bai.thoat(b.anh) + '" alt="" loading="lazy">',
        '<div class="qt-bai-giua">',
        '  <p class="qt-bai-tieu-de">' +
          Bai.thoat(b.tieu_de) +
          (b.noi_bat ? '<span class="qt-nhan-nho qt-nhan-noi-bat">Nổi bật</span>' : "") +
          (b.an ? '<span class="qt-nhan-nho qt-nhan-an">Đang ẩn</span>' : "") +
          "</p>",
        '  <p class="qt-bai-meta">' +
          Bai.thoat(b.href) +
          (b.ngay ? " · đăng " + Bai.thoat(b.ngay) : "") +
          "</p>",
        "</div>",
        '<div class="qt-bai-nut"></div>',
      ].join("\n");

      var cho_nut = the.querySelector(".qt-bai-nut");

      var nut_xem = document.createElement("a");
      nut_xem.className = "qt-nut qt-nut-nhe";
      nut_xem.textContent = "Mở";
      nut_xem.href = "/" + b.href;
      nut_xem.target = "_blank";
      nut_xem.rel = "noopener";

      var nut_sua = document.createElement("button");
      nut_sua.type = "button";
      nut_sua.className = "qt-nut qt-nut-nhe";
      nut_sua.textContent = "Sửa";
      nut_sua.addEventListener("click", function () {
        moBaiDeSua(b);
      });

      var nut_an = document.createElement("button");
      nut_an.type = "button";
      nut_an.className = "qt-nut qt-nut-nhe";
      nut_an.textContent = b.an ? "Hiện lại" : "Ẩn";
      nut_an.addEventListener("click", function () {
        anHienBai(b);
      });

      var nut_xoa = document.createElement("button");
      nut_xoa.type = "button";
      nut_xoa.className = "qt-nut qt-nut-nhe";
      nut_xoa.textContent = "Xóa";
      nut_xoa.addEventListener("click", function () {
        xoaBai(b);
      });

      cho_nut.appendChild(nut_xem);
      cho_nut.appendChild(nut_sua);
      cho_nut.appendChild(nut_an);
      cho_nut.appendChild(nut_xoa);
      bang.appendChild(the);
    });
  }

  // Ẩn = bài biến khỏi trang blog và khối "Bài viết khác" nhưng file vẫn còn,
  // link đã chia sẻ vẫn mở được. Đây là nút "gỡ bài" an toàn.
  function anHienBai(b) {
    var sap_an = !b.an;
    var loi_nhan = sap_an
      ? "<p>Bài <strong>" +
        Bai.thoat(b.tieu_de) +
        "</strong> sẽ biến khỏi trang blog, nhưng ai có sẵn link vẫn mở được bài. Muốn hiện lại lúc nào cũng được.</p>"
      : "<p>Bài <strong>" + Bai.thoat(b.tieu_de) + "</strong> sẽ hiện lại trên trang blog.</p>";

    hoi(sap_an ? "Ẩn bài này?" : "Hiện lại bài này?", loi_nhan, sap_an ? "Ẩn bài" : "Hiện lại").then(
      function (dong_y) {
        if (!dong_y) return;
        if (sap_an) b.an = true;
        else delete b.an;

        cho("Đang lưu…");
        Kho.ghi({
          sua: [
            { duong_dan: "blog-cards.js", noi_dung: Bai.ghiDanhSach(nguon_blog_cards, danh_sach) },
          ],
          thong_diep:
            (sap_an ? "content: ẩn bài " : "content: hiện lại bài ") + b.href + " (qua trang admin)",
        })
          .then(function () {
            cho(null);
            bao(sap_an ? "Đã ẩn bài. Vài phút nữa trang blog sẽ cập nhật." : "Đã hiện lại bài.", "tot");
            return taiDanhSach();
          })
          .catch(function (l) {
            cho(null);
            bao(l.message, "loi", 9000);
            taiDanhSach();
          });
      }
    );
  }

  // Xóa hẳn: mất file, link cũ thành trang lỗi. Hỏi kỹ và chỉ cho bấm khi
  // hiểu — mặc định luôn khuyên dùng Ẩn.
  function xoaBai(b) {
    hoi(
      "Xóa hẳn bài này?",
      "<p>Bài <strong>" +
        Bai.thoat(b.tieu_de) +
        "</strong> sẽ bị xóa khỏi site. Ai bấm vào link cũ (đã chia sẻ Zalo, Facebook, hoặc đã lên Google) sẽ gặp trang lỗi.</p>" +
        "<p>Nếu chỉ muốn bài biến khỏi trang blog, hãy bấm <strong>Thôi</strong> rồi dùng nút <strong>Ẩn</strong> — an toàn hơn nhiều.</p>",
      "Tôi hiểu, xóa hẳn"
    ).then(function (dong_y) {
      if (!dong_y) return;

      danh_sach = danh_sach.filter(function (m) {
        return m.href !== b.href;
      });

      cho("Đang xóa…");
      Kho.ghi({
        sua: [
          { duong_dan: "blog-cards.js", noi_dung: Bai.ghiDanhSach(nguon_blog_cards, danh_sach) },
          { duong_dan: "sitemap.xml", noi_dung: Bai.xoaSitemap(nguon_sitemap, b.href) },
        ],
        xoa: [b.href + ".html"],
        thong_diep: "content: xóa bài " + b.href + " (qua trang admin)",
      })
        .then(function () {
          cho(null);
          bao("Đã xóa bài.", "tot");
          return taiDanhSach();
        })
        .catch(function (l) {
          cho(null);
          bao(l.message, "loi", 9000);
          taiDanhSach();
        });
    });
  }

  // ═════════ Màn 3: Soạn bài ═════════

  // Các ô có data-dem sẽ hiện bộ đếm ký tự — quá mức khuyến nghị thì đỏ lên
  // nhưng không cấm, vì mức đó là khuyến nghị của Google chứ không phải luật.
  function gandem(inp) {
    var muc = Number(inp.getAttribute("data-dem"));
    var dem = document.createElement("p");
    dem.className = "qt-dem";
    inp.insertAdjacentElement("afterend", dem);
    function ve() {
      var n = inp.value.length;
      dem.textContent = n + "/" + muc + " ký tự";
      dem.classList.toggle("qt-dem-qua", n > muc);
    }
    inp.addEventListener("input", ve);
    ve();
    return ve;
  }
  var cac_dem = [];
  document.querySelectorAll("[data-dem]").forEach(function (inp) {
    cac_dem.push(gandem(inp));
  });
  function veLaiDem() {
    cac_dem.forEach(function (f) {
      f();
    });
    // Các ô trên thẻ vừa được tự điền lại thì thẻ xem trước cũng vẽ lại.
    veTheXemTruoc();
  }

  // ——— Chuyên mục: chọn từ danh sách, hoặc tạo mới có giới hạn ký tự ———
  function veChuyenMuc(chon) {
    var sel = o("o-nhan");
    sel.innerHTML = "";
    var ds = NHAN_GOI_Y.slice();
    // Bài đang sửa mang nhãn ngoài danh sách (bài cũ viết tay) thì vẫn phải
    // chọn được đúng nhãn đó, không được lặng lẽ đổi sang nhãn khác.
    if (chon && ds.indexOf(chon) < 0) ds.push(chon);
    ds.forEach(function (n) {
      var op = document.createElement("option");
      op.value = n;
      op.textContent = n;
      sel.appendChild(op);
    });
    var op_moi = document.createElement("option");
    op_moi.value = NHAN_MOI;
    op_moi.textContent = "+ Tạo chuyên mục mới…";
    sel.appendChild(op_moi);
    sel.value = chon || ds[0];
    o("o-nhan-moi").hidden = true;
    o("o-nhan-moi").value = "";
  }

  o("o-nhan").addEventListener("change", function () {
    var tao_moi = o("o-nhan").value === NHAN_MOI;
    o("o-nhan-moi").hidden = !tao_moi;
    if (tao_moi) o("o-nhan-moi").focus();
    veLaiDem();
  });

  // Nhãn cuối cùng ghi vào bài: chọn sẵn thì lấy nguyên, tạo mới thì tự
  // thêm "Blog · " đằng trước cho đồng bộ với các nhãn đang có.
  function layNhan() {
    if (o("o-nhan").value !== NHAN_MOI) return o("o-nhan").value;
    var ten = o("o-nhan-moi").value.replace(/\s+/g, " ").trim();
    return ten ? "Blog · " + ten : "";
  }

  bo_soan = window.SoanThao.tao({
    khung: o("khung-soan"),
    khiChonAnh: function (goiLai) {
      moChonAnh(function (anh) {
        goiLai(anh);
      });
    },
  });
  bo_soan.khiDoi(function () {
    da_doi = true;
    o("dem-chu").textContent = "Khoảng " + bo_soan.demChu() + " chữ.";
  });

  o("form-bai").addEventListener("input", function () {
    da_doi = true;
  });

  // Rời trang khi còn thay đổi chưa đăng thì trình duyệt hỏi lại giúp.
  window.addEventListener("beforeunload", function (e) {
    if (da_doi && !man_soan.hidden) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  // ——— Các ô SEO: tự sinh hoàn toàn, khóa không cho sửa ———
  // Chủ site không phải dân SEO nên toàn bộ phần này máy lo: đường dẫn,
  // tiêu đề Google, mô tả Google đều sinh từ tiêu đề + đoạn mở đầu. Ô hiện
  // trên form chỉ để xem trước, đã disabled trong HTML.
  //
  // Hai ô hiển thị trên thẻ bài (tiêu đề/mô tả trên trang blog) vẫn sửa
  // được — đó là chữ người đọc thấy, không phải SEO. Gõ tay rồi thì thôi
  // không tự điền đè lên nữa.
  var tay = {};
  ["o-the-tieu-de", "o-the-mo-ta"].forEach(function (id) {
    o(id).addEventListener("input", function () {
      tay[id] = true;
    });
  });

  // Cắt đoạn mở đầu thành mô tả cho Google: ưu tiên trọn câu, quá dài thì
  // cắt ở ranh giới từ và thêm dấu ba chấm.
  function catMoTa(chu, muc) {
    chu = chu.replace(/\s+/g, " ").trim();
    if (chu.length <= muc) return chu;
    var cau = chu.slice(0, muc);
    var het_cau = Math.max(cau.lastIndexOf(". "), cau.lastIndexOf("! "), cau.lastIndexOf("? "));
    if (het_cau > muc * 0.55) return cau.slice(0, het_cau + 1);
    return cau.slice(0, cau.lastIndexOf(" ")) + "…";
  }

  // ——— Tự viết hoa chữ cái đầu ở các ô nhập chữ ———
  // Gõ trên điện thoại hay quên viết hoa; sửa ngay lúc gõ thì mọi chỗ dùng
  // lại (thẻ bài, tiêu đề Google…) đều nhận được bản đã viết hoa.
  // Đăng ký TRƯỚC các bộ tự điền, để chúng đọc được giá trị đã sửa.
  function tuVietHoa(el) {
    el.addEventListener("input", function () {
      var chu = el.value;
      if (!chu) return;
      var dau = chu.charAt(0);
      var hoa = dau.toLocaleUpperCase("vi");
      if (dau === hoa) return;
      var chon_dau = el.selectionStart;
      var chon_cuoi = el.selectionEnd;
      el.value = hoa + chu.slice(1);
      try {
        el.setSelectionRange(chon_dau, chon_cuoi);
      } catch (e) {}
    });
  }
  ["o-h1", "o-lead", "o-anh-alt", "o-the-tieu-de", "o-the-mo-ta", "o-nhan-moi"].forEach(
    function (id) {
      tuVietHoa(o(id));
    }
  );

  o("o-h1").addEventListener("input", function () {
    var h1 = o("o-h1").value;
    // Đường dẫn chốt theo tiêu đề lúc viết bài mới. Bài đã đăng thì giữ
    // nguyên vĩnh viễn — đổi là link cũ đã chia sẻ thành trang lỗi.
    if (!dang_sua) o("o-ten-file").value = Bai.tenFile(h1);
    o("o-tieu-de-trang").value = h1 ? h1 + Bai.DUOI_TIEU_DE : "";
    if (!tay["o-the-tieu-de"]) o("o-the-tieu-de").value = h1;
    veLaiDem();
  });

  // Đoạn mở đầu → mô tả trên Google → mô tả trên thẻ, dây chuyền tự chảy.
  o("o-lead").addEventListener("input", function () {
    o("o-mo-ta-trang").value = catMoTa(o("o-lead").value, 160);
    if (!tay["o-the-mo-ta"]) o("o-the-mo-ta").value = o("o-mo-ta-trang").value;
    veLaiDem();
  });

  // ——— Thẻ xem trước: hình dáng thật của bài trên trang blog ———
  // Vẽ lại mỗi khi tiêu đề/mô tả/ảnh/nổi bật đổi, để thấy ngay chữ có bị
  // dài quá hay không mà cân nhắc gõ ngắn lại.
  function veTheXemTruoc() {
    var khung = o("xem-the");
    if (!khung) return;
    var anh_img = o("xem-anh").querySelector("img");
    var tieu_de = o("o-the-tieu-de").value.trim();
    var mo_ta = o("o-the-mo-ta").value.trim();
    khung.innerHTML = [
      o("o-noi-bat").checked ? '<span class="the-badge">Nổi bật</span>' : "",
      anh_img
        ? '<img class="the-anh" src="' + anh_img.src.replace(/"/g, "&quot;") + '" alt="">'
        : '<div class="the-anh-trong">Ảnh đại diện hiện ở đây</div>',
      "<h3>" + (tieu_de ? Bai.thoat(tieu_de) : "Tiêu đề bài viết…") + "</h3>",
      "<p>" + (mo_ta ? Bai.thoat(mo_ta) : "Mô tả ngắn của bài sẽ hiện ở đây.") + "</p>",
      '<span class="the-doc">Đọc bài viết →</span>',
    ].join("\n");
  }
  o("o-the-tieu-de").addEventListener("input", veTheXemTruoc);
  o("o-the-mo-ta").addEventListener("input", veTheXemTruoc);
  o("o-noi-bat").addEventListener("change", veTheXemTruoc);

  // ——— Tài liệu tham khảo: mỗi mục một ô ———
  function themOTaiLieu(gia_tri) {
    var khung = o("khung-tai-lieu");
    var hang = document.createElement("div");
    hang.className = "qt-tai-lieu-hang";
    var so = document.createElement("span");
    so.className = "qt-tai-lieu-so";
    var inp = document.createElement("input");
    inp.className = "qt-o";
    inp.type = "text";
    inp.value = gia_tri || "";
    tuVietHoa(inp);
    var nut = document.createElement("button");
    nut.type = "button";
    nut.className = "qt-nut qt-nut-nhe";
    nut.textContent = "Bỏ";
    nut.addEventListener("click", function () {
      hang.remove();
      danhSoTaiLieu();
      da_doi = true;
    });
    hang.appendChild(so);
    hang.appendChild(inp);
    hang.appendChild(nut);
    khung.appendChild(hang);
    danhSoTaiLieu();
  }
  function danhSoTaiLieu() {
    var so = o("khung-tai-lieu").querySelectorAll(".qt-tai-lieu-so");
    for (var i = 0; i < so.length; i++) so[i].textContent = i + 1 + ".";
  }
  function layTaiLieu() {
    return Array.prototype.map
      .call(o("khung-tai-lieu").querySelectorAll("input"), function (inp) {
        return inp.value.trim();
      })
      .filter(Boolean);
  }
  o("nut-them-tai-lieu").addEventListener("click", function () {
    themOTaiLieu("");
    da_doi = true;
  });

  // ——— Mở màn soạn ———
  function moBaiMoi() {
    dang_sua = null;
    anh_cho_tai = [];
    tay = {};
    o("form-bai").reset();
    o("khung-tai-lieu").innerHTML = "";
    bo_soan.datHTML("");
    datAnh("", "");
    o("o-ngay").value = Bai.homNay();
    veChuyenMuc(null);
    o("tieu-de-soan").textContent = "Viết bài mới";
    o("duong-dan-soan").textContent = "Bài sẽ lên sóng khoảng một phút sau khi bấm Đăng bài.";
    veLaiDem();
    da_doi = false;
    doiManSoan(true);
  }

  function moBaiDeSua(muc) {
    cho("Đang mở bài…");
    Kho.docFile(muc.href + ".html")
      .then(function (kq) {
        cho(null);
        if (!kq) {
          bao(
            "Không thấy file " + muc.href + ".html trong kho — bài có trong danh sách nhưng file đã mất.",
            "loi",
            9000
          );
          return;
        }
        var d = Bai.docHTML(kq.noi_dung, muc.href);
        dang_sua = d;
        anh_cho_tai = [];
        // Chữ trên thẻ bài của bài cũ giữ nguyên như đã đặt, trừ khi người
        // dùng gõ lại. (Các ô SEO thì luôn tự sinh, không cần cờ.)
        tay = { "o-the-tieu-de": true, "o-the-mo-ta": true };

        o("form-bai").reset();
        o("o-h1").value = d.h1;
        veChuyenMuc(d.nhan || null);
        o("o-lead").value = d.lead.replace(/<[^>]*>/g, "");
        bo_soan.datHTML(d.than);
        o("khung-tai-lieu").innerHTML = "";
        d.tai_lieu.forEach(themOTaiLieu);
        datAnh(d.anh, d.anh_alt, d.anh_rong, d.anh_cao);
        o("o-the-tieu-de").value = muc.tieu_de;
        o("o-the-mo-ta").value = muc.mo_ta;
        o("o-noi-bat").checked = !!muc.noi_bat;
        o("o-ten-file").value = d.ten_file;
        o("o-ngay").value = d.ngay;
        o("o-tieu-de-trang").value = d.tieu_de_trang;
        o("o-mo-ta-trang").value = d.mo_ta_trang;

        o("tieu-de-soan").textContent = "Sửa bài";
        o("duong-dan-soan").textContent = "Đang sửa: " + Bai.GOC_SITE + "/" + d.ten_file;
        veLaiDem();
        o("dem-chu").textContent = "Khoảng " + bo_soan.demChu() + " chữ.";
        da_doi = false;
        doiManSoan(true);
      })
      .catch(function (l) {
        cho(null);
        bao(l.message, "loi", 9000);
      });
  }

  function doiManSoan(sang_soan) {
    man_danh_sach.hidden = sang_soan;
    man_soan.hidden = !sang_soan;
    window.scrollTo(0, 0);
  }

  o("nut-bai-moi").addEventListener("click", moBaiMoi);

  o("nut-huy").addEventListener("click", function () {
    if (!da_doi) {
      doiManSoan(false);
      return;
    }
    hoi(
      "Bỏ thay đổi?",
      "<p>Bài đang soạn có thay đổi chưa đăng. Quay lại danh sách thì những thay đổi đó mất.</p>",
      "Bỏ và quay lại"
    ).then(function (dong_y) {
      if (dong_y) doiManSoan(false);
    });
  });

  // ——— Ảnh đại diện ———
  var anh_hien_tai = { anh: "", alt: "", rong: 0, cao: 0 };

  // xem_thu: dữ liệu ảnh trong máy, dùng khi ảnh vừa tải lên chưa có trên
  // site — không có nó thì khung xem thử vỡ vì đường dẫn chưa tồn tại.
  function datAnh(duong_dan, alt, rong, cao, xem_thu) {
    anh_hien_tai = { anh: duong_dan, alt: alt || "", rong: Number(rong) || 0, cao: Number(cao) || 0 };
    var khung = o("xem-anh");
    if (xem_thu) {
      khung.innerHTML = '<img src="' + xem_thu + '" alt="">';
      o("thong-tin-anh").textContent = duong_dan + " (sẽ tải lên khi đăng bài)";
    } else if (duong_dan) {
      khung.innerHTML = '<img src="/' + Bai.thoat(duong_dan) + '" alt="">';
      o("thong-tin-anh").textContent = duong_dan;
    } else {
      khung.innerHTML = "<span>Chưa chọn ảnh</span>";
      o("thong-tin-anh").textContent = "";
    }
    if (alt != null) o("o-anh-alt").value = alt;
    veTheXemTruoc();

    // Chưa biết kích thước (chọn ảnh có sẵn) thì đo từ chính ảnh — thẻ
    // og:image cần con số thật để Facebook/Zalo dựng khung đúng tỉ lệ.
    if (duong_dan && !xem_thu && !anh_hien_tai.rong) {
      var do_thu = new Image();
      do_thu.onload = function () {
        anh_hien_tai.rong = do_thu.naturalWidth;
        anh_hien_tai.cao = do_thu.naturalHeight;
      };
      do_thu.src = "/" + duong_dan;
    }
  }

  o("nut-chon-anh").addEventListener("click", function () {
    moChonAnh(function (anh) {
      if (!anh) return;
      datAnh(anh.anh, o("o-anh-alt").value || "", anh.rong, anh.cao, anh.xem_thu);
      da_doi = true;
    });
  });

  // ——— Bảng chọn ảnh (dùng cho cả ảnh đại diện lẫn ảnh chèn giữa bài) ———
  var goi_lai_anh = null;
  var kho_anh = null; // danh sách file trong assets/img, tải một lần

  function moChonAnh(goiLai) {
    goi_lai_anh = goiLai;
    o("lop-anh").hidden = false;
    o("o-tim-anh").value = "";
    chonThe("co");
    if (kho_anh) {
      veLuoiAnh(kho_anh);
      return;
    }
    o("luoi-anh").innerHTML = '<p class="qt-phu">Đang tải danh sách ảnh…</p>';
    Kho.docThuMuc(Bai.THU_MUC_ANH)
      .then(function (ds) {
        kho_anh = ds.filter(function (f) {
          return /\.(jpe?g|png|webp|gif)$/i.test(f.ten);
        });
        veLuoiAnh(kho_anh);
      })
      .catch(function (l) {
        o("luoi-anh").innerHTML = '<p class="qt-loi">' + Bai.thoat(l.message) + "</p>";
      });
  }

  function veLuoiAnh(ds) {
    var loc = o("o-tim-anh").value.trim().toLowerCase();
    var luoi = o("luoi-anh");
    luoi.innerHTML = "";
    ds.forEach(function (f) {
      if (loc && f.ten.toLowerCase().indexOf(loc) < 0) return;
      var nut = document.createElement("button");
      nut.type = "button";
      nut.innerHTML =
        '<img src="/' + Bai.thoat(f.duong_dan) + '" alt="" loading="lazy"><figcaption>' +
        Bai.thoat(f.ten) +
        "</figcaption>";
      nut.addEventListener("click", function () {
        dongChonAnh({ anh: f.duong_dan, alt: "" });
      });
      luoi.appendChild(nut);
    });
    if (!luoi.children.length) luoi.innerHTML = '<p class="qt-phu">Không có ảnh nào khớp.</p>';
  }
  o("o-tim-anh").addEventListener("input", function () {
    if (kho_anh) veLuoiAnh(kho_anh);
  });

  function chonThe(ten) {
    document.querySelectorAll(".qt-the").forEach(function (t) {
      t.classList.toggle("qt-the-bat", t.getAttribute("data-the") === ten);
    });
    o("the-co").hidden = ten !== "co";
    o("the-moi").hidden = ten !== "moi";
  }
  document.querySelectorAll(".qt-the").forEach(function (t) {
    t.addEventListener("click", function () {
      chonThe(t.getAttribute("data-the"));
    });
  });

  function dongChonAnh(ket_qua) {
    o("lop-anh").hidden = true;
    o("ket-qua-nen").innerHTML = "";
    o("o-tep-anh").value = "";
    var f = goi_lai_anh;
    goi_lai_anh = null;
    if (f) f(ket_qua);
  }
  o("nut-dong-anh").addEventListener("click", function () {
    dongChonAnh(null);
  });

  // ——— Tải ảnh mới: thu nhỏ và nén ngay trong trình duyệt ———
  // Ảnh chụp điện thoại thường 3–5MB; đẩy thẳng lên là trang nặng và kho
  // phình. Thu về tối đa 1600px, nén JPEG ~0.82 — đủ nét cho khung bài viết.
  var NEN_TOI_DA = 1600;

  o("o-tep-anh").addEventListener("change", function () {
    var tep = o("o-tep-anh").files[0];
    if (!tep) return;

    var doc = new FileReader();
    doc.onload = function () {
      var anh = new Image();
      anh.onload = function () {
        var ti_le = Math.min(1, NEN_TOI_DA / Math.max(anh.width, anh.height));
        var rong = Math.round(anh.width * ti_le);
        var cao = Math.round(anh.height * ti_le);
        var khung_ve = document.createElement("canvas");
        khung_ve.width = rong;
        khung_ve.height = cao;
        khung_ve.getContext("2d").drawImage(anh, 0, 0, rong, cao);
        var jpeg = khung_ve.toDataURL("image/jpeg", 0.82);
        var base64 = jpeg.split(",")[1];

        // Tên file: bỏ dấu + thêm ngày để không đè ảnh trùng tên đã có.
        var goc = tep.name.replace(/\.[^.]+$/, "");
        var ten = Bai.tenFile(goc) || "anh";
        var duong_dan = Bai.THU_MUC_ANH + "/" + ten + "-" + Bai.homNay() + ".jpg";

        var nang_kb = Math.round((base64.length * 3) / 4 / 1024);
        o("ket-qua-nen").innerHTML = [
          '<div class="qt-anh-chon" style="margin-top:12px">',
          '  <div class="qt-anh-xem"><img src="' + jpeg + '" alt=""></div>',
          '  <div class="qt-anh-canh">',
          '    <p class="qt-phu">' + rong + "×" + cao + "px · khoảng " + nang_kb + " KB sau khi nén.</p>",
          '    <p class="qt-phu">' + Bai.thoat(duong_dan) + "</p>",
          '    <button class="qt-nut qt-nut-chinh" type="button" id="nut-dung-anh-moi">Dùng ảnh này</button>',
          "  </div>",
          "</div>",
        ].join("\n");

        o("nut-dung-anh-moi").addEventListener("click", function () {
          anh_cho_tai.push({ base64: base64, duong_dan: duong_dan, rong: rong, cao: cao });
          // Cho hiện ngay bằng dữ liệu trong máy — ảnh chưa có trên site
          // cho tới khi bấm Đăng bài.
          dongChonAnh({ anh: duong_dan, rong: rong, cao: cao, xem_thu: jpeg });
        });
      };
      anh.src = doc.result;
    };
    doc.readAsDataURL(tep);
  });

  // ——— Gom dữ liệu từ form ———
  function kiemTraForm() {
    // Chỉ nhắc những ô người dùng sửa được. Các ô SEO tự sinh nên không bao
    // giờ nằm trong danh sách thiếu — thiếu là do nguồn của nó (tiêu đề,
    // đoạn mở đầu) chưa có.
    var thieu = [];
    if (!o("o-h1").value.trim()) thieu.push("tiêu đề bài viết");
    if (!layNhan()) thieu.push("tên chuyên mục mới");
    if (!o("o-ngay").value) thieu.push("ngày đăng");
    if (!o("o-lead").value.trim()) thieu.push("đoạn mở đầu");
    if (!anh_hien_tai.anh) thieu.push("ảnh đại diện");
    if (!o("o-anh-alt").value.trim()) thieu.push("mô tả ảnh");
    if (!bo_soan.layHTML().trim()) thieu.push("thân bài");
    if (thieu.length) {
      bao("Còn thiếu: <strong>" + thieu.join(", ") + "</strong>.", "loi", 7000);
      return false;
    }
    return true;
  }

  function gomDuLieu() {
    var ngay = o("o-ngay").value;
    // Sửa bài đã đăng vào ngày khác thì ghi thêm ngày sửa để Google biết bài
    // vừa được cập nhật; ngày đăng gốc giữ nguyên.
    var ngay_sua = "";
    if (dang_sua && dang_sua.ngay === ngay && ngay !== Bai.homNay()) ngay_sua = Bai.homNay();
    else if (dang_sua && dang_sua.ngay_sua) ngay_sua = dang_sua.ngay_sua;

    return {
      ten_file: o("o-ten-file").value.trim(),
      tieu_de_trang: o("o-tieu-de-trang").value.trim(),
      mo_ta_trang: o("o-mo-ta-trang").value.trim(),
      nhan: layNhan() || "Blog",
      h1: o("o-h1").value.trim(),
      anh: anh_hien_tai.anh,
      anh_alt: o("o-anh-alt").value.trim(),
      anh_rong: anh_hien_tai.rong || 1600,
      anh_cao: anh_hien_tai.cao || 900,
      lead: o("o-lead").value.trim(),
      than: bo_soan.layHTML(),
      tai_lieu: layTaiLieu(),
      ngay: ngay,
      ngay_sua: ngay_sua,
    };
  }

  // ——— Xem trước ———
  o("nut-xem-truoc").addEventListener("click", function () {
    if (!kiemTraForm()) return;
    var html = Bai.sinhHTML(gomDuLieu());
    // Thêm <base> để các đường dẫn tương đối (style.css, ảnh) trỏ về site
    // thật đang chạy, và bài xem trước trông đúng như khi lên sóng.
    html = html.replace("<head>", "<head>\n<base href=\"" + window.location.origin + "/\">");
    // Ảnh mới chưa lên site — thay tạm bằng dữ liệu trong máy.
    anh_cho_tai.forEach(function (a) {
      html = html
        .split('src="' + a.duong_dan + '"')
        .join('src="data:image/jpeg;base64,' + a.base64 + '"');
    });
    o("khung-xem").setAttribute("srcdoc", html);
    o("lop-xem").hidden = false;
  });
  o("nut-dong-xem").addEventListener("click", function () {
    o("lop-xem").hidden = true;
    o("khung-xem").removeAttribute("srcdoc");
  });

  // ——— Đăng bài: gom mọi thay đổi vào MỘT commit ———
  o("nut-dang").addEventListener("click", function () {
    if (!kiemTraForm()) return;
    var d = gomDuLieu();

    // Bài mới trùng đường dẫn với bài đã có (hai bài trùng tiêu đề) thì tự
    // thêm hậu tố -2, -3… — đường dẫn do máy sinh nên máy tự tránh luôn,
    // không bắt người dùng xử lý.
    if (!dang_sua) {
      var goc_ten = d.ten_file;
      var so = 2;
      while (
        danh_sach.some(function (m) {
          return m.href === d.ten_file;
        })
      ) {
        d.ten_file = goc_ten + "-" + so++;
      }
      o("o-ten-file").value = d.ten_file;
    }

    var doi_duong_dan = dang_sua && dang_sua.ten_file !== d.ten_file;

    var buoc = Promise.resolve(true);
    if (doi_duong_dan) {
      buoc = hoi(
        "Đổi đường dẫn bài đã đăng?",
        "<p>Địa chỉ cũ <code>" +
          Bai.thoat(dang_sua.ten_file) +
          "</code> sẽ không còn — ai mở link cũ sẽ gặp trang lỗi. Bài sẽ nằm ở địa chỉ mới <code>" +
          Bai.thoat(d.ten_file) +
          "</code>.</p>",
        "Đổi đường dẫn"
      );
    }

    buoc.then(function (dong_y) {
      if (!dong_y) return;

      // Cập nhật danh sách bài: bài mới chèn lên đầu, bài sửa giữ nguyên chỗ.
      var muc = {
        href: d.ten_file,
        tieu_de: o("o-the-tieu-de").value.trim() || d.h1,
        mo_ta: o("o-the-mo-ta").value.trim() || d.mo_ta_trang,
        anh: d.anh,
        alt: d.anh_alt,
        ngay: d.ngay,
      };
      if (o("o-noi-bat").checked) muc.noi_bat = true;

      var ds_moi;
      if (dang_sua) {
        ds_moi = danh_sach.map(function (m) {
          if (m.href !== dang_sua.ten_file) return m;
          if (m.an) muc.an = true; // bài đang ẩn thì sửa xong vẫn ẩn
          return muc;
        });
      } else {
        ds_moi = [muc].concat(danh_sach);
      }

      // sitemap: thêm/cập nhật khối của bài, làm mới lastmod trang blog.
      var xml = nguon_sitemap;
      if (doi_duong_dan) xml = Bai.xoaSitemap(xml, dang_sua.ten_file);
      xml = Bai.themSitemap(xml, d.ten_file, Bai.homNay());
      xml = Bai.moiLastmod(xml, "blog", Bai.homNay());

      var html_bai = Bai.sinhHTML(d);

      var thay_doi = {
        sua: [
          { duong_dan: d.ten_file + ".html", noi_dung: html_bai },
          { duong_dan: "blog-cards.js", noi_dung: Bai.ghiDanhSach(nguon_blog_cards, ds_moi) },
          { duong_dan: "sitemap.xml", noi_dung: xml },
        ],
        // Trong các ảnh tải lên khi soạn, chỉ đẩy ảnh bài thật sự dùng —
        // ảnh chọn thử rồi đổi ý thì bỏ, không làm rác kho.
        tai: anh_cho_tai.filter(function (a) {
          return html_bai.indexOf(a.duong_dan) >= 0;
        }),
        xoa: doi_duong_dan ? [dang_sua.ten_file + ".html"] : [],
        thong_diep:
          (dang_sua ? "content: sửa bài " : "content: đăng bài ") + d.ten_file + " (qua trang admin)",
      };

      cho(dang_sua ? "Đang lưu bài…" : "Đang đăng bài…");
      Kho.ghi(thay_doi)
        .then(function () {
          cho(null);
          da_doi = false;
          anh_cho_tai = [];
          bao(
            (dang_sua ? "Đã lưu. " : "Đã đăng. ") +
              'Khoảng một phút nữa bài sẽ có tại <a href="/' +
              Bai.thoat(d.ten_file) +
              '" target="_blank" rel="noopener">bacsikien.com/' +
              Bai.thoat(d.ten_file) +
              "</a>.",
            "tot",
            10000
          );
          doiManSoan(false);
          return taiDanhSach();
        })
        .catch(function (l) {
          cho(null);
          bao(l.message + " Bài đang soạn vẫn còn nguyên trên màn hình, chưa mất gì.", "loi", 10000);
        });
    });
  });

  // ═════════ Khởi động ═════════
  if (Kho.layToken()) {
    vaoTrang().catch(function () {
      // Token cũ hỏng/hết hạn — về màn đăng nhập, có sẵn lời nhắc.
      man_chinh.hidden = true;
      man_vao.hidden = false;
      o("loi-vao").textContent = "Token đã lưu không còn dùng được (thường do hết hạn). Dán token mới.";
      o("loi-vao").hidden = false;
    });
  }
})();
