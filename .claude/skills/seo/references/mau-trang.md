# Thuộc tính của `Trang.astro`

Mọi trang đều bọc trong `<Trang>`. Đây là **chỗ duy nhất** sinh ra thẻ
`<head>`, nên toàn bộ SEO của một trang nằm ở mấy thuộc tính dưới đây —
không trang nào tự viết thẻ `<meta>`.

File: `web/src/layouts/Trang.astro`

## Bắt buộc

| Thuộc tính | Dùng làm gì |
|---|---|
| `tieu_de` | Thẻ `<title>` và `og:title`. Máy **tự nối** " — Bác sĩ Lê Trung Kiên" vào cuối, trừ khi tên đã có sẵn trong chuỗi. Giữ tổng dưới 68 ký tự, tức phần tự viết dưới 45. |
| `mo_ta` | `<meta name="description">` và `og:description`. Nên 120–160 ký tự, viết trọn ý chứ đừng để bị cắt. |
| `duong_dan` | Đuôi địa chỉ, **không có gạch chéo đầu và không có đuôi `.html`**: `"blog"`, `"dieu-tri"`, `""` cho trang chủ. Canonical và `og:url` đều dựng từ đây, nên sai một chữ là canonical trỏ sang trang khác. |

## Hay dùng

| Thuộc tính | Mặc định | Dùng làm gì |
|---|---|---|
| `anh` | `assets/img/og-share.jpg` | Ảnh hiện khi chia sẻ lên Facebook/Zalo. Đường dẫn tương đối trong site. Kích thước **tự đo từ file lúc build**, không phải ghi tay. |
| `anh_alt` | `""` | Mô tả ảnh chia sẻ. |
| `loai` | `"website"` | `"article"` cho bài blog, `"profile"` cho trang hồ sơ bác sĩ. Vào thẻ `og:type`. |
| `loai_trang` | — | Vào `data-page` của `<html>`. **Chỉ nhận `home`, `service`, `article`** — `style.css` dựa vào đó để đổi giao diện; đặt giá trị lạ là trang mất kiểu. |
| `lop_body` | — | Thêm class cho `<body>`. Trang con dùng `"subpage"`. |
| `scripts` | `[]` | Các file JS trong `web/public/` mà riêng trang này cần, ví dụ `["lightbox.js"]`. Header, footer và bộ icon đã dựng sẵn phía máy chủ nên **không khai ở đây**. |

## Ít dùng

| Thuộc tính | Dùng làm gì |
|---|---|
| `ngay_dang` | Chỉ cho bài viết. Vào `data-ngay-dang` và `article:published_time`. |
| `anh_co` | `{ rong, cao }`. **Chỉ cần khi ảnh nằm ngoài site** (Supabase Storage) — lúc đó không có file trên đĩa để đo, nên phải truyền số đã ghi lại lúc tải lên. Ảnh trong repo thì bỏ qua. |
| `schema` | JSON-LD riêng của trang. Trang bài viết truyền `MedicalScholarlyArticle`, trang chuyên mục truyền `CollectionPage`. |
| `khong_lap_chi_muc` | Bật cho trang không muốn Google lưu, ví dụ trang 404. Nó thêm `noindex` **và bỏ luôn canonical** — trang 404 mà trỏ canonical về chính nó là đang bảo Google "đây là trang thật, cứ lưu vào". |

## Mẫu một trang dịch vụ

```astro
---
import Trang from "../layouts/Trang.astro";
import DuongDan from "../components/DuongDan.astro";
import { timDichVu } from "../data/dich-vu.mjs";
---

<Trang
  tieu_de="«Nội dung ngắn gọn»"
  mo_ta="«120–160 ký tự, có nhắc tên Bác sĩ Lê Trung Kiên»"
  duong_dan="«ten-trang»"
  anh="assets/img/«anh-chia-se».jpg"
  anh_alt="«Mô tả ảnh»"
  loai_trang="service"
  lop_body="subpage"
  scripts={["thong-tin.js","seo-schema.js","service-cards.js","sticky-cta.js"]}
>
  <section class="section cv-hero">
    <div class="container">
      <DuongDan hien_tai={timDichVu("«ten-trang»").ten} />
      <h1>«Tiêu đề lớn của trang»</h1>
    </div>
  </section>
</Trang>
```

Thêm trang mới thì làm nốt hai việc ngoài file này, nếu không Google sẽ không
tìm ra nó:

1. Thêm một khối vào `TRANG_TINH` trong `web/src/pages/sitemap.xml.ts`, kèm
   `lastmod` là ngày hôm nay.
2. Trỏ ít nhất một liên kết tới nó từ menu, chân trang hoặc một trang khác.

## Những gì KHÔNG còn phải làm

Site cũ viết tay từng file `.html`, nên tài liệu đời trước bảo phải chép ~20
dòng thẻ meta, tự khai `data-page`, tự thêm bài vào `blog-cards.js`, tự thêm
dòng vào khối `<noscript>` ở trang chủ, và giữ đúng thứ tự nạp script. **Không
còn thứ nào trong số đó.** Header, footer, bộ icon, dòng tác giả, breadcrumb,
danh sách bài, sitemap — tất cả đều dựng sẵn phía máy chủ.
