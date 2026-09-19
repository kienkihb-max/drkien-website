# drkien-website — Claude Instructions

Personal one-page website for ThS.BS Lê Trung Kiên.

**Site chạy bằng Astro, mã nguồn nằm trong `web/`.** Gốc kho còn giữ
`style.css`, `assets/`, `image/` và vài file JS của đời site tĩnh cũ;
`web/dong-bo-tinh.mjs` chép chúng sang `web/public` trước mỗi lần build.
`web/public/` bị `.gitignore` bỏ qua — **để file mới ở đó là lên mạng mất
file mà ở máy vẫn thấy bình thường.** Ảnh mới phải bỏ vào `assets/img` ở
gốc kho.

Chạy thử: `npm --prefix web run dev`. Dựng bản thật: `npm --prefix web run build`.

## Shared UI must be a component, never copy-paste

Any UI that appears the same on more than one page — footer, header,
card, CTA — must live in **one** place so sửa một chỗ là đổi đồng thời
mọi trang. Never duplicate the markup into a second file: hai bản là có
ngày hai bản lệch nhau mà không có lỗi nào hiện ra.

Component là file `.astro` trong `web/src/components/`, dựng sẵn lúc
build. Ví dụ đang có: `Header`, `Footer`, `ServiceCard`, `ServiceCards`,
`ServiceCardsRelated`, `ProductGrid`, `DuongDan`, `TheBai`.

Chữ nghĩa sửa được thì để trong `web/src/data/*.mjs` (`thong-tin.mjs`,
`dich-vu.mjs`, `san-pham.mjs`) — mỗi loại thông tin đúng một nguồn, và
chủ site đổi chữ mà không phải đọc logic.

**Đừng viết component mới bằng JS chạy phía trình duyệt.** Mấy file còn
lại trong `web/public/*.js` (`lightbox.js`, `sticky-cta.js`,
`seo-schema.js`, `icons.js`…) là di sản của site tĩnh, chưa kịp chuyển.
Cách đó đã trả giá thật: đường dẫn ảnh phải tự nối bằng tay nên có lần
404 trên trang lồng sâu, dữ liệu phải sinh thêm một bản `window.*` cho
trình duyệt đọc, và Google chỉ thấy nội dung sau khi chạy JS. Chạm vào
file nào trong số đó thì cân nhắc chuyển luôn nó thành component Astro.

## Đặt tên

**Định danh viết tiếng Anh. Chú thích viết tiếng Việt.** Chủ site đọc
chú thích, nên chú thích phải là tiếng Việt và nói *vì sao* chứ không
chỉ *cái gì*.

Tiếng Anh áp cho: tên file component (`ProductGrid.astro`), tên prop
(`items`, `service`, `alt`), tên biến trong mã mới, tên lớp CSS mới
(`.product-grid`, `.badge-bestseller`).

Ngoại lệ được giữ nguyên, **đừng đổi**:

- Tên file và trường dữ liệu trong `web/src/data/*.mjs` (`ten`, `anh`,
  `mo_ta_seo`, `duong_dan`…) — chủ site sửa trực tiếp mấy file này.
- Đường dẫn trang (`/san-pham`, `/dieu-tri`) — đổi là chết link cũ.
- Component và lớp CSS đã có từ trước (`DuongDan`, `TheBai`,
  `.offer-grid`, `.info-card`) — đổi phải sửa cả chục trang, không bõ.

Nói cách khác: code mới viết tiếng Anh, code cũ để yên.

## Khổ màn hình để ngắm

Giao diện tối ưu cho **viewport 1280 × 700**. Sửa xong mà muốn xem lại,
hoặc mở cho chủ site xem, thì đặt đúng khổ đó:

```
resize_window { width: 1280, height: 700 }
```

Đừng mở ở khổ khác rồi kết luận bố cục lệch — cao hơn 700 thì mọi thứ
trông thoáng hơn thực tế, thấp hơn thì tưởng là chật.

Vẫn phải thử thêm khổ điện thoại (`preset: "mobile"`, 375 × 812) trước
khi báo xong: phần lớn người đọc vào bằng điện thoại.

## Trang quản trị blog (admin.html)

`bacsikien.com/admin` là CMS tự viết: chủ site xem/sửa/ẩn/xóa/đăng bài
mà không cần mở code. Không có backend — trang ghi file thẳng vào repo
GitHub bằng token (Git Data API, mỗi lần đăng là MỘT commit gộp đủ
file bài + blog-cards.js + sitemap.xml). Các file liên quan:

- `admin-github.js` — gọi GitHub API, giữ token trong localStorage.
- `admin-bai-viet.js` — sinh file bài viết đúng khuôn và đọc ngược
  file HTML về dữ liệu form. **Đổi bố cục bài viết thì phải sửa cả
  `sinhHTML()` lẫn `docHTML()` cho khớp.**
- `admin-soan-thao.js` — khung soạn thảo, lọc sạch HTML dán từ Word.
- `admin.js` + `admin.css` — giao diện.

Ràng buộc phải giữ khi sửa các file khác:

- Vùng giữa hai mốc `/* DANH_SACH:BAT_DAU */` … `/* DANH_SACH:KET_THUC */`
  trong `blog-cards.js` phải luôn là JSON hợp lệ (nháy kép, không dấu
  phẩy thừa) — trang admin đọc/ghi đè đúng vùng này.
- Bài có `an: true` trong DANH_SACH là bài "gỡ khỏi danh sách": không
  hiện ở đâu nhưng file vẫn tồn tại để link cũ không chết.
- Trang admin ghi thẳng lên `origin/main`, nên **trước khi sửa nội dung
  blog trong repo local, luôn `git pull` trước** kẻo lệch với bài vừa
  đăng từ admin.

## Git workflow

- **Do not commit on your own initiative.** Only commit when the user
  explicitly asks (e.g. "commit đi", "lưu lại").
- **Whenever you do commit, always push in the same step** — never
  leave a commit sitting local-only. The user works from multiple
  machines and relies on `origin/main` being current.
- Git identity for this repo is set locally (not global):
  `Le Trung Kien <kienkihb@gmail.com>` — separate from any other
  repo's identity on this machine.
