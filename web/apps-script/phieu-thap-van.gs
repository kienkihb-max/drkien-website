// Nơi nhận Phiếu Thập Vấn — dán nguyên file này vào Google Apps Script gắn
// với Google Sheet của bác sĩ (cách làm: HUONG-DAN.md cùng thư mục).
//
// Mỗi lần bệnh nhân bấm "Gửi phiếu":
//   - mỗi câu hỏi là một cột trong sheet "Phiếu", mỗi phiếu là một dòng;
//   - ảnh lưỡi lưu vào thư mục riêng trong Google Drive của bác sĩ, ô trong
//     sheet là link tới ảnh.
//
// Trang web và script nói chuyện với nhau bằng MÃ CÂU HỎI (ví dụ cxk_1),
// không bằng chữ câu hỏi. Sheet có hai dòng tiêu đề:
//   dòng 1 = mã câu hỏi (khóa cố định, script tìm cột theo đây),
//   dòng 2 = chữ câu hỏi hiện trên web (script tự cập nhật khi chủ site đổi chữ).
// Nhờ vậy đổi chữ hay đổi thứ tự câu hỏi ở web không làm lệch hay sinh cột
// mới. Dữ liệu từ dòng 3 trở xuống. Bác sĩ kéo đổi chỗ cột thoải mái: cả hai
// dòng tiêu đề đi cùng cột nên script vẫn tìm đúng.
//
// Bảo mật:
//   - Chỉ có doPost (nhận vào). doGet chỉ trả một dòng chữ, không có đường
//     nào đọc dữ liệu ra từ bên ngoài.
//   - Ảnh để chế độ riêng tư: chỉ tài khoản chủ Drive mở được link. KHÔNG
//     đổi thành "ai có link cũng xem được" — đây là ảnh sức khỏe.
//   - Không ghi dữ liệu bệnh nhân vào nhật ký (Logger/console).
//   - Giới hạn số cột, độ dài chữ, số ảnh, dung lượng và loại ảnh để chống
//     gửi rác; chặn gửi dồn dập; chữ bắt đầu bằng = + - @ không thành công thức.

const TEN_SHEET = "Phiếu";
const TEN_THU_MUC = "Phiếu thập vấn - ảnh lưỡi";
const DONG_MA = 1;       // dòng chứa mã câu hỏi
const DONG_CHU = 2;      // dòng chứa chữ câu hỏi
const DONG_DAU_DU_LIEU = 3;
const MA_GIO_GUI = "_gui_luc";
const TOI_DA_ANH = 3;
// Ảnh đã được trang nén còn vài trăm KB; trên mức này coi là gửi bậy.
const TOI_DA_BYTE_ANH = 3 * 1024 * 1024;
const TOI_DA_COT = 200;
// Tổng số cột của cả Sheet. Phiếu thật hiện cần chừng 90 cột (mọi chuyên
// khoa cộng lại); trần này chặn kẻ gửi bậy làm Sheet phình cột vô hạn.
const TOI_DA_COT_SHEET = 150;
// Chặn gửi dồn dập: tối đa chừng này phiếu mỗi phút cho cả trang.
const TOI_DA_PHIEU_MOI_PHUT = 20;
const TOI_DA_CHU_TIEU_DE = 200;
// Một ô Google Sheet chứa tối đa 50.000 ký tự; cắt sớm cho chắc.
const TOI_DA_CHU_O = 5000;
const LOAI_ANH = { "image/jpeg": "jpg", "image/png": "png" };
const KHUON_MA = /^[a-z][a-z0-9_]{0,39}$/;

function doGet() {
  return ContentService.createTextOutput("Nơi nhận phiếu đang hoạt động.");
}

function doPost(e) {
  const khoa = LockService.getScriptLock();
  let da_khoa = false;
  try {
    // Hai bệnh nhân gửi cùng lúc thì xếp hàng, khỏi ghi đè lên cột của nhau.
    khoa.waitLock(30000);
    da_khoa = true;

    chanGuiDonDap_();

    const goi = JSON.parse(e.postData.contents);
    kiemTra_(goi);

    const sheet = laySheet_();
    const ma_ngay = Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "yyyyMMdd-HHmmss");
    // Họ tên và năm sinh trang gửi riêng, chỉ dùng để đặt tên file ảnh.
    const ho_ten = typeof goi.ho_ten === "string" ? goi.ho_ten.slice(0, 100) : "";
    const nam_sinh = typeof goi.nam_sinh === "string" ? goi.nam_sinh.replace(/\D/g, "").slice(0, 4) : "";

    // Lưu ảnh trước: Drive lỗi thì chưa ghi dòng nào, bệnh nhân gửi lại
    // không bị trùng phiếu.
    const link_theo_ma = {};
    (goi.anh || []).forEach(function (a, i) {
      const ten_file = ma_ngay + "_" + boDau_(ho_ten) + (nam_sinh ? "_" + nam_sinh : "") + "_" + (i + 1) + "." + LOAI_ANH[a.mime];
      const blob = Utilities.newBlob(Utilities.base64Decode(a.du_lieu), a.mime, ten_file);
      const file = layThuMuc_().createFile(blob);
      (link_theo_ma[a.ma] = link_theo_ma[a.ma] || []).push(file.getUrl());
    });

    // Cột "Thời gian gửi" luôn có; sau đó tới từng câu hỏi theo thứ tự lần
    // đầu gặp. Câu hỏi mới (bác sĩ thêm vào phiếu) tự có cột mới.
    const cot_khai = [{ ma: MA_GIO_GUI, tieu_de: "Thời gian gửi" }].concat(goi.cot);
    const cot_cua = capNhatCot_(sheet, cot_khai);
    const dong = new Array(sheet.getLastColumn()).fill("");
    dong[cot_cua[MA_GIO_GUI]] = Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm:ss");
    goi.cot.forEach(function (c) {
      const links = link_theo_ma[c.ma];
      dong[cot_cua[c.ma]] = links ? links.join("\n") : chongCongThuc_(String(c.gia_tri).slice(0, TOI_DA_CHU_O));
    });

    const so_dong = Math.max(sheet.getLastRow() + 1, DONG_DAU_DU_LIEU);
    moRongLuoi_(sheet, so_dong, dong.length);
    // Định dạng "văn bản thuần" để giữ số 0 đầu của số điện thoại. Việc này
    // KHÔNG đủ chặn công thức: đã thử, ô "=1+1" vẫn bị tính thành 2 — nên
    // còn có chongCongThuc_ ở trên.
    const vung = sheet.getRange(so_dong, 1, 1, dong.length);
    vung.setNumberFormat("@");
    vung.setValues([dong]);

    return json_({ ok: true });
  } catch (loi) {
    // Chỉ trả "không được", không kèm chi tiết ra ngoài.
    return json_({ ok: false });
  } finally {
    if (da_khoa) khoa.releaseLock();
  }
}

// ---- Kiểm tra dữ liệu gửi tới ----------------------------------------------
function kiemTra_(goi) {
  if (!goi || !Array.isArray(goi.cot) || goi.cot.length === 0 || goi.cot.length > TOI_DA_COT) {
    throw new Error("sai dạng");
  }
  const da_thay = Object.create(null);
  goi.cot.forEach(function (c) {
    if (typeof c.ma !== "string" || !KHUON_MA.test(c.ma) || c.ma === MA_GIO_GUI) throw new Error("mã câu hỏi lạ");
    if (typeof c.tieu_de !== "string" || c.tieu_de.length === 0 || c.tieu_de.length > TOI_DA_CHU_TIEU_DE) {
      throw new Error("sai tiêu đề cột");
    }
    // Chữ câu hỏi ghi thẳng vào dòng tiêu đề của Sheet nên cũng là chỗ chèn
    // công thức (vd =IMPORTXML(...) đẩy dữ liệu bệnh nhân ra ngoài). Chữ thật
    // luôn có dạng "Tên phần | Câu hỏi", bắt đầu bằng chữ cái.
    if (!/^\p{L}/u.test(c.tieu_de) || c.tieu_de.indexOf(" | ") < 0) throw new Error("tiêu đề lạ");
    if (da_thay[c.ma]) throw new Error("trùng mã");
    da_thay[c.ma] = true;
    if (typeof c.gia_tri !== "string") throw new Error("sai giá trị");
  });
  const anh = goi.anh || [];
  if (!Array.isArray(anh) || anh.length > TOI_DA_ANH) throw new Error("quá nhiều ảnh");
  anh.forEach(function (a) {
    if (!LOAI_ANH[a.mime]) throw new Error("loại ảnh không nhận");
    if (typeof a.du_lieu !== "string" || a.du_lieu.length > TOI_DA_BYTE_ANH * 1.4) throw new Error("ảnh quá nặng");
    if (typeof a.ma !== "string" || !da_thay[a.ma]) throw new Error("ảnh không thuộc câu hỏi nào");
  });
}

// ---- Giới hạn tốc độ -------------------------------------------------------
function chanGuiDonDap_() {
  const bo_nho = CacheService.getScriptCache();
  const phut = Math.floor(Date.now() / 60000);
  const khoa = "so_phieu_" + phut;
  const da_gui = Number(bo_nho.get(khoa) || 0);
  if (da_gui >= TOI_DA_PHIEU_MOI_PHUT) throw new Error("gửi quá nhanh");
  bo_nho.put(khoa, String(da_gui + 1), 120);
}

// ---- Sheet và Drive --------------------------------------------------------
function laySheet_() {
  const bang = SpreadsheetApp.getActiveSpreadsheet();
  return bang.getSheetByName(TEN_SHEET) || bang.insertSheet(TEN_SHEET);
}

// Bảo đảm mọi mã câu hỏi đã có cột; trả về { mã: số cột bắt đầu từ 0 }.
// Cột mới: ghi mã ở dòng 1, chữ ở dòng 2. Cột cũ mà chữ câu hỏi đã đổi: cập
// nhật dòng 2, dữ liệu giữ nguyên.
function capNhatCot_(sheet, cot_khai) {
  const so_cot = sheet.getLastColumn();
  const dong_ma = so_cot > 0 ? sheet.getRange(DONG_MA, 1, 1, so_cot).getValues()[0] : [];
  const dong_chu = so_cot > 0 ? sheet.getRange(DONG_CHU, 1, 1, so_cot).getValues()[0] : [];
  const cot_cua = Object.create(null);
  dong_ma.forEach(function (ma, i) { if (ma !== "") cot_cua[ma] = i; });

  const moi = cot_khai.filter(function (c) { return !(c.ma in cot_cua); });
  if (moi.length > 0) {
    const ghi_tu = so_cot + 1;
    if (so_cot + moi.length > TOI_DA_COT_SHEET) throw new Error("quá nhiều cột");
    moRongLuoi_(sheet, DONG_CHU, so_cot + moi.length);
    const o_tieu_de = sheet.getRange(DONG_MA, ghi_tu, 2, moi.length);
    o_tieu_de.setNumberFormat("@");
    o_tieu_de.setValues([
      moi.map(function (c) { return c.ma; }),
      moi.map(function (c) { return c.tieu_de; }),
    ]);
    sheet.getRange(DONG_MA, ghi_tu, 1, moi.length).setFontColor("#888888").setFontSize(8);
    sheet.getRange(DONG_CHU, ghi_tu, 1, moi.length).setFontWeight("bold");
    moi.forEach(function (c, i) { cot_cua[c.ma] = ghi_tu - 1 + i; });
    sheet.setFrozenRows(DONG_CHU);
  }

  // Chữ câu hỏi đã đổi trên web: cập nhật tên cột.
  cot_khai.forEach(function (c) {
    const i = cot_cua[c.ma];
    if (i < dong_chu.length && dong_chu[i] !== c.tieu_de) {
      sheet.getRange(DONG_CHU, i + 1).setNumberFormat("@").setValue(c.tieu_de);
    }
  });
  return cot_cua;
}

// Sheet mới chỉ có 26 cột, 1000 dòng; ghi ra ngoài lưới là Apps Script báo
// lỗi. Nới thêm đúng phần thiếu.
function moRongLuoi_(sheet, so_dong, so_cot) {
  if (sheet.getMaxColumns() < so_cot) sheet.insertColumnsAfter(sheet.getMaxColumns(), so_cot - sheet.getMaxColumns());
  if (sheet.getMaxRows() < so_dong) sheet.insertRowsAfter(sheet.getMaxRows(), so_dong - sheet.getMaxRows());
}

function layThuMuc_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("THU_MUC_ANH");
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* thư mục bị xóa: tạo lại bên dưới */ }
  }
  const thu_muc = DriveApp.createFolder(TEN_THU_MUC);
  props.setProperty("THU_MUC_ANH", thu_muc.getId());
  return thu_muc;
}

// ---- Tiện ích --------------------------------------------------------------
function json_(doi_tuong) {
  return ContentService.createTextOutput(JSON.stringify(doi_tuong)).setMimeType(ContentService.MimeType.JSON);
}

// Chữ bệnh nhân gõ mà bắt đầu bằng = + - @ sẽ bị Sheet hiểu là công thức
// (có thể gọi hàm lấy dữ liệu, hoặc chèn link giả). Thêm dấu nháy đơn ở đầu:
// Sheet coi là văn bản thuần và không hiện dấu nháy đó ra.
function chongCongThuc_(chu) {
  return /^[=+\-@\t\r]/.test(chu) ? "'" + chu : chu;
}

// "Trần Thị B" -> "Tran-Thi-B", để tên file ảnh không có dấu và ký tự lạ.
function boDau_(chu) {
  const s = String(chu || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "")
    .slice(0, 40);
  return s || "khong-ten";
}
