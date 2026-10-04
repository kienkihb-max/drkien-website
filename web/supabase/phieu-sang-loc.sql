-- Phiếu Thập Vấn (trang /sang-loc-benh) lưu vào Supabase để hiện ở trang admin.
--
-- Cách dùng: Supabase → SQL Editor → dán toàn bộ file này → Run. Chạy lại lần
-- nữa cũng không sao (mọi lệnh đều idempotent). Cần chạy schema.sql trước, vì
-- file này dùng hàm duoc_ghi_bai() và cham_sua_luc() trong đó.
--
-- Nguyên tắc bảo mật (dữ liệu sức khỏe):
--   - Bệnh nhân (chưa đăng nhập, vai "anon") chỉ GHI được: thêm một phiếu mới và
--     tải ảnh lên. Không đọc lại, không sửa, không xóa được gì — kể cả phiếu
--     của chính mình.
--   - Chỉ tài khoản có tên trong nguoi_viet (cùng danh sách với admin blog)
--     mới đọc, sửa, xóa phiếu và xem ảnh.
--   - Ảnh nằm trong bucket RIÊNG TƯ; admin xem bằng link tạm có hạn.
--   - Trang web KHÔNG BAO GIỜ chứa điểm số hay tên thể bệnh; cột ket_qua_ai
--     chỉ để bác sĩ/AI ghi sau này từ phía admin hoặc máy chủ.

-- ——— Bảng phiếu ———
create table if not exists phieu_sang_loc (
  -- Do trình duyệt bệnh nhân tự sinh (crypto.randomUUID) để tải ảnh vào thư mục
  -- trùng id này TRƯỚC khi thêm dòng. Không đoán ra được nên không ai chen vào
  -- thư mục ảnh của người khác.
  id          uuid primary key,
  tao_luc     timestamptz not null default now(),

  -- Ba thông tin liên hệ tách riêng ra cột để admin tìm và hiện danh sách.
  ho_ten      text not null check (char_length(ho_ten) between 1 and 100),
  nam_sinh    int  check (nam_sinh between 1900 and 2100),
  sdt         text not null check (char_length(sdt) between 6 and 20),

  -- Chuyên khoa bệnh nhân chọn, nguyên văn ("Cơ Xương Khớp"…).
  chuyen_khoa text check (char_length(chuyen_khoa) <= 80),

  -- TOÀN BỘ câu trả lời, dạng mảng [{ "ma": "cxk_vi_tri_dau",
  -- "tieu_de": "Cơ Xương Khớp | Bạn đau ở đâu?", "gia_tri": "Gối | Khác: …" }].
  -- Lưu kèm chữ câu hỏi lúc bệnh nhân điền để sau này chủ site đổi chữ câu hỏi
  -- thì phiếu cũ vẫn đọc được đúng như bệnh nhân đã thấy. "ma" là khóa cố định
  -- (xem data/phieu-thap-van.mjs).
  cau_tra_loi jsonb not null
    check (jsonb_typeof(cau_tra_loi) = 'array' and pg_column_size(cau_tra_loi) < 60000),

  -- Đường dẫn ảnh lưỡi trong bucket phieu-anh: "<id phiếu>/1.jpg".
  anh         text[] not null default '{}' check (cardinality(anh) <= 3),

  -- Phần bác sĩ dùng. Bệnh nhân không được điền (policy insert bên dưới ép
  -- trang_thai = 'moi' và hai cột sau để trống).
  trang_thai  text not null default 'moi'
    check (trang_thai in ('moi', 'da_xem', 'da_lien_he')),
  ghi_chu     text,
  ket_qua_ai  jsonb,
  sua_luc     timestamptz
);

comment on table phieu_sang_loc is
  'Phiếu thập vấn bệnh nhân gửi từ /sang-loc-benh. anon chỉ insert; admin đọc/sửa.';

create index if not exists phieu_sang_loc_tao_luc on phieu_sang_loc (tao_luc desc);

drop trigger if exists phieu_sang_loc_sua_luc on phieu_sang_loc;
create trigger phieu_sang_loc_sua_luc before update on phieu_sang_loc
  for each row execute function cham_sua_luc();

-- ——— Phân quyền hàng ———
alter table phieu_sang_loc enable row level security;

-- Bệnh nhân: chỉ thêm. KHÔNG có policy select cho anon, nên supabase-js phải gọi
-- .insert() KHÔNG kèm .select() (kèm .select() là cần quyền đọc và sẽ báo lỗi).
drop policy if exists phieu_sang_loc_gui on phieu_sang_loc;
create policy phieu_sang_loc_gui on phieu_sang_loc
  for insert to anon, authenticated
  with check (trang_thai = 'moi' and ghi_chu is null and ket_qua_ai is null);

drop policy if exists phieu_sang_loc_doc on phieu_sang_loc;
create policy phieu_sang_loc_doc on phieu_sang_loc
  for select to authenticated using (duoc_ghi_bai());

drop policy if exists phieu_sang_loc_sua on phieu_sang_loc;
create policy phieu_sang_loc_sua on phieu_sang_loc
  for update to authenticated using (duoc_ghi_bai()) with check (duoc_ghi_bai());

drop policy if exists phieu_sang_loc_xoa on phieu_sang_loc;
create policy phieu_sang_loc_xoa on phieu_sang_loc
  for delete to authenticated using (duoc_ghi_bai());

-- ——— Kho ảnh lưỡi (riêng tư) ———
-- Giới hạn ngay ở bucket: mỗi ảnh tối đa 3MB, chỉ nhận JPEG/PNG (trang đã nén
-- ảnh còn vài trăm KB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('phieu-anh', 'phieu-anh', false, 3145728, array['image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = 3145728,
      allowed_mime_types = array['image/jpeg', 'image/png'];

-- Bệnh nhân chỉ tải lên được đúng dạng đường dẫn "<uuid>/<1-3>.<jpg|png>", và
-- không ghi đè được tệp đã có (không có policy update).
drop policy if exists phieu_anh_tai_len on storage.objects;
create policy phieu_anh_tai_len on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'phieu-anh'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[1-3]\.(jpg|png)$'
  );

drop policy if exists phieu_anh_doc on storage.objects;
create policy phieu_anh_doc on storage.objects
  for select to authenticated using (bucket_id = 'phieu-anh' and duoc_ghi_bai());

drop policy if exists phieu_anh_xoa on storage.objects;
create policy phieu_anh_xoa on storage.objects
  for delete to authenticated using (bucket_id = 'phieu-anh' and duoc_ghi_bai());
