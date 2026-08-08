---
name: front-end
description: Quy ước sửa giao diện website drkien-website (HTML/CSS/JS thuần, không build step). Dùng skill này bất cứ khi nào chạm vào .html, style.css hoặc các file .js ở gốc dự án — thêm/sửa/xoá bài blog, đổi thông tin phòng khám, thêm trang mới, thêm icon, chèn ảnh, sửa header/footer/lightbox, hay chỉ đổi vài dòng chữ. Kể cả khi việc nghe có vẻ nhỏ và chỉ động một chỗ, hãy đọc skill này trước, vì phần lớn giao diện ở đây được dựng bằng component dùng chung và sửa thẳng vào HTML sẽ bị component ghi đè hoặc làm lệch các trang khác.
---

# Sửa front-end drkien-website

Website cá nhân của ThS.BS Lê Trung Kiên. HTML/CSS/JS thuần, **không có bước
build**, không npm. Chủ website tự sửa chữ nghĩa và không phải lập trình viên
— đó là lý do mọi thứ được giữ đơn giản và mọi nội dung sửa được đều nằm thành
hằng số ở đầu file.

## Luật quan trọng nhất

**UI xuất hiện ở nhiều hơn một trang thì phải nằm trong một component, không
được chép tay.**

Đây không phải sở thích kiến trúc. Dự án từng có 11 trang mỗi trang tự chép
sprite icon (18 icon bị chép 42 lần), mỗi bài blog tự chép 4 thẻ "Bài viết
khác", số Zalo nằm ở 8 file. Hậu quả thật: đổi một tiêu đề bài phải sửa 6 chỗ,
sót một chỗ thì lệch mà không ai biết cho tới khi người dùng nhìn thấy.

Không có bước build nên khuôn mẫu là: **một file JS tự chứa, dựng nội dung vào
một phần tử giữ chỗ trong HTML.** Nội dung sửa được để thành hằng số ở đầu file
kèm chú thích tiếng Việt, để chủ website đổi chữ mà không phải đọc logic.

Trước khi viết bất kỳ đoạn HTML nào lặp lại, hãy hỏi: chỗ này đã có component
chưa? Nếu chưa mà nó sẽ xuất hiện ở trang thứ hai, hãy tạo component.

## Bản đồ component

| File | Lo việc gì | Giữ chỗ trong HTML |
|---|---|---|
| `icons.js` | Toàn bộ sprite SVG (18 icon) | tự chèn, không cần gì |
| `thong-tin.js` | Địa chỉ, bản đồ, giờ làm việc, Zalo, Facebook | `data-tt=`, `data-tt-href=` |
| `seo-schema.js` | JSON-LD cho Google | đọc `<link rel="canonical">` |
| `blog-byline.js` | Dòng tác giả đầu bài blog | tự chèn |
| `site-header.js` | Header, menu, breadcrumb | `<header class="site-header">` |
| `site-footer.js` | Footer 6 cột | `<footer class="site-footer">` |
| `service-cards.js` | Thẻ 3 dịch vụ + khối "Xem thêm" | `.service-cards`, `section.service-related` |
| `blog-cards.js` | Danh sách bài + khối "Bài viết khác" | `.blog-list`, `section.blog-related` |
| `lightbox.js` | Bấm ảnh để phóng to | tự chèn, đọc `data-full` |
| `sticky-cta.js` | Thanh CTA dính đáy trên mobile | clone nút CTA sẵn có |
| `script.js` | Nút lên đầu trang (chỉ trang chủ) | `#backToTop` |

## Thứ tự nạp script

Thứ tự này **không tuỳ tiện đổi được**:

```html
<script src="icons.js"></script>      <!-- 1. sprite phải có trước khi ai dùng -->
<script src="thong-tin.js"></script>  <!-- 2. tạo window.THONG_TIN -->
<script src="seo-schema.js"></script> <!-- 3. đọc window.THONG_TIN -->
<script src="site-header.js"></script><!-- 4. đọc window.THONG_TIN -->
<script src="site-footer.js"></script><!-- 5. đọc window.THONG_TIN -->
<!-- rồi mới tới các component theo loại trang -->
```

`site-header.js`, `site-footer.js`, `service-cards.js`, `seo-schema.js` đều đọc
`window.THONG_TIN`. Nạp sai thứ tự thì chúng nhận `undefined` và trang gãy ngay
lập tức — lỗi này không âm thầm, sẽ thấy ngay khi mở trình duyệt.

Bộ script theo loại trang (xem `data-page` trên thẻ `<html>`):

- **home** — thêm `service-cards.js`, `lightbox.js`, `script.js`
- **service** — thêm `service-cards.js`, `sticky-cta.js`, và `lightbox.js` nếu trang có ảnh bấm phóng to được
- **article** (bài blog) — thêm `blog-byline.js` (trước header) và `blog-cards.js`
- **blog** (trang danh sách) — thêm `blog-cards.js`

## Việc thường gặp

### Thêm, sửa hoặc xoá bài blog

Sửa `DANH_SACH` trong `blog-cards.js` — **chỉ chỗ đó**. Thẻ ở trang blog và
khối "Bài viết khác" ở cuối mọi bài đều dựng từ đây. Đặt `noi_bat: true` để bài
lên khối nổi bật đầu trang blog.

Khối cuối bài tự loại chính bài đang mở và tự đổi nền xen kẽ với section phía
trên, không phải chỉnh tay.

Bài viết mới cần một file HTML riêng. Chép khung từ một bài đang có, đổi
`<title>`, `<meta name="description">`, `<link rel="canonical">`, `<h1>`, và
`data-ngay-dang` trên thẻ `<html>` cho `seo-schema.js`.

### Đổi địa chỉ, giờ làm việc, số Zalo, Facebook

Sửa `thong-tin.js`. Bản đồ Google suy ra từ địa chỉ nên đổi địa chỉ là bản đồ
đổi theo. Đừng viết lại mấy thứ này ở bất kỳ đâu khác — chúng từng nằm rải rác
8 chỗ và đó là lý do file này tồn tại.

Trong HTML dùng thuộc tính thay vì viết nội dung:

```html
<div data-tt="dia-chi-ban-do"></div>  <!-- địa chỉ kèm bản đồ -->
<div data-tt="gio"></div>             <!-- bảng giờ làm việc -->
<a data-tt-href="zalo">Nhắn Zalo</a>  <!-- tự điền href, target, rel -->
```

### Thêm icon

Thêm vào mảng `ICONS` trong `icons.js`, rồi dùng
`<svg class="icon"><use href="#ic-ten"/></svg>`. Không chép `<symbol>` vào
HTML nữa.

`icons.js` chỉ chèn icon nào trang chưa có, nên `site-footer.js` và
`lightbox.js` vẫn tự chèn icon riêng của chúng được — không giẫm chân nhau.

### Chèn ảnh

Ảnh nằm trong `assets/img`, đặt tên có nghĩa theo nhóm: `blog-`, `award-`,
`community-`, `sports-`, `treatment-`, `offer-`, `speak-`, `feedback-`,
`testimonial-`.

**Mở ảnh ra xem trước khi dùng.** Tên file trong dự án này đã từng sai: có hai
file bị đặt tên tráo nhau, dẫn tới việc đưa ảnh lễ trao bằng khen lên làm ảnh
bìa một bài về thoát vị đĩa đệm. Tên file không phải bằng chứng về nội dung.

Quy tắc dung lượng đã áp cho toàn bộ thư viện ảnh:

- Rộng tối đa **1600px** — bằng đúng nhu cầu của ảnh bìa bài viết trên màn
  retina (hiển thị 780px × 2). To hơn là lãng phí.
- Chất lượng JPEG **85**, riêng ảnh có chữ (ảnh chụp tin nhắn, bằng khen) dùng
  **88** để chữ không bị nhoè.
- PNG chỉ dùng khi cần nền trong suốt. PNG lưu ảnh chụp màn hình rất nặng —
  chuyển sang JPEG từng giảm được 75–94% cho vài file.

Ảnh hiển thị nhỏ nhưng bấm vào phóng to được (dải ảnh phản hồi) thì tách hai
bản: `src` trỏ bản `-thumb.jpg` rộng 640px, `data-full` trỏ bản gốc.
`lightbox.js` đọc `data-full` nên không phải sửa JS.

```html
<img src="assets/img/x-thumb.jpg" data-full="assets/img/x.jpg" alt="...">
```

Chỉ tạo thumbnail khi tiết kiệm được đáng kể — dưới khoảng 30% thì thêm một
file với một lượt tải không bõ.

### Liên kết

Liên kết nội bộ **không có đuôi `.html`**: `href="blog"`, `href="/"`,
`href="/#experience"`. GitHub Pages phục vụ cả `/blog` lẫn `/blog.html` nên link
cũ vẫn sống, nhưng link mới viết dạng gọn.

Cẩn thận với `site-header.js`: biến `TRANG_CHU` dùng cho liên kết, còn việc
nhận diện có đang ở trang chủ hay không do `laTrangChu` lo (xét cả `""`,
`"index"`, `"index.html"`). Đừng gộp hai việc đó vào một hằng số — đã từng làm
hỏng neo `#top` và menu trang chủ.

## Kiểm chứng trước khi báo xong

Sửa xong thì **mở trình duyệt xem**, đừng suy đoán. Server chạy thử:
`preview_start` với `{name: "static-site"}` từ `.claude/launch.json`.

Những thứ đáng đo bằng JS trong trang thay vì nhìn bằng mắt:

- Component đã dựng chưa (`document.querySelector('.footer-grid')` có nội dung không)
- Mọi `<use href="#...">` có tìm thấy symbol không
- Có liên kết nào chết không (fetch HEAD từng href nội bộ)
- Ảnh có tải được không — nhớ ảnh `loading="lazy"` ở dưới màn hình sẽ báo
  `naturalWidth === 0` dù file hoàn toàn bình thường, phải cuộn tới rồi mới đo
- Trang có bị trượt ngang không (`scrollWidth > innerWidth`)

Đổi CSS hay JS mà xem trên bacsikien.com không thấy đổi thì **Ctrl+F5 trước khi
nghi ngờ deploy** — GitHub Pages đệm các file này khoảng 10 phút.

## Commit

Theo `CLAUDE.md` ở gốc dự án: **chỉ commit khi được yêu cầu rõ ràng**, và
**commit thì push luôn trong cùng một bước** — chủ website làm việc trên nhiều
máy và dựa vào `origin/main` luôn mới.

Tách commit theo chủ đề, mỗi commit tự đứng vững được. Tin nhắn viết tiếng
Việt, nói **vì sao** chứ không chỉ **cái gì** — kể cả hiện trạng trước khi sửa,
vì đó là thứ người đọc sau này không tự suy ra được.

## Giọng văn

Bác sĩ xưng **"mình"**, không xưng "tôi". Ngoại lệ là khi "tôi" là lời người
khác: câu hỏi của bệnh nhân trong ngoặc kép, hay tiêu đề bài viết hỏi thay
người đọc ("Tôi đi làm cả ngày, như vậy đã đủ vận động chưa?").

Nội dung y khoa: **không tự bịa trích dẫn.** Nếu bài nhắc "nghiên cứu của X và
cộng sự" mà không có tên tạp chí, năm, số trang, thì để trống mục Tài liệu tham
khảo và hỏi chủ website, đừng đoán. Đây là trang nghề nghiệp của một bác sĩ.

## Bẫy đã gặp trên máy Windows này

PowerShell 5.1 đọc file `.ps1` theo bảng mã ANSI, nên ký tự Unicode trong
**chuỗi** của script (ví dụ dấu gạch dài `—`) sẽ vỡ và làm lỗi cú pháp. Giữ
phần mã ASCII; chú thích tiếng Việt thì không sao.

Regex phức tạp viết thẳng trong lệnh inline đôi khi bị lớp bảo vệ của shell
chặn. Đưa vào file `.ps1` rồi chạy thì qua.

Khi script tự động thêm thẻ `<script>` với điều kiện "chưa nạp thì mới thêm",
đừng để chú thích chèn kèm chứa tên file đó — điều kiện sẽ tưởng là đã nạp rồi
và bỏ qua. Lỗi này từng làm 5 trang thiếu `blog-cards.js` mà kiểm tra bằng
grep vẫn thấy "có".

## Làm việc song song

Có thể có phiên Claude khác sửa cùng thư mục này. Cả hai bên đều đọc file rồi
ghi đè cả file, nên nếu cùng ghi một file trong vài giây thì bên ghi sau xoá
sạch việc của bên trước — git không báo xung đột gì cả.

Trước khi chạy script sửa hàng loạt file, chạy `git status` xem có thay đổi nào
mình không tạo ra không. Nếu có, hoặc chờ, hoặc chia phạm vi theo file.
