// @ts-nocheck
/**
 * Real-work preloader: preloads the hero poster, first fly-through textures,
 * and the single display font, then lifts the curtain. Runs while the user
 * reads the lockup. Fires 'tdt-landing-ready' when done.
 */
import type { ChaptersResult } from './chapters';

const BASE_HREF = '../';

function assetUrl(src: string) {
  if (/^https?:\/\//.test(src)) return src;
  return BASE_HREF + src.replace(/^\/+/, '');
}

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

export async function runPreloader(chapters: ChaptersResult) {
  const curtain = document.getElementById('tdt-landing-curtain');
  const bar = document.getElementById('tdt-landing-progress');

  const fly = chapters.getFlythrough();
  const urls: string[] = [];
  urls.push('assets/images/PoC-TDT-October-poster.jpg');
  if (fly?.waypoints) {
    fly.waypoints.slice(0, 3).forEach((w) => urls.push(w.texture));
  }

  let done = 0;
  const total = urls.length;
  const update = () => {
    if (!bar) return;
    const pct = Math.round((done / Math.max(1, total)) * 100);
    bar.style.setProperty('--p', String(pct / 100));
    bar.setAttribute('aria-valuenow', String(pct));
  };
  update();

  const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T | void> =>
    Promise.race([p, new Promise<void>((res) => setTimeout(res, ms))]);

  await withTimeout(
    Promise.all(urls.map((u) => preloadImage(assetUrl(u)).then(() => { done++; update(); }))),
    2500,
  );

  // Try to resolve the display font so the hero does not reflow mid-lift,
  // but never let it block the curtain lift.
  if ('fonts' in document) {
    try { await withTimeout((document as any).fonts.load('1em "Quintessential"'), 800); } catch { /* noop */ }
  }

  function liftCurtain() {
    if (!curtain) return;
    curtain.classList.add('is-lifting');
    curtain.addEventListener('transitionend', () => curtain.remove(), { once: true });
    // Safety: force-remove after lift transition even if transitionend misses.
    setTimeout(() => curtain.remove(), 1400);
  }

  liftCurtain();
  document.documentElement.setAttribute('data-landing-ready', 'true');
  document.dispatchEvent(new CustomEvent('tdt-landing-ready'));
}

// Hard safety: if main.ts dies before preloader runs, nuke the curtain
// after 4 seconds so the page is never visually blocked.
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const c = document.getElementById('tdt-landing-curtain');
    if (c && !c.classList.contains('is-lifting')) {
      c.classList.add('is-lifting');
      setTimeout(() => c.remove(), 900);
      document.documentElement.setAttribute('data-landing-ready', 'true');
    }
  }, 4000);
}
