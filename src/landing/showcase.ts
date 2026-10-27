// @ts-nocheck
/**
 * Pinned watchable showcase. The 90s trailer stays a <video> with native
 * controls (NOT an Apple frame-scrub: that pattern is for product sequences,
 * not narrative video). ScrollTrigger pins the stage for ~160vh so a few
 * overlay captions enter and leave on top. If the viewer presses play, we
 * release the pin so playback is uninterrupted by continued scrolling.
 */
import { gsap, ScrollTrigger, type Conductor } from './conductor';

export function initShowcase(conductor: Conductor) {
  const section = document.querySelector<HTMLElement>('[data-chapter="showcase"]');
  if (!section) return;

  const stage = section.querySelector<HTMLElement>('[data-stage]');
  const video = section.querySelector<HTMLVideoElement>('video');
  const play = section.querySelector<HTMLButtonElement>('[data-play]');
  const overlays = Array.from(section.querySelectorAll<HTMLElement>('[data-overlay]'));

  if (!stage || !video || !play) return;

  const startFilm = () => {
    stage.classList.add('is-playing');
    const pending = video.play();
    if (pending && pending.catch) {
      pending.catch(() => { stage.classList.remove('is-playing'); });
    }
    // Release the pin so continued scroll does not snap over the video.
    const st = ScrollTrigger.getById('showcase-pin');
    if (st) st.disable(false, false);
  };
  play.addEventListener('click', startFilm);
  video.addEventListener('play', () => stage.classList.add('is-playing'));

  if (conductor.reduceMotion || conductor.isMobile) {
    overlays.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
    return;
  }

  // Caption keyframes within the pin: data-in / data-out are 0..1.
  overlays.forEach((el) => {
    el.style.willChange = 'opacity, transform';
    el.style.opacity = '0';
  });

  ScrollTrigger.create({
    id: 'showcase-pin',
    trigger: section,
    start: 'top top',
    end: '+=160%',
    pin: stage,
    scrub: 0.5,
    anticipatePin: 1,
    onUpdate: (self) => {
      const p = self.progress;
      overlays.forEach((el) => {
        const inAt = parseFloat(el.dataset.in || '0');
        const outAt = parseFloat(el.dataset.out || '1');
        const span = Math.max(0.01, outAt - inAt);
        const local = Math.min(1, Math.max(0, (p - inAt) / span));
        const vis = inAt <= p && p <= outAt ? 1 : 0;
        const fade = vis * Math.min(1, local * 4) * Math.min(1, (1 - local) * 4 + 0.1);
        el.style.opacity = String(fade);
        el.style.transform = `translateY(${(1 - fade) * 12}px)`;
      });
    },
  });
}
