/**
 * Scene-lab immersive shell (landing + /site/).
 *
 * Desktop / wide: pointer enter on the embed → cover the viewport.
 * Phone: first tap inside the lab (postMessage) → same; try fullscreen +
 * landscape lock when the gesture allows it.
 * Exit: top-right close, Escape, or browser fullscreen exit.
 */

const MSG = 'tdt-scene-lab';
const COOLDOWN_MS = 700;

function isPhoneLike(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.matchMedia('(max-width: 900px)').matches;
  return coarse && narrow;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

async function tryFullscreenAndLandscape(el: HTMLElement): Promise<void> {
  const req =
    el.requestFullscreen?.bind(el) ||
    (el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen?.bind(el);
  if (req) {
    try {
      await req();
    } catch {
      /* CSS immersive still covers the viewport */
    }
  }
  const orient = screen.orientation as ScreenOrientation & {
    lock?: (mode: string) => Promise<void>;
  };
  if (orient?.lock) {
    try {
      await orient.lock('landscape');
    } catch {
      /* iOS often denies; rotate hint covers this */
    }
  }
}

function exitBrowserFullscreen(): void {
  const doc = document as Document & {
    webkitExitFullscreen?: () => void;
    webkitFullscreenElement?: Element;
  };
  if (document.fullscreenElement || doc.webkitFullscreenElement) {
    try {
      if (document.exitFullscreen) document.exitFullscreen();
      else doc.webkitExitFullscreen?.();
    } catch {
      /* ignore */
    }
  }
  try {
    screen.orientation?.unlock?.();
  } catch {
    /* ignore */
  }
}

function wrapFrame(iframe: HTMLIFrameElement): HTMLElement {
  const existing = iframe.closest('.scene-lab-shell');
  if (existing) return existing as HTMLElement;

  const shell = document.createElement('div');
  shell.className = 'scene-lab-shell';
  iframe.parentNode?.insertBefore(shell, iframe);
  shell.appendChild(iframe);

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'scene-lab-close';
  close.setAttribute('aria-label', 'Close full screen');
  close.innerHTML = '<span aria-hidden="true">×</span>';
  close.hidden = true;
  shell.appendChild(close);

  const hint = document.createElement('p');
  hint.className = 'scene-lab-rotate-hint';
  hint.hidden = true;
  hint.setAttribute('aria-live', 'polite');
  hint.dataset.en = 'Rotate your phone for the full scene';
  hint.dataset.fr = 'Tournez le téléphone pour toute la scène';
  hint.textContent = hint.dataset.en;
  shell.appendChild(hint);

  return shell;
}

function syncHintLang(hint: HTMLElement): void {
  const fr =
    document.documentElement.lang?.toLowerCase().startsWith('fr') ||
    /[?&]lang=fr\b/i.test(location.search) ||
    document.body?.classList.contains('lang-fr');
  hint.textContent = fr ? hint.dataset.fr || hint.textContent : hint.dataset.en || hint.textContent;
}

function enhance(iframe: HTMLIFrameElement): void {
  if (iframe.dataset.tdtImmersiveBound === '1') return;
  iframe.dataset.tdtImmersiveBound = '1';

  if (!iframe.hasAttribute('allow')) {
    iframe.setAttribute('allow', 'fullscreen; screen-wake-lock');
  } else if (!/fullscreen/i.test(iframe.getAttribute('allow') || '')) {
    iframe.setAttribute('allow', `${iframe.getAttribute('allow')}; fullscreen; screen-wake-lock`);
  }

  const shell = wrapFrame(iframe);
  const close = shell.querySelector<HTMLButtonElement>('.scene-lab-close');
  const hint = shell.querySelector<HTMLElement>('.scene-lab-rotate-hint');
  if (!close || !hint) return;

  let immersive = false;
  let cooling = false;

  const enter = (fromGesture: boolean) => {
    if (immersive || cooling) return;
    immersive = true;
    shell.classList.add('is-immersive');
    document.documentElement.classList.add('scene-lab-immersive-open');
    close.hidden = false;
    close.focus({ preventScroll: true });

    const phone = isPhoneLike();
    if (phone) {
      syncHintLang(hint);
      hint.hidden = false;
      const hideHint = () => {
        if (window.matchMedia('(orientation: landscape)').matches) hint.hidden = true;
      };
      hideHint();
      window.addEventListener('orientationchange', hideHint);
      window.matchMedia('(orientation: landscape)').addEventListener?.('change', hideHint);
      if (fromGesture) void tryFullscreenAndLandscape(shell);
      window.setTimeout(() => {
        if (window.matchMedia('(orientation: landscape)').matches) hint.hidden = true;
      }, 4500);
    } else {
      hint.hidden = true;
    }

    iframe.contentWindow?.postMessage({ type: MSG, action: 'immersive-on' }, '*');
  };

  const exit = () => {
    if (!immersive) return;
    immersive = false;
    shell.classList.remove('is-immersive');
    document.documentElement.classList.remove('scene-lab-immersive-open');
    close.hidden = true;
    hint.hidden = true;
    exitBrowserFullscreen();
    iframe.contentWindow?.postMessage({ type: MSG, action: 'immersive-off' }, '*');

    cooling = true;
    window.setTimeout(() => {
      cooling = false;
    }, COOLDOWN_MS);
  };

  close.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    exit();
  });

  // Desktop / wide: intentional hover (dwell) expands it - not a drive-by while scrolling.
  let hoverTimer: number | null = null;
  const HOVER_DWELL_MS = 280;
  shell.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    if (isPhoneLike()) return;
    if (hoverTimer != null) window.clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(() => {
      hoverTimer = null;
      enter(false);
    }, HOVER_DWELL_MS);
  });
  shell.addEventListener('pointerleave', () => {
    if (hoverTimer != null) {
      window.clearTimeout(hoverTimer);
      hoverTimer = null;
    }
  });
  // Explicit click also enters (covers trackpad / fidgety cursors).
  shell.addEventListener('click', (e) => {
    if (isPhoneLike()) return;
    if ((e.target as HTMLElement)?.closest?.('.scene-lab-close')) return;
    enter(false);
  });

  // Phone: first interaction arrives via postMessage from the iframe (clicks don't bubble).
  window.addEventListener('message', (ev) => {
    const data = ev.data;
    if (!data || data.type !== MSG) return;
    if (ev.source !== iframe.contentWindow) return;
    if (data.action === 'enter') enter(true);
    if (data.action === 'exit') exit();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && immersive) {
      e.preventDefault();
      exit();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && immersive && isPhoneLike()) {
      // User swiped out of OS fullscreen - keep CSS immersive unless they hit close.
    }
  });

  if (!prefersReducedMotion()) {
    shell.classList.add('scene-lab-shell--motion');
  }
}

/** Wire every scene-lab iframe on the page. */
export function initSceneLabImmersive(): void {
  document.querySelectorAll<HTMLIFrameElement>('iframe.scene-lab-frame').forEach(enhance);
}
