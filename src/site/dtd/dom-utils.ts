/** After two rAF ticks layout is usually stable */
export function doubleRaf(fn: () => void): void {
    requestAnimationFrame(function () {
        requestAnimationFrame(fn);
    });
}

export function setupImgFade(img: HTMLImageElement): void {
    if (!img || img.nodeType !== 1 || img.tagName !== 'IMG') return;
    if (img.dataset.tdtImgFadeBound === '1') return;

    if (img.classList.contains('tdt-img-no-fade')) {
        img.classList.add('tdt-img-ready');
        img.dataset.tdtImgFadeBound = '1';
        return;
    }

    function reveal() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            img.classList.add('tdt-img-ready');
            return;
        }
        doubleRaf(function () {
            img.classList.add('tdt-img-ready');
        });
    }

    img.addEventListener('load', reveal);
    img.addEventListener('error', reveal);
    img.dataset.tdtImgFadeBound = '1';

    if (img.complete && img.naturalWidth > 0) {
        reveal();
    }
}

export function initImgFadeOnLoad(): void {
    if (document.documentElement.dataset.tdtImgFadeInit === '1') return;
    document.documentElement.dataset.tdtImgFadeInit = '1';

    document.querySelectorAll('img').forEach(function (node) {
        setupImgFade(node as HTMLImageElement);
    });

    if (typeof MutationObserver === 'undefined') return;
    const mo = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
            m.addedNodes.forEach(function (node) {
                if (node.nodeType !== 1) return;
                const el = node as HTMLElement;
                if (el.tagName === 'IMG') setupImgFade(el as HTMLImageElement);
                if (el.querySelectorAll) {
                    el.querySelectorAll('img').forEach(function (img) {
                        setupImgFade(img as HTMLImageElement);
                    });
                }
            });
        });
    });
    mo.observe(document.body, { childList: true, subtree: true });
}
