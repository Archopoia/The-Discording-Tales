// @ts-nocheck
/**
 * Peoples parade. Ten portraits stay in a sticky column for the whole
 * page. Scroll progress walks from the first people to the last, so the
 * art keeps moving after you leave any one chapter.
 * Images use object-fit contain inside the column: nothing is cropped.
 */
import type { Conductor } from './conductor';

const BASE = '../';

const PEOPLES = [
  ['assets/images/people/Aristois copy.webp', 'Aristese'],
  ['assets/images/people/Griscribes copy.webp', 'Greyscribes'],
  ['assets/images/people/Navillis copy.webp', 'Navillis'],
  ['assets/images/people/Méridiens copy.webp', 'Meridians'],
  ['assets/images/people/Grands Ylfes copy.webp', 'Great Ylves'],
  ['assets/images/people/Ylfes päles copy.webp', 'Pale Ylves'],
  ['assets/images/people/Ylfe des lacs copy.webp', 'Lake Ylves'],
  ['assets/images/people/Iqqars copy.webp', 'Iqqars'],
  ['assets/images/people/Tchalkchaï copy.webp', 'Tchalkchaïs'],
  ['assets/images/people/Slaadéens copy.webp', 'Slaadeans'],
];

export function initParade(conductor: Conductor) {
  const root = document.querySelector<HTMLElement>('[data-parade]');
  if (!root) return;
  const stage = root.querySelector<HTMLElement>('[data-parade-stage]');
  const nameEl = root.querySelector<HTMLElement>('[data-parade-name]');
  if (!stage || !nameEl) return;

  const imgs = PEOPLES.map(([src, name], i) => {
    const img = document.createElement('img');
    img.src = BASE + src;
    img.alt = name;
    img.decoding = 'async';
    img.draggable = false;
    if (i > 1) img.loading = 'lazy';
    stage.appendChild(img);
    return img;
  });

  if (conductor.reduceMotion) {
    root.setAttribute('data-parade-mode', 'still');
    imgs.forEach((img) => { img.style.opacity = '1'; img.style.transform = 'none'; });
    nameEl.textContent = '';
    return;
  }

  const n = imgs.length;
  conductor.addStep(() => {
    const p = conductor.getScrollProgress();
    const f = p * (n - 1);
    imgs.forEach((img, i) => {
      const d = i - f;
      const ad = Math.abs(d);
      const vis = Math.max(0, 1 - ad * 1.2);
      img.style.opacity = String(vis);
      img.style.transform = `translateX(-50%) translateX(${d * 10}%)`;
      img.style.zIndex = String(20 - Math.round(ad));
    });
    const idx = Math.max(0, Math.min(n - 1, Math.round(f)));
    nameEl.textContent = PEOPLES[idx][1];
  });
}

export function initShowcaseVideo() {
  const video = document.querySelector<HTMLVideoElement>('[data-ambient-video]');
  if (!video) return;
  video.muted = true;
  const play = () => { video.play().catch(() => {}); };
  if (video.readyState >= 2) play();
  else video.addEventListener('canplay', play, { once: true });
}

export function initPitchSlider() {
  const root = document.getElementById('landing-pitch');
  if (!root) return;
  const slides = Array.from(root.querySelectorAll<HTMLElement>('.pitch-slider__slide'));
  const prev = root.querySelector<HTMLButtonElement>('.pitch-slider__nav--prev');
  const next = root.querySelector<HTMLButtonElement>('.pitch-slider__nav--next');
  if (!slides.length || !prev || !next) return;

  let index = 0;
  const show = (nextIndex: number) => {
    index = Math.max(0, Math.min(slides.length - 1, nextIndex));
    slides.forEach((slide, i) => {
      const on = i === index;
      slide.classList.toggle('is-active', on);
      slide.toggleAttribute('hidden', !on);
    });
    prev.disabled = index === 0;
    next.disabled = index === slides.length - 1;
  };
  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  show(0);
}
