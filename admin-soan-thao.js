// Trình soạn thảo thân bài — kiểu kết hợp.
//
// "Kết hợp" nghĩa là: gõ và định dạng trực quan như Word cho phần chữ thường,
// nhưng có thêm nút riêng cho mấy khối chỉ site này mới có (danh sách dấu
// tick, ảnh minh họa kèm chú thích, số chú thích) — vì mấy khối đó phụ thuộc
// vào class trong style.css, gõ tay rất dễ sai. Và luôn có nút "Xem HTML" làm
// cửa thoát khi cần chỉnh tay một chỗ nào đó.
//
// Nguyên tắc quan trọng nhất: HTML lấy ra khỏi đây phải SẠCH. Chữ dán từ
// Word hay Google Docs mang theo hàng đống thẻ <span style="font-family:...">
// — để lọt vào bài viết là chữ trong bài lệch hẳn phần còn lại của site. Vì
// vậy mọi thứ đều đi qua donDep() trước khi trả về.
window.SoanThao = (function () {
  // ——— Những thẻ và thuộc tính được phép có mặt trong bài viết ———
  // Thêm kiểu nội dung mới thì khai báo ở đây, nếu không nó sẽ bị gỡ.
  var CHO_PHEP = {
    P: ["class"],
    H2: [],
    H3: [],
    H4: [],
    UL: ["class"],
    OL: [],
    LI: [],
    STRONG: [],
    EM: [],
    SUP: [],
    SUB: [],
    A: ["href", "target", "rel"],
    FIGURE: ["class"],
    FIGCAPTION: [],
    IMG: ["src", "alt", "loading"],
    BLOCKQUOTE: [],
    BR: [],
  };

  // Class được giữ lại — mọi class khác (nhất là class Word tự sinh) đều bỏ.
  var CLASS_GIU = { lead: 1, "list-check": 1, "article-inline-img": 1 };

  // Thẻ cũ đổi sang thẻ chuẩn: trình duyệt hay sinh <b>/<i>, còn Word thì
  // rắc <div> khắp nơi.
  var DOI_TEN = { B: "STRONG", I: "EM", DIV: "P" };

  // Thẻ khối — dùng để biết chữ trần có đang nằm ngoài khối nào không.
  var LA_KHOI = { P: 1, H2: 1, H3: 1, H4: 1, UL: 1, OL: 1, FIGURE: 1, BLOCKQUOTE: 1 };

  function thayTen(el, ten_moi) {
    var moi = document.createElement(ten_moi);
    while (el.firstChild) moi.appendChild(el.firstChild);
    el.parentNode.replaceChild(moi, el);
    return moi;
  }

  function boVo(el) {
    var cha = el.parentNode;
    while (el.firstChild) cha.insertBefore(el.firstChild, el);
    cha.removeChild(el);
  }

  function donDepNut(cha) {
    var con = Array.prototype.slice.call(cha.children);
    con.forEach(function (el) {
      if (DOI_TEN[el.tagName]) el = thayTen(el, DOI_TEN[el.tagName]);

      if (!CHO_PHEP[el.tagName]) {
        donDepNut(el);
        boVo(el);
        return;
      }

      // Ảnh vừa tải lên được hiển thị bằng dữ liệu trong máy (data:) cho khỏi
      // gãy, nhưng phải LƯU bằng đường dẫn thật — đổi lại trước khi lọc.
      if (el.tagName === "IMG" && el.hasAttribute("data-duong-dan")) {
        el.setAttribute("src", el.getAttribute("data-duong-dan"));
      }

      var giu = CHO_PHEP[el.tagName];
      Array.prototype.slice.call(el.attributes).forEach(function (a) {
        if (giu.indexOf(a.name) < 0) el.removeAttribute(a.name);
      });

      if (el.hasAttribute("class")) {
        var con_lai = el.className
          .split(/\s+/)
          .filter(function (c) {
            return CLASS_GIU[c];
          })
          .join(" ");
        if (con_lai) el.className = con_lai;
        else el.removeAttribute("class");
      }

      // Liên kết ra ngoài thì mở tab mới, và rel="noopener" cho an toàn.
      if (el.tagName === "A") {
        var dich = el.getAttribute("href") || "";
        if (/^https?:\/\//i.test(dich) && dich.indexOf("bacsikien.com") < 0) {
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener");
        }
      }
      if (el.tagName === "IMG") el.setAttribute("loading", "lazy");

      donDepNut(el);

      // Bỏ khối rỗng — hay sinh ra khi xóa chữ nhưng còn trơ cái thẻ.
      // Trừ chính thẻ ảnh/xuống dòng: chúng không có chữ bên trong là
      // chuyện bình thường, xóa là mất ảnh.
      if (
        el.tagName !== "IMG" &&
        el.tagName !== "BR" &&
        !el.textContent.trim() &&
        !el.querySelector("img, br")
      )
        el.remove();
    });
  }

  function donDep(html) {
    var hop = document.createElement("div");
    hop.innerHTML = html;
    donDepNut(hop);

    // Chữ nằm trần ngoài mọi khối thì gói vào <p>, nếu không lúc dàn trang
    // đoạn chữ đó sẽ biến mất.
    var nut = Array.prototype.slice.call(hop.childNodes);
    nut.forEach(function (n) {
      if (n.nodeType === 3 && n.textContent.trim()) {
        var p = document.createElement("p");
        hop.insertBefore(p, n);
        p.appendChild(n);
      } else if (n.nodeType === 1 && !LA_KHOI[n.tagName]) {
        var p2 = document.createElement("p");
        hop.insertBefore(p2, n);
        p2.appendChild(n);
      }
    });

    return hop.innerHTML;
  }

  // ——— Thanh công cụ ———
  // Mỗi nút: nhãn hiện trên màn hình, chú thích khi rê chuột, và việc phải làm.
  function dungThanhCongCu(bo) {
    return [
      { nhom: true },
      { chu: "B", chu_thich: "Chữ đậm (Ctrl+B)", dam: true, lam: function () { bo.lenh("bold"); } },
      { chu: "I", chu_thich: "Chữ nghiêng (Ctrl+I)", nghieng: true, lam: function () { bo.lenh("italic"); } },
      { nhom: true },
      { chu: "Đoạn", chu_thich: "Đoạn văn thường", lam: function () { bo.khoi("p"); } },
      { chu: "Tiêu đề lớn", chu_thich: "Tiêu đề mục lớn trong bài", lam: function () { bo.khoi("h2"); } },
      { chu: "Tiêu đề nhỏ", chu_thich: "Tiêu đề phụ nằm trong một mục", lam: function () { bo.khoi("h3"); } },
      { nhom: true },
      { chu: "• Danh sách", chu_thich: "Danh sách gạch đầu dòng", lam: function () { bo.danhSach(false); } },
      { chu: "1. Đánh số", chu_thich: "Danh sách đánh số", lam: function () { bo.lenh("insertOrderedList"); } },
      { chu: "✓ Dấu tick", chu_thich: "Danh sách có dấu tick — kiểu riêng của site", lam: function () { bo.danhSach(true); } },
      { nhom: true },
      { chu: "Liên kết", chu_thich: "Chèn liên kết vào chữ đang bôi đen", lam: function () { bo.lienKet(); } },
      { chu: "Ảnh", chu_thich: "Chèn ảnh minh họa kèm chú thích", lam: function () { bo.chenAnh(); } },
      { chu: "Chú thích¹", chu_thich: "Chèn số chú thích, tự đánh số tiếp", lam: function () { bo.chuThich(); } },
      { nhom: true },
      { chu: "Xóa định dạng", chu_thich: "Trả chữ đang bôi đen về chữ thường", lam: function () { bo.lenh("removeFormat"); } },
      { chu: "</> HTML", chu_thich: "Xem và sửa thẳng mã HTML của bài", lam: function () { bo.doiCheDo(); } },
    ];
  }

  // ——— Tạo một trình soạn thảo ———
  // tuy_chon.khung      : thẻ chứa trình soạn thảo
  // tuy_chon.khiChonAnh : hàm mở bảng chọn ảnh, gọi lại với { anh, alt }
  function tao(tuy_chon) {
    var khung = tuy_chon.khung;
    khung.classList.add("st");

    var thanh = document.createElement("div");
    thanh.className = "st-thanh";

    var vung = document.createElement("div");
    vung.className = "st-vung";
    vung.contentEditable = "true";
    vung.setAttribute("role", "textbox");
    vung.setAttribute("aria-multiline", "true");
    vung.setAttribute("aria-label", "Thân bài viết");

    var tho = document.createElement("textarea");
    tho.className = "st-tho";
    tho.hidden = true;
    tho.setAttribute("aria-label", "Mã HTML của thân bài");
    tho.spellcheck = false;

    khung.appendChild(thanh);
    khung.appendChild(vung);
    khung.appendChild(tho);

    var dang_xem_ma = false;

    var bo = {
      lenh: function (ten, gia_tri) {
        vung.focus();
        document.execCommand(ten, false, gia_tri || null);
      },

      khoi: function (ten) {
        vung.focus();
        document.execCommand("formatBlock", false, ten);
      },

      // Danh sách thường và danh sách dấu tick chỉ khác nhau đúng một class,
      // nên dùng chung một đường: tạo danh sách rồi gắn/gỡ class.
      danhSach: function (co_tick) {
        vung.focus();
        var ul = timCha("UL");
        if (!ul) {
          document.execCommand("insertUnorderedList");
          ul = timCha("UL");
        }
        if (ul) ul.classList.toggle("list-check", !!co_tick);
      },

      lienKet: function () {
        vung.focus();
        var chon = window.getSelection();
        if (!chon || chon.isCollapsed) {
          alert("Bôi đen đoạn chữ muốn gắn liên kết trước đã.");
          return;
        }
        var dich = window.prompt("Dán địa chỉ liên kết vào đây:", "https://");
        if (!dich) return;
        document.execCommand("createLink", false, dich);
      },

      chenAnh: function () {
        if (!tuy_chon.khiChonAnh) return;
        tuy_chon.khiChonAnh(function (anh) {
          if (!anh) return;
          vung.focus();
          // Ảnh mới chưa lên site: hiện tạm bằng dữ liệu trong máy
          // (anh.xem_thu), còn đường dẫn thật gửi kèm để lúc lưu đổi lại.
          var src = anh.xem_thu || anh.anh;
          var kem = anh.xem_thu ? ' data-duong-dan="' + anh.anh + '"' : "";
          document.execCommand(
            "insertHTML",
            false,
            '<figure class="article-inline-img">' +
              '<img src="' + src + '"' + kem + ' alt="' + String(anh.alt || "").replace(/"/g, "&quot;") + '" loading="lazy">' +
              "<figcaption>Nhập chú thích cho ảnh…</figcaption>" +
              "</figure><p><br></p>"
          );
        });
      },

      // Số chú thích trỏ xuống mục Tài liệu tham khảo ở cuối bài. Tự đếm để
      // đánh số tiếp, khỏi phải nhớ đang tới số mấy.
      chuThich: function () {
        vung.focus();
        var so = vung.querySelectorAll("sup").length + 1;
        document.execCommand("insertHTML", false, "<sup>" + so + "</sup>");
      },

      doiCheDo: function () {
        if (dang_xem_ma) {
          vung.innerHTML = donDep(tho.value);
          tho.hidden = true;
          vung.hidden = false;
        } else {
          tho.value = dinhDangMa(donDep(vung.innerHTML));
          vung.hidden = true;
          tho.hidden = false;
        }
        dang_xem_ma = !dang_xem_ma;
        ve();
      },
    };

    function timCha(ten) {
      var chon = window.getSelection();
      if (!chon || !chon.anchorNode) return null;
      var n = chon.anchorNode;
      while (n && n !== vung) {
        if (n.nodeType === 1 && n.tagName === ten) return n;
        n = n.parentNode;
      }
      return null;
    }

    // Xuống dòng giữa các thẻ cho dễ đọc khi xem mã HTML.
    function dinhDangMa(html) {
      return html.replace(/></g, ">\n<").replace(/<\/(p|h2|h3|h4|ul|ol|figure|blockquote)>/g, "</$1>\n");
    }

    function ve() {
      thanh.innerHTML = "";
      dungThanhCongCu(bo).forEach(function (n) {
        if (n.nhom) {
          var vach = document.createElement("span");
          vach.className = "st-vach";
          thanh.appendChild(vach);
          return;
        }
        var nut = document.createElement("button");
        nut.type = "button";
        nut.className = "st-nut";
        nut.textContent = n.chu;
        nut.title = n.chu_thich;
        if (n.dam) nut.style.fontWeight = "700";
        if (n.nghieng) nut.style.fontStyle = "italic";
        // Ở chế độ xem mã thì mọi nút định dạng đều vô nghĩa, chỉ chừa nút đổi
        // chế độ — tắt hẳn để không bấm nhầm rồi tưởng hỏng.
        if (dang_xem_ma && n.chu.indexOf("HTML") < 0) nut.disabled = true;
        if (dang_xem_ma && n.chu.indexOf("HTML") >= 0) nut.classList.add("st-nut-bat");
        nut.addEventListener("mousedown", function (e) {
          e.preventDefault(); // giữ nguyên chỗ đang bôi đen khi bấm nút
        });
        nut.addEventListener("click", n.lam);
        thanh.appendChild(nut);
      });
    }

    // ——— Dán chữ ———
    // Lấy đúng phần chữ, bỏ hết định dạng nguồn. Chữ soạn sẵn trong Word
    // thường ngăn đoạn bằng dòng trống, nên dòng trống được hiểu là sang
    // đoạn mới; còn xuống dòng đơn lẻ chỉ là chữ dài bị ngắt, nối lại.
    vung.addEventListener("paste", function (e) {
      e.preventDefault();
      var chu = (e.clipboardData || window.clipboardData).getData("text/plain") || "";
      if (!chu.trim()) return;

      var doan = chu
        .replace(/\r/g, "")
        .split(/\n\s*\n+/)
        .map(function (d) {
          return d.replace(/\n/g, " ").trim();
        })
        .filter(Boolean);

      if (doan.length < 2) {
        document.execCommand("insertText", false, doan[0] || "");
        return;
      }
      document.execCommand(
        "insertHTML",
        false,
        doan
          .map(function (d) {
            return "<p>" + window.BaiViet.thoat(d) + "</p>";
          })
          .join("")
      );
    });

    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch (e) {
      // Trình duyệt cũ không hỗ trợ — chỉ ảnh hưởng thẩm mỹ mã nguồn.
    }
    ve();

    return {
      datHTML: function (html) {
        if (dang_xem_ma) bo.doiCheDo();
        vung.innerHTML = donDep(html || "");
      },
      layHTML: function () {
        if (dang_xem_ma) return donDep(tho.value);
        return donDep(vung.innerHTML);
      },
      demChu: function () {
        var t = (dang_xem_ma ? tho.value.replace(/<[^>]*>/g, " ") : vung.textContent) || "";
        return t.trim().split(/\s+/).filter(Boolean).length;
      },
      khiDoi: function (ham) {
        vung.addEventListener("input", ham);
        tho.addEventListener("input", ham);
      },
    };
  }

  return { tao: tao, donDep: donDep };
})();
