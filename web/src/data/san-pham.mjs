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
 * @property {string[]} [diem_dac_biet] Mục "Điểm đặc biệt" — món này khác
 *                                     gì, làm ra sao, dùng tiện thế nào
 * @property {string[]} [cong_dung] Mục "Công dụng"
 * @property {string[]} [doi_tuong] Mục "Phù hợp với" — liệt kê đối tượng
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
      "Bột tam thất do bác sĩ Lê Trung Kiên tự chọn củ và bào chế tại phòng khám. Xem ảnh sản phẩm, công dụng và đối tượng phù hợp, nhắn Zalo để được tư vấn.",
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
    diem_dac_biet: [
      "Chọn củ già, rửa sạch và sấy khô trước khi nghiền — không pha trộn thêm bột nào khác",
      "Làm theo mẻ nhỏ, mỗi túi có ghi ngày đóng gói",
      "Pha nước ấm uống, trộn mật ong, nấu cùng thức ăn hoặc dùng làm mặt nạ đều được",
    ],
    // Ba dòng này chép nguyên văn từ nhãn dán trên túi. Đổi nhãn thì sửa ở
    // đây cho khớp, đừng để trang nói một đằng nhãn nói một nẻo.
    cong_dung: [
      "Hỗ trợ giảm u, tiêu viêm",
      "Bồi bổ sức khỏe, tăng sức đề kháng",
      "Hỗ trợ điều hòa kinh nguyệt, giảm đau bụng kinh",
    ],
    doi_tuong: [
      "Người mới ốm dậy hoặc sau phẫu thuật, cần bồi bổ",
      "Người hay bầm tím, tụ máu",
      "Phụ nữ đau bụng kinh, kinh nguyệt không đều",
      "Người muốn bồi bổ đều đặn hằng ngày",
    ],
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
      { anh: "product-thang-goi-giay.jpg", alt: "Xấp thang thuốc gói giấy buộc dây" },
      {
        anh: "product-thuoc-sac-thung-hang.jpg",
        alt: "Thùng thuốc sắc đóng túi chuẩn bị giao",
      },
    ],
    diem_dac_biet: [
      "Bốc theo đơn riêng của từng người sau khi khám, không có thang bán sẵn",
      "Lấy thang về tự sắc, hoặc đặt sắc sẵn đóng túi cho tiện mang đi",
      "Dược liệu mình tự chọn và cân, bốc tới đâu cân tới đó",
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
  },
  {
    slug: "bot-ngam-chan",
    ten: "Bột ngâm chân",
    ban_chay: true,
    icon: "Footprints",
    anh: "product-bot-ngam-chan.jpg",
    anh_alt: "Túi bột ngâm chân thảo dược đóng gói sẵn",
    mo_ta_seo:
      "Bột ngâm chân thảo dược do bác sĩ Lê Trung Kiên bào chế, đóng gói sẵn theo túi dùng một lần. Xem công dụng và đối tượng phù hợp, nhắn Zalo để được tư vấn.",
    album: [],
    diem_dac_biet: [
      "Thảo dược làm ấm đã cắt sẵn, đóng theo túi dùng một lần",
      "Pha một túi với nước nóng, chờ bớt nóng rồi ngâm 15–20 phút",
      "Không phải đun, không phải đong đếm gì thêm",
    ],
    cong_dung: [
      "Hỗ trợ làm ấm cơ thể, thư giãn sau một ngày dài",
      "Hỗ trợ lưu thông khí huyết vùng bàn chân, cẳng chân",
      "Giúp dễ vào giấc hơn khi ngâm buổi tối",
    ],
    doi_tuong: [
      "Người hay lạnh tay chân",
      "Người đứng hoặc ngồi cả ngày, tối về mỏi chân",
      "Người khó ngủ, hay tỉnh giấc giữa đêm",
      "Người chạy bộ muốn thư giãn cơ sau buổi tập",
    ],
  },
  {
    slug: "con-xoa-bop",
    ten: "Cồn xoa bóp",
    icon: "Droplets",
    anh: "product-con-xoa-bop.jpg",
    anh_alt: "Chai cồn xoa bóp dạng xịt do bác sĩ Lê Trung Kiên bào chế",
    mo_ta_seo:
      "Cồn xoa bóp dạng xịt do bác sĩ Lê Trung Kiên bào chế tại phòng khám. Xem công dụng và đối tượng phù hợp, nhắn Zalo để được tư vấn.",
    album: [],
    diem_dac_biet: [
      "Dược liệu ngâm cồn theo bài, đóng chai xịt nhỏ đủ bỏ túi",
      "Xịt ra tay rồi day nhẹ là thấm, không để lại cảm giác nhờn",
      "Mang theo được khi đi tập, đi thi đấu hay đi công tác",
    ],
    cong_dung: [
      "Hỗ trợ làm nóng tại chỗ, giảm cảm giác mỏi cơ sau vận động",
      "Hỗ trợ giảm đau mỏi vai gáy, thắt lưng do ngồi lâu một tư thế",
      "Dùng kèm khi xoa bóp, day ấn tại nhà",
    ],
    doi_tuong: [
      "Người chạy bộ, tập thể thao hay mỏi cơ sau buổi tập",
      "Dân văn phòng đau mỏi vai gáy",
      "Người lao động nặng, hay đau lưng cuối ngày",
    ],
  },
  {
    slug: "thuoc-ngam-ruou",
    ten: "Thuốc ngâm rượu",
    icon: "BottleWine",
    anh: "product-thang-ngam-ruou.jpg",
    anh_alt:
      "Thang dược liệu ngâm rượu trải trong túi vải: nhân sâm, kỷ tử, thục địa, hoàng kỳ",
    mo_ta_seo:
      "Thang dược liệu cắt sẵn theo bài để mang về ngâm rượu, do bác sĩ Lê Trung Kiên bốc. Xem công dụng và đối tượng phù hợp, nhắn Zalo để được tư vấn.",
    album: [
      {
        anh: "product-duoc-lieu-tui-zip.jpg",
        alt: "Các túi dược liệu chia sẵn: kỷ tử, táo đỏ, hoàng kỳ, hạt sen",
      },
    ],
    diem_dac_biet: [
      "Thang cắt sẵn, cân đủ vị theo bài — mang về chỉ việc đổ rượu",
      "Có bài ngâm để xoa bóp ngoài, có bài ngâm để uống; hỏi trước khi mua",
      "Kèm hướng dẫn tỉ lệ rượu và thời gian ngâm",
    ],
    cong_dung: [
      "Bài xoa bóp: hỗ trợ làm nóng, giảm đau mỏi cơ khớp khi day ấn ngoài da",
      "Bài uống: hỗ trợ bồi bổ theo thể trạng, dùng lượng nhỏ mỗi lần",
    ],
    doi_tuong: [
      "Người quen dùng rượu thuốc xoa bóp tại nhà",
      "Người cần bồi bổ theo bài đã được bác sĩ tư vấn",
      "Người muốn tự ngâm để biết rõ trong bình có vị gì",
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
    // Không liệt kê tên từng món: chủ site chốt chỉ giới thiệu chung, vì
    // mỗi đợt làm một số món khác nhau — ghi tên cụ thể ra là trang sai ngay
    // đợt sau. Ai cần biết có gì thì nhắn Zalo hỏi.
    gioi_thieu:
      "Các sản phẩm dưỡng sinh qua đường ăn uống và chăm sóc hằng ngày, dùng đều đặn tại nhà. Mỗi đợt mình làm một số món khác nhau, cần món gì thì nhắn hỏi mình.",
    diem_dac_biet: [
      "Làm theo đợt, mỗi đợt một số món nên lúc nào cũng mới",
      "Dược liệu cắt sẵn, chia đúng liều một lần dùng",
      "Đưa vào bữa ăn hoặc thói quen hằng ngày được ngay, không phải học cách dùng",
    ],
    cong_dung: [
      "Hỗ trợ bồi bổ, chăm sóc sức khỏe đều đặn tại nhà",
      "Dành cho việc giữ sức khỏe hằng ngày chứ không phải để chữa bệnh",
    ],
    doi_tuong: [
      "Người muốn giữ sức khỏe đều đặn chứ không đợi tới lúc ốm",
      "Người cần bồi bổ sau ốm, sau sinh",
      "Người tìm một món quà biếu thiết thực",
    ],
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
