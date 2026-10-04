// Logic của lightbox dùng chung cho trang admin (markup nằm ở components/Lightbox.astro,
// giao diện ở components/lightbox.css). Hành vi bám lightbox.js của site tĩnh:
// chuyển ảnh có vòng, bấm nền đóng, ←/→/Esc, khóa cuộn nền.
// Khác một điều: lightbox.js quét ảnh lúc tải trang, còn ảnh admin sinh ra sau bằng
// JS nên ở đây trang gọi thẳng moLightbox(danh_sach, vi_tri).

export interface AnhLightbox {
  src: string;
  alt?: string;
  /** Chú thích gốc; khi có nhiều ảnh sẽ được nối thêm " n/N". */
  caption?: string;
}

let ds: AnhLightbox[] = [];
let vi_tri = 0;
let nut_truoc_do: HTMLElement | null = null;

const lay = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;

function hien(i: number) {
  const lb_img = lay<HTMLImageElement>("lightboxImg");
  const cap = lay("lightboxCaption");
  if (!lb_img || !cap || ds.length === 0) return;
  vi_tri = (i + ds.length) % ds.length;
  const a = ds[vi_tri];
  lb_img.src = a.src;
  lb_img.alt = a.alt ?? a.caption ?? "";
  const dem = ds.length > 1 ? `${vi_tri + 1}/${ds.length}` : "";
  cap.textContent = [a.caption, dem].filter(Boolean).join(" ");
}

export function dangMo(): boolean {
  return !!lay("lightbox")?.classList.contains("open");
}

export function moLightbox(danh_sach: AnhLightbox[], bat_dau = 0) {
  const lb = lay("lightbox");
  if (!lb || danh_sach.length === 0) return;
  ds = danh_sach;
  nut_truoc_do = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  // Một ảnh thì hai nút chuyển vô nghĩa — ẩn đi.
  const nhieu = ds.length > 1;
  lay("lightboxPrev")!.hidden = !nhieu;
  lay("lightboxNext")!.hidden = !nhieu;
  hien(bat_dau);
  lb.classList.add("open");
  lb.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  lay("lightboxClose")?.focus();
}

export function dongLightbox() {
  const lb = lay("lightbox");
  if (!lb) return;
  lb.classList.remove("open");
  lb.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  nut_truoc_do?.focus();
  nut_truoc_do = null;
}

const lb = lay("lightbox");
if (lb) {
  lay("lightboxClose")!.addEventListener("click", dongLightbox);
  lay("lightboxPrev")!.addEventListener("click", () => hien(vi_tri - 1));
  lay("lightboxNext")!.addEventListener("click", () => hien(vi_tri + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) dongLightbox(); });
  // Pha capture + stopImmediatePropagation: Esc chỉ đóng lightbox, không để
  // trình xử lý Esc của trang đóng nốt panel phía sau.
  document.addEventListener("keydown", (e) => {
    if (!dangMo()) return;
    if (e.key === "Escape") dongLightbox();
    else if (e.key === "ArrowLeft") hien(vi_tri - 1);
    else if (e.key === "ArrowRight") hien(vi_tri + 1);
    else return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
}
