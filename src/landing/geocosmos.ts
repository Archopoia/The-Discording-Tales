// @ts-nocheck
/** Geocosmos backdrop. Starts tight on the center, upside down, and
 *  opens while turning upright across the whole scroll. The last frame
 *  is as wide as it can be while the disc still covers the viewport.
 *
 *  Progressive art: prefer medium in HTML, race to full during the curtain.
 *  Logs land on window.__TDT_LANDING_LOG__ for perf debugging. */
import type { Conductor } from './conductor';

const START = 4.4;
/* Disc radius on geocosmos-plain.webp (3118x2823). The plate is a
   circle; the bitmap's corners are parchment, so covering the bitmap
   still leaves a ring. Measured from the image center. */
const DISC_RADIUS = 1210;
/* 1 covers the viewport corners exactly. Lower opens the last frame
   further. 0.68 is wider than the edge-to-edge crop without dropping
   the disc into a margin. */
const FILL = 0.68;
const NATURAL_W = 2600;
const NATURAL_H = 2354;

function log(...args: unknown[]) {
  const row = { t: Math.round(performance.now()), msg: args.map(String).join(' ') };
  const w = window as Window & { __TDT_LANDING_LOG__?: unknown[] };
  (w.__TDT_LANDING_LOG__ ||= []).push(row);
  if (typeof console !== 'undefined') console.info('[tdt-geo]', ...args);
}

function absUrl(url: string): string {
  if (!url) return url;
  try {
    return new URL(url, document.location.href).href;
  } catch {
    return url;
  }
}

/** Contain-fit of the natural bitmap into the geo viewport box (zoom = 1). */
function baseFit(img: HTMLImageElement) {
  const nw = img.naturalWidth || NATURAL_W;
  const nh = img.naturalHeight || NATURAL_H;
  const bw = window.innerWidth;
  const bh = window.innerHeight * 0.94;
  if (!nw || !nh || !bw || !bh) return 1 / NATURAL_W;
  return Math.min(bw / nw, bh / nh);
}

/** Old --geo units (START…cover): relative to a viewport-fitted image. */
function coverZoom(img: HTMLImageElement) {
  const fit = baseFit(img);
  const diameter = DISC_RADIUS * 2 * fit;
  if (!diameter) return 1.7;
  const diag = Math.hypot(window.innerWidth, window.innerHeight);
  return (diag / diameter) * FILL;
}

/** Decode onto the visible <img> (one network request, no orphaned probe). */
async function swapSrc(img: HTMLImageElement, url: string, stage: 'is-medium' | 'is-full') {
  const href = absUrl(url);
  if (!href) return false;
  if ((img.currentSrc || img.src) === href && img.naturalWidth > 64) {
    img.classList.add(stage);
    img.classList.remove('is-soft');
    log(stage, 'already', img.naturalWidth);
    return true;
  }
  const t0 = performance.now();
  img.src = href;
  try {
    if (typeof img.decode === 'function') await img.decode();
    else {
      await new Promise<void>((resolve) => {
        if (img.complete && img.naturalWidth > 0) resolve();
        else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }
      });
    }
  } catch {
    /* decode can reject on rapid src swaps; naturalWidth still tells truth */
  }
  if (!(img.naturalWidth > 64)) {
    log(stage, 'FAIL', href);
    return false;
  }
  img.classList.add(stage);
  img.classList.remove('is-soft');
  syncNaturalBox(img);
  log(stage, 'ok', img.naturalWidth + 'px', Math.round(performance.now() - t0) + 'ms');
  return true;
}

/** Keep CSS box == decoded bitmap so medium is not stretched into a 3118 shell. */
function syncNaturalBox(img: HTMLImageElement) {
  const root = img.closest('[data-geo]') as HTMLElement | null;
  const nw = img.naturalWidth || NATURAL_W;
  const nh = img.naturalHeight || NATURAL_H;
  if (root) {
    root.style.setProperty('--geo-nw', nw + 'px');
    root.style.setProperty('--geo-nh', nh + 'px');
  }
  img.width = nw;
  img.height = nh;
}

/** LQIP/medium → full. Full is required: the camera starts at 4.4× zoom. */
export function upgradeGeocosmosArt(img: HTMLImageElement) {
  if (img.dataset.tdtGeoUpgrade === '1') return;
  img.dataset.tdtGeoUpgrade = '1';

  const medium = img.getAttribute('data-src-medium');
  const full = img.getAttribute('data-src-full');
  log('start', 'nw=' + img.naturalWidth, 'src=' + (img.getAttribute('src') || ''));

  void (async () => {
    // If HTML still points at LQIP, pull medium first for a usable interim.
    const onLqip = /_lqip\.webp/i.test(img.getAttribute('src') || '') || img.naturalWidth > 0 && img.naturalWidth <= 64;
    if (onLqip && medium) {
      await swapSrc(img, medium, 'is-medium');
    } else if (medium && !img.classList.contains('is-medium') && !img.classList.contains('is-full')) {
      img.classList.add('is-medium');
      img.classList.remove('is-soft');
    }
    if (full) {
      await swapSrc(img, full, 'is-full');
    }
    log('done', 'nw=' + img.naturalWidth, 'cls=' + img.className);
  })();
}

export function initGeocosmos(conductor: Conductor) {
  const root = document.querySelector<HTMLElement>('[data-geo]');
  const img = root?.querySelector<HTMLImageElement>('img');
  if (!root || !img) {
    log('missing geo node');
    return;
  }

  upgradeGeocosmosArt(img);
  syncNaturalBox(img);
  img.addEventListener('load', () => syncNaturalBox(img));

  const apply = (zoom: number, deg: number) => {
    // Absolute CSS scale on the natural-sized bitmap (= old viewport scale × baseFit).
    const abs = baseFit(img) * zoom;
    root.style.setProperty('--geo-scale', abs.toFixed(5));
    root.style.setProperty('--geo-rot', deg.toFixed(2) + 'deg');
    root.style.setProperty('--geo', zoom.toFixed(3));
  };
  if (conductor.reduceMotion) {
    apply(coverZoom(img), 0);
    return;
  }
  apply(START, 180);
  conductor.addStep(() => {
    const t = Math.min(1, Math.max(0, conductor.getScrollProgress()));
    apply(START + (coverZoom(img) - START) * t, 180 * (1 - t));
  });
}
