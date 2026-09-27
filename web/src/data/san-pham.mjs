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
// 2. TRANG CHI TIẾT theo ĐÚNG BA MỤC, không hơn, theo đúng thứ tự này:
//       Điểm đặc biệt → Công dụng → Phù hợp với
//    Mục nào để mảng rỗng thì trang tự bỏ hẳn, không hiện tiêu đề trống.
//    Từng có thêm mục "Lưu ý" nhưng chủ site đã bỏ — đừng thêm lại.
//
// 3. Đây là chế phẩm hỗ trợ, KHÔNG phải thuốc đã đăng ký. Viết theo hướng
//    "hỗ trợ", "dùng để", tránh "chữa khỏi", "đặc trị", tránh hứa kết quả.
//
// 4. CHỦ SITE PHẢI ĐỌC LẠI TRƯỚC KHI ĐĂNG. Phần chữ hiện tại do Claude
//    soạn theo yêu cầu, dựa trên nhãn sản phẩm và công năng cổ truyền quen
//    thuộc của từng vị. Đây là trang nghề nghiệp của một bác sĩ: người
//    đứng tên chịu trách nhiệm là bác sĩ, không phải máy. Dòng nào không
//    đúng với thực tế thì sửa hoặc xoá.
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
 * @property {string} [anh]     Ảnh đại diện, hiện trên thẻ danh sách. Bỏ
 *                              trống thì thẻ hiện icon trên nền nhạt thay
 *                              ảnh — dùng khi chưa chụp được ảnh.
 * @property {string} anh_alt   Mô tả ảnh cho Google và trình đọc màn hình
 * @property {string} mo_ta_seo Câu mô tả gửi Google cho trang chi tiết. Đây
 *                              KHÔNG phải mô tả sản phẩm hiện trên trang —
 *                              nó chỉ nằm trong thẻ meta. Viết trung tính,
 *                              đừng nhét công dụng vào.
 * @property {AnhAlbum[]} [album] Ảnh phụ của album, KHÔNG kể ảnh đại diện —
 *                                trang tự đặt ảnh đại diện lên đầu.
 * @property {string} [gioi_thieu]   Một đoạn giới thiệu chung, hiện ở đầu
 *                                   phần chữ của trang chi tiết. Dùng cho
 *                                   món là cả một nhóm nhiều thứ nhỏ, nói
 *                                   chung thay vì liệt kê tên từng thứ.
 * Các mục nội dung của trang chi tiết. TẤT CẢ đều không bắt buộc — món nào
 * có gì thì khai nấy, mục để trống thì trang bỏ hẳn. Thứ tự hiện trên trang
 * là thứ tự liệt kê dưới đây, khai lộn xộn trong dữ liệu cũng không sao.
 *
 * Khai bằng MẢNG thì trang in ra gạch đầu dòng; khai bằng MỘT CHUỖI thì
 * trang in ra một đoạn văn liền.
 *
 * Đầu mục lấy đúng tên trên nhãn sản phẩm chứ không tự đặt: nhãn ghi
 * "Thành phần" thì trang cũng ghi "Thành phần". Trước đây mọi món bị ép vào
 * ba mục cố định (Điểm đặc biệt → Công dụng → Phù hợp với) nên thành phần
 * bị nhét vào "Điểm đặc biệt" — sai chỗ, mà mục đó thành cái sọt đựng đủ
 * thứ. Đừng quay lại lối đó.
 *
 * @property {string[]} [quy_trinh]      Các bước phải qua, cho món không
 *                                       phải mua là xong (thuốc thang)
 * @property {string} [thanh_phan]       MỘT ĐOẠN VĂN, không phải danh sách:
 *                                       mỗi vị một dòng thì cột thuốc dài
 *                                       cả chục dòng mà chẳng rõ hơn. Có
 *                                       hàm lượng thì ghi đúng hàm lượng.
 * @property {string[]} [cong_dung]      Nhãn có chỗ ghi là "Tác dụng"
 * @property {string[]} [chi_dinh]       Dùng trong trường hợp nào
 * @property {string[]} [cach_dung]      Nhãn có chỗ ghi "Hướng dẫn sử dụng"
 * @property {string[]} [doi_tuong]      Ai nên dùng
 * @property {string[]} [chong_chi_dinh] Ai KHÔNG được dùng. Có trên nhãn thì
 *                                       BẮT BUỘC đưa lên trang, đừng bỏ.
 * @property {string[]} [bao_quan]       Bảo quản, hạn dùng
 * @property {string[]} [quy_cach]       Đóng gói: lọ 100ml, túi một lần…
 * @property {boolean} [ban_chay] Gắn nhãn "Bán chạy" lên góc ảnh. Chữ trên
 *                                nhãn sửa ở CHU_BAN_CHAY bên dưới.
 *
 * Không có trường nào đánh dấu "nổi bật": mọi thẻ cùng một cỡ, món nào cần
 * đứng trước thì xếp lên trên trong mảng SAN_PHAM — trang hiện đúng thứ tự
 * ở đây.
 */

/**
 * Mô tả ảnh (thuộc tính alt) cho MỌI ảnh sản phẩm, theo một khuôn duy nhất
 * do chủ site chốt:
 *
 *     <tên món> — tự bào chế bởi Bác sĩ Lê Trung Kiên
 *
 * Thẻ ở trang danh sách, ảnh to lẫn dải ảnh nhỏ trong album đều gọi hàm
 * này, nên đổi khuôn ở đây là đổi khắp site.
 *
 * Trường anh_alt của từng ảnh vì thế KHÔNG còn hiện ra trang nữa. Vẫn giữ
 * trong dữ liệu để biết tấm nào chụp gì, và để quay lại lối cũ được nếu
 * chủ site đổi ý.
 *
 * @param {string} ten Tên món, ví dụ "Bột tam thất"
 */
export function moTaAnh(ten) {
  return ten + " — tự bào chế bởi Bác sĩ Lê Trung Kiên";
}

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
    anh: "product-tam-that-tui-cu-am-tra.jpg",
    anh_alt: "Túi tam thất có nhãn đặt cạnh bộ ấm trà",
    mo_ta_seo:
      "Bột tam thất do bác sĩ Lê Trung Kiên tự chọn củ và bào chế tại phòng khám. Xem thành phần, công dụng và cách dùng, nhắn Zalo để được tư vấn.",
    album: [
      {
        anh: "product-bot-tam-that-nb.jpg",
        alt: "Các túi bột tam thất đang cân trên cân điện tử",
      },
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
    ],
    // NGUỒN: nhãn dán trên túi. Đổi nhãn thì sửa ở đây cho khớp.
    thanh_phan:
      "Củ tam thất khô: chọn củ già, rửa sạch, sấy khô rồi nghiền mịn — không pha trộn thêm bột nào khác.",
    cong_dung: [
      "Hỗ trợ giảm u, tiêu viêm",
      "Bồi bổ sức khỏe, tăng sức đề kháng",
      "Hỗ trợ điều hòa kinh nguyệt, giảm đau bụng kinh",
    ],
    cach_dung: [
      "Pha 1–2 thìa cà phê với nước ấm, có thể cho thêm mật ong. Uống 1–2 lần mỗi ngày.",
      "Có thể nấu cùng thức ăn hoặc dùng làm mặt nạ dưỡng da.",
    ],
    // Nhãn không có mục này — Claude soạn, chủ site đọc lại.
    doi_tuong: [
      "Người mới ốm dậy hoặc sau phẫu thuật, cần bồi bổ",
      "Người hay bầm tím, tụ máu",
      "Phụ nữ đau bụng kinh, kinh nguyệt không đều",
      "Người muốn bồi bổ đều đặn hằng ngày",
    ],
    bao_quan: [
      "Để nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp",
      "Làm theo mẻ nhỏ, mỗi túi có ghi ngày đóng gói",
    ],
  },
  {
    slug: "bot-ngam-chan",
    ten: "Bột ngâm chân",
    ban_chay: true,
    icon: "Footprints",
    anh: "product-bot-ngam-chan.jpg",
    anh_alt: "Túi bột ngâm chân thảo dược đóng gói sẵn",
    mo_ta_seo:
      "Bột ngâm chân thảo dược do bác sĩ Lê Trung Kiên bào chế, đóng theo túi dùng một lần. Xem thành phần, công dụng và chống chỉ định, nhắn Zalo để được tư vấn.",
    album: [],
    // NGUỒN: nhãn dán trên túi. Đổi nhãn thì sửa ở đây cho khớp.
    thanh_phan:
      "Quế chi, địa liền, lá lốt, sinh khương, thiên niên kiện và một số thảo dược khác.",
    cong_dung: ["Thông kinh hoạt lạc", "Hoạt huyết hóa ứ", "Tiêu viêm, giảm đau"],
    cach_dung: [
      "Pha một túi với nước nóng, chờ bớt nóng rồi ngâm 15–20 phút",
      "Đóng sẵn theo túi dùng một lần — không phải đun, không phải đong đếm gì thêm",
    ],
    // Nhãn không có mục này — Claude soạn, chủ site đọc lại.
    doi_tuong: [
      "Người hay lạnh tay chân",
      "Người đứng hoặc ngồi cả ngày, tối về mỏi chân",
      "Người chạy bộ muốn thư giãn cơ sau buổi tập",
    ],
    chong_chi_dinh: [
      "Người đái tháo đường",
      "Người giãn tĩnh mạch chi dưới",
      "Người có vết thương hở ở chân",
      "Trẻ em dưới 3 tuổi",
      "Phụ nữ mang thai 3 tháng đầu",
    ],
    bao_quan: [
      "Hạn dùng 6 tháng kể từ ngày sản xuất",
      "Để nơi khô ráo, thoáng mát",
    ],
  },
  {
    slug: "thuoc-thang-thuoc-sac",
    ten: "Thuốc thang, thuốc sắc",
    icon: "FlaskConical",
    anh: "product-thuoc-sac-nb.jpg",
    anh_alt: "Túi thuốc đã sắc sẵn, nước thuốc màu nâu",
    mo_ta_seo:
      "Thuốc thang bốc theo đơn và thuốc sắc sẵn đóng túi của bác sĩ Lê Trung Kiên. Xem quy trình thăm khám và bốc thuốc, nhắn Zalo để được tư vấn.",
    album: [
      { anh: "product-thang-goi-giay.jpg", alt: "Xấp thang thuốc gói giấy buộc dây" },
      {
        anh: "product-thuoc-sac-thung-hang.jpg",
        alt: "Thùng thuốc sắc đóng túi chuẩn bị giao",
      },
    ],
    // Món duy nhất có mục "Quy trình": nó không phải hàng mua là xong mà là
    // một đợt điều trị có các bước. Chủ site đọc cho, chép nguyên ý.
    //
    // KHÔNG có mục Thành phần: thuốc bốc theo đơn riêng của từng người, không
    // có công thức cố định để ghi ra.
    quy_trinh: [
      "Thăm khám, điền form Thập vấn và gửi ảnh lưỡi",
      "Bốc thuốc theo tình trạng bệnh, ưu tiên các bài thuốc cổ phương gia giảm",
      "Nhận thuốc: đóng túi sắc sẵn 7–10 thang mỗi lần, hoặc lấy thuốc thô về tự sắc",
      "Tái khám sau 7–10 ngày",
    ],
    cong_dung: [
      "Dùng đúng bài thuốc bác sĩ kê cho từng người, theo từng đợt điều trị",
      "Kết hợp cùng châm cứu, vật lý trị liệu trong các đợt điều trị cơ xương khớp",
    ],
    doi_tuong: [
      "Người đã khám và được bác sĩ kê đơn",
      "Người bận, không có thời gian sắc thuốc ở nhà",
      "Người ở xa, cần gửi thuốc theo từng đợt",
    ],
    quy_cach: [
      "Túi sắc sẵn, 7–10 thang mỗi lần",
      "Hoặc thuốc thô mang về tự sắc",
    ],
    bao_quan: ["Túi sắc sẵn để ngăn mát, hâm lại trước khi uống"],
  },
  {
    slug: "con-xoa-bop",
    ten: "Cồn xoa bóp",
    icon: "Droplets",
    anh: "product-con-xoa-bop.jpg",
    anh_alt: "Chai cồn xoa bóp dạng xịt do bác sĩ Lê Trung Kiên bào chế",
    mo_ta_seo:
      "Cồn xoa bóp dạng xịt của bác sĩ Lê Trung Kiên. Xem thành phần đầy đủ, chỉ định và chống chỉ định, nhắn Zalo để được tư vấn.",
    album: [],
    // NGUỒN: nhãn dán trên lọ. Đổi nhãn thì sửa ở đây cho khớp.
    // Hàm lượng ghi đúng như nhãn, đừng làm tròn hay bỏ bớt vị.
    thanh_phan:
      "Mã tiền, huyết giác, ô đầu, long não, đại hồi, một dược, địa liền, nhũ hương, đinh hương, quế nhục, sinh khương — mỗi vị 1g; ethanol 70° 100ml.",
    cong_dung: ["Hoạt huyết, giảm đau, tiêu viêm", "Trừ phong thấp, thông kinh lạc"],
    chi_dinh: [
      "Sưng đau do chấn thương, tụ máu bầm tím",
      "Đau nhức các khớp xương, đau mỏi cơ",
      "Đau cổ gáy, đau thắt lưng",
    ],
    cach_dung: ["Xịt lên chỗ đau và vùng lân cận, xoa nhẹ", "Ngày 3–4 lần"],
    chong_chi_dinh: [
      "Phụ nữ có thai và trẻ em dưới 2 tuổi",
      "Không xịt lên vết thương hở, mắt, mũi, miệng",
    ],
    quy_cach: ["Lọ xịt 100ml"],
  },
  {
    slug: "thuoc-ngam-ruou",
    ten: "Thuốc ngâm rượu",
    icon: "BottleWine",
    anh: "product-thang-ngam-ruou.jpg",
    anh_alt:
      "Thang dược liệu ngâm rượu trải trong túi vải: nhân sâm, kỷ tử, thục địa, hoàng kỳ",
    mo_ta_seo:
      "Thang dược liệu cắt sẵn theo bài để mang về ngâm rượu, do bác sĩ Lê Trung Kiên bốc. Nhắn Zalo để được tư vấn bài phù hợp.",
    album: [
      {
        anh: "product-duoc-lieu-tui-zip.jpg",
        alt: "Các túi dược liệu chia sẵn: kỷ tử, táo đỏ, hoàng kỳ, hạt sen",
      },
    ],
    // MÓN NÀY CHƯA CÓ NHÃN. Toàn bộ chữ dưới đây do Claude soạn theo ảnh
    // sản phẩm và công năng cổ truyền của từng vị. Chủ site có nhãn hoặc
    // đọc cho thì thay bằng chữ thật.
    //
    // ĐÂY LÀ THUỐC NGÂM RƯỢU ĐỂ UỐNG, không phải rượu xoa bóp ngoài da.
    // Bản trước viết là có cả bài xoa bóp — sai, chủ site đã đính chính.
    // Muốn nói tới xoa bóp ngoài da thì đó là món Cồn xoa bóp.
    thanh_phan:
      "Thang cắt sẵn, cân đủ vị theo bài. Tuỳ bài có nhân sâm, kỷ tử, thục địa, hoàng kỳ, táo đỏ, hạt sen…",
    // Ba dòng này chủ site đọc cho, dùng nguyên thuật ngữ của bài thuốc —
    // đừng diễn nôm thành "tăng sức đề kháng" cho dễ hiểu, vì đó là chữ
    // khác nghĩa khác.
    cong_dung: ["Nâng cao chính khí", "Bổ can thận", "Bổ khí huyết"],
    cach_dung: [
      "Đổ rượu theo tỉ lệ và ngâm đủ thời gian ghi kèm mỗi thang",
      "Uống lượng nhỏ mỗi lần, theo hướng dẫn của bác sĩ",
    ],
    doi_tuong: [
      "Người cần bồi bổ theo bài đã được bác sĩ tư vấn",
      "Người hay mệt mỏi, ăn ngủ kém",
      "Người muốn tự ngâm để biết rõ trong bình có vị gì",
    ],
    chong_chi_dinh: [
      "Người có bệnh gan, bệnh dạ dày",
      "Người đang uống thuốc tây — hỏi bác sĩ trước khi dùng",
      "Phụ nữ có thai và đang cho con bú",
      "Người không uống được rượu",
    ],
  },
  {
    slug: "san-pham-duong-sinh",
    ten: "Sản phẩm dưỡng sinh",
    icon: "Flower2",
    anh: "product-duong-sinh-ham-ga.jpg",
    anh_alt: "Các túi hầm gà ngũ vị của bác sĩ Kiên, đóng gói có nhãn",
    mo_ta_seo:
      "Các sản phẩm dưỡng sinh của bác sĩ Lê Trung Kiên, dùng qua đường ăn uống và chăm sóc hằng ngày. Nhắn Zalo để được tư vấn và đặt.",
    album: [],
    // Không liệt kê tên từng món ở thẻ danh sách: chủ site chốt chỉ giới
    // thiệu chung, vì mỗi đợt làm một số món khác nhau.
    gioi_thieu:
      "Các sản phẩm dưỡng sinh qua đường ăn uống và chăm sóc hằng ngày, dùng đều đặn tại nhà. Mỗi đợt mình làm một số món khác nhau, cần món gì thì nhắn hỏi mình.",
    // NGUỒN: nhãn Hầm gà ngũ vị — món đang có trong ảnh bìa. Đợt sau làm món
    // khác thì sửa lại cho khớp nhãn của món đó.
    // Khai bằng MẢNG chứ không phải một chuỗi: đây là hai món khác nhau,
    // mỗi món một dòng cho rõ. Đợt sau có thêm món thì thêm một dòng.
    thanh_phan: [
      "Hầm gà ngũ vị: đảng sâm, kỷ tử, đương quy, hạt sen, hồng táo",
      "Trà dưỡng nhan: kỷ tử, hồng táo, cúc hoa",
    ],
    cong_dung: [
      "Bồi bổ cơ thể, tăng sức đề kháng",
      "Hỗ trợ phục hồi sức khỏe cho người mệt mỏi, suy nhược và người sau khi ốm dậy",
    ],
    // Mỗi món một dòng, có tên món ở đầu: hai món nấu khác hẳn nhau, không
    // ghi tên thì người đọc tưởng cách nào cũng dùng chung được.
    cach_dung: [
      "Hầm gà ngũ vị: một gói với gà 1–1,5kg và 1,5–2 lít nước, hầm lửa nhỏ 45–60 phút",
      "Trà dưỡng nhan: một gói hãm với 500ml nước sôi trong bình giữ nhiệt, uống trong ngày",
    ],
    doi_tuong: [
      "Người cần bồi bổ",
      "Người lao động nặng",
      "Người tập thể thao",
      "Người mới ốm dậy",
    ],
    quy_cach: ["Chia sẵn một gói cho một lần nấu"],
    bao_quan: ["Để nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp"],
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


/** Chữ trên hai nút kêu gọi ở trang chi tiết. Sửa chữ thì sửa ở đây. */
export const CHU_NUT_TU_VAN = "Nhận tư vấn";
export const CHU_NUT_MUA = "Liên hệ mua";

/** Chữ trên nút liên hệ ở trang danh sách. */
export const CHU_NUT_HOI = "Liên hệ tư vấn";
