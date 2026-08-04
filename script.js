document.getElementById("year").textContent = new Date().getFullYear();

const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");

navToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", isOpen);
});

siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    siteNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  backToTop.classList.toggle("visible", window.scrollY > 400);
});

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCaption = document.getElementById("lightboxCaption");
let currentShots = [];
let currentShot = 0;

function showShot(index) {
  currentShot = (index + currentShots.length) % currentShots.length;
  const shot = currentShots[currentShot];
  lightboxImg.src = shot.src;
  lightboxImg.alt = shot.alt;
  lightboxCaption.textContent = shot.caption;
}

function openLightbox(shots, index) {
  currentShots = shots;
  showShot(index);
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.querySelectorAll(".shots-grid").forEach((gallery) => {
  const cards = Array.from(gallery.querySelectorAll(".shot-card"));
  const shots = cards.map((card) => ({
    src: card.querySelector("img").src,
    alt: card.querySelector("img").alt,
    caption: card.querySelector("figcaption").textContent.trim(),
  }));
  cards.forEach((card, index) => {
    card.addEventListener("click", () => openLightbox(shots, index));
  });
});

document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
document.getElementById("lightboxPrev").addEventListener("click", () => showShot(currentShot - 1));
document.getElementById("lightboxNext").addEventListener("click", () => showShot(currentShot + 1));

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") showShot(currentShot - 1);
  if (e.key === "ArrowRight") showShot(currentShot + 1);
});
