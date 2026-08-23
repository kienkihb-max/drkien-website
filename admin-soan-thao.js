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
  // Chữ mờ trong ô chú thích của ảnh vừa chèn. Người viết gõ đè lên; còn để
  // nguyên thì lúc lấy HTML ra nó bị bỏ đi, chứ không lên web thành một dòng
  // "Nhập chú thích cho ảnh…" nằm dưới tấm ảnh.
  var CHU_THICH_MAU = "Nhập chú thích cho ảnh…";

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
  var CLASS_GIU = {
    lead: 1,
    "list-check": 1,
    "article-inline-img": 1,
    // Ảnh dọc: giữ nguyên tỉ lệ gốc thay vì bị ép khung ngang 16/10. Thiếu
    // dòng này thì class bị lọc mất lúc lưu, và ảnh chân dung trong bài lại
    // bị cắt mất đầu với chân — đúng lỗi mà nó sinh ra để chữa.
    "article-inline-img-doc": 1,
  };

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
      if (el.tagName === "IMG") {
        el.setAttribute("loading", "lazy");
        // Đường dẫn ảnh phải bắt đầu bằng "/". Bài cũ ghi "assets/img/x.jpg"
        // (không có gạch đầu) — trên trang bài ở địa chỉ /ten-bai thì nó vẫn
        // ra đúng /assets/img/x.jpg, nhưng trong trang soạn ở /admin/bai thì
        // trình duyệt hiểu là /admin/assets/img/x.jpg và ảnh thành ô vỡ.
        var duong = el.getAttribute("src") || "";
        if (/^(assets|image)\//i.test(duong)) el.setAttribute("src", "/" + duong);
      }

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

  // ——— Tự dọn dáng cho đẹp ———
  // donDep() lo phần an toàn: bỏ thẻ lạ, bỏ class Word. Còn chuanHoa() lo
  // phần thẩm mỹ: đoán xem đoạn nào đáng ra là tiêu đề, đoạn nào đáng ra là
  // gạch đầu dòng. Chữ dán vào hay mất đúng hai thứ đó — người viết thấy nó
  // là tiêu đề vì nó in đậm và đứng một mình, nhưng dán sang thì nó chỉ còn
  // là một <p> như mọi đoạn khác.

  // Dấu mở đầu một gạch đầu dòng, gõ kiểu nào cũng nhận.
  var DAU_GACH = /^\s*[-–—•·*+]\s+/;
  // "1." "1)" "1 -" … mở đầu một danh sách đánh số.
  var DAU_SO = /^\s*\d{1,2}\s*[.)\-]\s+/;
  // Đoạn kết thúc bằng dấu câu thì gần như chắc chắn là câu văn, không phải
  // tiêu đề. Dấu hai chấm là ngoại lệ: "Ba điều cần nhớ:" vẫn là tiêu đề.
  var KET_CAU = /[.!?;,…]$/;

  // Một đoạn có "dáng tiêu đề" không: ngắn, đứng một mình, không kết thúc
  // như một câu. Ngưỡng 80 ký tự là chỗ tiêu đề tiếng Việt hầu như không
  // vượt qua, còn câu văn thường thì vượt.
  function dangTieuDe(chu, toan_bo_dam) {
    chu = chu.replace(/\s+/g, " ").trim();
    if (!chu) return false;
    if (chu.length > 80) return false;
    if (DAU_GACH.test(chu) || DAU_SO.test(chu)) return false;
    if (KET_CAU.test(chu)) return false;
    // Không in đậm thì phải thật ngắn mới dám đoán là tiêu đề, kẻo biến một
    // câu văn cụt giữa bài thành tiêu đề.
    return toan_bo_dam || chu.length <= 45;
  }

  // Đoạn này có phải chỉ gồm chữ in đậm? Claude và ChatGPT hay xuống dòng
  // một cụm in đậm để làm tiêu đề mục, thay vì dùng thẻ tiêu đề thật.
  function toanBoDam(el) {
    var chu = el.textContent.replace(/\s+/g, " ").trim();
    if (!chu) return false;
    var dam = "";
    Array.prototype.forEach.call(el.querySelectorAll("strong"), function (s) {
      dam += s.textContent;
    });
    return dam.replace(/\s+/g, " ").trim() === chu;
  }

  // Gom những đoạn liên tiếp cùng mở đầu bằng gạch/số thành một danh sách.
  function gomDanhSach(hop) {
    var con = Array.prototype.slice.call(hop.children);
    var i = 0;
    while (i < con.length) {
      var el = con[i];
      var la_gach = el.tagName === "P" && DAU_GACH.test(el.textContent);
      var la_so = el.tagName === "P" && DAU_SO.test(el.textContent);
      if (!la_gach && !la_so) {
        i++;
        continue;
      }
      // Vét tiếp các đoạn cùng loại nằm ngay sau nó.
      var cung_loai = [];
      var j = i;
      while (j < con.length) {
        var e = con[j];
        if (e.tagName !== "P") break;
        if (la_gach ? !DAU_GACH.test(e.textContent) : !DAU_SO.test(e.textContent)) break;
        cung_loai.push(e);
        j++;
      }
      // Một dòng lẻ mở đầu bằng dấu gạch chưa chắc là danh sách — có khi chỉ
      // là câu văn dùng dấu gạch ngang. Cần ít nhất hai dòng mới gom.
      if (cung_loai.length < 2) {
        i = j;
        continue;
      }
      var ds = document.createElement(la_so ? "ol" : "ul");
      cung_loai.forEach(function (e) {
        var li = document.createElement("li");
        while (e.firstChild) li.appendChild(e.firstChild);
        // Bỏ dấu đầu dòng đi, vì <ul>/<ol> tự vẽ lại dấu đó.
        li.innerHTML = li.innerHTML.replace(la_so ? DAU_SO : DAU_GACH, "");
        ds.appendChild(li);
      });
      hop.insertBefore(ds, cung_loai[0]);
      cung_loai.forEach(function (e) {
        e.remove();
      });
      i = j;
    }
  }

  function chuanHoa(hop) {
    // Khoảng trắng cứng của Word làm chữ giãn lạ khi xuống dòng.
    Array.prototype.forEach.call(hop.querySelectorAll("*"), function (el) {
      Array.prototype.forEach.call(el.childNodes, function (n) {
        if (n.nodeType === 3 && n.nodeValue.indexOf(" ") >= 0)
          n.nodeValue = n.nodeValue.replace(/ /g, " ");
      });
    });

    // Word gói chữ trong <li> vào thêm một lớp <p> — gỡ ra cho gọn.
    Array.prototype.forEach.call(hop.querySelectorAll("li > p"), function (p) {
      if (p.parentNode.children.length === 1) boVo(p);
    });

    gomDanhSach(hop);

    // Đoạn có dáng tiêu đề thì nâng thành <h2>. Làm SAU khi gom danh sách,
    // để dòng "- Điều một" không bị hiểu nhầm là tiêu đề ngắn.
    Array.prototype.slice.call(hop.children).forEach(function (el) {
      if (el.tagName !== "P") return;
      if (el.querySelector("img, a")) return;
      if (!dangTieuDe(el.textContent, toanBoDam(el))) return;
      var h = thayTen(el, "H2");
      // Tiêu đề đã to sẵn, in đậm bên trong chỉ làm nó nặng thêm.
      Array.prototype.slice.call(h.querySelectorAll("strong, em")).forEach(boVo);
    });

    return hop;
  }

  // ——— Đọc Markdown ———
  // Bài soạn ở Claude hay ChatGPT rồi dán sang có hai đường: copy thẳng từ
  // khung chat thì clipboard mang theo HTML đã dàn sẵn (đường trên), còn
  // copy từ khối mã hoặc đi vòng qua Notepad thì chỉ còn Markdown thô —
  // "## Tiêu đề", "**đậm**", "- gạch đầu dòng". Đường dưới lo phần đó, nếu
  // không thì mấy dấu ## sẽ nằm chình ình trong bài đã đăng.

  // Chỉ nhận diện đúng mấy dấu Markdown mà người viết thật sự hay dùng.
  // Nhận thêm bảng biểu hay chú thích chỉ tổ đoán sai.
  var CO_MARKDOWN = /^\s{0,3}#{1,4}\s+\S|\*\*\S|^\s{0,3}[-*+]\s+\S|^\s{0,3}\d{1,2}[.)]\s+\S|\[[^\]]+\]\([^)]+\)/m;

  // Định dạng nằm trong một dòng: đậm, nghiêng, liên kết.
  // Chạy sau khi đã thoát HTML, nên chữ của người dùng không thể thành thẻ.
  function markdownTrongDong(chu) {
    // Thoát HTML TRƯỚC, rồi mới đặt thẻ của mình vào. Ngược lại thì một dấu
    // ngoặc nhọn người viết gõ ra sẽ thành thẻ thật trong bài.
    return window.BaiViet.thoat(chu)
      .replace(/\*\*\*(\S(?:[^*]*\S)?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(\S(?:[^*]*\S)?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[\s(])\*(\S(?:[^*]*\S)?)\*(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, chu_hien, dich) {
        return '<a href="' + dich.replace(/"/g, "&quot;") + '">' + chu_hien + "</a>";
      });
  }

  function markdownSangHTML(chu) {
    var dong = chu.replace(/\r/g, "").split("\n");
    var ra = [];
    var dang_ds = null; // "ul" | "ol" | null
    var doan = []; // các dòng đang gom lại thành một đoạn văn

    function xongDoan() {
      if (!doan.length) return;
      // Xuống dòng đơn lẻ giữa đoạn chỉ là chữ dài bị ngắt — nối lại.
      ra.push("<p>" + markdownTrongDong(doan.join(" ")) + "</p>");
      doan = [];
    }
    function xongDanhSach() {
      if (!dang_ds) return;
      ra.push("</" + dang_ds + ">");
      dang_ds = null;
    }
    function moDanhSach(loai) {
      if (dang_ds === loai) return;
      xongDanhSach();
      ra.push("<" + loai + ">");
      dang_ds = loai;
    }

    dong.forEach(function (d) {
      var t = d.trim();

      if (!t) {
        xongDoan();
        xongDanhSach();
        return;
      }

      // Đường kẻ ngang "---" chỉ để phân đoạn khi soạn, bài viết không dùng.
      if (/^\s{0,3}([-*_])\s*(\1\s*){2,}$/.test(t)) {
        xongDoan();
        xongDanhSach();
        return;
      }

      var tieu_de = t.match(/^\s{0,3}(#{1,4})\s+(.+?)\s*#*$/);
      if (tieu_de) {
        xongDoan();
        xongDanhSach();
        // Bài viết chỉ dùng h2/h3/h4 — h1 đã là tiêu đề trang, có thêm cái
        // nữa trong thân bài là sai cấu trúc và Google chấm điểm thấp. Nên
        // "#" và "##" đều về h2: Claude với ChatGPT hay lấy "##" làm mức
        // ngoài cùng, dịch thẳng thành h3 là bài thiếu hẳn một bậc tiêu đề.
        var bac = Math.min(4, Math.max(2, tieu_de[1].length));
        ra.push("<h" + bac + ">" + markdownTrongDong(tieu_de[2]) + "</h" + bac + ">");
        return;
      }

      var gach = t.match(/^\s{0,3}[-*+]\s+(.+)$/);
      if (gach) {
        xongDoan();
        moDanhSach("ul");
        ra.push("<li>" + markdownTrongDong(gach[1]) + "</li>");
        return;
      }

      var so = t.match(/^\s{0,3}\d{1,2}[.)]\s+(.+)$/);
      if (so) {
        xongDoan();
        moDanhSach("ol");
        ra.push("<li>" + markdownTrongDong(so[1]) + "</li>");
        return;
      }

      var trich = t.match(/^\s{0,3}>\s?(.*)$/);
      if (trich) {
        xongDoan();
        xongDanhSach();
        ra.push("<blockquote><p>" + markdownTrongDong(trich[1]) + "</p></blockquote>");
        return;
      }

      xongDanhSach();
      doan.push(t);
    });

    xongDoan();
    xongDanhSach();
    return ra.join("");
  }

  /**
   * Ảnh trong bài: bỏ chú thích còn để nguyên chữ mờ, và lấy chú thích làm
   * mô tả ảnh khi ảnh chưa có mô tả.
   *
   * Chú thích là chữ người đọc nhìn thấy dưới ảnh; mô tả ảnh (alt) là chữ
   * dành cho người khiếm thị và cho Google. Hai chỗ này gần như luôn nói
   * cùng một điều, nên bắt người viết gõ hai lần là thừa — gõ chú thích một
   * lần, máy lấy làm mô tả.
   */
  function donDepAnh(hop) {
    Array.prototype.forEach.call(hop.querySelectorAll("figure"), function (fig) {
      var cap = fig.querySelector("figcaption");
      if (cap && cap.textContent.trim() === CHU_THICH_MAU) {
        cap.remove();
        cap = null;
      }
      var anh = fig.querySelector("img");
      if (!anh) return;
      var chu = cap ? cap.textContent.trim() : "";
      if (chu && !(anh.getAttribute("alt") || "").trim()) anh.setAttribute("alt", chu);
    });
  }

  function donDep(html) {
    var hop = document.createElement("div");
    hop.innerHTML = html;
    donDepAnh(hop);
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

  // Dọn sạch RỒI nắn dáng. Đây là việc của nút "Chuẩn hóa", người viết bấm
  // thì mới chạy — không tự chạy lúc dán và càng không chạy lúc lưu.
  // chuanHoa() ĐOÁN dáng, mà đoán thì có lúc sai: chạy ngầm thì bài tự đổi
  // mà không rõ vì sao, còn chạy lúc lưu thì một đoạn vừa được sửa tay từ
  // tiêu đề về đoạn thường sẽ bị nâng lại sau mỗi lần lưu, sửa mấy cũng
  // không đứng yên. Thành nút bấm thì đoán sai chỉ cần Ctrl+Z là xong.
  function nanDang(html) {
    var hop = document.createElement("div");
    hop.innerHTML = donDep(html);
    return chuanHoa(hop).innerHTML;
  }

  /**
   * Tấm ảnh trong clipboard, nếu có. Trả về null nếu người dùng đang dán chữ.
   *
   * Chữ copy từ Word cũng kèm ảnh xem trước trong clipboard, nên chỉ nhận
   * khi KHÔNG có chữ đi kèm — bằng không dán một đoạn văn lại ra một tấm
   * ảnh chụp đoạn văn đó.
   */
  function anhTrongClipboard(bang) {
    if (!bang) return null;
    var chu = (bang.getData("text/plain") || "").trim();
    if (chu) return null;
    var tep = bang.files && bang.files.length ? bang.files[0] : null;
    if (!tep && bang.items) {
      for (var i = 0; i < bang.items.length; i++) {
        if (bang.items[i].kind === "file") {
          tep = bang.items[i].getAsFile();
          break;
        }
      }
    }
    return tep && /^image\//.test(tep.type) ? tep : null;
  }

  // ——— Thanh công cụ ———
  // Mỗi nút: nhãn hiện trên màn hình, chú thích khi rê chuột, và việc phải làm.
  function dungThanhCongCu(bo) {
    return [
      { ma: "hoan_tac", chu: "↶", chu_thich: "Hoàn tác (Ctrl+Z)", lam: function () { bo.lenh("undo"); } },
      { ma: "lam_lai", chu: "↷", chu_thich: "Làm lại (Ctrl+Y)", lam: function () { bo.lenh("redo"); } },
      { nhom: true },
      { ma: "dam", chu: "B", chu_thich: "Chữ đậm (Ctrl+B)", dam: true, lam: function () { bo.lenh("bold"); } },
      { ma: "nghieng", chu: "I", chu_thich: "Chữ nghiêng (Ctrl+I)", nghieng: true, lam: function () { bo.lenh("italic"); } },
      { nhom: true },
      { ma: "doan", chu: "Đoạn", chu_thich: "Đoạn văn thường", lam: function () { bo.khoi("p"); } },
      { ma: "h2", chu: "Tiêu đề lớn", chu_thich: "Tiêu đề mục lớn trong bài", lam: function () { bo.khoi("h2"); } },
      { ma: "h3", chu: "Tiêu đề nhỏ", chu_thich: "Tiêu đề phụ nằm trong một mục", lam: function () { bo.khoi("h3"); } },
      { nhom: true },
      { ma: "gach", chu: "• Danh sách", chu_thich: "Danh sách gạch đầu dòng", lam: function () { bo.danhSach(false); } },
      { ma: "so", chu: "1. Đánh số", chu_thich: "Danh sách đánh số", lam: function () { bo.lenh("insertOrderedList"); } },
      { ma: "tick", chu: "✓ Dấu tick", chu_thich: "Danh sách có dấu tick — kiểu riêng của site", lam: function () { bo.danhSach(true); } },
      { ma: "trich", chu: "❝ Trích dẫn", chu_thich: "Khối trích dẫn — lời bệnh nhân, câu trích từ nghiên cứu", lam: function () { bo.khoi("blockquote"); } },
      { nhom: true },
      { ma: "lien_ket", chu: "Liên kết", chu_thich: "Gắn liên kết vào chữ đang bôi đen, hoặc sửa liên kết đang đứng (Ctrl+K)", lam: function () { bo.lienKet(); } },
      { chu: "Ảnh", chu_thich: "Chèn ảnh minh họa kèm chú thích", lam: function () { bo.chenAnh(); } },
      { chu: "Chú thích¹", chu_thich: "Chèn số chú thích, tự đánh số tiếp", lam: function () { bo.chuThich(); } },
      { day_phai: true },
      { chu: "✨ Chuẩn hóa", chu_thich: "Đoán và sửa lại dáng cả bài: đoạn ngắn đứng riêng thành tiêu đề, các dòng gạch đầu dòng gom thành danh sách. Đoán sai thì Ctrl+Z.", lam: function () { bo.chuanHoaCaBai(); } },
      { chu: "Xóa định dạng", chu_thich: "Trả chữ đang bôi đen về chữ thường", lam: function () { bo.lenh("removeFormat"); } },
      { ma: "ma_html", chu: "</> HTML", chu_thich: "Xem và sửa thẳng mã HTML của bài", lam: function () { bo.doiCheDo(); } },
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

    // Chỗ con trỏ đang đứng, cất lại trước khi mở hộp thoại.
    //
    // Chèn ảnh phải chờ tải file lên xong mới chèn được, mà trong lúc chờ thì
    // con trỏ đã rời khỏi vùng soạn (bấm nút chọn file, gõ mô tả ảnh...).
    // Không cất lại thì ảnh rơi về đầu bài chứ không nằm chỗ đang viết.
    var vung_chon_cu = null;

    function catVungChon() {
      var chon = window.getSelection();
      if (!chon || !chon.rangeCount) return;
      var vung_chon = chon.getRangeAt(0);
      if (vung.contains(vung_chon.commonAncestorContainer)) {
        vung_chon_cu = vung_chon.cloneRange();
      }
    }

    function traVungChon() {
      vung.focus();
      if (!vung_chon_cu) return;
      var chon = window.getSelection();
      if (!chon) return;
      chon.removeAllRanges();
      chon.addRange(vung_chon_cu);
    }

    /**
     * Khối cấp trên cùng (đoạn văn, tiêu đề, danh sách…) đang chứa con trỏ.
     * Trả về null nếu con trỏ không ở trong vùng soạn.
     */
    function khoiDangDung() {
      var chon = window.getSelection();
      if (!chon || !chon.rangeCount) return null;
      var nut = chon.getRangeAt(0).commonAncestorContainer;
      if (!vung.contains(nut)) return null;
      var khoi = nut.nodeType === 1 ? nut : nut.parentNode;
      while (khoi && khoi.parentNode !== vung) khoi = khoi.parentNode;
      return khoi || null;
    }

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

      /**
       * Gắn liên kết mới, hoặc sửa / bỏ liên kết đang đứng.
       *
       * Trước đây chỉ gắn được liên kết mới: bấm vào một liên kết có sẵn rồi
       * bấm nút này thì hoặc bị mắng "bôi đen chữ trước đã", hoặc chèn chồng
       * một liên kết nữa lên trên. Sửa một địa chỉ gõ nhầm phải mở chế độ
       * HTML ra vá tay.
       */
      lienKet: function () {
        vung.focus();
        var lk = timCha("A");
        var chon = window.getSelection();

        if (!lk && (!chon || chon.isCollapsed)) {
          alert("Bôi đen đoạn chữ muốn gắn liên kết trước đã.");
          return;
        }

        var dich = window.prompt(
          lk
            ? "Sửa địa chỉ liên kết. Xoá trắng rồi bấm OK là bỏ liên kết, chữ vẫn còn."
            : "Dán địa chỉ liên kết vào đây:",
          lk ? lk.getAttribute("href") || "" : "https://"
        );
        if (dich === null) return; // bấm Cancel
        dich = dich.trim();

        if (lk) {
          // Bôi đen trọn liên kết cũ rồi mới sửa, để lệnh của trình duyệt
          // biết phải tác động lên đúng nó chứ không phải chỗ con trỏ.
          var vet = document.createRange();
          vet.selectNodeContents(lk);
          chon.removeAllRanges();
          chon.addRange(vet);
          if (!dich) {
            document.execCommand("unlink");
            return;
          }
        } else if (!dich) {
          return;
        }
        document.execCommand("createLink", false, dich);
      },

      /**
       * Chèn khối ảnh vào bài.
       *
       * Dựng bằng DOM chứ không qua execCommand("insertHTML"): <figure>
       * không được phép nằm trong <p>, nên trình duyệt "chữa" bằng cách hất
       * tấm ảnh ra khỏi figure và nhét vào đoạn văn — figure còn trơ mỗi cái
       * chú thích rỗng. Đã dựng lại đúng cảnh đó trong trình duyệt hai lần
       * mới tin: nó xảy ra cả khi con trỏ ở giữa đoạn lẫn ở cuối đoạn.
       *
       * Đổi lại, bước này không vào được lịch sử hoàn tác của trình duyệt
       * nên Ctrl+Z không gỡ được ảnh — xóa bằng tay, hoặc dùng nút Hoàn tác
       * khi nào làm tới.
       */
      chenAnh: function () {
        if (!tuy_chon.khiChonAnh) return;
        catVungChon();
        tuy_chon.khiChonAnh(function (anh) {
          if (!anh) return;
          traVungChon();
          chenKhoiAnh(anh);
        });
      },

      // Số chú thích trỏ xuống mục Tài liệu tham khảo ở cuối bài. Tự đếm để
      // đánh số tiếp, khỏi phải nhớ đang tới số mấy.
      chuThich: function () {
        vung.focus();
        var so = vung.querySelectorAll("sup").length + 1;
        document.execCommand("insertHTML", false, "<sup>" + so + "</sup>");
      },

      // Nút "Chuẩn hóa": nắn dáng cả bài một lượt.
      // Ghi đè bằng insertHTML sau khi bôi đen tất cả, chứ không gán thẳng
      // vào innerHTML — làm vậy trình duyệt mới ghi được một bước vào lịch
      // sử hoàn tác, để đoán sai thì Ctrl+Z là quay lại nguyên trạng.
      chuanHoaCaBai: function () {
        var moi = nanDang(vung.innerHTML);
        if (!moi || moi === vung.innerHTML) {
          alert("Bài đang gọn rồi, không có gì để nắn.");
          return;
        }
        // Nói trước sẽ đụng vào bao nhiêu khối. Nút này sửa CẢ BÀI một phát,
        // mà lối lùi duy nhất là Ctrl+Z — bấm nhầm rồi mới biết thì muộn.
        var truoc = document.createElement("div");
        truoc.innerHTML = vung.innerHTML;
        var sau = document.createElement("div");
        sau.innerHTML = moi;
        if (
          !confirm(
            "Nắn lại dáng cả bài: đoạn ngắn đứng riêng thành tiêu đề, các " +
              "dòng gạch đầu dòng gom thành danh sách.\n\n" +
              "Bài đang có " + truoc.children.length + " khối, sau khi nắn còn " +
              sau.children.length + ".\n\nLàm tiếp không? (đoán sai thì Ctrl+Z)"
          )
        )
          return;
        vung.focus();
        document.execCommand("selectAll", false, null);
        document.execCommand("insertHTML", false, moi);
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

    /**
     * Dựng khối ảnh và đặt vào chỗ con trỏ đang đứng.
     *
     * Dựng bằng DOM chứ không qua execCommand("insertHTML"): <figure> không
     * được phép nằm trong <p>, nên trình duyệt "chữa" bằng cách hất tấm ảnh
     * ra khỏi figure và nhét vào đoạn văn — figure còn trơ mỗi cái chú thích
     * rỗng. Đã dựng lại đúng cảnh đó trong trình duyệt hai lần mới tin: nó
     * xảy ra cả khi con trỏ ở giữa đoạn lẫn ở cuối đoạn.
     *
     * Đổi lại, bước này không vào được lịch sử hoàn tác của trình duyệt nên
     * Ctrl+Z và nút Hoàn tác không gỡ được ảnh — phải xóa bằng tay.
     */
    function chenKhoiAnh(anh) {
      // Ảnh mới chưa lên site: hiện tạm bằng dữ liệu trong máy (anh.xem_thu),
      // còn đường dẫn thật gửi kèm để lúc lưu đổi lại.
      var hinh = document.createElement("img");
      hinh.setAttribute("src", anh.xem_thu || anh.anh);
      if (anh.xem_thu) hinh.setAttribute("data-duong-dan", anh.anh);
      hinh.setAttribute("alt", String(anh.alt || ""));
      hinh.setAttribute("loading", "lazy");

      var cap = document.createElement("figcaption");
      cap.textContent = CHU_THICH_MAU;

      var khung_anh = document.createElement("figure");
      khung_anh.className = "article-inline-img";
      // Ảnh cao hơn rộng thì đánh dấu là ảnh dọc ngay từ đầu: khung ngang
      // 16/10 sẽ cắt mất đầu và chân người, chỉ còn một dải ngang giữa ảnh.
      // Máy biết kích thước sẵn rồi, không việc gì bắt người viết tự nhận ra.
      if (anh.cao && anh.rong && anh.cao > anh.rong) {
        khung_anh.classList.add("article-inline-img-doc");
      }
      khung_anh.appendChild(hinh);
      khung_anh.appendChild(cap);

      // Đoạn trống nối sau, để còn chỗ viết tiếp dưới ảnh.
      var doan = document.createElement("p");
      doan.appendChild(document.createElement("br"));

      var khoi = khoiDangDung();
      if (khoi) {
        khoi.parentNode.insertBefore(khung_anh, khoi.nextSibling);
      } else {
        vung.appendChild(khung_anh);
      }
      khung_anh.parentNode.insertBefore(doan, khung_anh.nextSibling);

      // Con trỏ nhảy thẳng vào ô chú thích: vừa chèn xong là gõ được luôn,
      // khỏi phải nhớ quay lại điền.
      var chon = window.getSelection();
      if (chon) {
        var khe = document.createRange();
        khe.selectNodeContents(cap);
        chon.removeAllRanges();
        chon.addRange(khe);
      }
      vung.focus();

      // Sửa DOM thẳng tay thì trình duyệt không bắn "input", mà bộ đếm chữ
      // và nút Lưu đều dựa vào sự kiện đó.
      vung.dispatchEvent(new Event("input", { bubbles: true }));
    }

    /** Nút theo mã, để còn bật/tắt trạng thái sáng. */
    var nut_theo_ma = {};

    function ve() {
      thanh.innerHTML = "";
      nut_theo_ma = {};
      dungThanhCongCu(bo).forEach(function (n) {
        if (n.nhom) {
          var vach = document.createElement("span");
          vach.className = "st-vach";
          thanh.appendChild(vach);
          return;
        }
        // Khoảng đẩy: mấy nút sau nó dạt hẳn sang phải. Chuẩn hóa, Xóa định
        // dạng và HTML là công cụ phụ, đứng lẫn giữa nút định dạng thì vừa
        // chiếm chỗ vừa dễ bấm nhầm.
        if (n.day_phai) {
          var day = document.createElement("span");
          day.className = "st-day-phai";
          thanh.appendChild(day);
          return;
        }
        var nut = document.createElement("button");
        nut.type = "button";
        nut.className = "st-nut";
        nut.textContent = n.chu;
        nut.title = n.chu_thich;
        // Nút bật/tắt (đậm, nghiêng, kiểu khối, danh sách) thì báo cho trình
        // đọc màn hình biết đang bật hay tắt, chứ không chỉ đổi màu.
        if (n.ma) nut.setAttribute("aria-pressed", "false");
        if (n.dam) nut.style.fontWeight = "700";
        if (n.nghieng) nut.style.fontStyle = "italic";
        // Ở chế độ xem mã thì mọi nút định dạng đều vô nghĩa, chỉ chừa nút đổi
        // chế độ — tắt hẳn để không bấm nhầm rồi tưởng hỏng.
        if (dang_xem_ma && n.chu.indexOf("HTML") < 0) nut.disabled = true;
        if (dang_xem_ma && n.chu.indexOf("HTML") >= 0) nut.classList.add("st-nut-bat");
        nut.addEventListener("mousedown", function (e) {
          e.preventDefault(); // giữ nguyên chỗ đang bôi đen khi bấm nút
        });
        nut.addEventListener("click", function () {
          n.lam();
          capNhatTrangThai();
        });
        if (n.ma) nut_theo_ma[n.ma] = nut;
        thanh.appendChild(nut);
      });
      capNhatTrangThai();
    }

    function batNut(ma, bat) {
      var nut = nut_theo_ma[ma];
      if (!nut) return;
      nut.classList.toggle("st-nut-bat", !!bat);
      nut.setAttribute("aria-pressed", bat ? "true" : "false");
    }

    /**
     * Sáng những nút ứng với định dạng con trỏ đang đứng.
     *
     * Trước đây thanh nút trơ như nhau ở mọi chỗ: con trỏ đang trong một
     * tiêu đề mục mà nút "Tiêu đề lớn" vẫn tắt, nên cách duy nhất để biết
     * đang gõ vào cái gì là nhìn cỡ chữ mà đoán.
     */
    function capNhatTrangThai() {
      if (dang_xem_ma) return;
      var trong_vung =
        document.activeElement === vung ||
        (window.getSelection() &&
          window.getSelection().anchorNode &&
          vung.contains(window.getSelection().anchorNode));
      if (!trong_vung) return;

      batNut("dam", document.queryCommandState("bold"));
      batNut("nghieng", document.queryCommandState("italic"));

      var khoi = khoiDangDung();
      var ten = khoi ? khoi.tagName : "";
      batNut("h2", ten === "H2");
      batNut("h3", ten === "H3");
      // "Đoạn" sáng khi đang ở đoạn văn thường — kể cả đoạn nằm trong danh
      // sách thì vẫn tính là đang ở danh sách, nên xét sau.
      batNut("doan", ten === "P");

      var ul = timCha("UL");
      var ol = timCha("OL");
      var co_tick = !!(ul && ul.classList.contains("list-check"));
      batNut("gach", !!ul && !co_tick);
      batNut("tick", co_tick);
      batNut("so", !!ol);

      batNut("trich", !!timCha("BLOCKQUOTE"));
      batNut("lien_ket", !!timCha("A"));
    }

    // ——— Cụm nút trên tấm ảnh ———
    // Hiện khi rê chuột vào ảnh, hoặc khi con trỏ đang đứng trong khối ảnh
    // (để người dùng bàn phím cũng tới được, không chỉ người dùng chuột).
    //
    // Cụm nút nằm NGOÀI vùng soạn (gắn vào .st), không nhét vào trong
    // figure: mọi thứ trong vùng soạn đều là nội dung bài, thêm một cái nút
    // vào đó là sớm muộn nó chui vào HTML lúc lưu.
    var cum_nut_anh = document.createElement("div");
    cum_nut_anh.className = "st-nut-anh";
    cum_nut_anh.hidden = true;

    var nut_doc_ngang = document.createElement("button");
    nut_doc_ngang.type = "button";
    nut_doc_ngang.className = "st-nut-tren-anh";

    var nut_xoa_anh = document.createElement("button");
    nut_xoa_anh.type = "button";
    nut_xoa_anh.className = "st-nut-tren-anh st-nut-tren-anh-nguy";
    nut_xoa_anh.textContent = "✕";
    nut_xoa_anh.title = "Xoá ảnh này khỏi bài";

    cum_nut_anh.appendChild(nut_doc_ngang);
    cum_nut_anh.appendChild(nut_xoa_anh);
    khung.appendChild(cum_nut_anh);

    /** Khối ảnh mà cụm nút đang trỏ tới. */
    var anh_dang_tro = null;

    function datCumNutAnh(khung_anh) {
      anh_dang_tro = khung_anh;
      if (!khung_anh) {
        cum_nut_anh.hidden = true;
        return;
      }
      var la_doc = khung_anh.classList.contains("article-inline-img-doc");
      // Nhãn nói việc SẼ làm khi bấm, không nói trạng thái đang có — "Ảnh
      // dọc" mà bấm vào lại thành ngang thì ai cũng hiểu nhầm một lần.
      nut_doc_ngang.textContent = la_doc ? "Cắt khung ngang" : "Giữ ảnh dọc";
      nut_doc_ngang.title = la_doc
        ? "Ảnh đang giữ nguyên tỉ lệ gốc. Bấm để cắt về khung ngang 16/10 như ảnh thường."
        : "Ảnh đang bị cắt về khung ngang 16/10. Bấm để giữ nguyên tỉ lệ gốc — dùng cho ảnh chụp dọc.";

      var o_anh = khung_anh.getBoundingClientRect();
      var o_khung = khung.getBoundingClientRect();
      cum_nut_anh.hidden = false;
      var rong_cum = cum_nut_anh.offsetWidth || 160;
      // Góc phải trên của ảnh, thụt vào 8px.
      cum_nut_anh.style.top = o_anh.top - o_khung.top + 8 + "px";
      cum_nut_anh.style.left = o_anh.right - o_khung.left - rong_cum - 8 + "px";
    }

    vung.addEventListener("mousemove", function (e) {
      var el = e.target;
      var khung_anh = el && el.closest ? el.closest("figure.article-inline-img") : null;
      // Chỉ đổi khi thật sự sang một ảnh khác: đặt lại vị trí liên tục theo
      // từng nhịp chuột làm cụm nút rung.
      if (khung_anh && khung_anh !== anh_dang_tro) datCumNutAnh(khung_anh);
    });

    // Rời hẳn vùng soạn thì cất đi — trừ khi con chuột đang đi sang chính
    // cụm nút, vì nó nằm ngoài vùng soạn nên rê tới cũng tính là "rời".
    vung.addEventListener("mouseleave", function (e) {
      if (cum_nut_anh.contains(e.relatedTarget)) return;
      if (!khoiAnhDangGo()) datCumNutAnh(null);
    });
    cum_nut_anh.addEventListener("mouseleave", function () {
      if (!khoiAnhDangGo()) datCumNutAnh(null);
    });

    /** Khối ảnh đang chứa con trỏ, nếu có — dùng cho đường bàn phím. */
    function khoiAnhDangGo() {
      var khoi = khoiDangDung();
      return khoi && khoi.matches && khoi.matches("figure.article-inline-img") ? khoi : null;
    }

    // Gõ chú thích trong một tấm ảnh thì cụm nút hiện lên ở đúng ảnh đó.
    ["keyup", "mouseup", "focus"].forEach(function (ten) {
      vung.addEventListener(ten, function () {
        var khoi = khoiAnhDangGo();
        if (khoi && khoi !== anh_dang_tro) datCumNutAnh(khoi);
      });
    });

    // Cuộn trong vùng soạn thì ảnh trôi đi, cụm nút phải trôi theo.
    vung.addEventListener("scroll", function () {
      if (anh_dang_tro) datCumNutAnh(anh_dang_tro);
    });

    [nut_doc_ngang, nut_xoa_anh].forEach(function (n) {
      n.addEventListener("mousedown", function (e) {
        e.preventDefault(); // giữ nguyên chỗ con trỏ đang đứng
      });
    });

    nut_doc_ngang.addEventListener("click", function () {
      if (!anh_dang_tro) return;
      anh_dang_tro.classList.toggle("article-inline-img-doc");
      datCumNutAnh(anh_dang_tro);
      vung.dispatchEvent(new Event("input", { bubbles: true }));
    });

    nut_xoa_anh.addEventListener("click", function () {
      if (!anh_dang_tro) return;
      var doan_sau = anh_dang_tro.nextElementSibling;
      anh_dang_tro.remove();
      // Đoạn trống dựng kèm lúc chèn ảnh cũng dọn luôn, nếu người viết chưa
      // gõ gì vào đó — bằng không xoá ảnh xong còn lại một khoảng hở.
      if (doan_sau && doan_sau.tagName === "P" && !doan_sau.textContent.trim()) {
        doan_sau.remove();
      }
      datCumNutAnh(null);
      vung.focus();
      vung.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // Ctrl+K: phím tắt gắn liên kết, giống Word và Google Docs. Ctrl+B và
    // Ctrl+I thì trình duyệt lo sẵn.
    vung.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        bo.lienKet();
        capNhatTrangThai();
      }
    });

    // Con trỏ nhảy chỗ nào thì thanh nút phải theo kịp chỗ đó.
    ["keyup", "mouseup", "input", "focus"].forEach(function (ten) {
      vung.addEventListener(ten, capNhatTrangThai);
    });
    document.addEventListener("selectionchange", capNhatTrangThai);

    // ——— Dán chữ ———
    // Ba đường vào, xét theo thứ tự:
    //
    //   1. Clipboard có HTML (copy từ khung chat Claude/ChatGPT, từ Word,
    //      Google Docs, hay một trang web) — giữ nguyên tiêu đề, in đậm,
    //      danh sách, liên kết; donDep() chỉ vứt phần rác.
    //   2. Chỉ có chữ thường nhưng nhìn ra dấu Markdown ("##", "**", "- ")
    //      — dịch Markdown sang thẻ.
    //   3. Chữ thường trơn — dòng trống là sang đoạn mới, xuống dòng đơn lẻ
    //      chỉ là chữ dài bị ngắt nên nối lại.
    //
    // Cả ba đường đều CHỈ giữ đúng những gì nguồn có, không tự đoán thêm.
    // Phần đoán dáng nằm ở nút "Chuẩn hóa", bấm hay không là quyền người
    // viết. Dù đi đường nào cũng chui qua donDep() ở cuối, nên không có cách
    // nào để một thẻ lạ hay một dòng style của Word lọt được vào bài.
    vung.addEventListener("paste", function (e) {
      e.preventDefault();
      var bang = e.clipboardData || window.clipboardData;

      // ——— Dán ẢNH ———
      // Chụp màn hình rồi Ctrl+V, hay copy ảnh từ một trang khác. Xét TRƯỚC
      // chữ: clipboard chứa ảnh thường kèm theo một mẩu HTML <img> trỏ vào
      // file trên máy hoặc vào trang nguồn — đi đường chữ thì bài dính một
      // tấm ảnh mà chỉ mình anh xem được, người đọc thấy ô vỡ.
      var tep_anh = anhTrongClipboard(bang);
      if (tep_anh && tuy_chon.khiTaiAnh) {
        catVungChon();
        tuy_chon.khiTaiAnh(tep_anh, function (anh) {
          if (!anh) return;
          traVungChon();
          chenKhoiAnh(anh);
        });
        return;
      }

      var html = (bang.getData("text/html") || "").trim();
      var chu = bang.getData("text/plain") || "";
      if (!html && !chu.trim()) return;

      var ket;
      if (html) {
        // Word bọc nội dung trong mấy mốc <!--StartFragment-->; cắt lấy
        // đúng phần bên trong cho khỏi kéo theo cả thẻ <style> của Word.
        var manh = html.match(/<!--\s*StartFragment\s*-->([\s\S]*?)<!--\s*EndFragment\s*-->/i);
        ket = donDep(manh ? manh[1] : html);
      } else if (CO_MARKDOWN.test(chu)) {
        ket = donDep(markdownSangHTML(chu));
      } else {
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
        ket = donDep(
          doan
            .map(function (d) {
              return "<p>" + window.BaiViet.thoat(d) + "</p>";
            })
            .join("")
        );
      }

      if (ket) document.execCommand("insertHTML", false, ket);
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
