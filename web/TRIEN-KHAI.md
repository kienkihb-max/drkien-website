# Đưa web lên Cloudflare Pages

Từng bước, làm theo thứ tự. Bước nào cũng **chưa đụng gì tới web thật** —
bacsikien.com vẫn đang chạy bản cũ trên GitHub Pages cho tới bước 7.

---

## 1. Tạo project Pages

1. Đăng ký / đăng nhập <https://dash.cloudflare.com> (bản miễn phí là đủ).
2. Vào thẳng địa chỉ này: <https://dash.cloudflare.com/?to=/:account/pages/new/provider/github>
3. Cho Cloudflare quyền đọc kho `kienkihb-max/drkien-website`.
4. Chọn kho đó, rồi **Begin setup**.

> **Phải đúng luồng Pages.** Cloudflare nay đẩy mọi người sang Workers, và
> nút "Import a repository" ở trang chủ dashboard tạo ra một **Worker** chứ
> không phải Pages — màn hình đó hỏi "Deploy command: npx wrangler deploy".
> Nhận ra thì bấm Back. Workers Builds chỉ dựng lại khi có commit mới, không
> có Deploy Hook, mà Deploy Hook chính là thứ để đăng bài xong web tự dựng
> lại (bước 5). Màn hình Pages đúng sẽ hỏi "Framework preset" và "Build
> output directory".

## 2. Cấu hình build

Điền đúng bốn ô này:

| Ô | Giá trị |
| --- | --- |
| Production branch | `cms-blog` |
| Framework preset | `Astro` (hoặc `None` cũng được) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory (Advanced) | `web` |

`Root directory = web` là chỗ hay quên nhất. Đặt rồi thì mọi đường dẫn còn
lại tính từ `web/`, nên output là `dist` chứ **không** phải `web/dist`.

Phiên bản Node đã ghi sẵn trong `web/.nvmrc` (22.17.0), không phải khai báo.

## 3. Hai biến môi trường

Vẫn ở màn hình đó, mục **Environment variables**, thêm cho **cả Production
lẫn Preview**:

```
PUBLIC_SUPABASE_URL       = https://lqiaymltyvxwijvopmci.supabase.co
PUBLIC_SUPABASE_ANON_KEY  = sb_publishable_enlavzrz0QaooVIdciuY6w_5WfQH3rC
```

(Đúng hai dòng trong `web/.env`. Chúng công khai được — cái giữ an toàn là
RLS, xem đầu file `src/lib/supabase.ts`.)

Bấm **Save and Deploy**. Build đầu mất khoảng 1–2 phút, xong Cloudflare cho
một địa chỉ dạng `ten-project.pages.dev`.

## 4. Cho phép đăng nhập từ địa chỉ mới

Trang `/admin` đăng nhập bằng GitHub qua Supabase. Supabase chỉ chấp nhận
quay về những địa chỉ đã khai báo, nên địa chỉ `.pages.dev` mới phải được
thêm vào, không thì bấm đăng nhập sẽ quay về trang trắng.

Supabase → **Authentication → URL Configuration → Redirect URLs**, thêm:

```
https://ten-project.pages.dev/admin
```

Giữ nguyên các dòng đang có (localhost, bacsikien.com).

## 5. Deploy Hook — để đăng bài xong web tự dựng lại

Web là HTML dựng sẵn, nên bài mới nằm trong database thì **chưa** thành
trang. Phải có một lần build nữa. Cloudflare cho một địa chỉ gọi vào là nó
build lại:

1. Trong project Pages → **Settings → Builds → Add deploy hook**. Tên gì cũng được ("Đăng bài"), branch chọn
   `cms-blog` (sau khi đổi sang chạy thật thì sửa lại thành `main`).
2. Chép địa chỉ nó cho.
3. Supabase → **SQL Editor**, chạy:

```sql
insert into cau_hinh (khoa, gia_tri, ghi_chu)
values ('moc_dung_lai', 'DÁN_ĐỊA_CHỈ_VỪA_CHÉP_VÀO_ĐÂY', 'Deploy Hook Cloudflare Pages')
on conflict (khoa) do update set gia_tri = excluded.gia_tri, sua_luc = now();
```

Nếu bảng `cau_hinh` chưa có thì chạy lại cả `web/supabase/schema.sql` trước
— file đó chạy lại nhiều lần vẫn an toàn.

Địa chỉ hook không hỏi mật khẩu, ai biết cũng bắt web dựng lại được, nên nó
nằm trong database khoá bằng RLS chứ không nằm trong mã nguồn.

## 6. Xem cho kỹ trước khi đổi tên miền

Mở `ten-project.pages.dev` và kiểm:

- [ ] Trang chủ, 5 trang tĩnh, trang blog, vài bài viết — chữ và ảnh đúng.
- [ ] `/sitemap.xml` ra đủ 19 địa chỉ, không có `bai-test`.
- [ ] Bấm một bài từ blog, mở được, ảnh hiện, nút Zalo đúng số.
- [ ] `/admin` đăng nhập được bằng GitHub, thấy danh sách bài.
- [ ] Sửa một bài rồi bấm **Đăng**, đợi ~2 phút, mở lại thấy bản mới →
      Deploy Hook chạy đúng.
- [ ] Xem trên điện thoại: thanh CTA dính đáy, menu, ảnh.

Địa chỉ `.pages.dev` này Google có thể thấy, nhưng mọi trang đều có
`canonical` trỏ về `bacsikien.com` nên không bị coi là trùng nội dung.

## 7. Chỉ khi đã ưng: chuyển web thật sang

Theo thứ tự này, đừng đảo:

1. Gộp `cms-blog` vào `main` và đẩy lên.
2. Trong Cloudflare đổi **Production branch** sang `main`, và sửa Deploy
   Hook ở bước 5 sang `main` (chạy lại câu SQL với địa chỉ hook mới).
3. Pages → **Custom domains** → thêm `bacsikien.com` và `www.bacsikien.com`.
   Cloudflare sẽ chỉ cần đổi bản ghi DNS ở chỗ đang quản lý tên miền.
4. Đợi chứng chỉ HTTPS xanh, mở `https://bacsikien.com` kiểm lại một lượt.
5. GitHub Pages: vào Settings → Pages của kho, tắt đi để khỏi có hai bản
   cùng chạy.
6. Google Search Console: gửi lại `https://bacsikien.com/sitemap.xml`.

Nếu có gì sai, quay lại rất nhanh: trỏ DNS về GitHub Pages như cũ.
