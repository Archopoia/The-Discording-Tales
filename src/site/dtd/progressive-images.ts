/**
 * Progressive heavy images: LQIP → medium → full.
 *
 * 1) Explicit markup (class + data-src-*).
 * 2) Manifest auto-wire: any <img> whose src matches
 *    window.__TDT_PROGRESSIVE_IMAGES__ gets swapped to LQIP then upgraded.
 */

type ProgressiveEntry = { lqip: string; medium: string; full: string };
type ProgressiveManifest = Record<string, ProgressiveEntry>;

function loadUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error('Failed to load ' + url));
        img.src = url;
    });
}

async function applyChain(
    apply: (url: string, stage: 'is-medium' | 'is-full') => void,
    medium: string | null,
    full: string | null,
): Promise<void> {
    if (medium) {
        try {
            await loadUrl(medium);
            apply(medium, 'is-medium');
        } catch {
            /* keep LQIP */
        }
    }
    if (full && full !== medium) {
        try {
            await loadUrl(full);
            apply(full, 'is-full');
        } catch {
            /* keep previous stage */
        }
    }
}

/** Normalize any site-relative / root-absolute asset URL to assets/images/... key. */
export function progressiveKeyFromSrc(src: string): string | null {
    if (!src) return null;
    let s = src.trim();
    try {
        if (/^https?:/i.test(s)) s = new URL(s).pathname;
    } catch {
        /* keep */
    }
    s = s.replace(/^\.\.\//, '').replace(/^\.\//, '').replace(/^\//, '');
    try {
        s = decodeURIComponent(s);
    } catch {
        /* keep */
    }
    if (!s.startsWith('assets/images/')) return null;
    if (/_(lqip|medium|display)\.webp$/i.test(s)) {
        // Map variant back to a full key guess for lookup
        const fullGuess = s.replace(/_(lqip|medium|display)\.webp$/i, '.webp');
        return fullGuess;
    }
    return s;
}

function rootAssetUrl(src: string): string {
    if (!src || /^(https?:|data:|blob:|\/\/|\/)/i.test(src)) return src;
    return '/' + src.replace(/^\.\//, '');
}

function resolveEntry(src: string, manifest: ProgressiveManifest): ProgressiveEntry | null {
    const key = progressiveKeyFromSrc(src);
    if (!key) return null;
    if (manifest[key]) return manifest[key];
    // PNG/JPG full might be keyed while img already points at webp sibling
    const alt = key.replace(/\.(png|jpe?g)$/i, '.webp');
    if (alt !== key && manifest[alt]) return manifest[alt];
    const png = key.replace(/\.webp$/i, '.png');
    if (png !== key && manifest[png]) return manifest[png];
    return null;
}

export function upgradeProgressiveImage(img: HTMLImageElement): void {
    if (!img || img.dataset.tdtProgressiveBound === '1') return;
    img.dataset.tdtProgressiveBound = '1';
    const medium = img.getAttribute('data-src-medium');
    const full = img.getAttribute('data-src-full');
    if (!medium && !full) return;

    void applyChain(
        (url, stage) => {
            img.src = url;
            img.classList.add(stage);
            img.classList.remove('is-soft');
        },
        medium,
        full,
    );
}

function withPhotoLayer(currentBg: string, photoUrl: string): string {
    const layers = currentBg.split(/,(?![^(]*\))/).map((part) => part.trim());
    if (layers.length === 0) return `url("${photoUrl}")`;
    let replaced = false;
    for (let i = layers.length - 1; i >= 0; i--) {
        if (/url\(/i.test(layers[i])) {
            layers[i] = layers[i].replace(/url\(\s*(['"]?)[^)'"]+\1\s*\)/i, `url("${photoUrl}")`);
            replaced = true;
            break;
        }
    }
    if (!replaced) layers.push(`url("${photoUrl}")`);
    return layers.join(', ');
}

export function upgradeProgressiveBackground(el: HTMLElement): void {
    if (!el || el.dataset.tdtProgressiveBound === '1') return;
    el.dataset.tdtProgressiveBound = '1';
    const medium = el.getAttribute('data-bg-medium');
    const full = el.getAttribute('data-bg-full');
    if (!medium && !full) return;

    void applyChain(
        (url, stage) => {
            const computed = getComputedStyle(el).backgroundImage || '';
            const inline = el.style.backgroundImage || '';
            const current = inline || computed;
            el.style.backgroundImage = withPhotoLayer(current, url);
            el.classList.add(stage);
            el.classList.remove('is-soft');
        },
        medium,
        full,
    );
}

function whenNearViewport(el: Element, fn: () => void): void {
    if (typeof IntersectionObserver === 'undefined') {
        fn();
        return;
    }
    const io = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                io.disconnect();
                fn();
                break;
            }
        },
        { rootMargin: '240px 0px' },
    );
    io.observe(el);
}

/** Apply manifest entry onto an img (LQIP first). Safe to call from carousel/gallery builders. */
export function bindProgressiveFromManifest(img: HTMLImageElement, srcFull: string, manifest?: ProgressiveManifest | null): boolean {
    const man = manifest || window.__TDT_PROGRESSIVE_IMAGES__;
    if (!man || !img) return false;
    const entry = resolveEntry(srcFull, man);
    if (!entry) return false;

    img.classList.add('tdt-progressive', 'is-soft');
    img.setAttribute('data-src-medium', rootAssetUrl(entry.medium));
    img.setAttribute('data-src-full', rootAssetUrl(entry.full));
    img.src = rootAssetUrl(entry.lqip);
    img.decoding = 'async';
    return true;
}

function wireImg(img: HTMLImageElement, manifest: ProgressiveManifest): void {
    if (img.dataset.tdtProgressiveBound === '1') return;

    // Already explicitly marked
    if (img.classList.contains('tdt-progressive') && (img.getAttribute('data-src-medium') || img.getAttribute('data-src-full'))) {
        whenNearViewport(img, () => upgradeProgressiveImage(img));
        return;
    }

    const current = img.getAttribute('src') || '';
    // Display-sized logos are already the intended final asset
    if (/_display\.webp$/i.test(current)) return;

    const entry = resolveEntry(current, manifest);
    if (!entry) return;

    img.classList.add('tdt-progressive', 'is-soft');
    img.setAttribute('data-src-medium', rootAssetUrl(entry.medium));
    img.setAttribute('data-src-full', rootAssetUrl(entry.full));
    // Only swap to LQIP if we are not already on a variant
    if (!/_(lqip|medium)\.webp$/i.test(current)) {
        img.src = rootAssetUrl(entry.lqip);
    }
    whenNearViewport(img, () => upgradeProgressiveImage(img));
}

/** Upgrade all progressive imgs/bgs + auto-wire from manifest. */
export function initProgressiveImages(): void {
    if (document.documentElement.dataset.tdtProgressiveInit === '1') return;
    document.documentElement.dataset.tdtProgressiveInit = '1';

    const manifest = window.__TDT_PROGRESSIVE_IMAGES__ || {};

    document.querySelectorAll<HTMLImageElement>('img').forEach((img) => wireImg(img, manifest));

    document.querySelectorAll<HTMLElement>('.tdt-progressive-bg[data-bg-medium], .tdt-progressive-bg[data-bg-full]').forEach((el) => {
        whenNearViewport(el, () => upgradeProgressiveBackground(el));
    });

    // Catch late-injected carousel / gallery images
    if (typeof MutationObserver === 'undefined') return;
    const mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
            m.addedNodes.forEach((node) => {
                if (node.nodeType !== 1) return;
                const el = node as HTMLElement;
                if (el.tagName === 'IMG') wireImg(el as HTMLImageElement, manifest);
                el.querySelectorAll?.('img').forEach((img) => wireImg(img as HTMLImageElement, manifest));
            });
        }
    });
    mo.observe(document.body, { childList: true, subtree: true });
}
