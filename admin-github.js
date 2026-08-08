// Lớp nói chuyện với GitHub — dùng riêng cho trang admin.
//
// Site này là file tĩnh trên GitHub Pages, không có máy chủ nào để chạy code.
// Nên "đăng bài" thực chất là ghi file thẳng vào kho GitHub; ghi xong khoảng
// một phút là GitHub Pages dựng lại và bài lên sóng.
//
// Điểm quan trọng nhất trong file này là hàm ghi(): một bài viết đụng tới ba
// file (file bài, danh sách trong blog-cards.js, sitemap.xml). Nếu ghi từng
// file một mà đứt mạng giữa chừng thì site rơi vào trạng thái nửa vời — bài
// có mà không ai thấy, hoặc ngược lại. Vì vậy hàm này gộp cả ba vào MỘT commit
// duy nhất: hoặc lên hết, hoặc không có gì thay đổi.
//
// Token lưu trong localStorage của trình duyệt, không nằm trong code và không
// bao giờ được đẩy lên kho.
window.GitHubKho = (function () {
  // ——— Kho và nhánh, sửa ở đây nếu đổi kho ———
  var CHU_KHO = "kienkihb-max";
  var TEN_KHO = "drkien-website";
  var NHANH = "main";

  var GOC = "https://api.github.com/repos/" + CHU_KHO + "/" + TEN_KHO;
  var KHOA_LUU = "drkien_admin_token";

  // ——— Token ———
  var token = null;
  try {
    token = window.localStorage.getItem(KHOA_LUU);
  } catch (e) {
    // Trình duyệt chặn localStorage (chế độ ẩn danh chẳng hạn) — vẫn chạy
    // được, chỉ là mở lại trang thì phải dán token lần nữa.
  }

  function layToken() {
    return token;
  }
  function datToken(gia_tri) {
    token = gia_tri;
    try {
      window.localStorage.setItem(KHOA_LUU, gia_tri);
    } catch (e) {}
  }
  function xoaToken() {
    token = null;
    try {
      window.localStorage.removeItem(KHOA_LUU);
    } catch (e) {}
  }

  // ——— Gọi API ———
  // Mọi lỗi đều được đổi sang câu tiếng Việt nói rõ phải làm gì, vì người
  // dùng trang này không đọc mã lỗi HTTP.
  function loi(ma, viec) {
    if (ma === 401)
      return new Error("Token sai hoặc đã hết hạn. Bấm Đăng xuất rồi tạo và dán token mới.");
    if (ma === 403)
      return new Error(
        "GitHub từ chối. Thường là token thiếu quyền ghi (Contents: Read and write), " +
          "hoặc bạn vừa thao tác quá nhiều lần trong một phút — chờ chút rồi thử lại."
      );
    if (ma === 404)
      return new Error(
        "Không tìm thấy kho " + CHU_KHO + "/" + TEN_KHO + ". Kiểm tra token có được cấp " +
          "quyền cho đúng kho này không."
      );
    if (ma === 409 || ma === 422)
      return new Error(
        "Kho vừa có thay đổi khác đẩy lên trong lúc bạn đang soạn. Tải lại trang admin " +
          "rồi làm lại để khỏi ghi đè mất."
      );
    return new Error("Lỗi khi " + viec + " (mã " + ma + "). Kiểm tra mạng rồi thử lại.");
  }

  function goi(duong, tuy_chon, viec) {
    tuy_chon = tuy_chon || {};
    var dau = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (token) dau.Authorization = "Bearer " + token;
    if (tuy_chon.than) dau["Content-Type"] = "application/json";

    return fetch(duong.indexOf("http") === 0 ? duong : GOC + duong, {
      method: tuy_chon.cach || "GET",
      headers: dau,
      body: tuy_chon.than ? JSON.stringify(tuy_chon.than) : undefined,
    }).then(function (dap) {
      if (dap.status === 404 && tuy_chon.cho_phep_khong_co) return null;
      if (!dap.ok) throw loi(dap.status, viec || "gọi GitHub");
      if (dap.status === 204) return null;
      return dap.json();
    });
  }

  // ——— Đổi chữ có dấu sang base64 và ngược lại ———
  // btoa() chỉ nuốt được ký tự Latin-1, mà nội dung ở đây toàn tiếng Việt,
  // nên phải đi vòng qua byte UTF-8.
  function sangBase64(chuoi) {
    var byte = new TextEncoder().encode(chuoi);
    var tho = "";
    // Cắt khúc vì đẩy cả mảng lớn vào fromCharCode.apply sẽ tràn ngăn xếp.
    for (var i = 0; i < byte.length; i += 8192) {
      tho += String.fromCharCode.apply(null, byte.subarray(i, i + 8192));
    }
    return btoa(tho);
  }

  function tuBase64(b64) {
    var tho = atob(String(b64).replace(/\s/g, ""));
    var byte = new Uint8Array(tho.length);
    for (var i = 0; i < tho.length; i++) byte[i] = tho.charCodeAt(i);
    return new TextDecoder("utf-8").decode(byte);
  }

  // ——— Kiểm tra token có dùng được không ———
  // Gọi ngay lúc đăng nhập để báo sai từ đầu, thay vì để người dùng soạn xong
  // cả bài mới phát hiện không đăng được.
  function kiemTra() {
    return goi("", null, "kiểm tra kho").then(function (kho) {
      if (!kho.permissions || !kho.permissions.push) {
        throw new Error(
          "Token đọc được kho nhưng không có quyền ghi. Tạo lại token và nhớ đặt " +
            "Contents: Read and write."
        );
      }
      return { ten: kho.full_name, nhanh: kho.default_branch };
    });
  }

  // ——— Đọc một file trong kho ———
  // Trả về null nếu file chưa có, để nơi gọi tự quyết định tạo mới.
  function docFile(duong_dan) {
    return goi(
      "/contents/" + duong_dan.split("/").map(encodeURIComponent).join("/") + "?ref=" + NHANH,
      { cho_phep_khong_co: true },
      "đọc file " + duong_dan
    ).then(function (kq) {
      if (!kq || !kq.content) return null;
      return { noi_dung: tuBase64(kq.content), sha: kq.sha };
    });
  }

  // ——— Liệt kê file trong một thư mục ———
  function docThuMuc(duong_dan) {
    return goi(
      "/contents/" + duong_dan + "?ref=" + NHANH,
      { cho_phep_khong_co: true },
      "đọc thư mục " + duong_dan
    ).then(function (kq) {
      if (!Array.isArray(kq)) return [];
      return kq
        .filter(function (m) {
          return m.type === "file";
        })
        .map(function (m) {
          return { ten: m.name, duong_dan: m.path, co: m.size };
        });
    });
  }

  // ——— Ghi nhiều file trong một commit ———
  //
  // thay_doi.sua  : [{ duong_dan, noi_dung }]  — file chữ (HTML, JS, XML)
  // thay_doi.tai  : [{ duong_dan, base64 }]    — file nhị phân (ảnh)
  // thay_doi.xoa  : [ duong_dan ]
  //
  // Cách làm theo đúng cách Git nghĩ: tạo blob cho từng file → ghép thành một
  // cây mới dựa trên cây cũ → tạo commit trỏ vào cây đó → dời nhánh sang
  // commit mới. Bước cuối chỉ thành công nếu nhánh chưa bị ai đẩy thêm, nên
  // không bao giờ ghi đè mất thay đổi của lần khác.
  function ghi(thay_doi) {
    var sua = thay_doi.sua || [];
    var tai = thay_doi.tai || [];
    var xoa = thay_doi.xoa || [];
    var sha_dau, sha_cay_cu;

    return goi("/git/ref/heads/" + NHANH, null, "đọc nhánh " + NHANH)
      .then(function (ref) {
        sha_dau = ref.object.sha;
        return goi("/git/commits/" + sha_dau, null, "đọc commit hiện tại");
      })
      .then(function (commit) {
        sha_cay_cu = commit.tree.sha;

        // Đẩy nội dung lên trước dưới dạng blob rồi mới nhắc tên trong cây.
        var viec = sua
          .map(function (f) {
            return goi(
              "/git/blobs",
              { cach: "POST", than: { content: sangBase64(f.noi_dung), encoding: "base64" } },
              "tải nội dung " + f.duong_dan
            ).then(function (b) {
              return { path: f.duong_dan, mode: "100644", type: "blob", sha: b.sha };
            });
          })
          .concat(
            tai.map(function (f) {
              return goi(
                "/git/blobs",
                { cach: "POST", than: { content: f.base64, encoding: "base64" } },
                "tải file " + f.duong_dan
              ).then(function (b) {
                return { path: f.duong_dan, mode: "100644", type: "blob", sha: b.sha };
              });
            })
          );

        return Promise.all(viec);
      })
      .then(function (muc) {
        // sha: null nghĩa là gỡ đường dẫn đó khỏi cây, tức xóa file.
        var day_du = muc.concat(
          xoa.map(function (d) {
            return { path: d, mode: "100644", type: "blob", sha: null };
          })
        );
        return goi(
          "/git/trees",
          { cach: "POST", than: { base_tree: sha_cay_cu, tree: day_du } },
          "dựng cây file mới"
        );
      })
      .then(function (cay) {
        return goi(
          "/git/commits",
          { cach: "POST", than: { message: thay_doi.thong_diep, tree: cay.sha, parents: [sha_dau] } },
          "tạo commit"
        );
      })
      .then(function (commit) {
        return goi(
          "/git/refs/heads/" + NHANH,
          { cach: "PATCH", than: { sha: commit.sha } },
          "đẩy commit lên"
        ).then(function () {
          return commit.sha.slice(0, 7);
        });
      });
  }

  return {
    CHU_KHO: CHU_KHO,
    TEN_KHO: TEN_KHO,
    layToken: layToken,
    datToken: datToken,
    xoaToken: xoaToken,
    kiemTra: kiemTra,
    docFile: docFile,
    docThuMuc: docThuMuc,
    ghi: ghi,
  };
})();
