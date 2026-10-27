// @ts-nocheck
/**
 * ARCHIVED. Not imported by /landing/.
 * Landing slideshow: the fixed right-hand column of peoples and origins.
 *
 * Peoples parade. Ten portraits stay in a fixed column. Their origin
 * sits under them, in one shared frame: Yums, then Yors in front of a
 * darkened Yums, then Beingsts in front of both.
 * A portrait arrives from the top, small and faint, stands full size,
 * then shrinks and fades down into the origin. Origin pictures hang
 * lower so the viewport cuts their feet; captions stay put.
 */
import type { Conductor } from '../../src/landing/conductor';

const BASE = '../';

// Fixed portrait scale. Yums 80%, Pale Ylves 80%, Beingsts 120%. Others 100%.
const PEOPLE_SCALE = [0.8, 0.8, 0.8, 0.8, 1, 0.8, 1, 1, 1.2, 1.2];

const PEOPLES = [
  ['assets/images/people/Aristois copy.webp', 'Aristese', 'They ride giant furred starfish, hoard all knowledge in a moving library, and treat the Beingsts as beasts.'],
  ['assets/images/people/Griscribes copy.webp', 'Greyscribes', 'Their perfumers have driven a whole foe to mass suicide with a rumour.'],
  ['assets/images/people/Navillis copy.webp', 'Navillis', 'They garden on boats, and raise deep-ocean beings whose lights carry their speech.'],
  ['assets/images/people/Méridiens copy.webp', 'Meridians', 'They dance prophecies with their fingers on the corpses of the vanquished.'],
  ['assets/images/people/Grands Ylfes copy.webp', 'Great Ylves', 'They hunt Aristese as food, and cut Slaadean skin for their seats.'],
  ['assets/images/people/Ylfes päles copy.webp', 'Pale Ylves', 'They invented the Cordon d\'Or inside their mastodons, and that coin paid for the wars.'],
  ['assets/images/people/Ylfe des lacs copy.webp', 'Lake Ylves', 'Their rites heal the mind by first unsettling it.'],
  ['assets/images/people/Iqqars copy.webp', 'Iqqars', 'High and Low became one people in an ecstatic triumph of every body.'],
  ['assets/images/people/Tchalkchaï copy.webp', 'Tchalkchaïs', 'They live ten to twenty-seven years, and sacrifice is the virtue.'],
  ['assets/images/people/Slaadéens copy.webp', 'Slaadeans', 'In snow split by boiling springs, they count the Aristese as tools.'],
];

export function initParade(conductor: Conductor) {
  const root = document.querySelector<HTMLElement>('[data-parade]');
  if (!root) return;
  const stage = root.querySelector<HTMLElement>('[data-parade-stage]');
  const nameEl = root.querySelector<HTMLElement>('[data-parade-name]');
  const lineEl = root.querySelector<HTMLElement>('[data-parade-line]');
  const originFigs = Array.from(root.querySelectorAll<HTMLElement>('[data-origins] figure'));
  if (!stage || !nameEl || !lineEl) return;

  const imgs = PEOPLES.map(([src, name], i) => {
    const img = document.createElement('img');
    img.src = BASE + src;
    img.alt = name;
    img.decoding = 'async';
    img.draggable = false;
    if (i > 1) img.loading = 'lazy';
    img.style.setProperty('--people-scale', String(PEOPLE_SCALE[i]));
    img.style.transformOrigin = 'center bottom';
    stage.appendChild(img);
    return img;
  });

  if (conductor.reduceMotion) {
    root.setAttribute('data-parade-mode', 'still');
    imgs.forEach((img) => { img.style.opacity = '1'; img.style.transform = 'none'; });
    nameEl.textContent = '';
    lineEl.textContent = '';
    return;
  }

  const n = imgs.length;
  const YUM_YOR = 3.5;
  const YOR_BEING = 7.5;
  const SWAP = 0.4;
  // Fixed for the whole scroll. Yums 80%, Yors 100%, Beingsts 120%.
  const ORIGIN_BASE = [0.8, 1, 1.2];
  conductor.addStep(() => {
    const p = conductor.getScrollProgress();
    const f = p * (n - 1);
    imgs.forEach((img, i) => {
      const d = i - f;
      const ad = Math.abs(d);
      // Visible only near the current slot. Far ones are fully gone.
      const presence = Math.max(0, 1 - ad * 1.2);
      const span = 0.85;
      const along = Math.min(1, ad / span);
      // Small at the edges, the person's own scale when they are current.
      const scale = PEOPLE_SCALE[i] * (0.22 + 0.78 * presence);
      // Upcoming figures drop in from the top. Leaving figures sink into the origin.
      const yVh = d >= 0 ? -58 * along : 34 * along;
      img.style.opacity = String(presence);
      img.style.transform = `translateX(-50%) translateY(${yVh.toFixed(2)}vh) scale(${scale.toFixed(3)})`;
      img.style.zIndex = String(20 - Math.round(ad));
    });
    const idx = Math.max(0, Math.min(n - 1, Math.round(f)));
    nameEl.textContent = PEOPLES[idx][1];
    lineEl.textContent = PEOPLES[idx][2];

    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    const tYor = clamp01((f - (YUM_YOR - SWAP)) / SWAP);
    const tBeing = clamp01((f - (YOR_BEING - SWAP)) / SWAP);
    // Same frame the whole way. A new origin comes in front at full strength.
    // The one it covers drops to half light. The one before that drops further,
    // about 80% of the way to black, and stays there.
    const layers = [
      { presence: 1, bright: 1 - 0.5 * tYor - 0.3 * tBeing, cap: 1 - tYor },
      { presence: tYor, bright: 1 - 0.5 * tBeing, cap: 1 - tBeing },
      { presence: tBeing, bright: 1, cap: 1 },
    ];
    originFigs.forEach((fig, i) => {
      const layer = layers[i];
      fig.style.opacity = String(layer.presence);
      fig.style.visibility = layer.presence < 0.02 ? 'hidden' : 'visible';
      const img = fig.querySelector('img');
      if (img) {
        img.style.filter = `brightness(${layer.bright})`;
        img.style.transformOrigin = 'center bottom';
        const extra = i === 2 ? '25%' : '0px';
        img.style.transform = `translateY(calc(var(--origin-drop, 1.8rem) + ${extra})) scale(${ORIGIN_BASE[i]})`;
      }
      const cap = fig.querySelector('figcaption');
      if (cap) cap.style.opacity = String(layer.cap);
    });
  });
}

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
