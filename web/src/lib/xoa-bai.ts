// Xoá hẳn một bài, kèm ảnh của nó trên kho.
//
// Để riêng ra đây vì có HAI chỗ gọi: danh sách bài (/admin) và trang soạn
// bài (/admin/bai). Viết hai bản là sớm muộn một bản quên xoá ảnh, hoặc
// quên bảo web dựng lại, mà chẳng có dấu hiệu gì.
import { supabase } from "./supabase";
import { dungLaiWeb } from "./dung-lai-web";

export interface KetQuaXoa {
  xong: boolean;
  /** Câu để hiện thẳng cho người dùng đọc. */
  chu: string;
}

/**
 * @param id      id bài trong bảng bai_viet
 * @param slug    đường dẫn bài, cũng là tên thư mục ảnh trên kho
 * @param da_dang bài đang có mặt trên web hay không — quyết định có phải
 *                dựng lại web sau khi xoá
 */
export async function xoaBaiVaAnh(
  id: string,
  slug: string,
  da_dang: boolean
): Promise<KetQuaXoa> {
  // Ảnh trước, bài sau. Ngược lại thì lỡ xoá bài xong mà xoá ảnh hỏng, ảnh
  // nằm lại trong kho vĩnh viễn mà không còn bài nào nhắc tới để lần ra.
  const { data: ds_anh, error: loi_liet } = await supabase.storage.from("anh").list(slug);
  if (loi_liet) {
    return { xong: false, chu: "Không đọc được kho ảnh của bài: " + loi_liet.message + ". Chưa xoá gì cả." };
  }
  if (ds_anh?.length) {
    const { error: loi_anh } = await supabase.storage
      .from("anh")
      .remove(ds_anh.map((a) => slug + "/" + a.name));
    if (loi_anh) {
      return { xong: false, chu: "Không xoá được ảnh của bài: " + loi_anh.message + ". Chưa xoá bài." };
    }
  }

  // Bản nháp treo (nếu có) tự đi theo nhờ "on delete cascade" trong schema.
  const { error } = await supabase.from("bai_viet").delete().eq("id", id);
  if (error) return { xong: false, chu: "Không xoá được bài: " + error.message };

  // Bài đang trên web thì phải dựng lại, không thì trang cũ vẫn nằm đó.
  if (da_dang) {
    const kq = await dungLaiWeb();
    return { xong: true, chu: "Đã xoá bài. " + kq.chu };
  }
  return { xong: true, chu: "Đã xoá bài." };
}
