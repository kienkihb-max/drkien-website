# drkien-website — Claude Instructions

Personal one-page website for ThS.BS Lê Trung Kiên. Plain HTML/CSS/JS
(no build step, no npm needed) — kept simple on purpose since the
owner edits text by hand and isn't a developer.

## Shared UI must be a component, never copy-paste

Any UI that appears the same on more than one page — footer, header,
sprite icon, CTA, card — must live in **one** place so sửa một chỗ là
đổi đồng thời mọi trang. Never duplicate the markup into each HTML
file: 9 copies means 9 edits and one of them will silently drift.

There is no build step, so the pattern is a small self-contained JS
file that renders into a placeholder element:

- `site-footer.js` — footer dùng chung, mọi trang chỉ để
  `<footer class="site-footer"></footer>` rồi nạp script. Nội dung
  (địa chỉ, giờ làm việc, số Zalo) sửa trong file này.
- `sticky-cta.js` — thanh CTA dính đáy trên mobile; nút được clone từ
  CTA có sẵn của trang thay vì viết lại chữ.

When adding shared UI, keep the editable text as plain constants at the
top of the file so the owner can change wording without reading logic.
If a page needs an SVG symbol the component uses, the component should
inject the missing symbol itself rather than requiring every page to
carry the sprite.

## Git workflow

- **Do not commit on your own initiative.** Only commit when the user
  explicitly asks (e.g. "commit đi", "lưu lại").
- **Whenever you do commit, always push in the same step** — never
  leave a commit sitting local-only. The user works from multiple
  machines and relies on `origin/main` being current.
- Git identity for this repo is set locally (not global):
  `Le Trung Kien <kienkihb@gmail.com>` — separate from any other
  repo's identity on this machine.
