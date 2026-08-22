-- Cấu trúc database cho blog bacsikien.com
--
-- Cách dùng: mở bảng điều khiển Supabase → SQL Editor → dán toàn bộ file này
-- → Run. Chạy lại lần nữa cũng không sao, mọi lệnh đều có "if not exists".
--
-- Hai bảng:
--   bai_viet    nội dung blog
--   nguoi_viet  danh sách tài khoản GitHub được phép ghi bài
--
-- Nguyên tắc bảo mật: ai cũng ĐỌC được bài đã đăng (website cần đọc để
-- build), nhưng chỉ tài khoản có tên trong nguoi_viet mới GHI được. Khoá này
-- đặt ở tầng database chứ không phải ở giao diện — người lạ có mò ra trang
-- admin, hay gọi thẳng API, cũng không ghi được gì.

-- ——— Bảng người được phép viết ———
create table if not exists nguoi_viet (
  -- Tên tài khoản GitHub, ví dụ "letrungkien". Chữ thường.
  tai_khoan_github text primary key,
  ghi_chu          text,
  tao_luc          timestamptz not null default now()
);

comment on table nguoi_viet is
  'Ai được ghi bài. Thêm người: insert thêm một dòng tên tài khoản GitHub.';

-- ——— Bảng bài viết ———
create table if not exists bai_viet (
  id         uuid primary key default gen_random_uuid(),

  -- Đường dẫn bài, không đuôi .html: "cau-chuyen-ve-cuu-ngai".
  -- ĐỔI LÀ HỎNG: link cũ đã chia sẻ ra ngoài sẽ thành trang lỗi và bài mất
  -- thứ hạng Google. Chốt lúc tạo bài, sau đó đừng đụng vào.
  slug       text not null unique,

  tieu_de    text not null,
  -- Đoạn mở đầu, in to hơn phần thân bài.
  lead       text,
  -- Thân bài, dạng HTML đã lọc sạch bởi trình soạn thảo.
  than_bai   text not null default '',

  -- Nhãn trên đầu bài, dạng "Blog · Y học cổ truyền".
  nhan       text,

  -- Ảnh bìa: hiện ở đầu bài, trên thẻ blog, và khi chia sẻ Facebook/Zalo.
  anh        text,
  anh_alt    text,

  -- Chữ hiện trên thẻ ở trang blog (người đọc thấy).
  the_tieu_de text,
  the_mo_ta   text,
  -- Chữ hiện trên Google (máy đọc). Tách riêng vì hai chỗ này cần độ dài
  -- khác nhau, gộp làm một là hỏng một trong hai.
  seo_tieu_de text,
  seo_mo_ta   text,

  ngay_dang  date not null default current_date,
  -- true thì bài nằm ở khối nổi bật đầu trang blog.
  noi_bat    boolean not null default false,
  -- true thì bài biến khỏi mọi danh sách nhưng địa chỉ cũ vẫn sống — dùng
  -- để "gỡ bài" mà không làm chết link đã chia sẻ.
  an         boolean not null default false,
  -- false là bản nháp: chỉ mình tác giả thấy trong trang quản trị.
  da_dang    boolean not null default false,

  tao_luc    timestamptz not null default now(),
  sua_luc    timestamptz not null default now()
);

-- Trang blog sắp bài theo ngày, mỗi lần build đều chạy truy vấn này.
create index if not exists bai_viet_ngay_idx
  on bai_viet (ngay_dang desc) where da_dang and not an;

-- Tự cập nhật sua_luc, khỏi phải nhớ ghi tay mỗi lần sửa.
create or replace function cham_sua_luc() returns trigger
  language plpgsql as $$
begin
  new.sua_luc = now();
  return new;
end;
$$;

drop trigger if exists bai_viet_sua_luc on bai_viet;
create trigger bai_viet_sua_luc before update on bai_viet
  for each row execute function cham_sua_luc();

-- ——— Phân quyền ———
alter table bai_viet   enable row level security;
alter table nguoi_viet enable row level security;

-- Tài khoản GitHub của người đang đăng nhập, lấy từ thông tin Supabase Auth
-- nhận về sau khi OAuth xong.
create or replace function github_dang_nhap() returns text
  language sql stable as $$
  select lower(coalesce(
    auth.jwt() -> 'user_metadata' ->> 'user_name',
    auth.jwt() -> 'user_metadata' ->> 'preferred_username'
  ));
$$;

create or replace function duoc_ghi_bai() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from nguoi_viet
    where tai_khoan_github = github_dang_nhap()
  );
$$;

-- Đọc: ai cũng đọc được bài ĐÃ ĐĂNG. Bản nháp thì chỉ người viết thấy.
drop policy if exists bai_viet_doc_cong_khai on bai_viet;
create policy bai_viet_doc_cong_khai on bai_viet
  for select using (da_dang);

drop policy if exists bai_viet_doc_nguoi_viet on bai_viet;
create policy bai_viet_doc_nguoi_viet on bai_viet
  for select using (duoc_ghi_bai());

-- Ghi: chỉ người có tên trong nguoi_viet.
drop policy if exists bai_viet_them on bai_viet;
create policy bai_viet_them on bai_viet
  for insert with check (duoc_ghi_bai());

drop policy if exists bai_viet_sua on bai_viet;
create policy bai_viet_sua on bai_viet
  for update using (duoc_ghi_bai()) with check (duoc_ghi_bai());

drop policy if exists bai_viet_xoa on bai_viet;
create policy bai_viet_xoa on bai_viet
  for delete using (duoc_ghi_bai());

-- Bảng người viết: chỉ chính người viết xem được, và không ai sửa được qua
-- API. Thêm người mới phải vào SQL Editor — cố ý làm khó, vì đây là cái
-- khoá của toàn bộ hệ thống.
drop policy if exists nguoi_viet_doc on nguoi_viet;
create policy nguoi_viet_doc on nguoi_viet
  for select using (duoc_ghi_bai());

-- ——— Việc phải làm bằng tay sau khi chạy file này ———
-- Thay "TEN_GITHUB_CUA_ANH" bằng tên tài khoản GitHub thật rồi chạy dòng
-- dưới. Chưa làm bước này thì CHÍNH ANH cũng không ghi bài được.
--
--   insert into nguoi_viet (tai_khoan_github, ghi_chu)
--   values ('ten_github_cua_anh', 'Chủ site')
--   on conflict do nothing;
