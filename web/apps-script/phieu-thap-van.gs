// Nơi nhận Phiếu Thập Vấn — dán nguyên file này vào Google Apps Script gắn
// với Google Sheet của bác sĩ (cách làm: HUONG-DAN.md cùng thư mục).
//
// Mỗi lần bệnh nhân bấm "Gửi phiếu":
//   - mỗi câu hỏi là một cột trong sheet "Phiếu", mỗi phiếu là một dòng;
//   - ảnh lưỡi lưu vào thư mục riêng trong Google Drive của bác sĩ, ô trong
//     sheet là link tới ảnh.
//
// Bảo mật:
//   - Chỉ có doPost (nhận vào). doGet chỉ trả một dòng chữ, không có đường
//     nào đọc dữ liệu ra từ bên ngoài.
//   - Ảnh để chế độ riêng tư: chỉ tài khoản chủ Drive mở được link. KHÔNG
//     đổi thành "ai có link cũng xem được" — đây là ảnh sức khỏe.
//   - Không ghi dữ liệu bệnh nhân vào nhật ký (Logger/console).
//   - Giới hạn số cột, độ dài chữ, số ảnh, dung lượng và loại ảnh để chống
//     gửi rác.

const TEN_SHEET = "Phiếu";
const TEN_THU_MUC = "Phiếu thập vấn - ảnh lưỡi";
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
    // Họ tên do trang gửi riêng (chữ câu hỏi có thể đổi); chỉ dùng để đặt tên file ảnh.
    const ho_ten = typeof goi.ho_ten === "string" ? goi.ho_ten.slice(0, 100) : "";

    // Lưu ảnh trước: Drive lỗi thì chưa ghi dòng nào, bệnh nhân gửi lại
    // không bị trùng phiếu.
    const link_theo_cot = {};
    (goi.anh || []).forEach(function (a, i) {
      const ten_file = ma_ngay + "_" + boDau_(ho_ten) + "_" + (i + 1) + "." + LOAI_ANH[a.mime];
      const blob = Utilities.newBlob(Utilities.base64Decode(a.du_lieu), a.mime, ten_file);
      const file = layThuMuc_().createFile(blob);
      (link_theo_cot[a.cot] = link_theo_cot[a.cot] || []).push(file.getUrl());
    });

    // Cột "Thời gian gửi" luôn đứng đầu, sau đó tới từng câu hỏi theo thứ
    // tự lần đầu gặp. Câu hỏi mới (bác sĩ thêm vào phiếu) tự có cột mới.
    const tieu_de = ["Thời gian gửi"].concat(goi.cot.map(function (c) { return c.tieu_de; }));
    const cot_cua = capNhatTieuDe_(sheet, tieu_de);
    const dong = new Array(sheet.getLastColumn()).fill("");
    dong[0] = Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm:ss");
    goi.cot.forEach(function (c) {
      const links = link_theo_cot[c.tieu_de];
      dong[cot_cua[c.tieu_de]] = links ? links.join("\n") : chongCongThuc_(String(c.gia_tri).slice(0, TOI_DA_CHU_O));
    });

    const so_dong = sheet.getLastRow() + 1;
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
    if (typeof c.tieu_de !== "string" || c.tieu_de.length === 0 || c.tieu_de.length > TOI_DA_CHU_TIEU_DE) {
      throw new Error("sai tiêu đề cột");
    }
    // Tiêu đề ghi thẳng vào hàng 1 của Sheet nên cũng là chỗ chèn công thức
    // (vd =IMPORTXML(...) đẩy dữ liệu bệnh nhân ra ngoài). Tiêu đề thật luôn
    // có dạng "Tên phần | Câu hỏi", bắt đầu bằng chữ cái.
    if (!/^\p{L}/u.test(c.tieu_de) || c.tieu_de.indexOf(" | ") < 0) throw new Error("tiêu đề lạ");
    if (da_thay[c.tieu_de]) throw new Error("trùng cột");
    da_thay[c.tieu_de] = true;
    if (typeof c.gia_tri !== "string") throw new Error("sai giá trị");
  });
  const anh = goi.anh || [];
  if (!Array.isArray(anh) || anh.length > TOI_DA_ANH) throw new Error("quá nhiều ảnh");
  anh.forEach(function (a) {
    if (!LOAI_ANH[a.mime]) throw new Error("loại ảnh không nhận");
    if (typeof a.du_lieu !== "string" || a.du_lieu.length > TOI_DA_BYTE_ANH * 1.4) throw new Error("ảnh quá nặng");
    if (typeof a.cot !== "string" || !da_thay[a.cot]) throw new Error("ảnh không thuộc câu hỏi nào");
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

// Bảo đảm mọi tiêu đề đã có cột, trả về { tiêu đề: số cột bắt đầu từ 0 }.
function capNhatTieuDe_(sheet, tieu_de) {
  const so_cot_dang_co = sheet.getLastColumn();
  const da_co = so_cot_dang_co > 0 ? sheet.getRange(1, 1, 1, so_cot_dang_co).getValues()[0] : [];
  const cot_cua = Object.create(null);
  da_co.forEach(function (t, i) { cot_cua[t] = i; });

  const moi = tieu_de.filter(function (t) { return !(t in cot_cua); });
  if (moi.length > 0) {
    const ghi_tu = da_co.length + 1;
    if (da_co.length + moi.length > TOI_DA_COT_SHEET) throw new Error("quá nhiều cột");
    moRongLuoi_(sheet, 1, da_co.length + moi.length);
    const o_tieu_de = sheet.getRange(1, ghi_tu, 1, moi.length);
    o_tieu_de.setNumberFormat("@");
    o_tieu_de.setValues([moi]).setFontWeight("bold");
    moi.forEach(function (t, i) { cot_cua[t] = ghi_tu - 1 + i; });
    sheet.setFrozenRows(1);
  }
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
