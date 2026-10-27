// @ts-nocheck
/**
 * Showcase video and pitch slider.
 * The peoples/origins column lives in archive/landing-slideshow/ and is not loaded.
 */

function silenceShowcase(video: HTMLVideoElement) {
  if (!video.muted) video.muted = true;
  video.defaultMuted = true;
  if (video.volume !== 0) video.volume = 0;
  const tracks = (video as HTMLVideoElement & { audioTracks?: { length: number; [i: number]: { enabled: boolean } } }).audioTracks;
  if (!tracks) return;
  for (let i = 0; i < tracks.length; i++) tracks[i].enabled = false;
}

export function initShowcaseVideo() {
  const video = document.querySelector<HTMLVideoElement>('[data-ambient-video]');
  if (!video) return;
  silenceShowcase(video);
  video.addEventListener('volumechange', () => silenceShowcase(video));
  video.addEventListener('loadedmetadata', () => silenceShowcase(video));
  const play = () => {
    silenceShowcase(video);
    video.play().catch(() => {});
  };
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
