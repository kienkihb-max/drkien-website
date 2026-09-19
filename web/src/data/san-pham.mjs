// Danh sách sản phẩm — NGUỒN DUY NHẤT cho trang /san-pham và các trang chi
// tiết /san-pham/<slug>.
//
// Sửa chữ nghĩa, thêm hay bớt một món thì sửa đúng file này, không đụng vào
// san-pham.astro hay [slug].astro. Hai trang đó tự dựng lại theo danh sách
// bên dưới.
//
// LUẬT VỀ CHỮ NGHĨA — chủ site đã chốt:
//
// 1. THẺ Ở TRANG DANH SÁCH chỉ ghi TÊN. Không mô tả, không công dụng.
//
// 2. TRANG CHI TIẾT có công dụng, thành phần, đối tượng dùng — nhưng chỉ
//    được chép lại chữ CHỦ SITE ĐÃ TỰ VIẾT (nhãn dán trên sản phẩm, tờ
//    hướng dẫn). TUYỆT ĐỐI KHÔNG tự nghĩ ra công dụng hay thành phần.
//    Đây là trang nghề nghiệp của một bác sĩ; một dòng công dụng bịa ra là
//    một dòng sai chịu trách nhiệm pháp lý. Món nào chưa có chữ thì để
//    mảng rỗng — trang tự bỏ hẳn mục đó, không hiện tiêu đề trống.
//
// 3. Đây là chế phẩm hỗ trợ, không phải thuốc đã đăng ký. Viết theo hướng
//    "hỗ trợ", "dùng để", tránh "chữa khỏi", "đặc trị".
//
// CÁCH THÊM MỘT MÓN MỚI
//   1. Chép một khối có sẵn xuống dưới, sửa "slug" cho khác các món kia —
//      slug thành địa chỉ trang: /san-pham/<slug>.
//   2. "icon" lấy tên trên lucide.dev, viết kiểu PascalCase ("Leaf"). Icon
//      chưa có trong danh sách thì phải khai thêm một dòng trong phần ICON
//      ở đầu san-pham.astro VÀ [slug].astro, nếu không thẻ sẽ thiếu hình.
//   3. "anh" là tên file trong assets/img ở GỐC repo (web/public chỉ là bản
//      sao do máy chép, đã bị .gitignore bỏ qua — để ảnh ở đó là lên mạng
//      mất ảnh mà ở máy vẫn thấy bình thường). Ảnh cắt khổ DỌC 3:4, rộng
//      900px, JPEG chất lượng 85 — cùng khổ thì lưới thẻ mới đều.
//   4. "anh_alt" bắt buộc có: Google và trình đọc màn hình dựa vào đó.
//   5. Muốn gắn nhãn "Bán chạy" thì thêm dòng ban_chay: true.
//
// Tên file ảnh đặt theo THỨ CÓ TRONG ẢNH chứ không theo tên món, để sau này
// đổi món nào dùng ảnh nào thì nhìn tên vẫn biết ảnh chụp gì.
//
// GIÁ: chủ site đã chốt KHÔNG hiện giá trên trang, ai hỏi thì nhắn Zalo.
// Đừng thêm trường giá vào đây — giá đổi mà trang quên sửa còn tệ hơn là
// không ghi.

/**
 * @typedef {object} AnhAlbum
 * @property {string} anh      Tên file trong assets/img
 * @property {string} alt      Mô tả ảnh
 */

/**
 * @typedef {object} SanPham
 * @property {string} slug      Đuôi địa chỉ trang chi tiết: /san-pham/<slug>
 * @property {string} ten       Tên món — thứ duy nhất hiện trên thẻ danh sách
 * @property {string} icon      Tên icon Lucide, PascalCase
 * @property {string} anh       Ảnh đại diện, hiện trên thẻ danh sách
 * @property {string} anh_alt   Mô tả ảnh cho Google và trình đọc màn hình
 * @property {string} mo_ta_seo Câu mô tả gửi Google cho trang chi tiết. Đây
 *                              KHÔNG phải mô tả sản phẩm hiện trên trang —
 *                              nó chỉ nằm trong thẻ meta. Viết trung tính,
 *                              đừng nhét công dụng vào.
 * @property {AnhAlbum[]} [album] Ảnh phụ của album, KHÔNG kể ảnh đại diện —
 *                                trang tự đặt ảnh đại diện lên đầu.
 * @property {string[]} [cong_dung]  Chép từ nhãn sản phẩm
 * @property {string[]} [thanh_phan] Chép từ nhãn sản phẩm
 * @property {string[]} [doi_tuong]  Ai nên dùng
 * @property {string[]} [cach_dung]  Chép từ nhãn sản phẩm
 * @property {string[]} [luu_y]      Ai không nên dùng, bảo quản ra sao
 * @property {boolean} [ban_chay] Gắn nhãn "Bán chạy" lên góc ảnh. Chữ trên
 *                                nhãn sửa ở CHU_BAN_CHAY bên dưới.
 *
 * Không có trường nào đánh dấu "nổi bật": mọi thẻ cùng một cỡ, món nào cần
 * đứng trước thì xếp lên trên trong mảng SAN_PHAM — trang hiện đúng thứ tự
 * ở đây.
 */

/**
 * Chữ trên nhãn góc ảnh. Để một chỗ vì nó lặp trên nhiều thẻ — sửa ở đây là
 * đổi hết, khỏi phải dò từng món.
 */
export const CHU_BAN_CHAY = "Bán chạy";

/** Nhãn nhỏ, tiêu đề và đoạn dẫn của khối sản phẩm tự bào chế. */
export const TU_BAO_CHE = {
  ma: "tu-bao-che",
  nhan: "Tự bào chế",
  tieu_de: "Chế phẩm mình tự bào chế",
};

/** @type {SanPham[]} */
export const SAN_PHAM = [
  {
    slug: "bot-tam-that",
    ten: "Bột tam thất",
    ban_chay: true,
    icon: "Leaf",
    anh: "product-bot-tam-that-nb.jpg",
    anh_alt: "Các túi bột tam thất đang cân trên cân điện tử",
    mo_ta_seo:
      "Bột tam thất do bác sĩ Lê Trung Kiên tự chọn củ và bào chế tại phòng khám. Xem ảnh sản phẩm, cách dùng và cách bảo quản, nhắn Zalo để được tư vấn.",
    album: [
      { anh: "product-tam-that-cu-kho.jpg", alt: "Củ tam thất khô nguyên liệu" },
      {
        anh: "product-tam-that-cu-cat-doi.jpg",
        alt: "Củ tam thất cắt đôi, thấy rõ ruột vàng bên trong",
      },
      {
        anh: "product-tam-that-cu-tren-tay.jpg",
        alt: "Nắm củ tam thất khô trên tay trước kệ dược liệu",
      },
      { anh: "product-tam-that-tui-bot.jpg", alt: "Túi bột tam thất đã đóng gói, có nhãn" },
      {
        anh: "product-tam-that-tui-cu-am-tra.jpg",
        alt: "Túi củ tam thất khô đặt cạnh bộ ấm trà",
      },
    ],
    // Chép nguyên văn từ nhãn dán trên túi sản phẩm. Đổi nhãn thì sửa ở đây
    // cho khớp, đừng để trang nói một đằng nhãn nói một nẻo.
    cong_dung: [
      "Hỗ trợ giảm u, tiêu viêm hiệu quả",
      "Bồi bổ sức khỏe, tăng sức đề kháng",
      "Hỗ trợ điều hòa kinh nguyệt, giảm đau bụng kinh",
    ],
    thanh_phan: ["Củ tam thất khô nghiền mịn, không pha trộn thêm bột khác"],
    cach_dung: [
      "Pha 1–2 thìa cà phê bột tam thất với nước ấm, có thể cho thêm mật ong. Uống 1–2 lần/ngày.",
      "Có thể nấu với thức ăn hoặc dùng làm mặt nạ dưỡng da.",
    ],
    luu_y: ["Để nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp."],
    doi_tuong: [],
  },
  {
    slug: "thuoc-thang-thuoc-sac",
    ten: "Thuốc thang, thuốc sắc",
    ban_chay: true,
    icon: "FlaskConical",
    anh: "product-thuoc-sac-nb.jpg",
    anh_alt: "Túi thuốc đã sắc sẵn, nước thuốc màu nâu",
    mo_ta_seo:
      "Thuốc thang bốc theo đơn và thuốc sắc sẵn đóng túi của bác sĩ Lê Trung Kiên. Xem ảnh sản phẩm, nhắn Zalo để được tư vấn và đặt.",
    album: [
      {
        anh: "product-thuoc-sac-thung-hang.jpg",
        alt: "Thùng thuốc sắc đóng túi chuẩn bị giao",
      },
    ],
    cong_dung: [],
    thanh_phan: [],
    doi_tuong: [],
  },
  {
    slug: "bot-ngam-chan",
    ten: "Bột ngâm chân",
    ban_chay: true,
    icon: "Footprints",
    anh: "product-bot-ngam-chan.jpg",
    anh_alt: "Túi bột ngâm chân thảo dược đóng gói sẵn",
    mo_ta_seo:
      "Bột ngâm chân thảo dược do bác sĩ Lê Trung Kiên bào chế, đóng gói sẵn theo túi. Xem ảnh sản phẩm, nhắn Zalo để được tư vấn.",
    album: [],
    cong_dung: [],
    thanh_phan: [],
    doi_tuong: [],
  },
  {
    slug: "con-xoa-bop",
    ten: "Cồn xoa bóp",
    icon: "Droplets",
    anh: "product-con-xoa-bop.jpg",
    anh_alt: "Chai cồn xoa bóp dạng xịt do bác sĩ Lê Trung Kiên bào chế",
    mo_ta_seo:
      "Cồn xoa bóp dạng xịt do bác sĩ Lê Trung Kiên bào chế tại phòng khám. Xem ảnh sản phẩm, nhắn Zalo để được tư vấn.",
    album: [],
    cong_dung: [],
    thanh_phan: [],
    doi_tuong: [],
  },
  {
    slug: "thuoc-ngam-ruou",
    ten: "Thuốc ngâm rượu",
    icon: "BottleWine",
    anh: "product-thang-goi-giay.jpg",
    anh_alt: "Xấp thang thuốc gói giấy buộc dây",
    mo_ta_seo:
      "Thang dược liệu cắt sẵn theo bài để mang về ngâm rượu, do bác sĩ Lê Trung Kiên bốc. Xem ảnh sản phẩm, nhắn Zalo để được tư vấn.",
    album: [
      {
        anh: "product-duoc-lieu-tui-zip.jpg",
        alt: "Các túi dược liệu chia sẵn: kỷ tử, táo đỏ, hoàng kỳ, hạt sen",
      },
    ],
    cong_dung: [],
    thanh_phan: [],
    doi_tuong: [],
  },
];

/**
 * Tra một món theo slug. Trả về undefined nếu không có — nơi gọi tự quyết
 * định làm gì.
 * @param {string} slug
 * @returns {SanPham | undefined}
 */
export function timSanPham(slug) {
  return SAN_PHAM.find((m) => m.slug === slug);
}

/**
 * Khối "nhận đặt hộ". Chủ site chốt để gọn: một dòng nói nhận đặt những gì,
 * rồi mời nhắn Zalo — không liệt kê thành thẻ, vì hàng đặt hộ mỗi đợt mỗi
 * khác, ghi cụ thể ra là trang sai ngay tháng sau.
 */
export const DAT_HO = {
  ma: "dat-ho",
  nhan: "Nhận đặt hộ",
  tieu_de: "Đặt hộ chế phẩm Đông y, dược liệu, trà dưỡng sinh",
  dan: "Mình nhận đặt hộ chế phẩm Đông y từ các nhà thuốc Trung Quốc như Đồng Nhân Đường, cùng dược liệu và trà dưỡng sinh. Cần món gì thì nhắn Zalo cho mình.",
};

/** Chữ trên hai nút kêu gọi ở trang chi tiết. Sửa chữ thì sửa ở đây. */
export const CHU_NUT_TU_VAN = "Nhận tư vấn";
export const CHU_NUT_MUA = "Liên hệ mua";

/** Chữ trên nút liên hệ ở trang danh sách. */
export const CHU_NUT_HOI = "Hỏi về sản phẩm";
