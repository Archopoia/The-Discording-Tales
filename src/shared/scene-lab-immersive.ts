/**
 * Scene-lab immersive shell (landing + /site/).
 *
 * Enter only via the top-right fullscreen control (or Escape to leave).
 * Phone: click also requests browser fullscreen + landscape lock.
 * No hover / auto-enter.
 */

const MSG = 'tdt-scene-lab';

const ICON_EXPAND =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 9V3h6v2H5v4H3zm12-6h6v6h-2V5h-4V3zM3 15h2v4h4v2H3v-6zm16 0h2v6h-6v-2h4v-4z"/></svg>';
const ICON_CLOSE = '<span aria-hidden="true">×</span>';

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

function paintToggle(btn: HTMLButtonElement, immersive: boolean): void {
  if (immersive) {
    btn.classList.add('is-close');
    btn.setAttribute('aria-label', 'Close full screen');
    btn.setAttribute('title', 'Close full screen');
    btn.innerHTML = ICON_CLOSE;
  } else {
    btn.classList.remove('is-close');
    btn.setAttribute('aria-label', 'Full screen');
    btn.setAttribute('title', 'Full screen');
    btn.innerHTML = ICON_EXPAND;
  }
}

function wrapFrame(iframe: HTMLIFrameElement): HTMLElement {
  const existing = iframe.closest('.scene-lab-shell');
  if (existing) return existing as HTMLElement;

  const shell = document.createElement('div');
  shell.className = 'scene-lab-shell';
  iframe.parentNode?.insertBefore(shell, iframe);
  shell.appendChild(iframe);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'scene-lab-close';
  paintToggle(toggle, false);
  shell.appendChild(toggle);

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
  const toggle = shell.querySelector<HTMLButtonElement>('.scene-lab-close');
  const hint = shell.querySelector<HTMLElement>('.scene-lab-rotate-hint');
  if (!toggle || !hint) return;

  let immersive = false;

  const enter = () => {
    if (immersive) return;
    immersive = true;
    shell.classList.add('is-immersive');
    document.documentElement.classList.add('scene-lab-immersive-open');
    paintToggle(toggle, true);
    toggle.focus({ preventScroll: true });

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
      void tryFullscreenAndLandscape(shell);
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
    paintToggle(toggle, false);
    hint.hidden = true;
    exitBrowserFullscreen();
    iframe.contentWindow?.postMessage({ type: MSG, action: 'immersive-off' }, '*');
  };

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (immersive) exit();
    else enter();
  });

  // Legacy iframe messages: ignore auto-enter; still honor explicit exit.
  window.addEventListener('message', (ev) => {
    const data = ev.data;
    if (!data || data.type !== MSG) return;
    if (ev.source !== iframe.contentWindow) return;
    if (data.action === 'exit') exit();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && immersive) {
      e.preventDefault();
      exit();
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
