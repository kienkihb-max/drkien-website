# Mẫu `<head>` và khối script

Chép nguyên rồi thay các chỗ đánh dấu `«...»`. Thứ tự các thẻ không quan
trọng với trình duyệt, nhưng giữ đúng thứ tự này thì mọi trang giống nhau,
dễ so sánh khi có gì sai.

## Bài blog

```html
<!DOCTYPE html>
<html lang="vi" data-page="article" data-ngay-dang="«2026-08-08»">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>«Tiêu đề ngắn gọn» — Bác sĩ Lê Trung Kiên</title>
<meta name="description" content="«Mô tả 100–175 ký tự, nói về nội dung bài»">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<!-- Tải font không chặn hiển thị: trình duyệt vẽ chữ bằng font hệ thống trước,
     đổi sang font riêng khi tải xong. Chữ hiện sớm hơn trên mạng chậm. -->
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@600;700&family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@600;700&family=Inter:wght@400;500;600;700&display=swap"></noscript>
<link rel="canonical" href="https://bacsikien.com/«ten-trang»">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Bác sĩ Lê Trung Kiên">
<meta property="og:locale" content="vi_VN">
<meta property="og:title" content="«giống hệt thẻ title ở trên»">
<meta property="og:description" content="«giống hệt meta description ở trên»">
<meta property="og:url" content="https://bacsikien.com/«ten-trang»">
<meta property="og:image" content="https://bacsikien.com/assets/img/«anh-mo-dau-bai».jpg">
<meta property="og:image:width" content="«chiều rộng thật của ảnh»">
<meta property="og:image:height" content="«chiều cao thật của ảnh»">
<meta property="og:image:alt" content="«mô tả ảnh»">
<meta property="article:published_time" content="«2026-08-08»T08:00:00+07:00">
<meta property="article:author" content="Bác sĩ Lê Trung Kiên">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="style.css">
</head>
```

Không biết kích thước ảnh thì chạy lệnh này, nó in ra rộng x cao:

```bash
node -e "const b=require('fs').readFileSync(process.argv[1]);let i=2;while(i<b.length){if(b[i]===0xff&&b[i+1]>=0xc0&&b[i+1]<=0xcf&&![0xc4,0xc8,0xcc].includes(b[i+1])){console.log(b.readUInt16BE(i+7)+'x'+b.readUInt16BE(i+5));break}i+=2+b.readUInt16BE(i+2)}" assets/img/ten-anh.jpg
```

Hoặc cứ điền đại rồi chạy bộ kiểm tra — nó đọc kích thước thật và báo cho
biết con số đúng là bao nhiêu.

## Trang thường (dịch vụ, danh sách)

Giống hệt mẫu trên, trừ bốn điểm:

- Thẻ `<html>`: `data-page="service"` (hoặc `"home"` cho trang chủ), **bỏ**
  `data-ngay-dang`.
- `og:type` là `website`.
- **Bỏ** `article:published_time` và `article:author`.
- Mô tả nên nhắc tên "Bác sĩ Lê Trung Kiên".

## Khối script cuối `<body>`

```html
<script src="icons.js"></script>
<script src="thong-tin.js"></script>
<script src="seo-schema.js"></script>
<script src="blog-byline.js"></script>   <!-- chỉ bài blog -->
<script src="site-header.js"></script>
<script src="site-footer.js"></script>
<script src="blog-cards.js"></script>    <!-- trang blog và các bài blog -->
<script src="service-cards.js"></script> <!-- trang chủ và trang dịch vụ -->
<script src="lightbox.js"></script>      <!-- trang có ảnh bấm vào phóng to -->
<script src="sticky-cta.js"></script>    <!-- trang dịch vụ -->
```

Thứ tự có ý nghĩa ở hai chỗ:

- `thong-tin.js` phải trước `seo-schema.js` — schema đọc địa chỉ, giờ làm
  việc, số Zalo từ đó.
- `service-cards.js` phải trước `sticky-cta.js` — thanh CTA nhân bản nút từ
  thẻ dịch vụ đã dựng xong.

## Trang chuyển hướng khi đổi địa chỉ

Khi đổi tên một trang, đừng xóa file cũ. Thay ruột nó bằng đoạn này để link
đã chia sẻ ra ngoài vẫn dẫn về đúng chỗ, và Google dồn điểm sang trang mới
thay vì coi là hai trang trùng nội dung:

```html
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0; url=/«ten-trang-moi»">
<link rel="canonical" href="https://bacsikien.com/«ten-trang-moi»">
<meta name="robots" content="noindex, follow">
<title>«Tiêu đề ngắn»</title>
</head>
<body>
<p>Trang đã chuyển tới <a href="/«ten-trang-moi»">«tên trang mới»</a>.</p>
<script>location.replace("/«ten-trang-moi»");</script>
</body>
</html>
```

Trang chuyển hướng **không** được nằm trong `sitemap.xml`.

## Khối `<url>` cho sitemap.xml

```xml
  <url>
    <loc>https://bacsikien.com/«ten-trang»</loc>
    <lastmod>«2026-08-08»</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>
```

`changefreq` và `priority` chỉ là gợi ý cho Google, không phải mệnh lệnh.
Quy ước đang dùng: trang chủ `weekly`/`1.0`, trang hồ sơ `monthly`/`0.9`,
trang dịch vụ `monthly`/`0.8`, trang blog `weekly`/`0.7`, bài viết
`yearly`/`0.6`.
