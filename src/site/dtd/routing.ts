import { doubleRaf } from './dom-utils';
import { switchTab } from './tabs';
import { switchSubTab } from './subtabs';

export function getRouteHashFragment(): string {
    let h = (window.location.hash || '').replace(/^#/, '');
    try {
        h = decodeURIComponent(h);
    } catch {
        /* keep raw */
    }
    h = (h || '').split('?')[0].split('&')[0].trim();
    if (h.indexOf('/') === 0) {
        h = h.replace(/^\/+/, '');
    }
    return h;
}

export function fragmentFromMondeLink(anchor: HTMLAnchorElement | null): string {
    if (!anchor || anchor.tagName !== 'A') return '';
    try {
        const u = new URL(anchor.href, window.location.href);
        if (u.origin !== window.location.origin) return '';
        let frag = (u.hash || '').replace(/^#/, '').split('?')[0].trim();
        if (frag.indexOf('/') === 0) frag = frag.replace(/^\/+/, '');
        return frag;
    } catch {
        const raw = anchor.getAttribute('href') || '';
        const m = raw.match(/#([^#?\s]+)/);
        return m ? m[1].trim() : '';
    }
}

export function handleHashChange(): void {
    const hash = getRouteHashFragment();
    const validTabs = ['landing', 'pitch', 'univers', 'play', 'about'];
    const sectionToTab: Record<string, string> = {
        peoples: 'univers',
        'system-overview': 'univers',
        'about-world': 'about',
        'about-author': 'about',
        'about-contact': 'about',
    };

    if (!hash) {
        switchTab('landing');
        return;
    }
    if (hash === 'world-map') {
        if (history.replaceState) history.replaceState(null, '', '#map');
        handleHashChange();
        return;
    }
    if (hash === 'map') {
        // Map is regular Monde content (not .archived-section); do not gate on archived-hidden.
        switchTab('univers', { skipScrollToTop: true, skipEnsureSubTab: true });
        switchSubTab('univers', 'peoples', 'map');
        return;
    }
    if (hash === 'universe-lore') {
        switchTab('univers', { skipScrollToTop: true, skipEnsureSubTab: true });
        switchSubTab('univers', 'peoples', 'universe-lore');
        return;
    }
    if (validTabs.includes(hash)) {
        switchTab(hash);
        return;
    }
    if (sectionToTab[hash]) {
        const tab = sectionToTab[hash];
        switchTab(tab, { skipScrollToTop: true });
        switchSubTab(tab, hash);
        return;
    }
    if (hash.indexOf('system-overview') === 0) {
        switchTab('univers', { skipScrollToTop: true });
        switchSubTab('univers', 'system-overview');
        doubleRaf(function () {
            const target = document.getElementById(hash);
            if (target) {
                const body = target.querySelector('.system-overview-accordion-body');
                const head = target.querySelector('.system-overview-accordion-head');
                if (body && head) {
                    body.classList.add('is-open');
                    head.setAttribute('aria-expanded', 'true');
                }
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        return;
    }
    switchTab('landing');
}

/**
 * Sidebar Monde sub-links (#peoples / #map / #universe-lore)
 */
export function initUniversMondeSidebarLinks(): void {
    const nav = document.querySelector('.univers-monde-in-page-nav');
    if (!nav) return;
    nav.addEventListener(
        'click',
        function (e) {
            const t = e.target as HTMLElement | null;
            const a = t && t.closest ? (t.closest('a') as HTMLAnchorElement | null) : null;
            if (!a || !a.classList.contains('univers-monde-sublink') || !nav.contains(a)) return;
            const frag = fragmentFromMondeLink(a);
            if (frag !== 'peoples' && frag !== 'map' && frag !== 'universe-lore') return;
            e.preventDefault();
            const pushHash = '#' + frag;
            if (history.pushState) {
                history.pushState(null, '', pushHash);
                handleHashChange();
            } else {
                window.location.hash = pushHash;
            }
        },
        true
    );
}
