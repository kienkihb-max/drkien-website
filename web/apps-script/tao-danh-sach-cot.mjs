// In ra danh sách "mã câu hỏi + tên cột" của toàn bộ phiếu, theo đúng thứ tự
// trên form, để dán vào hằng DANH_SACH_CAU_HOI trong phieu-thap-van.gs.
//
// Dùng khi: sửa câu hỏi ở data/phieu-thap-van.mjs (thêm câu, đổi chữ, đổi thứ
// tự) rồi muốn Sheet có sẵn đủ cột đúng thứ tự trước khi có phiếu đầu tiên.
//   node web/apps-script/tao-danh-sach-cot.mjs
// Cách dán và chạy: HUONG-DAN.md, mục "Tạo sẵn cột".
import {
  PHAN_VAN_DE,
  BO_CHUYEN_KHOA,
  PHAN_THAP_VAN,
  PHAN_KINH_NGUYET,
  PHAN_ANH_LUOI,
  PHAN_LIEN_HE,
} from "../src/data/phieu-thap-van.mjs";

const CAC_PHAN = [
  PHAN_VAN_DE,
  ...Object.values(BO_CHUYEN_KHOA),
  PHAN_THAP_VAN,
  PHAN_KINH_NGUYET,
  PHAN_ANH_LUOI,
  PHAN_LIEN_HE,
];

// Tên cột = "Tên phần | Câu hỏi", giống hệt chữ trang gửi lên (data-cot).
const dong = [];
for (const phan of CAC_PHAN) {
  for (const c of phan.cau_hoi) dong.push(`  [${JSON.stringify(c.id)}, ${JSON.stringify(phan.ten + " | " + c.nhan)}],`);
}
console.log("const DANH_SACH_CAU_HOI = [\n" + dong.join("\n") + "\n];");
