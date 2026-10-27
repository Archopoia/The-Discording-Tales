// @ts-nocheck
/**
 * Opening gate. The map is visible immediately (phone behaviour).
 * The symbol stays put and spins up like an engine, then the view
 * punches in and the gate fades. Nothing in the gate is a control.
 */
const HOLD_MS = 2600;
/* angle = A * (exp(k * t) - 1). One direction, already turning, then continuously faster. */
const SPIN_K = 2.5;
const SPIN_END_DEG = 1440;
const SPIN_A = SPIN_END_DEG / (Math.exp(SPIN_K) - 1);

function spinGateSymbol(reduced) {
  const spin = document.querySelector('.gate-symbol__spin');
  if (!spin || reduced) return;
  spin.style.transformOrigin = 'center center';
  const start = performance.now();
  // Degrees per ms at the end of the wind-up, so the fade keeps that speed.
  const omega = (SPIN_A * SPIN_K * Math.exp(SPIN_K)) / HOLD_MS;
  const tick = (now) => {
    if (!spin.isConnected) return;
    const elapsed = now - start;
    const t = elapsed / HOLD_MS;
    const angle = t <= 1
      ? SPIN_A * (Math.exp(SPIN_K * t) - 1)
      : SPIN_END_DEG + omega * (elapsed - HOLD_MS);
    spin.style.transform = `rotate(${angle}deg)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function sharpenGate(curtain: HTMLElement) {
  curtain.querySelectorAll<HTMLElement>('[data-gate-src]').forEach((el) => {
    const src = el.getAttribute('data-gate-src');
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      el.style.backgroundImage = `url("${src}")`;
      el.classList.add('is-sharp');
    };
    img.src = src;
  });
}

export function runPreloader() {
  const curtain = document.getElementById('tdt-landing-curtain');
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.style.overflow = 'hidden';
  spinGateSymbol(reduced);

  function liftCurtain() {
    if (!curtain || curtain.classList.contains('is-lifting')) return;
    curtain.classList.add('is-lifting');
    if (!reduced) root.classList.add('is-entering');
    const done = () => {
      curtain.remove();
      root.style.overflow = '';
      root.classList.remove('is-entering');
    };
    curtain.addEventListener('transitionend', (event) => {
      if (event.target !== curtain) return;
      done();
    });
    setTimeout(done, 900);
    root.setAttribute('data-landing-ready', 'true');
    document.dispatchEvent(new CustomEvent('tdt-landing-ready'));
  }

  if (curtain) sharpenGate(curtain);

  setTimeout(liftCurtain, reduced ? 400 : HOLD_MS);
}

// Hard safety: if main.ts dies before preloader runs, nuke the curtain
// after 4 seconds so the page is never visually blocked.
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const c = document.getElementById('tdt-landing-curtain');
    if (c && !c.classList.contains('is-lifting')) {
      document.documentElement.style.overflow = '';
      c.classList.add('is-lifting');
      setTimeout(() => c.remove(), 1200);
      document.documentElement.setAttribute('data-landing-ready', 'true');
    }
  }, 8000);
}
