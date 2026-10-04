// Gửi Phiếu Thập Vấn: Supabase là nơi lưu chính, Google Sheet là bản sao phụ.
// Hợp đồng bảng và bucket nằm ở web/supabase/phieu-sang-loc.sql — đổi một bên
// thì phải đổi bên kia.
//
// File này chạy trong trình duyệt bệnh nhân. Tuyệt đối không console.log dữ
// liệu phiếu: đó là dữ liệu sức khỏe.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface CauTraLoi {
  ma: string;
  tieu_de: string;
  gia_tri: string;
}

export interface PhieuGui {
  id: string;
  ho_ten: string;
  nam_sinh: number | null;
  sdt: string;
  chuyen_khoa: string | null;
  cau_tra_loi: CauTraLoi[];
}

// Client RIÊNG, không lưu phiên: bệnh nhân luôn là "anon". Dùng chung client
// của supabase.ts thì lỡ chủ site đang đăng nhập admin trên cùng trình duyệt,
// phiếu thử sẽ được gửi bằng quyền admin và che mất lỗi phân quyền thật.
// Tạo lười (lúc gửi) để thiếu biến môi trường chỉ làm hỏng việc gửi chứ không
// làm sập cả trang.
let khach: SupabaseClient | null = null;
function layKhach(): SupabaseClient {
  if (khach) return khach;
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const khoa = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !khoa) throw new Error("thiếu cấu hình Supabase");
  khach = createClient(url, khoa, { auth: { persistSession: false, autoRefreshToken: false } });
  return khach;
}

/**
 * Nén ảnh về JPEG cạnh dài tối đa 1600px, chất lượng 0.82. Ảnh điện thoại
 * 5–10MB, ba tấm là gần 30MB; thu lại còn 300–500KB/tấm mà bác sĩ vẫn thấy
 * rõ màu và lớp rêu lưỡi. Dùng chung cho cả Supabase (Blob) lẫn Apps Script
 * (base64, xem blobSangBase64).
 */
export function nenAnh(f: File): Promise<Blob> {
  return new Promise((xong, loi) => {
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const he_so = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * he_so);
      c.height = Math.round(img.height * he_so);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(
        (b) => (b ? xong(b) : loi(new Error("Vui lòng chọn ảnh khác, không đọc được ảnh " + f.name))),
        "image/jpeg",
        0.82,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      loi(new Error("Vui lòng chọn ảnh khác, không đọc được ảnh " + f.name));
    };
    img.src = url;
  });
}

/** Apps Script nhận ảnh dạng base64 thuần (không có tiền tố "data:..."). */
export function blobSangBase64(b: Blob): Promise<string> {
  return new Promise((xong, loi) => {
    const doc = new FileReader();
    doc.onload = () => xong(String(doc.result).split(",")[1] ?? "");
    doc.onerror = () => loi(new Error("không đọc được ảnh"));
    doc.readAsDataURL(b);
  });
}

/**
 * Lưu phiếu vào Supabase: tải ảnh lên trước rồi mới thêm dòng, để dòng phiếu
 * không bao giờ trỏ tới ảnh chưa có. Ném lỗi nếu bất kỳ bước nào hỏng.
 *
 * Hai điều bắt buộc theo phân quyền của anon (xem file .sql):
 *  - insert KHÔNG kèm .select(): anon không có quyền đọc, kèm vào là lỗi.
 *  - upload không bật upsert: không có quyền ghi đè.
 */
export async function guiVaoSupabase(phieu: PhieuGui, anh: Blob[]): Promise<void> {
  const db = layKhach();
  const duong_anh: string[] = [];
  for (let i = 0; i < anh.length; i++) {
    const duong = `${phieu.id}/${i + 1}.jpg`;
    const { error } = await db.storage
      .from("phieu-anh")
      .upload(duong, anh[i], { contentType: "image/jpeg", upsert: false });
    if (error) throw new Error("tải ảnh lên lỗi");
    duong_anh.push(duong);
  }
  const { error } = await db.from("phieu_sang_loc").insert({ ...phieu, anh: duong_anh });
  if (error) throw new Error("lưu phiếu lỗi");
}
