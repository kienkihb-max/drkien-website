// Nội dung "Phiếu Thập Vấn Chuyên Khoa" — NGUỒN DUY NHẤT cho trang
// /sang-loc-benh. Sửa chữ câu hỏi, thêm bớt đáp án ở đây là đổi trên trang;
// component PhieuThapVan.astro chỉ dựng ra HTML từ file này.
//
// TUYỆT ĐỐI KHÔNG đưa vào file này điểm số, trọng số, tên thể bệnh hay gợi ý
// chẩn đoán. Trang chỉ ghi lại câu trả lời nguyên văn; việc tính điểm phân
// thể bác sĩ làm riêng trong Google Sheet. File này lại được đóng gói gửi
// xuống trình duyệt, nên bất cứ gì viết ở đây là ai cũng đọc được.
//
// Loại câu hỏi (trường `loai`):
//   chon1       chọn một (nút tròn)
//   chon_nhieu  chọn nhiều (ô vuông)
//   ngan        ô nhập một dòng
//   so          ô nhập một dòng, chỉ nhận số
//   doan        ô nhập nhiều dòng
//   thang       thang 0–10, có nhãn hai đầu
//   anh         tải ảnh lên
// `co_khac: true` (tự thêm, xem CAU_CO_O_KHAC) là câu có lựa chọn "Khác (tự ghi)".
// `bat_buoc: true` là câu có dấu * đỏ. `nguy_hiem: true` là câu "dấu hiệu
// nguy hiểm": chọn "Có" thì hiện trang Cảnh báo.
// MÃ CÂU HỎI (`id`) là khóa cố định giữa trang web và Google Sheet: Sheet gom dữ
// liệu theo mã này chứ không theo chữ câu hỏi. Vì vậy chữ `nhan` đổi thoải mái
// (Sheet tự cập nhật tên cột, dữ liệu cũ giữ nguyên) và đổi thứ tự câu cũng
// không lệch cột. CHỈ KHÔNG ĐƯỢC đổi `id` của câu đã có người trả lời: đổi mã
// là Sheet coi như một câu mới và mở cột mới. Câu mới thì đặt mã mới, không
// trùng mã nào khác (trùng hay thiếu mã thì dựng trang báo lỗi ngay).
// Đáp án là chữ trơn, hoặc { ten, mo_ta } khi có dòng mô tả nhỏ bên dưới.

const CO_KHONG = ["Có", "Không"];

// Gán id theo thứ tự câu trong từng phần. id chỉ dùng để nối nhãn với ô nhập
// trên trang; tên cột trong Google Sheet lấy từ tên phần + chữ câu hỏi, nên
// đổi thứ tự câu không làm lệch cột.
// Câu có thêm lựa chọn "Khác (tự ghi)": bệnh nhân chọn thì hiện ô gõ chữ. Chỉ
// thêm ở câu mà danh sách đáp án khó đủ (vị trí đau, triệu chứng, bệnh nền…).
// Câu rẽ nhánh (chuyên khoa, giới tính) và câu "dấu hiệu nguy hiểm" thì KHÔNG
// thêm, vì đáp án của chúng quyết định đường đi của phiếu. Muốn thêm hay bớt
// một câu, sửa danh sách này (id = mã câu hỏi, xem phần chú thích về MÃ CÂU HỎI bên dưới).
const CAU_CO_O_KHAC = new Set([
  "cxk_vi_tri_dau", "cxk_tinh_chat_dau", "cxk_khoi_phat_dau",
  "tk_trieu_chung_chinh", "tk_nang_hon_khi",
  "tn_van_de_gap_phai",
  "th_van_de_gap_phai", "th_nang_hon_khi",
  "hh_van_de_gap_phai",
  "tm_van_de_gap_phai", "tm_nang_hon_khi",
  "dl_bieu_hien_da", "dl_vi_tri_ton_thuong", "dl_nang_hon_khi",
  "nt_chan_doan_nghi_ngo",
  "tv_suc_khoe_chung", "tv_tinh_than", "tv_benh_dang_co",
]);

const MA_DA_DUNG = new Set();
const danhSo = (ma, ds) =>
  ds.map((c) => {
    if (!c.id) throw new Error("Câu hỏi thiếu mã (id): " + c.nhan);
    if (MA_DA_DUNG.has(c.id)) throw new Error("Trùng mã câu hỏi: " + c.id);
    MA_DA_DUNG.add(c.id);
    return { ...c, ...(CAU_CO_O_KHAC.has(c.id) ? { co_khac: true } : {}) };
  });

// Câu "dấu hiệu nguy hiểm" cuối mỗi bộ chuyên khoa.
const nguyHiem = (id, chu_thich) => ({
  id,
  loai: "chon1",
  bat_buoc: true,
  nguy_hiem: true,
  nhan: "Bạn có đang gặp một trong các dấu hiệu sau không?",
  chu_thich,
  dap_an: CO_KHONG,
});

// ---- Phần 1 · Vấn đề và chuyên khoa -------------------------------------------
// `bo` trên mỗi đáp án của câu chuyên khoa là mã bộ câu hỏi ở BO_CHUYEN_KHOA
// sẽ hiện ra ở Phần 2. Đáp án không có `bo` (khám tổng quát) thì bỏ qua Phần 2.
export const PHAN_VAN_DE = {
  ten: "Vấn đề",
  tieu_de: "Bạn đang gặp vấn đề gì?",
  cau_hoi: [
    { id: "van_de", loai: "doan", bat_buoc: true, nhan: "Bạn hãy mô tả chi tiết vấn đề của mình" },
    {
      id: "thoi_gian",
      loai: "chon1",
      bat_buoc: true,
      nhan: "Bạn bị như vậy bao lâu rồi?",
      dap_an: ["Dưới 1 tuần", "1–4 tuần", "1–6 tháng", "Trên 6 tháng"],
    },
    {
      id: "chuyen_khoa",
      loai: "chon1",
      bat_buoc: true,
      nhan: "Vấn đề chính của bạn thuộc nhóm nào?",
      chu_thich: "Nếu có nhiều vấn đề, hãy chọn vấn đề làm bạn khó chịu nhất.",
      dap_an: [
        { ten: "Cơ Xương Khớp", bo: "cxk", mo_ta: "Đau mỏi cổ vai gáy, lưng, gối, khớp, chấn thương khi tập luyện" },
        { ten: "Thần kinh", bo: "tk", mo_ta: "Đau đầu, chóng mặt, mất ngủ, tê bì tay chân" },
        { ten: "Tiết niệu", bo: "tn", mo_ta: "Tiểu nhiều lần, tiểu đêm, tiểu buốt, tiểu không hết" },
        { ten: "Tiêu hóa", bo: "th", mo_ta: "Đau dạ dày, ợ chua, đầy bụng, táo bón, tiêu chảy" },
        { ten: "Hô hấp, Tai Mũi Họng", bo: "hh", mo_ta: "Ho, đờm, nghẹt mũi, viêm họng, hay cảm lạnh" },
        { ten: "Tim mạch, Huyết áp", bo: "tm", mo_ta: "Hồi hộp, tức ngực, huyết áp cao hoặc thấp, phù chân" },
        { ten: "Da liễu", bo: "dl", mo_ta: "Mẩn ngứa, mề đay, mụn, chàm, khô da" },
        { ten: "Phụ khoa", bo: "pk", mo_ta: "Rối loạn kinh nguyệt, khí hư, đau bụng kinh, tiền mãn kinh" },
        { ten: "Nội tiết, Chuyển hóa", bo: "nt", mo_ta: "Tiểu đường, mỡ máu, tuyến giáp, thừa cân, acid uric" },
        { ten: "Chưa rõ, muốn khám tổng quát", mo_ta: "Bỏ qua bộ câu hỏi chuyên khoa" },
      ],
    },
  ],
};

// ---- Phần 6 · Thông tin liên hệ (phần cuối, ngay trước nút Gửi) ----------------
// Để cuối cùng: bệnh nhân trả lời xong các câu về sức khỏe rồi mới để lại
// thông tin cá nhân. Tên phần vẫn là "Thông tin" để cột trong Google Sheet
// ("Thông tin | Họ và tên"…) giữ nguyên như đã gửi thử.
export const PHAN_LIEN_HE = {
  ten: "Thông tin",
  tieu_de: "Để lại thông tin liên hệ",
  cau_hoi: [
    { id: "ho_ten", loai: "ngan", bat_buoc: true, nhan: "Họ và tên của bạn là gì?" },
    { id: "nam_sinh", loai: "so", bat_buoc: true, nhan: "Bạn sinh năm bao nhiêu?" },
    { id: "sdt", loai: "so", bat_buoc: true, nhan: "Số điện thoại / Zalo của bạn là gì?" },
  ],
};

// Mã bộ của chuyên khoa Phụ khoa. Bộ này đã có phần kinh nguyệt riêng nên
// Phần 4 không hiện nữa.
export const BO_PHU_KHOA = "pk";

// ---- Phần 2 · Bộ câu hỏi riêng ----------------------------------------------
export const BO_CHUYEN_KHOA = {
  cxk: {
    ten: "Cơ Xương Khớp",
    tieu_de: "Mô tả triệu chứng bệnh cơ xương khớp",
    cau_hoi: danhSo("cxk", [
      {
        id: "cxk_vi_tri_dau",
        loai: "chon_nhieu",
        bat_buoc: true,
        nhan: "Bạn đau ở đâu?",
        dap_an: ["Cổ vai gáy", "Vai", "Lưng trên", "Thắt lưng", "Háng", "Gối", "Cổ chân, bàn chân", "Khớp nhỏ bàn tay"],
      },
      {
        id: "cxk_tinh_chat_dau",
        loai: "chon_nhieu",
        bat_buoc: true,
        nhan: "Cơn đau của bạn như thế nào?",
        dap_an: [
          "Âm ỉ, mỏi",
          "Nhói như kim châm, cố định một chỗ",
          "Nặng nề, khó cử động",
          "Đau chạy chỗ này sang chỗ khác",
          "Nóng rát",
          "Buốt lạnh",
        ],
      },
      {
        id: "cxk_anh_huong_thoi_tiet",
        loai: "chon1",
        bat_buoc: true,
        nhan: "Thời tiết ảnh hưởng đến cơn đau của bạn thế nào?",
        dap_an: ["Tăng khi trời lạnh, ẩm", "Tăng khi trời nóng", "Không ảnh hưởng"],
      },
      {
        id: "cxk_cho_dau_sung",
        loai: "chon1",
        bat_buoc: true,
        nhan: "Chỗ đau của bạn có sưng không?",
        dap_an: ["Không sưng", "Sưng, không nóng đỏ", "Sưng, nóng, đỏ"],
      },
      {
        id: "cxk_cung_khop_buoi_sang",
        loai: "chon1",
        nhan: "Buổi sáng ngủ dậy, bạn có bị cứng khớp không?",
        dap_an: ["Không", "Có, dưới 30 phút", "Có, trên 30 phút"],
      },
      { id: "cxk_dau_ve_dem", loai: "chon1", nhan: "Cơn đau của bạn có tăng về đêm không?", dap_an: ["Không", "Có"] },
      {
        id: "cxk_muc_do_dau",
        loai: "thang",
        bat_buoc: true,
        nhan: "Mức đau của bạn hiện giờ là bao nhiêu?",
        nhan_trai: "0 · Không đau",
        nhan_phai: "10 · Đau không chịu nổi",
      },
      {
        id: "cxk_te_bi_lan",
        loai: "chon1",
        nhan: "Bạn có bị tê bì lan xuống tay hoặc chân không?",
        dap_an: ["Không", "Lan xuống tay", "Lan xuống chân"],
      },
      {
        id: "cxk_khoi_phat_dau",
        loai: "chon1",
        nhan: "Cơn đau của bạn bắt đầu từ khi nào?",
        dap_an: [
          "Từ từ, tăng dần theo tuổi",
          "Sau chấn thương hoặc tập luyện quá sức",
          "Sau khi bị nhiễm lạnh",
          "Không rõ",
        ],
      },
      nguyHiem("cxk_dau_hieu_nguy_hiem", "Sốt kèm khớp sưng nóng · Đau sau té ngã hoặc va đập mạnh · Sụt cân không rõ lý do"),
    ]),
  },

  tk: {
    ten: "Thần kinh",
    tieu_de: "Mô tả triệu chứng bệnh thần kinh",
    cau_hoi: danhSo("tk", [
      {
        id: "tk_trieu_chung_chinh",
        loai: "chon_nhieu",
        bat_buoc: true,
        nhan: "Bạn gặp triệu chứng chính nào?",
        dap_an: ["Đau đầu", "Chóng mặt", "Mất ngủ", "Tê bì tay chân", "Run tay", "Hay quên"],
      },
      {
        id: "tk_kieu_dau_dau",
        loai: "chon1",
        nhan: "Nếu bạn bị đau đầu, cơn đau giống mô tả nào nhất?",
        dap_an: [
          "Không đau đầu",
          "Căng, giật theo nhịp, mặt đỏ",
          "Nặng như đội mũ chặt",
          "Âm ỉ, tăng khi mệt",
          "Nhói cố định một chỗ",
        ],
      },
      {
        id: "tk_vi_tri_dau_dau",
        loai: "chon_nhieu",
        nhan: "Bạn đau đầu ở vị trí nào?",
        dap_an: ["Trán", "Hai bên thái dương", "Đỉnh đầu", "Gáy", "Cả đầu"],
      },
      {
        id: "tk_chong_mat_kem_theo",
        loai: "chon1",
        nhan: "Bạn bị chóng mặt kèm theo triệu chứng nào?",
        dap_an: ["Không chóng mặt", "Mặt đỏ, dễ cáu", "Buồn nôn, nặng đầu", "Khi đứng dậy, kèm mệt"],
      },
      { id: "tk_te_bi", loai: "chon1", nhan: "Bạn có bị tê bì không?", dap_an: ["Không", "Tê kèm mỏi yếu", "Tê kèm đau nhói"] },
      {
        id: "tk_nang_hon_khi",
        loai: "chon_nhieu",
        nhan: "Triệu chứng của bạn nặng hơn khi nào?",
        dap_an: ["Căng thẳng", "Thiếu ngủ, làm việc nhiều", "Trời ẩm", "Không rõ"],
      },
      nguyHiem("tk_dau_hieu_nguy_hiem", "Đột ngột yếu hoặc tê nửa người · Méo miệng, nói khó · Đau đầu dữ dội đột ngột, chưa từng bị"),
    ]),
  },

  tn: {
    ten: "Tiết niệu",
    tieu_de: "Mô tả triệu chứng bệnh tiết niệu",
    cau_hoi: danhSo("tn", [
      {
        id: "tn_van_de_gap_phai",
        loai: "chon_nhieu",
        bat_buoc: true,
        nhan: "Bạn gặp những vấn đề nào?",
        dap_an: [
          "Tiểu nhiều lần ban ngày",
          "Tiểu buốt, rát",
          "Tiểu rắt, tiểu không hết",
          "Rỉ tiểu, són tiểu khi ho, hắt hơi",
          "Tia tiểu yếu",
        ],
      },
      {
        id: "tn_tieu_dem",
        loai: "chon1",
        bat_buoc: true,
        nhan: "Ban đêm bạn dậy đi tiểu mấy lần?",
        dap_an: ["0 lần", "1 lần", "2 lần", "Từ 3 lần trở lên"],
      },
      {
        id: "tn_mau_nuoc_tieu",
        loai: "chon1",
        bat_buoc: true,
        nhan: "Nước tiểu của bạn có màu gì?",
        dap_an: ["Trong", "Vàng nhạt", "Vàng sẫm", "Đục"],
      },
      {
        id: "tn_lung_goi",
        loai: "chon1",
        nhan: "Lưng và gối của bạn thế nào?",
        dap_an: ["Bình thường", "Mỏi, lạnh, thích chườm ấm", "Mỏi, nóng trong người, khô miệng"],
      },
      {
        id: "tn_thoi_diem_xuat_hien",
        loai: "chon1",
        nhan: "Triệu chứng của bạn xuất hiện như thế nào?",
        dap_an: ["Đột ngột vài ngày nay", "Kéo dài nhiều tháng"],
      },
      nguyHiem("tn_dau_hieu_nguy_hiem", "Tiểu ra máu · Sốt kèm đau hông lưng · Không tiểu được"),
    ]),
  },

  th: {
    ten: "Tiêu hóa",
    tieu_de: "Mô tả triệu chứng bệnh tiêu hóa",
    cau_hoi: danhSo("th", [
      {
        id: "th_van_de_gap_phai",
        loai: "chon_nhieu",
        bat_buoc: true,
        nhan: "Bạn gặp những vấn đề nào?",
        dap_an: [
          "Đau vùng thượng vị (trên rốn)",
          "Ợ hơi, ợ chua",
          "Đầy bụng, chướng hơi",
          "Buồn nôn",
          "Táo bón",
          "Tiêu chảy",
        ],
      },
      {
        id: "th_kieu_dau_bung",
        loai: "chon1",
        bat_buoc: true,
        nhan: "Cơn đau bụng của bạn giống mô tả nào nhất?",
        dap_an: [
          "Không đau bụng",
          "Âm ỉ, thích chườm ấm, thích xoa bóp",
          "Nóng rát, ợ chua",
          "Căng chướng, lan hai bên sườn, nặng khi căng thẳng",
          "Nhói cố định một chỗ, đau về đêm",
        ],
      },
      {
        id: "th_nang_hon_khi",
        loai: "chon1",
        nhan: "Triệu chứng của bạn nặng hơn trong trường hợp nào?",
        dap_an: [
          "Ăn đồ lạnh, đồ sống",
          "Ăn cay, nóng, chiên rán",
          "Căng thẳng, tức giận",
          "Ăn quá no, khó tiêu",
          "Không rõ",
        ],
      },
      {
        id: "th_tinh_chat_phan",
        loai: "chon1",
        bat_buoc: true,
        nhan: "Phân của bạn gần đây như thế nào?",
        dap_an: [
          "Bình thường",
          "Nát, không thành khuôn",
          "Khô cứng, táo",
          "Lúc táo lúc lỏng, tăng khi căng thẳng",
          "Có nhiều chất nhầy",
          "Lỏng vào sáng sớm",
        ],
      },
      {
        id: "th_noi_soi_da_day",
        loai: "chon1",
        nhan: "Bạn đã từng nội soi dạ dày chưa?",
        dap_an: ["Chưa", "Có, bình thường", "Có, viêm hoặc loét", "Có, nhiễm vi khuẩn HP"],
      },
      nguyHiem("th_dau_hieu_nguy_hiem", "Nôn ra máu · Đi ngoài phân đen hoặc có máu · Sụt cân nhanh không rõ lý do · Khó nuốt"),
    ]),
  },

  hh: {
    ten: "Hô hấp, Tai Mũi Họng",
    tieu_de: "Mô tả triệu chứng bệnh hô hấp, tai mũi họng",
    cau_hoi: danhSo("hh", [
      {
        id: "hh_van_de_gap_phai",
        loai: "chon_nhieu",
        bat_buoc: true,
        nhan: "Bạn gặp những vấn đề nào?",
        dap_an: ["Ho", "Khạc đờm", "Khò khè, khó thở", "Nghẹt mũi, sổ mũi", "Đau, rát họng", "Ù tai, nghẹt tai"],
      },
      {
        id: "hh_kieu_ho",
        loai: "chon1",
        nhan: "Nếu bạn bị ho, cơn ho của bạn như thế nào?",
        dap_an: [
          "Không ho",
          "Ho khan, rát họng",
          "Đờm trắng loãng, sợ lạnh",
          "Đờm vàng đặc",
          "Ho kéo dài, hụt hơi, nặng khi mệt",
        ],
      },
      {
        id: "hh_mui",
        loai: "chon1",
        nhan: "Mũi của bạn thế nào?",
        dap_an: [
          "Bình thường",
          "Nghẹt, nước mũi trong",
          "Nghẹt, nước mũi vàng đặc",
          "Hắt hơi từng cơn khi đổi thời tiết",
        ],
      },
      {
        id: "hh_hong",
        loai: "chon1",
        nhan: "Họng của bạn thế nào?",
        dap_an: ["Bình thường", "Đỏ, đau rát", "Vướng như có dị vật, không đau", "Khô họng nhiều về đêm"],
      },
      {
        id: "hh_chiu_thoi_tiet",
        loai: "chon1",
        nhan: "Khả năng chịu thời tiết của bạn thế nào?",
        dap_an: [
          "Dễ cảm khi đổi trời, hay bị tái đi tái lại",
          "Ngày nào cũng ho vào sáng sớm, lạnh",
          "Không bị ảnh hưởng",
        ],
      },
      nguyHiem("hh_dau_hieu_nguy_hiem", "Khó thở khi nghỉ · Ho ra máu · Sốt cao trên 3 ngày · Môi tím"),
    ]),
  },

  tm: {
    ten: "Tim mạch, Huyết áp",
    tieu_de: "Mô tả triệu chứng bệnh tim mạch, huyết áp",
    cau_hoi: danhSo("tm", [
      {
        id: "tm_van_de_gap_phai",
        loai: "chon_nhieu",
        bat_buoc: true,
        nhan: "Bạn gặp những vấn đề nào?",
        dap_an: [
          "Hồi hộp, đánh trống ngực",
          "Tức nặng ngực",
          "Khó thở khi gắng sức",
          "Chóng mặt",
          "Phù chân",
          "Đau đầu vùng gáy",
        ],
      },
      {
        id: "tm_huyet_ap",
        loai: "chon1",
        bat_buoc: true,
        nhan: "Huyết áp của bạn thường ở mức nào?",
        dap_an: ["Cao, trên 140/90", "Bình thường", "Thấp, dưới 90/60", "Chưa đo"],
      },
      {
        id: "tm_cam_giac_nguc",
        loai: "chon1",
        nhan: "Vùng ngực của bạn có cảm giác gì?",
        dap_an: ["Bình thường", "Tức nặng như bị đè", "Nhói từng cơn vùng tim", "Hồi hộp, hay lo, hay quên"],
      },
      { id: "tm_phu_chan", loai: "chon1", nhan: "Chân của bạn có bị phù không?", dap_an: ["Không", "Phù buổi chiều, ấn lõm"] },
      {
        id: "tm_nang_hon_khi",
        loai: "chon_nhieu",
        nhan: "Triệu chứng của bạn nặng hơn khi nào?",
        dap_an: [
          "Gắng sức, leo cầu thang",
          "Căng thẳng, tức giận",
          "Ăn mặn, ăn nhiều dầu mỡ",
          "Thức khuya, thiếu ngủ",
          "Không rõ",
        ],
      },
      nguyHiem("tm_dau_hieu_nguy_hiem", "Đau ngực dữ dội lan tay hoặc hàm · Khó thở khi nghỉ · Ngất · Huyết áp trên 180/110"),
    ]),
  },

  dl: {
    ten: "Da liễu",
    tieu_de: "Mô tả triệu chứng bệnh da liễu",
    cau_hoi: danhSo("dl", [
      {
        id: "dl_bieu_hien_da",
        loai: "chon_nhieu",
        bat_buoc: true,
        nhan: "Da của bạn đang có biểu hiện gì?",
        dap_an: ["Mẩn đỏ", "Ngứa", "Mụn", "Nổi mề đay", "Khô da, bong tróc", "Chàm, rỉ dịch"],
      },
      {
        id: "dl_vi_tri_ton_thuong",
        loai: "chon_nhieu",
        bat_buoc: true,
        nhan: "Tổn thương xuất hiện ở vị trí nào trên cơ thể bạn?",
        dap_an: ["Mặt", "Thân mình", "Tay chân", "Nếp gấp", "Da đầu", "Toàn thân"],
      },
      {
        id: "dl_tinh_chat_ngua",
        loai: "chon1",
        bat_buoc: true,
        nhan: "Bạn bị ngứa như thế nào?",
        dap_an: ["Không ngứa", "Tăng khi nóng, ra mồ hôi", "Tăng khi gặp gió, lạnh", "Ngứa về đêm, da khô"],
      },
      {
        id: "dl_chay_dich",
        loai: "chon1",
        nhan: "Tổn thương trên da của bạn có chảy dịch không?",
        dap_an: ["Không", "Dịch trong", "Có mủ vàng"],
      },
      {
        id: "dl_nang_hon_khi",
        loai: "chon_nhieu",
        nhan: "Bạn thấy tình trạng nặng hơn khi nào?",
        dap_an: ["Ăn hải sản, đồ cay", "Căng thẳng", "Thay đổi thời tiết", "Dùng mỹ phẩm, hóa chất", "Không rõ"],
      },
      nguyHiem("dl_dau_hieu_nguy_hiem", "Sưng môi, mặt kèm khó thở · Phát ban toàn thân kèm sốt · Vết loét lan nhanh"),
    ]),
  },

  pk: {
    ten: "Phụ khoa",
    tieu_de: "Mô tả triệu chứng bệnh phụ khoa",
    cau_hoi: danhSo("pk", [
      {
        id: "pk_tinh_trang",
        loai: "chon1",
        bat_buoc: true,
        nhan: "Tình trạng hiện tại của bạn là gì?",
        dap_an: ["Còn kinh", "Đã mãn kinh hoặc tiền mãn kinh", "Đang mang thai", "Đang cho con bú"],
      },
      {
        id: "pk_chu_ky_kinh",
        loai: "chon1",
        nhan: "Chu kỳ kinh của bạn thế nào?",
        dap_an: ["Đều", "Đến sớm", "Đến muộn", "Lúc sớm lúc muộn"],
      },
      {
        id: "pk_mau_luong_kinh",
        loai: "chon_nhieu",
        nhan: "Màu và lượng kinh của bạn thế nào?",
        dap_an: ["Bình thường", "Nhạt màu, ít", "Đỏ sẫm, có máu cục", "Đỏ tươi, nhiều"],
      },
      {
        id: "pk_khi_hu",
        loai: "chon1",
        nhan: "Khí hư của bạn thế nào?",
        dap_an: ["Bình thường", "Nhiều, trắng loãng", "Vàng, có mùi, ngứa", "Ít, khô"],
      },
      {
        id: "pk_dau_bung_kinh",
        loai: "chon1",
        nhan: "Bạn có bị đau bụng kinh không?",
        dap_an: ["Không", "Đau trước kỳ, tức ngực", "Đau trong kỳ, đỡ khi chườm ấm", "Đau âm ỉ sau kỳ"],
      },
      nguyHiem("pk_dau_hieu_nguy_hiem", 
        "Đang mang thai kèm ra máu, đau bụng · Ra huyết thấm hơn 1 băng mỗi giờ · Đau bụng dưới dữ dội kèm sốt",
      ),
    ]),
  },

  nt: {
    ten: "Nội tiết, Chuyển hóa",
    tieu_de: "Mô tả triệu chứng bệnh nội tiết, chuyển hóa",
    cau_hoi: danhSo("nt", [
      {
        id: "nt_chan_doan_nghi_ngo",
        loai: "chon_nhieu",
        bat_buoc: true,
        nhan: "Bạn đã được chẩn đoán hoặc nghi ngờ mắc bệnh nào?",
        dap_an: [
          "Tiểu đường hoặc tiền tiểu đường",
          "Mỡ máu cao",
          "Thừa cân, béo phì",
          "Bệnh tuyến giáp",
          "Tăng acid uric",
          "Chưa chẩn đoán, chỉ thấy mệt",
        ],
      },
      {
        id: "nt_khat_doi_tieu_nhieu",
        loai: "chon1",
        bat_buoc: true,
        nhan: "Bạn có bị khát, đói hoặc tiểu nhiều không?",
        dap_an: ["Không", "Khát nhiều, uống nhiều, tiểu nhiều", "Hay đói, ăn nhiều"],
      },
      {
        id: "nt_can_nang_6_thang",
        loai: "chon1",
        nhan: "Cân nặng của bạn 6 tháng gần đây thay đổi thế nào?",
        dap_an: ["Ổn định", "Tăng, người nặng nề, nhiều đờm", "Sụt cân dù ăn nhiều"],
      },
      {
        id: "nt_cam_giac_co_the",
        loai: "chon1",
        nhan: "Bạn cảm thấy cơ thể mình thế nào?",
        dap_an: [
          "Bình thường",
          "Mệt, hụt hơi",
          "Sợ lạnh, tay chân lạnh, lờ đờ",
          "Hồi hộp, nóng trong, ra mồ hôi",
        ],
      },
      {
        id: "nt_chi_so_xet_nghiem",
        loai: "doan",
        nhan: "Chỉ số xét nghiệm gần nhất của bạn là bao nhiêu (nếu có)?",
        chu_thich: "Ví dụ: đường huyết đói, HbA1c, cholesterol, TSH.",
      },
      nguyHiem("nt_dau_hieu_nguy_hiem", "Khát nhiều kèm lơ mơ, thở nhanh · Đường huyết trên 300 mg/dL · Sụt cân nhanh không rõ lý do"),
    ]),
  },
};

// ---- Trang Cảnh báo ---------------------------------------------------------
// Chỉ hiện khi bệnh nhân trả lời "Có" ở câu dấu hiệu nguy hiểm. Không chặn
// việc gửi phiếu — nút Tiếp vẫn đi tiếp.
export const CANH_BAO = {
  tieu_de: "Hãy đi khám trực tiếp sớm",
  tieu_de_nho: "Đừng chờ tư vấn online",
  y: [
    "Nếu triệu chứng đang xảy ra đột ngột, hãy gọi 115 hoặc đến cơ sở y tế gần nhất.",
    "Bạn vẫn có thể gửi phiếu này để bác sĩ theo dõi sau.",
  ],
};

// ---- Phần 3 · Thập vấn chung ------------------------------------------------
// Câu giới tính quyết định có hiện Phần 4 hay không (Nữ và không phải Phụ khoa).
export const GIOI_TINH_NU = "Nữ";

export const PHAN_THAP_VAN = {
  ten: "Thập vấn chung",
  tieu_de: "Cơ thể bạn thường ngày thế nào?",
  cau_hoi: danhSo("tv", [
    {
      id: "tv_cam_giac_hang_ngay",
      loai: "chon1",
      bat_buoc: true,
      nhan: "Bạn thường cảm thấy cơ thể thế nào hằng ngày?",
      dap_an: [
        "Sợ lạnh, tay chân lạnh",
        "Sợ nóng, người nóng",
        "Nóng về chiều tối, lòng bàn tay chân nóng",
        "Lúc nóng lúc lạnh",
        "Bình thường",
      ],
    },
    {
      id: "tv_mo_hoi",
      loai: "chon1",
      bat_buoc: true,
      nhan: "Mồ hôi của bạn thế nào?",
      dap_an: ["Bình thường", "Ra nhiều dù không vận động", "Ra khi ngủ, tỉnh dậy thì hết", "Ít hoặc không ra mồ hôi"],
    },
    {
      id: "tv_suc_khoe_chung",
      loai: "chon_nhieu",
      nhan: "Sức khỏe chung của bạn thế nào?",
      dap_an: ["Bình thường", "Hay mệt, hụt hơi", "Nói nhỏ, ngại nói", "Người nặng nề", "Lưng gối mỏi yếu"],
    },
    {
      id: "tv_an_uong",
      loai: "chon1",
      bat_buoc: true,
      nhan: "Việc ăn uống của bạn thế nào?",
      dap_an: ["Ngon miệng", "Chán ăn", "Ăn nhiều, mau đói", "Ăn xong đầy bụng, khó tiêu"],
    },
    { id: "tv_vi_mieng", loai: "chon1", nhan: "Miệng của bạn có vị gì?", dap_an: ["Bình thường", "Đắng", "Nhạt", "Dính, nhớt"] },
    {
      id: "tv_khat_nuoc",
      loai: "chon1",
      bat_buoc: true,
      nhan: "Bạn có hay khát nước không?",
      dap_an: [
        "Không khát",
        "Khát, thích uống lạnh",
        "Khát, thích uống ấm",
        "Khát nhưng không muốn uống",
        "Miệng họng khô về đêm",
      ],
    },
    {
      id: "tv_di_ngoai",
      loai: "chon1",
      bat_buoc: true,
      nhan: "Việc đi ngoài của bạn thế nào?",
      dap_an: ["Bình thường", "Táo, phân khô", "Phân nát, không thành khuôn", "Đi lỏng vào sáng sớm"],
    },
    { id: "tv_nuoc_tieu", loai: "chon1", nhan: "Nước tiểu của bạn thế nào?", dap_an: ["Trong, nhiều", "Vàng nhạt", "Vàng sẫm", "Đục"] },
    {
      id: "tv_giac_ngu",
      loai: "chon_nhieu",
      bat_buoc: true,
      nhan: "Giấc ngủ của bạn thế nào?",
      dap_an: ["Ngủ tốt", "Khó vào giấc", "Hay tỉnh giấc", "Mơ nhiều", "Ngủ nhiều vẫn mệt"],
    },
    {
      id: "tv_tinh_than",
      loai: "chon_nhieu",
      nhan: "Tinh thần của bạn thế nào?",
      dap_an: ["Bình thường", "Hay cáu gắt", "Lo âu", "Hay quên", "Uể oải"],
    },
    {
      id: "tv_benh_dang_co",
      loai: "chon_nhieu",
      bat_buoc: true,
      nhan: "Bạn đang có bệnh nào?",
      dap_an: ["Không có", "Tăng huyết áp", "Tiểu đường", "Mỡ máu", "Dạ dày", "Gan", "Thận", "Tim mạch"],
    },
    { id: "tv_thuoc_dang_dung", loai: "doan", nhan: "Bạn đang dùng thuốc gì (nếu có)?" },
    {
      id: "gioi_tinh",
      loai: "chon1",
      bat_buoc: true,
      nhan: "Giới tính của bạn là gì?",
      dap_an: ["Nam", GIOI_TINH_NU],
    },
  ]),
};

// ---- Phần 4 · Kinh nguyệt ---------------------------------------------------
export const PHAN_KINH_NGUYET = {
  ten: "Kinh nguyệt",
  tieu_de: "Kinh nguyệt của bạn thế nào?",
  cau_hoi: danhSo("kn", [
    {
      id: "kn_tinh_trang",
      loai: "chon1",
      bat_buoc: true,
      nhan: "Tình trạng hiện tại của bạn là gì?",
      dap_an: ["Kinh đều", "Kinh không đều", "Đã mãn kinh", "Đang mang thai", "Đang cho con bú"],
    },
    {
      id: "kn_mau_luong_kinh",
      loai: "chon_nhieu",
      nhan: "Màu và lượng kinh của bạn thế nào?",
      chu_thich: "Bỏ qua nếu đã mãn kinh.",
      dap_an: ["Bình thường", "Nhạt màu, ít", "Đỏ sẫm, có máu cục", "Đỏ tươi, nhiều"],
    },
    {
      id: "kn_dau_bung_kinh",
      loai: "chon1",
      nhan: "Bạn có bị đau bụng kinh không?",
      dap_an: ["Không", "Nhẹ", "Nặng, đỡ khi chườm ấm"],
    },
  ]),
};

// ---- Phần 5 · Ảnh lưỡi ------------------------------------------------------
// `nen: true` là dòng màu xanh, `nen: false` là dòng màu đỏ.
export const PHAN_ANH_LUOI = {
  ten: "Ảnh lưỡi",
  tieu_de: "Chụp ảnh lưỡi",
  huong_dan_tieu_de: "Chụp thế nào cho đúng?",
  huong_dan: [
    { nen: true, chu: "Nên chụp gần cửa sổ, ánh sáng tự nhiên, tốt nhất vào buổi sáng" },
    { nen: true, chu: "Nên thè lưỡi tự nhiên, thấy rõ cả đầu lưỡi và gốc lưỡi" },
    { nen: false, chu: "Không bật filter, không chụp dưới đèn vàng" },
    { nen: false, chu: "Không ăn uống đồ có màu (cà phê, trà, kẹo) trong 30 phút trước khi chụp" },
  ],
  cau_hoi: danhSo("luoi", [
    {
      id: "luoi_anh",
      loai: "anh",
      nhan: "Bạn hãy tải ảnh lưỡi lên (1–3 ảnh)",
      toi_da: 3,
      mb_toi_da: 10,
    },
    {
      id: "luoi_an_uong_mau",
      loai: "chon1",
      nhan: "30 phút trước khi chụp, bạn có ăn uống đồ có màu không?",
      dap_an: ["Không", "Có"],
    },
    { id: "luoi_ghi_chu", loai: "doan", nhan: "Bạn muốn nói thêm điều gì với bác sĩ?" },
  ]),
};

// ---- Màn hình sau khi gửi ---------------------------------------------------
// {ten} và {sdt} được thay bằng họ tên và số điện thoại bệnh nhân đã điền.
export const DA_GUI = {
  tieu_de: "Đã gửi phiếu",
  noi_dung: "Cảm ơn {ten}. Bác sĩ sẽ xem phiếu và liên hệ qua Zalo {sdt}.",
};
