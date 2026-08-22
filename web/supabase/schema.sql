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

  -- Danh mục "Tài liệu tham khảo" ở cuối bài, mỗi phần tử là một mục.
  -- Tách riêng khỏi than_bai vì nó được dàn trang bằng khối .article-refs
  -- có kiểu hiển thị riêng, và vì với nội dung y tế thì đây là phần Google
  -- dùng để chấm độ tin cậy chuyên môn — trộn vào thân bài là mất khối đó.
  tai_lieu   jsonb not null default '[]'::jsonb,

  -- Ảnh bìa: hiện ở đầu bài, trên thẻ blog, và khi chia sẻ Facebook/Zalo.
  -- Có hai dạng đường dẫn cùng tồn tại:
  --   "assets/img/ten.jpg"  ảnh cũ nằm trong repo
  --   "https://….supabase.co/storage/…"  ảnh tải lên qua CMS
  anh        text,
  anh_alt    text,
  -- Kích thước thật của ảnh bìa, đo ngay lúc tải lên.
  -- Facebook dựa vào hai số này để dựng khung xem trước; sai thì ảnh méo
  -- hoặc bị cắt. Ảnh trong repo thì lúc build tự đo được từ file, còn ảnh
  -- trên Storage thì không — nên phải ghi lại từ lúc trình duyệt còn cầm
  -- tấm ảnh trong tay.
  anh_rong   integer,
  anh_cao    integer,

  -- Chữ hiện trên Google. Sinh ra từ tiêu đề và đoạn mở đầu, chứ không bắt
  -- người viết gõ.
  --
  -- Từng có thêm hai cột the_tieu_de/the_mo_ta cho chữ hiện trên thẻ ngoài
  -- trang blog. Đã bỏ (drop column): chúng bắt gõ lại đúng những gì vừa gõ ở
  -- trên, và sửa tiêu đề bài xong thì thẻ vẫn đề tên cũ mà không có dấu hiệu
  -- gì. Nay thẻ lấy thẳng tiêu đề bài và seo_mo_ta.
  seo_tieu_de text,
  seo_mo_ta   text,

  ngay_dang  date not null default current_date,
  -- Ngày sửa nội dung gần nhất. Để trống nghĩa là chưa sửa lần nào.
  -- Dùng cho <lastmod> trong sitemap và dateModified trong dữ liệu có cấu
  -- trúc. Khác sua_luc bên dưới: sua_luc là dấu thời gian máy tự ghi mỗi
  -- lần chạm vào bản ghi, kể cả sửa một dấu phẩy; còn ngay_sua là mốc chủ
  -- site muốn Google nhìn thấy.
  ngay_sua   date,
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

-- ——— Vá cho database đã tạo từ trước ———
-- "create table if not exists" ở trên KHÔNG thêm cột mới vào bảng đã tồn
-- tại, nên cột nào sinh sau phải có thêm một dòng alter ở đây. Chạy lại
-- nhiều lần vẫn an toàn.
alter table bai_viet add column if not exists tai_lieu jsonb not null default '[]'::jsonb;
alter table bai_viet add column if not exists ngay_sua date;
alter table bai_viet add column if not exists anh_rong integer;
alter table bai_viet add column if not exists anh_cao integer;

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

-- ——— Kho ảnh ———
-- Ảnh tải lên qua CMS nằm ở Supabase Storage, không đẩy vào kho mã. Để
-- trong kho mã thì CMS phải có quyền ghi vào GitHub — đúng cái quyền vừa
-- bỏ đi khi chuyển sang đăng nhập bằng tài khoản.
--
-- Phần này phải nằm SAU hàm duoc_ghi_bai() bên trên, vì mấy policy dưới
-- gọi tới nó.
--
-- Bucket để công khai: ảnh bài viết vốn để mọi người xem, và trình thu
-- thập của Google với Facebook phải đọc được mà không cần đăng nhập.
insert into storage.buckets (id, name, public)
values ('anh', 'anh', true)
on conflict (id) do update set public = true;

-- Đọc: ai cũng xem được. Ghi: chỉ người có tên trong nguoi_viet.
drop policy if exists anh_doc on storage.objects;
create policy anh_doc on storage.objects
  for select using (bucket_id = 'anh');

drop policy if exists anh_tai_len on storage.objects;
create policy anh_tai_len on storage.objects
  for insert with check (bucket_id = 'anh' and duoc_ghi_bai());

drop policy if exists anh_sua on storage.objects;
create policy anh_sua on storage.objects
  for update using (bucket_id = 'anh' and duoc_ghi_bai());

drop policy if exists anh_xoa on storage.objects;
create policy anh_xoa on storage.objects
  for delete using (bucket_id = 'anh' and duoc_ghi_bai());

-- ——— Bản nháp của bài ĐÃ ĐĂNG ———
-- Sửa một bài đang chạy trên web thì bản sửa phải nằm chỗ khác, chứ không
-- được ghi thẳng vào bài. Trước đây bấm "Lưu nháp" trên bài đã đăng là bài
-- rơi khỏi blog ngay lúc đó: địa chỉ Google đã lập chỉ mục chết, mà không
-- có một dòng cảnh báo nào.
--
-- Bài CHƯA đăng thì không cần bảng này — chính nó đã là bản nháp
-- (da_dang = false), và người ngoài không đọc được.
--
-- Vì sao là bảng riêng chứ không phải thêm một cột vào bai_viet: chính
-- sách đọc của bai_viet là "for select using (da_dang)", tức MỌI CỘT của
-- bài đã đăng đều công khai. Thêm cột nháp vào đó là phơi nguyên nội dung
-- đang sửa dở ra ngoài. Để bảng riêng thì nó kín bằng chính sách, không
-- phải chống bằng mẹo phân quyền từng cột.
create table if not exists ban_nhap (
  -- Một bài chỉ có một bản nháp đang treo. Bài bị xoá thì nháp đi theo.
  bai_id  uuid primary key references bai_viet(id) on delete cascade,
  -- Cả form đóng thành một khối JSON, đúng những khoá mà docForm() sinh ra.
  -- Không dựng lại từng cột ở đây: thêm một ô vào form là phải sửa hai chỗ
  -- và sớm muộn cũng lệch nhau.
  du_lieu jsonb not null,
  sua_luc timestamptz not null default now()
);

alter table ban_nhap enable row level security;

-- Nháp là thứ chưa ai được thấy. Không có chính sách công khai nào ở đây,
-- kể cả cho bài đã đăng.
drop policy if exists ban_nhap_doc on ban_nhap;
create policy ban_nhap_doc on ban_nhap
  for select using (duoc_ghi_bai());

drop policy if exists ban_nhap_them on ban_nhap;
create policy ban_nhap_them on ban_nhap
  for insert with check (duoc_ghi_bai());

drop policy if exists ban_nhap_sua on ban_nhap;
create policy ban_nhap_sua on ban_nhap
  for update using (duoc_ghi_bai()) with check (duoc_ghi_bai());

drop policy if exists ban_nhap_xoa on ban_nhap;
create policy ban_nhap_xoa on ban_nhap
  for delete using (duoc_ghi_bai());

drop trigger if exists ban_nhap_sua_luc on ban_nhap;
create trigger ban_nhap_sua_luc before update on ban_nhap
  for each row execute function cham_sua_luc();

-- ——— Việc phải làm bằng tay sau khi chạy file này ———
-- Thay "TEN_GITHUB_CUA_ANH" bằng tên tài khoản GitHub thật rồi chạy dòng
-- dưới. Chưa làm bước này thì CHÍNH ANH cũng không ghi bài được.
--
--   insert into nguoi_viet (tai_khoan_github, ghi_chu)
--   values ('ten_github_cua_anh', 'Chủ site')
--   on conflict do nothing;

-- ——— Cấu hình kín ———
-- Chỗ để những giá trị mà trang quản trị cần dùng nhưng KHÔNG được nằm
-- trong mã nguồn: mã nguồn của site là tĩnh, ai xem trang cũng tải về đọc
-- được, kể cả người không đăng nhập.
--
-- Giá trị đầu tiên phải cất ở đây là "moc_dung_lai" — địa chỉ Deploy Hook
-- của Cloudflare Pages. Gọi vào địa chỉ đó là web dựng lại; nó không hỏi
-- mật khẩu, nên ai biết địa chỉ cũng bắt web dựng lại được. Không sập được
-- site, nhưng đủ để người rảnh rỗi làm phiền, nên cất kín.
--
-- Bảng này KHÔNG có chính sách ghi. RLS mặc định là cấm, nên qua API thì
-- không ai thêm/sửa/xoá được — kể cả người viết bài. Muốn đổi giá trị phải
-- vào Supabase → SQL Editor, đúng như bảng nguoi_viet.
create table if not exists cau_hinh (
  khoa    text primary key,
  gia_tri text not null,
  ghi_chu text,
  sua_luc timestamptz not null default now()
);

alter table cau_hinh enable row level security;

-- Đọc: chỉ người có quyền ghi bài. Người đọc bình thường không thấy gì.
drop policy if exists cau_hinh_doc on cau_hinh;
create policy cau_hinh_doc on cau_hinh
  for select using (duoc_ghi_bai());

drop trigger if exists cau_hinh_sua_luc on cau_hinh;
create trigger cau_hinh_sua_luc before update on cau_hinh
  for each row execute function cham_sua_luc();

-- ——— Việc phải làm bằng tay: nối Cloudflare ———
-- Sau khi tạo Deploy Hook trong Cloudflare Pages (Settings → Builds &
-- deployments → Deploy hooks), chép địa chỉ nó cho rồi chạy dòng dưới.
-- Chưa làm bước này thì đăng bài vẫn chạy bình thường, chỉ là web không tự
-- dựng lại — trang quản trị sẽ nói rõ điều đó chứ không im lặng.
--
--   insert into cau_hinh (khoa, gia_tri, ghi_chu)
--   values ('moc_dung_lai', 'https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/...',
--           'Deploy Hook của Cloudflare Pages, nhánh main')
--   on conflict (khoa) do update set gia_tri = excluded.gia_tri, sua_luc = now();
