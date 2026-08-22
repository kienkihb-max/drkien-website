// Bảo Cloudflare dựng lại web sau khi đăng bài.
//
// Vì sao cần: web là HTML tĩnh, dựng sẵn lúc build. Bài mới nằm trong
// database thì chưa thành trang — phải có một lần build nữa nó mới ra file
// .html để Google và người đọc thấy. Cloudflare cho một địa chỉ "Deploy
// Hook": gọi POST vào đó là nó build lại, không cần đăng nhập gì.
//
// Chính chỗ "không cần đăng nhập gì" là lý do địa chỉ ấy KHÔNG được nằm
// trong mã nguồn: trang này là tĩnh, mọi dòng JS đều tải về đọc được. Nên
// nó cất trong bảng cau_hinh của Supabase, khoá bằng RLS: chỉ tài khoản có
// tên trong nguoi_viet mới đọc ra.
import { supabase } from "./supabase";

/** Khoá của dòng chứa địa chỉ Deploy Hook trong bảng cau_hinh. */
const KHOA = "moc_dung_lai";

export interface KetQuaDungLai {
  /** true nghĩa là đã gửi được yêu cầu build đi. */
  xong: boolean;
  /** Câu để hiện thẳng cho người dùng đọc. */
  chu: string;
}

/**
 * Gọi Deploy Hook. Không bao giờ ném lỗi — đăng bài đã xong rồi, hỏng ở
 * bước này thì cùng lắm là web chậm cập nhật, không được để nó trông như
 * đăng thất bại.
 */
export async function dungLaiWeb(): Promise<KetQuaDungLai> {
  const { data, error } = await supabase
    .from("cau_hinh")
    .select("gia_tri")
    .eq("khoa", KHOA)
    .maybeSingle();

  if (error) {
    return { xong: false, chu: "Không đọc được địa chỉ dựng lại web: " + error.message };
  }
  const dia_chi = data?.gia_tri?.trim();
  if (!dia_chi) {
    // Chưa nối Cloudflare. Nói ra chứ đừng im: người viết cần biết vì sao
    // bài đã đăng mà mở web vẫn chưa thấy.
    return {
      xong: false,
      chu:
        "Chưa cài Deploy Hook nên web không tự dựng lại. " +
        "Xem cuối file web/supabase/schema.sql để biết cách cài.",
    };
  }

  try {
    await fetch(dia_chi, { method: "POST" });
    return { xong: true, chu: "Web đang dựng lại, khoảng 1–2 phút nữa là thấy bài." };
  } catch {
    // Trình duyệt chặn vì CORS thì fetch ném lỗi TRƯỚC khi biết máy chủ trả
    // gì. Gửi lại ở chế độ no-cors: yêu cầu vẫn đi tới nơi, chỉ là mình
    // không đọc được câu trả lời. Nên câu báo dưới đây không dám khẳng định
    // là xong.
    try {
      await fetch(dia_chi, { method: "POST", mode: "no-cors" });
      return {
        xong: true,
        chu:
          "Đã gửi yêu cầu dựng lại web (không đọc được kết quả trả về). " +
          "Khoảng 1–2 phút nữa mở web xem, chưa thấy thì kiểm tra trong Cloudflare.",
      };
    } catch (loi) {
      return {
        xong: false,
        chu:
          "Bài đã đăng, nhưng không gọi được lệnh dựng lại web: " +
          (loi instanceof Error ? loi.message : String(loi)) +
          ". Vào Cloudflare bấm Retry deployment là xong.",
      };
    }
  }
}
