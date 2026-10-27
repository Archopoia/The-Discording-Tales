// @ts-nocheck
/**
 * Opening gate. The map is visible immediately (phone behaviour).
 * The symbol stays put and spins up like an engine, then the view
 * punches in and the gate fades. Nothing in the gate is a control.
 *
 * Hold is adaptive: lift as soon as gate medium layers are sharp,
 * with a short floor so the spin still reads, and a hard cap so we
 * never sit on a frozen curtain.
 */
const HOLD_MIN_MS = 480;
const HOLD_MAX_MS = 1200;
/* angle = A * (exp(k * t) - 1). One direction, already turning, then continuously faster. */
const SPIN_K = 2.5;
const SPIN_END_DEG = 1440;
const SPIN_A = SPIN_END_DEG / (Math.exp(SPIN_K) - 1);

function log(...args: unknown[]) {
  const w = window as Window & { __TDT_LANDING_LOG__?: unknown[] };
  (w.__TDT_LANDING_LOG__ ||= []).push({ t: Math.round(performance.now()), msg: '[preloader] ' + args.map(String).join(' ') });
  console.info('[tdt-preloader]', ...args);
}

function spinGateSymbol(reduced) {
  const spin = document.querySelector('.gate-symbol__spin');
  if (!spin || reduced) return;
  spin.style.transformOrigin = 'center center';
  const start = performance.now();
  const omega = (SPIN_A * SPIN_K * Math.exp(SPIN_K)) / HOLD_MAX_MS;
  const tick = (now) => {
    if (!spin.isConnected) return;
    const elapsed = now - start;
    const t = elapsed / HOLD_MAX_MS;
    const angle = t <= 1
      ? SPIN_A * (Math.exp(SPIN_K * t) - 1)
      : SPIN_END_DEG + omega * (elapsed - HOLD_MAX_MS);
    spin.style.transform = `rotate(${angle}deg)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function sharpenGate(curtain: HTMLElement): Promise<void> {
  const layers = [...curtain.querySelectorAll<HTMLElement>('[data-gate-src]')];
  if (!layers.length) return Promise.resolve();
  return Promise.all(
    layers.map(
      (el) =>
        new Promise<void>((resolve) => {
          const src = el.getAttribute('data-gate-src');
          if (!src) {
            resolve();
            return;
          }
          const img = new Image();
          const done = () => {
            el.style.backgroundImage = `url("${src}")`;
            el.classList.add('is-sharp');
            resolve();
          };
          img.onload = done;
          img.onerror = done;
          img.src = src;
        }),
    ),
  ).then(() => {
    log('gate sharp');
  });
}

export function runPreloader() {
  const curtain = document.getElementById('tdt-landing-curtain');
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.style.overflow = 'hidden';
  spinGateSymbol(reduced);

  let lifted = false;
  function liftCurtain(reason: string) {
    if (lifted) return;
    lifted = true;
    log('lift', reason, Math.round(performance.now()) + 'ms');
    if (!curtain || curtain.classList.contains('is-lifting')) {
      root.setAttribute('data-landing-ready', 'true');
      document.dispatchEvent(new CustomEvent('tdt-landing-ready'));
      return;
    }
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

  if (reduced) {
    setTimeout(() => liftCurtain('reduced-motion'), 400);
    return;
  }

  const started = performance.now();
  const gatePromise = curtain ? sharpenGate(curtain) : Promise.resolve();

  // Floor: let the spin read. Cap: never block past HOLD_MAX.
  const minWait = new Promise<void>((r) => setTimeout(r, HOLD_MIN_MS));
  const maxWait = new Promise<'cap'>((r) => setTimeout(() => r('cap'), HOLD_MAX_MS));

  Promise.race([
    Promise.all([minWait, gatePromise]).then(() => 'ready' as const),
    maxWait,
  ]).then((reason) => {
    log('hold done', reason, Math.round(performance.now() - started) + 'ms');
    liftCurtain(reason);
  });
}

// Hard safety: if main.ts dies before preloader runs, nuke the curtain.
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const c = document.getElementById('tdt-landing-curtain');
    if (c && !c.classList.contains('is-lifting')) {
      document.documentElement.style.overflow = '';
      c.classList.add('is-lifting');
      setTimeout(() => c.remove(), 1200);
      document.documentElement.setAttribute('data-landing-ready', 'true');
      document.dispatchEvent(new CustomEvent('tdt-landing-ready'));
      console.warn('[tdt-preloader] safety lift');
    }
  }, 5000);
}
