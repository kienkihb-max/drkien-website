// Chuyên mục blog — chỗ duy nhất hiểu cột "nhan" trong database.
//
// Trong database, chuyên mục nằm ở cột nhan dưới dạng "Blog · Y học thể
// thao": phần "Blog" là nấc breadcrumb chung của mọi bài, phần sau mới là
// chuyên mục thật. Mọi nơi cần tên mục hay địa chỉ trang mục đều gọi vào
// đây, đừng nơi nào tự cắt chuỗi lấy — cắt sai một chỗ là trang mục trống
// trơn mà chẳng có lỗi nào hiện ra.
import type { BaiViet } from "./supabase";

/** Tiền tố chung trong cột nhan. */
const DAU_NHAN = "Blog ·";

export interface ChuyenMuc {
  /** Tên hiện cho người đọc, ví dụ "Y học thể thao". */
  ten: string;
  /** Phần đuôi địa chỉ: /blog/y-hoc-the-thao */
  slug: string;
  bai: BaiViet[];
}

/** Cắt "Blog · Y học thể thao" thành "Y học thể thao". */
export function tenChuyenMuc(nhan: string | null): string {
  const chu = (nhan ?? "").trim();
  if (!chu) return "";
  return chu.startsWith(DAU_NHAN) ? chu.slice(DAU_NHAN.length).trim() : chu;
}

/**
 * Đổi tên mục thành đường dẫn: bỏ dấu tiếng Việt, thay khoảng trắng và ký
 * tự lạ bằng gạch nối. "Cơ xương khớp & Phục hồi chức năng" →
 * "co-xuong-khop-phuc-hoi-chuc-nang".
 */
export function slugChuyenMuc(ten: string): string {
  return ten
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function diaChiChuyenMuc(ten: string): string {
  return "/blog/" + slugChuyenMuc(ten);
}

/**
 * Gom danh sách bài thành các chuyên mục, mục nhiều bài đứng trước.
 *
 * Bài chưa chọn mục thì không tạo ra mục rỗng — nó vẫn nằm ở trang blog
 * tổng, chỉ là không có trang mục riêng.
 */
export function gomChuyenMuc(bai: BaiViet[]): ChuyenMuc[] {
  const theo_ten = new Map<string, BaiViet[]>();
  for (const b of bai) {
    const ten = tenChuyenMuc(b.nhan);
    if (!ten) continue;
    const ds = theo_ten.get(ten);
    if (ds) ds.push(b);
    else theo_ten.set(ten, [b]);
  }
  return [...theo_ten.entries()]
    .map(([ten, ds]) => ({ ten, slug: slugChuyenMuc(ten), bai: ds }))
    .sort((a, b) => b.bai.length - a.bai.length || a.ten.localeCompare(b.ten, "vi"));
}
