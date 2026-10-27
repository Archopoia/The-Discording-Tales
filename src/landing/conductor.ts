// @ts-nocheck
/**
 * Single animation clock for /landing/.
 * Wires Lenis -> gsap.ticker -> ScrollTrigger -> registered render callbacks.
 * All WebGL/scroll modules on this page MUST subscribe here; do not start
 * independent requestAnimationFrame loops.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export type RenderStep = (t: { time: number; delta: number; progress: number }) => void;

export interface Conductor {
  lenis: Lenis | null;
  reduceMotion: boolean;
  isMobile: boolean;
  addStep: (fn: RenderStep) => () => void;
  getScrollProgress: () => number;
  refresh: () => void;
  destroy: () => void;
}

const steps = new Set<RenderStep>();
let lastT = 0;
let currentProgress = 0;

export function createConductor(): Conductor {
  const mql = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  const reduceMotion = !!mql?.matches;
  const isMobile = window.innerWidth <= 768;

  // No smooth-scroll on reduced motion. Native scroll stays source of truth.
  let lenis: Lenis | null = null;
  if (!reduceMotion) {
    lenis = new Lenis({
      autoRaf: false,
      // Lower lerp = snappier. We also disable touch smoothing on iOS.
      lerp: 0.11,
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1,
    });
    lenis.on('scroll', ScrollTrigger.update);
  }

  // One ticker drives everything. GSAP calls at raf cadence already.
  const onTick = (time: number) => {
    const t = time * 1000; // gsap time is seconds since page start
    const delta = lastT ? Math.min(64, t - lastT) : 16;
    lastT = t;

    if (lenis) lenis.raf(t);

    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    currentProgress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

    if (!document.hidden) {
      for (const step of steps) {
        try { step({ time: t, delta, progress: currentProgress }); } catch (e) { /* noop */ }
      }
    }
  };

  gsap.ticker.add(onTick);
  gsap.ticker.lagSmoothing(0);

  const onVis = () => {
    // Reset delta accumulator when tab returns so animations don't jump.
    lastT = 0;
    ScrollTrigger.refresh();
  };
  document.addEventListener('visibilitychange', onVis);

  return {
    lenis,
    reduceMotion,
    isMobile,
    addStep(fn: RenderStep) {
      steps.add(fn);
      return () => { steps.delete(fn); };
    },
    getScrollProgress() { return currentProgress; },
    refresh() { ScrollTrigger.refresh(); },
    destroy() {
      gsap.ticker.remove(onTick);
      document.removeEventListener('visibilitychange', onVis);
      if (lenis) { lenis.destroy(); }
      ScrollTrigger.getAll().forEach((st) => st.kill());
      steps.clear();
    },
  };
}

export { gsap, ScrollTrigger };
