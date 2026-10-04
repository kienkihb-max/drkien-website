-- Bảng chấm điểm phân thể cho phiếu sàng lọc (trang /admin/phieu).
--
-- FILE NÀY CHỈ CÓ CẤU TRÚC, KHÔNG CÓ SỐ LIỆU. Kho GitHub của site là công
-- khai, mà bảng điểm, hệ số và tên thể bệnh là bí mật nghiệp vụ của bác sĩ.
-- Số liệu nằm trong web/supabase/rieng/cham-diem-du-lieu.sql (đã .gitignore,
-- chạy tay trong SQL Editor của Supabase) và được sinh ra từ
-- web/supabase/rieng/tao-du-lieu.mjs.
--
-- Vì sao khóa chặt: bảng điểm mà đọc được từ trình duyệt bệnh nhân thì bí mật
-- coi như lộ. Nên anon KHÔNG có quyền gì; chỉ người đăng nhập và có tên trong
-- nguoi_viet (duoc_ghi_bai(), xem schema.sql) mới đọc/ghi được. Trang admin
-- đọc bảng điểm bằng phiên đăng nhập của bác sĩ rồi tính ngay trong trình duyệt
-- của bác sĩ, nên bệnh nhân không bao giờ nhận được số liệu.
--
-- Chạy lại nhiều lần không hại: create ... if not exists, policy drop rồi tạo lại.
-- Phải chạy schema.sql trước (cần hàm duoc_ghi_bai()).

-- 13 nhãn (Hàn, Nhiệt, Thấp...). `ma` là mã ngắn dùng ở các bảng còn lại,
-- `ten` là chữ hiển thị cho bác sĩ.
create table if not exists cham_diem_nhan (
  ma  text primary key,
  ten text not null
);

-- Đáp án nào của câu nào gắn với những nhãn nào. `ma_cau` là mã câu hỏi cố
-- định (xem web/src/data/phieu-thap-van.mjs), `dap_an` là chữ đáp án nguyên văn.
-- Đổi chữ đáp án trên form thì phải sửa dòng tương ứng ở đây, nếu không đáp
-- án đó thôi được tính điểm.
create table if not exists cham_diem_dap_an (
  id      bigint generated always as identity primary key,
  ma_cau  text not null,
  dap_an  text not null,
  nhan    text[] not null default '{}',
  unique (ma_cau, dap_an)
);

-- Thể bệnh của từng chuyên khoa (bo = mã bộ: cxk, tk, tn...), mỗi dòng là một
-- nhãn và hệ số của nhãn đó trong thể. Điểm thể = tổng (số lần nhãn xuất hiện
-- trên phiếu × hệ số).
create table if not exists cham_diem_the (
  id      bigint generated always as identity primary key,
  bo      text not null,
  ten_the text not null,
  nhan    text not null references cham_diem_nhan (ma) on update cascade on delete cascade,
  he_so   int  not null check (he_so > 0),
  unique (bo, ten_the, nhan)
);

-- Ngưỡng chỉnh được mà không phải sửa code. Khóa dùng:
--   diem_toi_thieu     điểm cao nhất thấp hơn mức này thì "chưa đủ dữ kiện"
--   ty_le_phoi_hop     thể thứ hai đạt tỉ lệ này so với thể đầu thì là thể phối hợp
--   so_nhan_tong_quat  số nhãn nêu ra khi bệnh nhân chọn "Chưa rõ"
--   so_nhan_noi_bat    số nhãn nêu ra kèm kết quả thể chính
create table if not exists cham_diem_cau_hinh (
  khoa    text primary key,
  gia_tri numeric not null
);

-- ---- Phân quyền ---------------------------------------------------------------
alter table cham_diem_nhan      enable row level security;
alter table cham_diem_dap_an    enable row level security;
alter table cham_diem_the       enable row level security;
alter table cham_diem_cau_hinh  enable row level security;

-- Thu hết quyền mặc định rồi chỉ cấp lại cho người đã đăng nhập. RLS vẫn
-- chặn tiếp bằng duoc_ghi_bai(): đăng nhập mà không có tên trong nguoi_viet
-- thì cũng không thấy dòng nào.
revoke all on cham_diem_nhan, cham_diem_dap_an, cham_diem_the, cham_diem_cau_hinh from anon;
grant select, insert, update, delete
  on cham_diem_nhan, cham_diem_dap_an, cham_diem_the, cham_diem_cau_hinh to authenticated;

do $$
declare
  b text;
begin
  foreach b in array array['cham_diem_nhan', 'cham_diem_dap_an', 'cham_diem_the', 'cham_diem_cau_hinh']
  loop
    execute format('drop policy if exists %I on %I', b || '_admin', b);
    execute format(
      'create policy %I on %I for all to authenticated using (duoc_ghi_bai()) with check (duoc_ghi_bai())',
      b || '_admin', b
    );
  end loop;
end $$;
