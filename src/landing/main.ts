// @ts-nocheck
/**
 * /landing/ cinematic entry.
 *
 * Critical path (before curtain lifts):
 *   conductor + chapters + geocosmos upgrade + preloader
 * Deferred (after tdt-landing-ready):
 *   progressive pitch, video, pitch slider, music, scene-lab immersive
 */
import './styles/landing.css';
import ledger from '../../public/data/landing-cinema.json';
import { createConductor } from './conductor';
import { bootChapters } from './chapters';
import { initShowcaseVideo, initPitchSlider } from './parade';
import { initGeocosmos, upgradeGeocosmosArt } from './geocosmos';
import { initLandingProgressive } from './progressive';
import { initTopbarDensity } from './team';
import { initLandingMusic } from './music';
import { runPreloader } from './preloader';
import { initSceneLabImmersive } from '../shared/scene-lab-immersive';

function log(...args: unknown[]) {
  const w = window as Window & { __TDT_LANDING_LOG__?: unknown[] };
  (w.__TDT_LANDING_LOG__ ||= []).push({ t: Math.round(performance.now()), msg: args.map(String).join(' ') });
  console.info('[tdt-boot]', ...args);
}

function safe(label: string, fn: () => void) {
  const t0 = performance.now();
  try {
    fn();
    log(label, 'ok', Math.round(performance.now() - t0) + 'ms');
  } catch (err) {
    console.error('[landing]', label, err);
    log(label, 'ERR', String(err));
  }
}

function whenIdle(fn: () => void, timeout = 1200) {
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (typeof ric === 'function') ric(fn, { timeout });
  else setTimeout(fn, Math.min(timeout, 200));
}

function boot() {
  log('boot start');
  const t0 = performance.now();
  const conductor = createConductor();
  log('conductor', Math.round(performance.now() - t0) + 'ms');

  safe('chapters', () => bootChapters(conductor, ledger as any));
  safe('geo', () => initGeocosmos(conductor));
  safe('topbar', () => initTopbarDensity());

  // Kick geo upgrade even if init path changed; idempotent.
  const geoImg = document.querySelector<HTMLImageElement>('[data-geo] img');
  if (geoImg) upgradeGeocosmosArt(geoImg);

  // Curtain + gate sharpen - keep on critical path.
  // Prefer lifting after geo full is in, without exceeding preloader cap.
  const geoReady = new Promise<void>((resolve) => {
    const img = document.querySelector<HTMLImageElement>('[data-geo] img');
    if (!img) {
      resolve();
      return;
    }
    const done = () => resolve();
    const check = () => {
      if (img.classList.contains('is-full') && img.naturalWidth > 1000) done();
    };
    check();
    const mo = new MutationObserver(check);
    mo.observe(img, { attributes: true, attributeFilter: ['class', 'src'] });
    img.addEventListener('load', check);
    setTimeout(() => {
      mo.disconnect();
      done();
    }, 1600);
  });

  runPreloader();
  log('preloader scheduled');
  void geoReady.then(() => log('geo-full settled'));

  const defer = () => {
    log('deferred start');
    safe('progressive', () => initLandingProgressive());
    safe('pitch', () => initPitchSlider());
    // Video + scene shell after a beat; music only on user gesture (see music.ts).
    whenIdle(() => {
      safe('video', () => initShowcaseVideo());
      safe('scene-lab-src', () => {
        document.querySelectorAll<HTMLIFrameElement>('iframe.scene-lab-frame[data-src]').forEach((frame) => {
          if (frame.getAttribute('src')) return;
          const src = frame.getAttribute('data-src');
          if (src) frame.setAttribute('src', src);
        });
      });
      safe('scene-lab', () => initSceneLabImmersive());
      safe('music', () => initLandingMusic());
      log('deferred idle done');
    }, 900);
  };

  if (document.documentElement.getAttribute('data-landing-ready') === 'true') {
    defer();
  } else {
    document.addEventListener('tdt-landing-ready', defer, { once: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
