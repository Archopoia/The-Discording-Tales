// @ts-nocheck
/**
 * /landing/ cinematic entry.
 *
 * Order:
 *   1. Boot conductor (one gsap.ticker, Lenis unless reduced motion).
 *   2. Boot chapters (section progress + palette CSS vars).
 *   3. Mount shader backdrop (fixed canvas, uniforms follow chapters).
 *   4. Wire showcase pin + overlay choreography.
 *   5. Wire Three.js signature fly-through.
 *   6. Static UX: topbar density.
 *   7. Preloader lifts when hero poster + first textures are decoded.
 */
import './styles/landing.css';
import ledger from '../../public/data/landing-cinema.json';
import { createConductor } from './conductor';
import { bootChapters } from './chapters';
import { initShowcaseVideo, initPitchSlider } from './parade';
import { initGeocosmos } from './geocosmos';
import { initTopbarDensity } from './team';
import { initLandingMusic } from './music';
import { runPreloader } from './preloader';

function safe(label: string, fn: () => void) {
  try { fn(); } catch (err) { console.error('[landing]', label, err); }
}

function boot() {
  const conductor = createConductor();
  bootChapters(conductor, ledger as any);

  safe('geo', () => initGeocosmos(conductor));
  safe('video', () => initShowcaseVideo());
  safe('pitch', () => initPitchSlider());

  safe('topbar', () => initTopbarDensity());
  safe('music', () => initLandingMusic());

  // Always lift the curtain, even if a later init threw.
  runPreloader();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
