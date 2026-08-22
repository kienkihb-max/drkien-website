// Tải ảnh lên Supabase Storage, từ trình duyệt.
//
// Ảnh chụp từ điện thoại giờ thường 4000px và 5–8 MB. Đẩy nguyên lên là
// trang tải chậm hẳn trên mạng di động, mà người đọc site này phần lớn vào
// bằng điện thoại. Nên thu nhỏ và nén TRƯỚC khi gửi đi — làm ngay trong
// trình duyệt, không cần máy chủ xử lý ảnh.
//
// Nhân tiện đo luôn kích thước thật: đây là lúc duy nhất còn cầm tấm ảnh
// trong tay, sau này lúc build chỉ còn cái địa chỉ.
import { supabase } from "./supabase";

/** Chiều ngang tối đa. 1600 đủ nét cho ảnh bìa full chiều rộng bài viết. */
const RONG_TOI_DA = 1600;
/** Chất lượng nén JPEG. 0.82 là chỗ mắt thường chưa thấy khác mà file nhỏ đi nhiều. */
const CHAT_LUONG = 0.82;

export interface AnhDaTai {
  /** Địa chỉ công khai, dán thẳng vào thẻ <img src>. */
  dia_chi: string;
  rong: number;
  cao: number;
  /** Cỡ file sau khi nén, tính bằng byte. */
  co_file: number;
}

/** Đổi tên file thành dạng không dấu, an toàn cho đường dẫn. */
function tenAnToan(ten: string) {
  const duoi = (ten.match(/\.[a-z0-9]+$/i)?.[0] ?? ".jpg").toLowerCase();
  return (
    ten
      .replace(/\.[a-z0-9]+$/i, "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "anh"
  ) + duoi;
}

/** Đọc file thành ảnh để biết kích thước và vẽ lại được. */
function docAnh(tep: File): Promise<HTMLImageElement> {
  return new Promise((xong, hong) => {
    const dia_chi = URL.createObjectURL(tep);
    const anh = new Image();
    anh.onload = () => {
      URL.revokeObjectURL(dia_chi);
      xong(anh);
    };
    anh.onerror = () => {
      URL.revokeObjectURL(dia_chi);
      hong(new Error("Không đọc được ảnh. File có đúng là ảnh không?"));
    };
    anh.src = dia_chi;
  });
}

function veLai(anh: HTMLImageElement, rong: number, cao: number): Promise<Blob> {
  const khung = document.createElement("canvas");
  khung.width = rong;
  khung.height = cao;
  const but = khung.getContext("2d");
  if (!but) throw new Error("Trình duyệt không vẽ được ảnh.");
  but.drawImage(anh, 0, 0, rong, cao);
  return new Promise((xong, hong) => {
    khung.toBlob(
      (b) => (b ? xong(b) : hong(new Error("Không nén được ảnh."))),
      "image/jpeg",
      CHAT_LUONG
    );
  });
}

/**
 * Nén rồi tải một tấm ảnh lên kho.
 * @param tep    file người dùng chọn
 * @param thu_muc thư mục trong kho, ví dụ slug của bài
 */
export async function taiAnhLen(tep: File, thu_muc = "bai"): Promise<AnhDaTai> {
  if (!tep.type.startsWith("image/")) {
    throw new Error(`"${tep.name}" không phải là ảnh.`);
  }

  const anh = await docAnh(tep);

  // Chỉ thu nhỏ, không phóng to: ảnh vốn đã nhỏ mà kéo giãn ra thì chỉ mờ
  // thêm chứ không nét hơn.
  const ti_le = Math.min(1, RONG_TOI_DA / anh.naturalWidth);
  const rong = Math.round(anh.naturalWidth * ti_le);
  const cao = Math.round(anh.naturalHeight * ti_le);

  // Ảnh nhỏ sẵn và đã là JPEG thì gửi nguyên file, khỏi nén lại — nén lại
  // một tấm đã nén chỉ làm nó xấu đi.
  const can_ve_lai = ti_le < 1 || tep.type !== "image/jpeg";
  const du_lieu = can_ve_lai ? await veLai(anh, rong, cao) : tep;

  // Tên file gắn thêm dấu thời gian để tải lại cùng một tên không đè lên
  // ảnh cũ — bài cũ vẫn đang dùng tấm đó.
  const dau_thoi_gian = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const ten = `${thu_muc}/${dau_thoi_gian}-${tenAnToan(tep.name)}`;

  const { error } = await supabase.storage.from("anh").upload(ten, du_lieu, {
    contentType: can_ve_lai ? "image/jpeg" : tep.type,
    cacheControl: "31536000", // ảnh không đổi nội dung, cho trình duyệt nhớ 1 năm
    upsert: false,
  });
  if (error) {
    throw new Error(
      error.message.includes("row-level security")
        ? "Tài khoản này chưa có quyền tải ảnh. Kiểm tra bảng nguoi_viet."
        : "Không tải được ảnh: " + error.message
    );
  }

  const { data } = supabase.storage.from("anh").getPublicUrl(ten);
  return { dia_chi: data.publicUrl, rong, cao, co_file: du_lieu.size };
}
