---
name: seo
description: Quy tắc SEO cho website bacsikien.com của ThS.BS Lê Trung Kiên. Dùng skill này BẤT CỨ KHI NÀO đụng vào nội dung site — thêm bài blog mới, thêm trang mới, sửa tiêu đề, sửa mô tả, đổi ảnh, đổi địa chỉ trang, hay chỉ sửa vài câu chữ trong trang có sẵn. Cũng dùng khi được hỏi "SEO thế nào", "kiểm tra SEO", "sao Google chưa thấy trang", "chia sẻ Facebook không hiện ảnh", hoặc khi cần biết thẻ meta, canonical, schema, sitemap của site này phải viết ra sao. Site không có bước build nên mọi thứ phải viết tay đúng ngay từ đầu — đừng đoán, hãy đọc skill này trước.
---

# SEO cho bacsikien.com

Site này đang đẩy một từ khóa duy nhất: **"Bác sĩ Lê Trung Kiên"**. Đây là
truy vấn kiểu tên riêng, nên thứ quyết định không phải là nhồi từ khóa mà là
làm Google hiểu rõ *đây là một bác sĩ có thật, hành nghề ở đâu, học ở đâu*.
Mọi quy tắc bên dưới đều phục vụ mục tiêu đó.

Site không có bước build. Không có gì tự sinh ra lúc deploy — thiếu thẻ nào
là thiếu thật. Bù lại có một bộ kiểm tra soát hộ những chỗ dễ quên.

## Luôn bắt đầu và kết thúc bằng lệnh này

```bash
node .claude/skills/seo/scripts/kiem-tra-seo.js
```

Chạy trước khi sửa để biết hiện trạng, chạy lại sau khi sửa để chắc không làm
hỏng gì. Lệnh này soát cả 12 trang: tiêu đề, mô tả, canonical, Open Graph,
kích thước ảnh chia sẻ, thứ bậc heading, ngày đăng bài, sitemap, robots.txt.

`[LỖI]` phải sửa hết. `[NHẮC]` là gợi ý, cân nhắc theo ngữ cảnh.

Bộ kiểm tra bắt được lỗi cú pháp và lỗi thiếu sót, nhưng không đọc được chất
lượng câu chữ. Phần đó đọc tiếp bên dưới.

## Ba nguyên tắc dễ vi phạm nhất

**1. Viết "Bác sĩ Lê Trung Kiên" đủ chữ, đừng viết tắt.** Google coi
`ThS.BS` là một chuỗi khác hẳn với `Bác sĩ`. Trước đây toàn site viết tắt và
từ khóa mục tiêu gần như không xuất hiện ở chỗ có trọng số cao nhất. Tiêu đề
trang phải có tên viết đủ; học vị để sau cũng được.

**2. Open Graph bắt buộc là HTML tĩnh.** Google có chạy JavaScript nên
JSON-LD dựng bằng JS vẫn đọc được, nhưng trình thu thập của Facebook và Zalo
thì **không**. Thẻ `og:` mà sinh bằng JS thì khi chia sẻ link chỉ hiện URL
trơ. Đây là lý do `seo-schema.js` là file JS còn thẻ `og:` thì chép thẳng vào
từng trang — không phải quên gom lại thành component.

**3. Địa chỉ, giờ làm việc, số Zalo chỉ có một nguồn: `thong-tin.js`.**
Không chép tay vào bất kỳ trang nào. `seo-schema.js` đọc thẳng từ đó, kể cả
giờ mở cửa — sửa `thong-tin.js` là schema đổi theo. Địa chỉ trên site mà lệch
với hồ sơ Google Doanh nghiệp là mất điểm tìm kiếm địa phương.

## Thêm bài blog mới

1. Chép một bài có sẵn làm khung, ví dụ `shin-splints-dau-xuong-chay.html`.
2. Thẻ mở đầu: `<html lang="vi" data-page="article" data-ngay-dang="2026-08-08">`
   — ngày đăng dạng NĂM-THÁNG-NGÀY. Dòng tác giả và schema đều lấy ngày từ
   đây nên chỉ cần ghi một chỗ.
3. `<head>` theo mẫu trong `references/mau-trang.md`. Tiêu đề đặt dạng
   `<Nội dung ngắn gọn> — Bác sĩ Lê Trung Kiên`, giữ dưới 68 ký tự để phần
   tên không bị Google cắt mất trên trang kết quả.
4. Mô tả nói về nội dung bài, đừng nhồi tên bác sĩ vào — tên đã có ở dòng
   tác giả và trong schema rồi, nhồi thêm trông như spam.
5. `og:type` là `article`, thêm `article:published_time`. Ảnh chia sẻ dùng
   luôn ảnh mở đầu bài, nhớ ghi đúng kích thước thật của ảnh.
6. Nạp script cuối `<body>`, đúng thứ tự này:
   `icons.js` → `thong-tin.js` → `seo-schema.js` → `blog-byline.js` →
   `site-header.js` → `site-footer.js` → `blog-cards.js`.
   Thứ tự có ý nghĩa: `seo-schema.js` đọc địa chỉ và giờ làm việc từ
   `thong-tin.js` nên phải đứng sau.
7. Trong thân bài: mục lớn là `<h2>`, mục con là `<h3>`. Khối tài liệu tham
   khảo dùng `<h2>`. Đừng bắt đầu bằng `<h3>` — nhảy từ `h1` xuống `h3` là
   bỏ bậc.
8. Thêm bài vào danh sách `DANH_SACH` trong `blog-cards.js`, nếu không bài sẽ
   không hiện ở trang blog lẫn mục "Bài viết khác".
9. Thêm một khối `<url>` vào `sitemap.xml`.
10. Thêm một dòng vào khối `<noscript class="fallback-nav">` ở `index.html`.

## Thêm trang mới (không phải bài blog)

Giống trên, khác ba chỗ:

- `data-page="service"` cho trang dịch vụ, không có `data-ngay-dang`, không
  nạp `blog-byline.js`, không thêm vào `blog-cards.js`.
- `og:type` là `website`.
- Mô tả nên nhắc tên bác sĩ, vì đây là trang giới thiệu dịch vụ chứ không
  phải bài chuyên môn.

Nếu trang mới thuộc một loại khác hẳn (không phải dịch vụ, không phải bài
viết), mở `seo-schema.js` xem phần `kieu_trang` để quyết định nó nên là
`WebPage`, `ProfilePage` hay `CollectionPage`.

## Sửa nội dung trang có sẵn

- Đổi tiêu đề hoặc mô tả trong `<head>` thì nhớ đổi luôn `og:title` /
  `og:description` cho khớp. Bộ kiểm tra không bắt được chỗ lệch này vì cả
  hai đều hợp lệ về mặt cú pháp — phải tự để ý.
- Đổi ảnh mở đầu thì đổi luôn `og:image` và `og:image:width` /
  `og:image:height`. Cái này bộ kiểm tra có bắt.
- Sửa nội dung đáng kể thì cập nhật `<lastmod>` của trang đó trong
  `sitemap.xml`, và thêm `data-ngay-sua="..."` vào thẻ `<html>` nếu là bài
  blog.
- Đừng đổi `<h1>` của trang chủ. Chủ site đã chốt giữ nguyên câu
  "Đồng hành sức khỏe, từ phòng khám đến sân đấu".

## Đổi địa chỉ một trang

Đổi URL làm mất mọi link đã chia sẻ ra ngoài, nên chỉ đổi khi thật đáng.
Nếu đổi, giữ file cũ lại làm trang chuyển hướng thay vì xóa — xem
`ho-so.html` làm mẫu: `<meta http-equiv="refresh">` về địa chỉ mới,
`<meta name="robots" content="noindex, follow">`, canonical trỏ sang trang
mới, và **không** để địa chỉ cũ trong sitemap.

Nhớ sửa hết chỗ trỏ tới nó: link trong các trang, `sitemap.xml`, khối
`<noscript>` ở trang chủ, và cả logic nhận diện trang trong `seo-schema.js`
với `blog-byline.js` nếu trang đó có tên riêng trong code.

## Ảnh

- Đặt ảnh ở `assets/img/`, tên file có nghĩa và không dấu, ví dụ
  `blog-run-with-me-cong-dong-khoe.jpg`. Thư mục `image/` là kho ảnh nguồn
  chưa dùng, không trang nào lấy ảnh từ đó.
- Mọi thẻ `<img>` phải có `alt` mô tả đúng nội dung ảnh. Ảnh có mặt bác sĩ
  thì nhắc tên trong `alt` là hợp lý, ảnh minh họa chung thì không cần.
- Ảnh chia sẻ mạng xã hội đẹp nhất ở 1200x630. Trang chủ, trang hồ sơ và
  trang blog đang dùng chung `assets/img/og-share.jpg`.

## Sau khi sửa xong

1. Chạy lại bộ kiểm tra, sửa hết `[LỖI]`.
2. Xem thử trên trình duyệt nếu có đổi giao diện.
3. Sau khi deploy, kiểm chứng trên bản live — schema và Open Graph không
   test được từ file trên máy:
   - Schema: https://search.google.com/test/rich-results
   - Ảnh chia sẻ: https://developers.facebook.com/tools/debug/
4. Thêm trang mới thì vào Google Search Console gửi lại `sitemap.xml`.

## Đọc thêm

- `references/mau-trang.md` — mẫu `<head>` đầy đủ để chép, kèm giải thích
  từng thẻ dùng làm gì và chỗ nào phải thay.
