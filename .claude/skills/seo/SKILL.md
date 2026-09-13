---
name: seo
description: Quy tắc SEO cho website bacsikien.com của ThS.BS Lê Trung Kiên. Dùng skill này BẤT CỨ KHI NÀO đụng vào nội dung site — thêm bài blog mới, thêm trang mới, sửa tiêu đề, sửa mô tả, đổi ảnh, đổi địa chỉ trang, hay chỉ sửa vài câu chữ trong trang có sẵn. Cũng dùng khi được hỏi "SEO thế nào", "kiểm tra SEO", "sao Google chưa thấy trang", "chia sẻ Facebook không hiện ảnh", hoặc khi cần biết thẻ meta, canonical, schema, sitemap của site này phải viết ra sao.
---

# SEO cho bacsikien.com

Site đẩy một từ khóa duy nhất: **"Bác sĩ Lê Trung Kiên"**. Đây là truy vấn
kiểu tên riêng, nên thứ quyết định không phải nhồi từ khóa mà là làm Google
hiểu rõ *đây là một bác sĩ có thật, hành nghề ở đâu, học ở đâu*.

## Luôn bắt đầu và kết thúc bằng lệnh này

```bash
node .claude/skills/seo/scripts/kiem-tra-seo.js
```

Soi máy chủ dev (`npm --prefix web run dev`). Muốn soi bản thật đang chạy:

```bash
node .claude/skills/seo/scripts/kiem-tra-seo.js https://bacsikien.com
```

Nó lấy sitemap rồi mở từng địa chỉ trong đó, kiểm tiêu đề, mô tả, canonical,
thẻ chia sẻ Facebook (tải cả ảnh về đo kích thước thật), thứ bậc heading, ảnh
thiếu alt, robots.txt, **trang mồ côi** và **lastmod bị bỏ quên**.

`[LỖI]` phải sửa hết. `[NHẮC]` là gợi ý, cân nhắc theo ngữ cảnh.

Bộ kiểm tra bắt lỗi cú pháp và lỗi thiếu sót, không đọc được chất lượng câu
chữ. Phần đó đọc tiếp bên dưới.

## Site này được dựng ra sao — đọc trước khi sửa

Ba điều quyết định mọi thứ còn lại:

**1. Thẻ `<head>` chỉ sinh ra ở MỘT chỗ: `web/src/layouts/Trang.astro`.**
Không trang nào tự viết thẻ meta. Muốn đổi tiêu đề hay mô tả của một trang
thì sửa các thuộc tính truyền vào `<Trang>` ở đầu file trang đó, đừng thêm
thẻ `<meta>` vào thân. Danh sách thuộc tính: `references/mau-trang.md`.

**2. Bài viết KHÔNG nằm trong kho mã.** Chúng nằm trong database Supabase,
soạn qua `bacsikien.com/admin`. Thêm bài mới là việc của chủ site, không phải
việc của code — không có file nào để chép, không có danh sách nào để thêm tay.

**3. `sitemap.xml` sinh tự động lúc build** từ `web/src/pages/sitemap.xml.ts`.
Bài mới đăng là tự có mặt. Chỉ **trang tĩnh** mới phải khai tay ở đó.

## Ba nguyên tắc dễ vi phạm nhất

**1. Viết "Bác sĩ Lê Trung Kiên" đủ chữ, đừng viết tắt.** Google coi `ThS.BS`
là một chuỗi khác hẳn `Bác sĩ`. Tiêu đề trang phải có tên viết đủ; học vị để
sau cũng được. `Trang.astro` tự nối " — Bác sĩ Lê Trung Kiên" vào cuối tiêu
đề, trừ khi tên đã có sẵn trong đó — nên đừng tự gõ thêm lần nữa.

**2. Thẻ Open Graph phải là HTML tĩnh.** Google có chạy JavaScript nên JSON-LD
dựng bằng JS vẫn đọc được, nhưng trình thu thập của Facebook và Zalo thì
**không**. Thẻ `og:` mà sinh bằng JS thì khi chia sẻ link chỉ hiện URL trơ.
`Trang.astro` đã dựng sẵn phía máy chủ — đừng chuyển việc đó sang JS.

**3. Mỗi loại thông tin chỉ có một nguồn.** Chép tay sang chỗ thứ hai là có
ngày hai chỗ lệch nhau mà không ai biết:

| Thông tin | Nguồn duy nhất |
|---|---|
| Địa chỉ, giờ làm việc, Zalo, Facebook | `web/src/data/thong-tin.mjs` |
| Tên, mô tả, icon ba dịch vụ | `web/src/data/dich-vu.mjs` |
| Tiêu đề, mô tả, ảnh bìa từng bài | Database, sửa ở `/admin` |

## Thêm bài blog mới

Làm hoàn toàn trong `bacsikien.com/admin`, **không đụng vào code**. Mấy ô ảnh
hưởng trực tiếp tới SEO:

- **Tiêu đề bài** — cũng là tiêu đề trên Google, và cũng là dòng tít lớn trên
  trang. Giữ **dưới 45 ký tự**: máy tự nối thêm " — Bác sĩ Lê Trung Kiên"
  (23 ký tự) và tổng phải dưới 68, dài hơn thì Google cắt mất phần tên.
- **Đoạn mở đầu** — 160 ký tự đầu của nó thành mô tả trên Google. Viết sao cho
  **câu đầu tiên trọn ý và kết thúc trước 160 ký tự**, nếu không mô tả sẽ bị
  chặt ngang bằng dấu ba chấm. Hai ô "trên Google" trong trang quản trị bị
  khoá vì chúng sinh ra từ đây.
- **Mô tả ảnh bìa** — ô riêng, khác chú thích ảnh trong bài. Để trống là
  Google và trình đọc màn hình không biết ảnh chụp gì.
- **Chuyên mục** và **Dịch vụ** — quyết định bài xuất hiện ở trang mục nào,
  ở sidebar bài nào, và ở khối "Bài viết liên quan" của trang dịch vụ nào.
  Bỏ trống là bài mất mấy đường dẫn nội bộ đó.

Trong thân bài: mục lớn dùng nút **Tiêu đề lớn** (h2), mục con dùng **Tiêu đề
nhỏ** (h3). Đừng bắt đầu bằng Tiêu đề nhỏ — nhảy từ h1 xuống h3 là bỏ bậc, bộ
kiểm tra sẽ báo lỗi. Ảnh chèn vào nhớ điền chú thích, máy lấy nó làm mô tả ảnh.

## Thêm trang mới (không phải bài blog)

1. Chép một trang dịch vụ có sẵn làm khung, ví dụ `web/src/pages/dieu-tri.astro`.
2. Điền các thuộc tính của `<Trang>` — xem `references/mau-trang.md`.
3. **Thêm một khối vào `TRANG_TINH` trong `web/src/pages/sitemap.xml.ts`**,
   kèm `lastmod` là ngày hôm nay.
4. **Trỏ ít nhất một liên kết tới nó** từ menu, chân trang, hoặc một trang
   khác. Trang không ai dẫn tới thì Google hiếm khi chịu đọc — bộ kiểm tra
   gọi đó là trang mồ côi và báo `[LỖI]`.

## Sửa nội dung trang có sẵn

- Đổi tiêu đề hay mô tả thì sửa thuộc tính `tieu_de` / `mo_ta` của `<Trang>`.
  Thẻ `og:` tự đổi theo, không phải sửa hai lần.
- Đổi ảnh chia sẻ thì đổi thuộc tính `anh`. Kích thước tự đo từ file lúc
  build, không phải ghi tay.
- **Sửa nội dung đáng kể thì cập nhật `lastmod`** của trang đó trong
  `sitemap.xml.ts`. Ghi ngày **nội dung** đổi, không phải ngày build: đặt đại
  ngày hôm nay cho mọi lần build thì Google phát hiện ra là ngày giả rồi bỏ
  qua hẳn trường này. Đổi màu nút hay sửa menu chung thì không tính là đổi
  nội dung. Bộ kiểm tra có soát chỗ này.

## Đổi địa chỉ một trang

Đổi URL làm chết mọi link đã chia sẻ ra ngoài và mất thứ hạng đã có, nên chỉ
đổi khi thật đáng. Nếu đổi thì giữ địa chỉ cũ sống bằng một trang chuyển
hướng: `<meta http-equiv="refresh">` về địa chỉ mới, `khong_lap_chi_muc` bật
lên, và **không** đưa địa chỉ cũ vào sitemap.

Nhớ sửa hết chỗ trỏ tới nó: liên kết trong các trang, `TRANG_TINH` trong
sitemap, và menu ở `Header.astro` / `Footer.astro`.

## Ảnh

- Ảnh của trang tĩnh nằm ở `assets/img/`, tên có nghĩa và không dấu. Thư mục
  `image/` là kho ảnh nguồn chưa dùng, không trang nào lấy ảnh từ đó.
- Ảnh của bài viết tải lên qua trang quản trị, nằm trên Supabase Storage.
- Mọi thẻ `<img>` phải có `alt`. Ảnh trang trí thì `alt=""` là hợp lệ; ảnh có
  mặt bác sĩ thì nhắc tên trong `alt`.
- Ảnh chia sẻ đẹp nhất ở 1200x630. Trang chủ, trang hồ sơ, trang blog dùng
  chung `assets/img/og-share.jpg`.

## Sau khi sửa xong

1. Chạy lại bộ kiểm tra, sửa hết `[LỖI]`.
2. Xem thử trên trình duyệt nếu có đổi giao diện.
3. Deploy (đẩy lên `origin/main`, Cloudflare tự build).
4. Chạy bộ kiểm tra lần nữa với `https://bacsikien.com` để chắc bản thật
   đúng như bản dev.
5. Kiểm chứng những thứ không test được từ máy:
   - Schema: https://search.google.com/test/rich-results
   - Ảnh chia sẻ: https://developers.facebook.com/tools/debug/
6. Thêm trang mới thì vào Google Search Console gửi lại `sitemap.xml`.

## Khi Google chưa lập chỉ mục trang

Search Console báo "Discovered — currently not indexed" nghĩa là Google biết
địa chỉ nhưng chưa chịu đọc. Kiểm theo thứ tự này, đừng đoán:

1. Chạy bộ kiểm tra với `https://bacsikien.com`. Nó bắt được phần lớn nguyên
   nhân kỹ thuật: trang mồ côi, canonical trỏ sai chỗ, `noindex` lẫn vào,
   địa chỉ trong sitemap trả về lỗi.
2. Mở `https://bacsikien.com/robots.txt`. Cloudflare tự chèn một khối chặn
   bot huấn luyện AI (GPTBot, ClaudeBot, Google-Extended…) — **khối đó không
   ảnh hưởng tìm kiếm**, đừng nhầm là đang chặn Google. Chỉ lo khi nhóm
   `User-agent: *` có `Disallow: /`.
3. Nếu kỹ thuật sạch mà Google vẫn chưa đọc thì nguyên nhân gần như luôn là
   **tên miền còn mới và chưa có ai trỏ tới**. Cách chữa không nằm trong code:
   đặt link về site từ trang Facebook của bác sĩ, phần giới thiệu tác giả trên
   các báo đã đăng bài, và hồ sơ Google Doanh nghiệp.

## Đọc thêm

- `references/mau-trang.md` — danh sách thuộc tính của `Trang.astro`, kèm
  giải thích từng cái dùng làm gì và trang nào nên truyền gì.
