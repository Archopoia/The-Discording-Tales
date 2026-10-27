// @ts-nocheck
/** Geocosmos backdrop. Starts tight on the center, upside down, and
 *  opens while turning upright across the whole scroll. The last frame
 *  is as wide as it can be while the disc still covers the viewport. */
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

function coverScale(img: HTMLImageElement) {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const bw = img.clientWidth;
  const bh = img.clientHeight;
  if (!nw || !nh || !bw || !bh) return 1.7;
  const fit = Math.min(bw / nw, bh / nh);
  const diameter = DISC_RADIUS * 2 * fit;
  if (!diameter) return 1.7;
  const diag = Math.hypot(window.innerWidth, window.innerHeight);
  return (diag / diameter) * FILL;
}

export function initGeocosmos(conductor: Conductor) {
  const root = document.querySelector<HTMLElement>('[data-geo]');
  const img = root?.querySelector<HTMLImageElement>('img');
  if (!root || !img) return;
  const apply = (scale: number, deg: number) => {
    root.style.setProperty('--geo', scale.toFixed(3));
    root.style.setProperty('--geo-rot', deg.toFixed(2) + 'deg');
  };
  if (conductor.reduceMotion) {
    apply(coverScale(img), 0);
    return;
  }
  apply(START, 180);
  conductor.addStep(() => {
    const t = Math.min(1, Math.max(0, conductor.getScrollProgress()));
    apply(START + (coverScale(img) - START) * t, 180 * (1 - t));
  });
}
