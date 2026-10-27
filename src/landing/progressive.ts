// @ts-nocheck
/**
 * Landing progressive imgs (pitch deck): LQIP → medium → full,
 * but only for the active / nearby slide. Loading all 12 full
 * 1920px decks at once was the main post-curtain hitch.
 */

function log(...args: unknown[]) {
  const w = window as Window & { __TDT_LANDING_LOG__?: unknown[] };
  (w.__TDT_LANDING_LOG__ ||= []).push({ t: Math.round(performance.now()), msg: '[pitch] ' + args.map(String).join(' ') });
}

function absUrl(url: string) {
  try {
    return new URL(url, document.baseURI || location.href).href;
  } catch {
    return url;
  }
}

function variantUrls(src: string) {
  const clean = src.replace(/^\.\.\//, '').replace(/^\//, '');
  if (/_(lqip|medium|display)\.webp$/i.test(clean)) {
    const full = clean.replace(/_(lqip|medium|display)\.webp$/i, '.webp');
    const stem = full.replace(/\.webp$/i, '');
    const dir = stem.includes('/') ? stem.slice(0, stem.lastIndexOf('/') + 1) : '';
    const base = stem.slice(dir.length);
    const prefix = src.startsWith('../') ? '../' : src.startsWith('/') ? '/' : '';
    return {
      lqip: `${prefix}${dir}${base}_lqip.webp`,
      medium: `${prefix}${dir}${base}_medium.webp`,
      full: `${prefix}${dir}${base}.webp`,
    };
  }
  const stem = clean.replace(/\.(webp|png|jpe?g)$/i, '');
  const dir = stem.includes('/') ? stem.slice(0, stem.lastIndexOf('/') + 1) : '';
  const base = stem.slice(dir.length);
  const prefix = src.startsWith('../') ? '../' : src.startsWith('/') ? '/' : '';
  return {
    lqip: `${prefix}${dir}${base}_lqip.webp`,
    medium: `${prefix}${dir}${base}_medium.webp`,
    full: src,
  };
}

function ensureAttrs(img: HTMLImageElement) {
  if (img.getAttribute('data-src-medium') && img.getAttribute('data-src-full')) return;
  const v = variantUrls(img.getAttribute('src') || '');
  if (!v) return;
  img.setAttribute('data-src-medium', v.medium);
  img.setAttribute('data-src-full', v.full);
  if (!/_lqip\.webp/i.test(img.getAttribute('src') || '')) {
    img.src = v.lqip;
  }
  img.classList.add('tdt-progressive', 'is-soft');
}

async function swapTo(img: HTMLImageElement, url: string, stage: 'is-medium' | 'is-full') {
  if (!url) return false;
  const href = absUrl(url);
  if ((img.currentSrc || img.src) === href && img.naturalWidth > 64) {
    img.classList.add(stage);
    img.classList.remove('is-soft');
    return true;
  }
  img.src = href;
  try {
    if (typeof img.decode === 'function') await img.decode();
  } catch {
    /* ignore */
  }
  if (!(img.naturalWidth > 64)) return false;
  img.classList.add(stage);
  img.classList.remove('is-soft');
  return true;
}

/** Upgrade one slide. maxStage 'medium' avoids pulling full 1920s for offscreen decks. */
async function upgradeSlide(img: HTMLImageElement, maxStage: 'medium' | 'full') {
  ensureAttrs(img);
  const medium = img.getAttribute('data-src-medium');
  const full = img.getAttribute('data-src-full');
  const key = maxStage + ':' + (full || medium || '');
  if (img.dataset.tdtPitchStage === key) return;
  img.dataset.tdtPitchStage = key;

  const onLqip = /_lqip\.webp/i.test(img.getAttribute('src') || '') || img.naturalWidth <= 64;
  if (onLqip && medium) {
    const ok = await swapTo(img, medium, 'is-medium');
    log(maxStage, 'medium', ok ? img.naturalWidth : 'fail');
  }
  if (maxStage === 'full' && full) {
    const ok = await swapTo(img, full, 'is-full');
    log('full', ok ? img.naturalWidth : 'fail');
  }
}

function activePitchImg(): HTMLImageElement | null {
  return document.querySelector('.pitch-slider__slide.is-active img, .pitch-slider__slide:not([hidden]) img');
}

export function initLandingProgressive() {
  const imgs = [...document.querySelectorAll<HTMLImageElement>('.pitch-slider__slide img')];
  if (!imgs.length) return;
  imgs.forEach(ensureAttrs);

  const active = activePitchImg();
  if (active) void upgradeSlide(active, 'full');

  // Nearby slides: medium only (IntersectionObserver).
  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const img = (entry.target as HTMLElement).querySelector?.('img') || (entry.target as HTMLImageElement);
          if (img && img.tagName === 'IMG') void upgradeSlide(img as HTMLImageElement, 'medium');
        }
      },
      { rootMargin: '120px 0px' },
    );
    document.querySelectorAll('.pitch-slider__slide').forEach((slide) => io.observe(slide));
  }

  // When the user advances the slider, promote that slide to full.
  const root = document.getElementById('landing-pitch');
  if (!root) return;
  const mo = new MutationObserver(() => {
    const next = activePitchImg();
    if (next) void upgradeSlide(next, 'full');
  });
  mo.observe(root, { subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
}
