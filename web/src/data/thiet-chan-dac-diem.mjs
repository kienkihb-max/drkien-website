// Dữ liệu đọc lưỡi AI (trang /thiet-chan) — chữ nghĩa và ngưỡng nằm ở đây để
// bác sĩ sửa mà không phải đọc logic. Ngưỡng và mô tả chuyển nguyên từ app
// cũ (mô hình v1, 17/11/2026), không đổi.

export const MODEL_URL = "/assets/models/thiet-chan-v1.onnx";
export const MODEL_VERSION = "v1 (17/11/2026)";

export const GROUP = { chat: "Chất lưỡi", hinh: "Hình thể", reu: "Rêu lưỡi" };
// Mô tả khi AI không thấy dấu hiệu bất thường nào trong nhóm.
export const NORMAL = { chat: "Lưỡi hồng", hinh: "Hình thể cân đối", reu: "Rêu bình thường" };

// Đặc điểm được hiển thị, khóa là mã nhãn của mô hình. lo/hi: ngưỡng "có thể"/"rõ".
// tier A: AP50 trên tập kiểm tra >= 0,6. tier B: 0,3-0,6, kèm lưu ý AI còn hay nhầm.
export const FEATURES = {
  9: { tier: "A", group: "reu", name: "Rêu trắng", lo: 0.4, hi: 0.7,
    desc: "Lớp rêu phủ trên mặt lưỡi có màu trắng. Rêu trắng mỏng cũng thường thấy ở người khỏe mạnh." },
  10: { tier: "A", group: "reu", name: "Rêu vàng", lo: 0.4, hi: 0.65,
    desc: "Lớp rêu trên mặt lưỡi ngả màu vàng.",
    note: "Cà phê, trà, nghệ, thuốc lá, kẹo màu có thể nhuộm vàng rêu lưỡi." },
  2: { tier: "A", group: "chat", name: "Lưỡi đỏ", lo: 0.3, hi: 0.55,
    desc: "Phần thịt lưỡi bên dưới lớp rêu có màu đỏ hơn màu hồng nhạt thường gặp.",
    note: "Đèn vàng, đèn flash, vừa ăn đồ nóng hoặc cay có thể làm lưỡi trông đỏ hơn." },
  5: { tier: "A", group: "hinh", name: "Lưỡi gầy mỏng", lo: 0.4, hi: 0.65,
    desc: "Thân lưỡi nhỏ và mỏng hơn bình thường.",
    note: "Lè lưỡi chưa hết hoặc chụp quá xa có thể làm lưỡi trông nhỏ hơn." },
  1: { tier: "B", group: "reu", name: "Rêu bong", lo: 0.45, hi: 0.7,
    desc: "Có mảng rêu bị bong mất, để lộ mặt lưỡi nhẵn với ranh giới rõ (còn gọi là lưỡi bản đồ)." },
  11: { tier: "B", group: "reu", name: "Rêu đen", lo: 0.45, hi: 0.7,
    desc: "Rêu lưỡi sẫm màu, xám hoặc đen.",
    note: "Cà phê, thuốc lá và một số loại thuốc có thể làm rêu sẫm màu." },
  4: { tier: "B", group: "hinh", name: "Lưỡi bệu", lo: 0.35, hi: 0.6,
    desc: "Thân lưỡi to và dày, có thể chiếm gần hết khoang miệng." },
};

// Đặc điểm AI chưa đủ tin cậy (AP50 < 0,3): không nhận định, chỉ liệt kê.
export const WEAK = ["Vết nứt", "Hằn răng", "Lưỡi tím", "Điểm đỏ", "Rêu trơn ướt"];

// ---------------------------------------------------------------------------
// KẾT LUẬN NGẮN + GỢI Ý BIỆN CHỨNG — luật đơn giản ánh xạ từ đặc điểm AI thấy.
// `can`: danh sách mã nhãn phải cùng có. Luật nhiều nhãn được xét trước và
// "dùng hết" các nhãn của nó; nhãn còn lại mới xét luật đơn.
// ĐÂY LÀ DIỄN GIẢI THEO YHCT PHỔ BIẾN, CHỜ BÁC SĨ DUYỆT từng dòng. AI không
// đo được độ dày rêu, độ khô ướt, nên không có ánh xạ "rêu dày/mỏng".
// ---------------------------------------------------------------------------
export const RULES = [
  { can: [2, 10], ket_luan: "Nhiệt thịnh ở lý",
    goi_y: "Lưỡi đỏ kèm rêu vàng thường được xếp vào hướng thực nhiệt ở lý." },
  // CHỜ BÁC SĨ DUYỆT: gầy mỏng + đỏ là âm hư hỏa vượng theo sách, nhưng đây là suy ra từ hai nhãn riêng lẻ.
  { can: [2, 5], ket_luan: "Âm hư nội nhiệt",
    goi_y: "Lưỡi gầy mỏng và đỏ thường được xếp vào hướng âm hư sinh nội nhiệt." },
  { can: [2], ket_luan: "Thiên nhiệt",
    goi_y: "Lưỡi đỏ thường gợi hướng nhiệt (nhiệt chứng)." },
  { can: [10], ket_luan: "Nhiệt ở lý",
    goi_y: "Rêu vàng thường gợi hướng có nhiệt ở lý." },
  { can: [9], ket_luan: "Hàn hoặc bệnh ở biểu",
    goi_y: "Rêu trắng mỏng gặp cả ở người khỏe; nếu dày thì thường gợi hướng hàn hoặc bệnh còn ở biểu." },
  { can: [5], ket_luan: "Khí huyết hoặc âm dịch kém",
    goi_y: "Lưỡi gầy mỏng thường gợi hướng khí huyết hư hoặc âm dịch hao." },
  { can: [4], ket_luan: "Tỳ hư, đàm thấp",
    goi_y: "Lưỡi bệu thường gợi hướng tỳ hư, thấp hoặc đàm trệ." },
  // CHỜ BÁC SĨ DUYỆT: rêu bong là nhãn tier B (AI hay nhầm).
  { can: [1], ket_luan: "Vị âm hao tổn",
    goi_y: "Rêu bong từng mảng thường gợi hướng vị âm (tân dịch) hao tổn." },
  // CHỜ BÁC SĨ DUYỆT: rêu đen có thể do nhiệt cực hoặc hàn cực, và hay do thức uống nhuộm màu.
  { can: [11], ket_luan: "Cần bác sĩ xem trực tiếp",
    goi_y: "Rêu sẫm màu có thể gặp ở cả chứng nhiệt cực lẫn hàn cực, hoặc do đồ ăn uống nhuộm màu; không suy luận từ ảnh." },
];

export const KET_LUAN_TRONG = "Chưa thấy dấu hiệu bất thường rõ";
export const GOI_Y_TRONG = "AI không phát hiện đặc điểm nào trong số những đặc điểm nó nhận biết được; bác sĩ sẽ xem lại trên ảnh.";
export const CAU_KHONG_PHAI_CHAN_DOAN = "Đây là gợi ý để bác sĩ tham khảo, không phải chẩn đoán.";
