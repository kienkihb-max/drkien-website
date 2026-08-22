// Kết nối tới Supabase.
//
// Hai giá trị dưới đây CÔNG KHAI được — chúng nằm sẵn trong mã nguồn trang
// web mà ai xem cũng thấy. Cái giữ an toàn không phải là giấu chúng đi, mà
// là phân quyền RLS trong supabase/schema.sql: có khoá này cũng chỉ đọc
// được bài đã đăng, muốn ghi thì phải đăng nhập bằng tài khoản GitHub có
// tên trong bảng nguoi_viet.
//
// TUYỆT ĐỐI không đặt service_role key vào đây — khoá đó bỏ qua mọi phân
// quyền, lộ ra là ai cũng xoá sạch được database.
import { createClient } from "@supabase/supabase-js";

const URL_SUPABASE = import.meta.env.PUBLIC_SUPABASE_URL;
const KHOA_CONG_KHAI = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!URL_SUPABASE || !KHOA_CONG_KHAI) {
  throw new Error(
    "Thiếu PUBLIC_SUPABASE_URL hoặc PUBLIC_SUPABASE_ANON_KEY. " +
      "Chép web/.env.example thành web/.env rồi điền hai giá trị lấy từ " +
      "Supabase → Project Settings → API."
  );
}

export const supabase = createClient(URL_SUPABASE, KHOA_CONG_KHAI);

/** Một bài viết, khớp với bảng bai_viet trong schema.sql. */
export interface BaiViet {
  id: string;
  slug: string;
  tieu_de: string;
  lead: string | null;
  than_bai: string;
  nhan: string | null;
  /** Danh mục "Tài liệu tham khảo", mỗi phần tử là một mục (có thể chứa HTML). */
  tai_lieu: string[];
  anh: string | null;
  anh_alt: string | null;
  anh_rong: number | null;
  anh_cao: number | null;
  seo_tieu_de: string | null;
  seo_mo_ta: string | null;
  ngay_dang: string;
  /** Ngày sửa gần nhất; null nghĩa là chưa sửa lần nào. */
  ngay_sua: string | null;
  noi_bat: boolean;
  an: boolean;
  da_dang: boolean;
}

/**
 * Bài chỉ dùng để thử, KHÔNG BAO GIỜ được ra web thật.
 *
 * Dev và web thật dùng chung một database, nên bài để thử mà bấm Đăng là nó
 * lên web thật ngay, và Google có thể ăn nó trước khi kịp gỡ. Chặn ở đây
 * thì dù bài có da_dang = true, có nổi bật, có gì đi nữa, lúc build ra web
 * thật nó vẫn không thành trang, không vào blog, không vào sitemap.
 *
 * Chặn bằng danh sách cứng chứ không bằng một cột trong database: cột thì
 * sửa được từ trang admin, mà đây là thứ không nên đổi được bằng một cú
 * bấm. Muốn thêm bài thử thì thêm slug vào đây, tức phải đi qua kho mã.
 */
const BAI_CHI_DE_THU = ["bai-test"];

/**
 * Bỏ bài thử khi build ra web thật. Chạy astro dev thì giữ, vì đó đúng là
 * lúc cần chúng để thử.
 */
function boBaiThu(ds: BaiViet[]): BaiViet[] {
  if (import.meta.env.DEV) return ds;
  const con = ds.filter((b) => !BAI_CHI_DE_THU.includes(b.slug));
  const bo = ds.length - con.length;
  // Nói ra, đừng bỏ im: hôm nào một bài thật bị đặt trùng đường dẫn với bài
  // thử thì nó biến mất khỏi web mà không có dấu hiệu nào.
  if (bo) console.log(`[bài thử] bỏ ${bo} bài khỏi bản build: ${BAI_CHI_DE_THU.join(", ")}`);
  return con;
}

/**
 * Các bài hiện lên website: đã đăng, chưa bị gỡ, mới nhất trước.
 * Dùng lúc build để sinh trang blog và từng trang bài viết.
 */
export async function layBaiHienLen(): Promise<BaiViet[]> {
  const { data, error } = await supabase
    .from("bai_viet")
    .select("*")
    .eq("da_dang", true)
    .eq("an", false)
    .order("ngay_dang", { ascending: false });
  if (error) throw error;
  return boBaiThu(data ?? []);
}

/**
 * Bài bị "gỡ khỏi danh sách" (an = true) vẫn phải sinh ra file, nếu không
 * thì mọi link cũ đã chia sẻ ra ngoài sẽ thành trang lỗi.
 */
export async function layBaiCanSinhFile(): Promise<BaiViet[]> {
  const { data, error } = await supabase
    .from("bai_viet")
    .select("*")
    .eq("da_dang", true)
    .order("ngay_dang", { ascending: false });
  if (error) throw error;
  return boBaiThu(data ?? []);
}
