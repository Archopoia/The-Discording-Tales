import { elements, state, TAB_ORDER } from './context';
import { ensureFirstSubTabActive } from './subtabs';
import { setLanguage } from './language';

let logoBurstTimeout: ReturnType<typeof setTimeout> | null = null;
let tdtPlayBundlesPromise: Promise<unknown[]> | null = null;

export function triggerLogoBurst(direction: 'cw' | 'ccw'): void {
    if (!elements.siteLogo) return;
    if (logoBurstTimeout) {
        clearTimeout(logoBurstTimeout);
        logoBurstTimeout = null;
    }
    elements.siteLogo.classList.remove('logo-spin-cw', 'logo-spin-ccw');
    elements.siteLogo.offsetHeight;
    elements.siteLogo.classList.add(direction === 'cw' ? 'logo-spin-cw' : 'logo-spin-ccw');
    logoBurstTimeout = setTimeout(function () {
        elements.siteLogo!.classList.remove('logo-spin-cw', 'logo-spin-ccw');
        logoBurstTimeout = null;
    }, 1000);
}

export function loadPlayTabBundles(): Promise<unknown[]> | null {
    if (tdtPlayBundlesPromise) {
        return tdtPlayBundlesPromise;
    }
    function injectVendorScript(src: string, attr: string, alreadyLoaded?: () => boolean) {
        return new Promise<void>(function (resolve, reject) {
            if (alreadyLoaded && alreadyLoaded()) {
                resolve();
                return;
            }
            if (document.querySelector('script[' + attr + ']')) {
                resolve();
                return;
            }
            const s = document.createElement('script');
            s.src = src;
            s.async = false;
            s.setAttribute(attr, '1');
            s.onload = function () {
                resolve();
            };
            s.onerror = function () {
                reject(new Error('Failed to load ' + src));
            };
            document.head.appendChild(s);
        });
    }
    function injectModuleOnce(src: string, attr: string, alreadyLoaded?: () => boolean) {
        return new Promise<void>(function (resolve, reject) {
            if (alreadyLoaded && alreadyLoaded()) {
                resolve();
                return;
            }
            if (document.querySelector('script[' + attr + ']')) {
                resolve();
                return;
            }
            const s = document.createElement('script');
            s.type = 'module';
            s.src = src;
            s.setAttribute(attr, '1');
            s.onload = function () {
                resolve();
            };
            s.onerror = function () {
                reject(new Error('Failed to load ' + src));
            };
            document.head.appendChild(s);
        });
    }
    function injectDeferScriptOnce(src: string, attr: string, alreadyLoaded?: () => boolean) {
        return new Promise<void>(function (resolve, reject) {
            if (alreadyLoaded && alreadyLoaded()) {
                resolve();
                return;
            }
            if (document.querySelector('script[' + attr + ']')) {
                resolve();
                return;
            }
            const s = document.createElement('script');
            s.src = src;
            s.async = false;
            s.setAttribute(attr, '1');
            s.onload = function () {
                (window as unknown as { __tdtCharacterSheetLoaded?: boolean }).__tdtCharacterSheetLoaded = true;
                resolve();
            };
            s.onerror = function () {
                reject(new Error('Failed to load ' + src));
            };
            document.head.appendChild(s);
        });
    }
    tdtPlayBundlesPromise = Promise.all([
        injectVendorScript('js/vendor/marked.min.js', 'data-tdt-marked', function () {
            return typeof (window as unknown as { marked?: unknown }).marked !== 'undefined';
        }),
        injectVendorScript('js/vendor/purify.min.js', 'data-tdt-dompurify', function () {
            return typeof (window as unknown as { DOMPurify?: unknown }).DOMPurify !== 'undefined';
        }),
        injectModuleOnce('dist/play-webllm.js', 'data-tdt-play-webllm', function () {
            return typeof (window as unknown as { getWebLLMEngine?: unknown }).getWebLLMEngine === 'function';
        }),
        injectDeferScriptOnce('dist/character-sheet.js', 'data-tdt-character-sheet', function () {
            return !!(window as unknown as { __tdtCharacterSheetLoaded?: boolean }).__tdtCharacterSheetLoaded;
        }),
    ])
        .then(function () {
            window.dispatchEvent(new CustomEvent('tdt-gm-markdown-ready'));
            return [];
        })
        .catch(function () {
            tdtPlayBundlesPromise = null;
            return [];
        });
    return tdtPlayBundlesPromise;
}

export function switchTab(tabId: string, options?: { skipScrollToTop?: boolean; skipEnsureSubTab?: boolean }): void {
    options = options || {};
    const skipScrollToTop = options.skipScrollToTop === true;
    const skipEnsureSubTab = options.skipEnsureSubTab === true;

    if (tabId === 'play') {
        loadPlayTabBundles()?.catch(function () {});
    }

    elements.tabLinks.forEach((link) => {
        if (link.getAttribute('data-tab') === tabId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    elements.tabContents.forEach((content) => {
        if (content.id !== tabId) {
            content.classList.remove('active');
        }
    });
    const targetContent = document.getElementById(tabId);
    if (targetContent) {
        targetContent.classList.add('active');
        state.currentTab = tabId;
        if (!skipScrollToTop) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (!skipEnsureSubTab) {
            ensureFirstSubTabActive(tabId);
        }
        requestAnimationFrame(function () {
            setLanguage(state.currentLang);
        });
    }
}

export function initTabs(): void {
    elements.tabLinks.forEach((link) => {
        link.addEventListener('click', function (this: HTMLAnchorElement, e: Event) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            if (!tabId) return;
            if (elements.siteLogo && tabId !== state.currentTab) {
                const currentIdx = TAB_ORDER.indexOf(state.currentTab as (typeof TAB_ORDER)[number]);
                const clickedIdx = TAB_ORDER.indexOf(tabId as (typeof TAB_ORDER)[number]);
                if (currentIdx >= 0 && clickedIdx >= 0) {
                    if (clickedIdx > currentIdx) {
                        triggerLogoBurst('cw');
                    } else {
                        triggerLogoBurst('ccw');
                    }
                }
            }
            switchTab(tabId);

            if (history.pushState) {
                history.pushState(null, '', '#' + tabId);
            }

            if (elements.menu) {
                elements.menu.classList.remove('active');
                if (elements.menuToggle) {
                    elements.menuToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });
}
