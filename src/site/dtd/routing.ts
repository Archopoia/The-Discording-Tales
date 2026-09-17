import { doubleRaf } from './dom-utils';
import { loadPlayTabBundles, switchTab } from './tabs';
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

const HASH_ALIASES: Record<string, string> = {
    play: 'chatbot',
    chat: 'chatbot',
    'world-map': 'map',
};

const WORLD_INNER: Record<string, string> = {
    peoples: 'peoples-peoples',
    map: 'map',
    'universe-lore': 'universe-lore',
};

const TABLETOP_INNER: Record<string, string> = {
    tabletop: 'tabletop-rules',
    zine: 'zine',
    sheet: 'sheet',
    chatbot: 'chatbot',
};

const TABLETOP_PLAY_BUNDLES = new Set(['sheet', 'chatbot']);

const NESTED_LINK_FRAGS: Record<string, string[]> = {
    'univers-nav-main-link': ['peoples', 'videogame', 'tabletop'],
    'univers-monde-sublink': ['peoples', 'map', 'universe-lore'],
    'univers-tabletop-sublink': ['tabletop', 'zine', 'sheet', 'chatbot'],
};

export function handleHashChange(): void {
    const rawHash = getRouteHashFragment();
    const validTabs = ['landing', 'pitch', 'univers', 'about'];
    const sectionToTab: Record<string, string> = {
        'about-world': 'about',
        'about-author': 'about',
        'about-contact': 'about',
    };

    if (!rawHash) {
        switchTab('landing');
        return;
    }

    if (HASH_ALIASES[rawHash]) {
        if (history.replaceState) history.replaceState(null, '', '#' + HASH_ALIASES[rawHash]);
        handleHashChange();
        return;
    }

    const hash = rawHash;

    if (hash === 'videogame') {
        switchTab('univers', { skipScrollToTop: true, skipEnsureSubTab: true });
        switchSubTab('univers', 'videogame');
        return;
    }
    if (WORLD_INNER[hash]) {
        switchTab('univers', { skipScrollToTop: true, skipEnsureSubTab: true });
        switchSubTab('univers', 'peoples', WORLD_INNER[hash]);
        return;
    }
    if (TABLETOP_INNER[hash]) {
        switchTab('univers', { skipScrollToTop: true, skipEnsureSubTab: true });
        switchSubTab('univers', 'tabletop', TABLETOP_INNER[hash]);
        if (TABLETOP_PLAY_BUNDLES.has(hash)) {
            loadPlayTabBundles()?.catch(function () {});
        }
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
        switchTab('univers', { skipScrollToTop: true, skipEnsureSubTab: true });
        switchSubTab('univers', 'tabletop', 'tabletop-rules');
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
 * Sidebar nested sub-links (World: #peoples / #map / #universe-lore;
 * Tabletop: #tabletop / #zine / #sheet / #chatbot)
 */
export function initUniversMondeSidebarLinks(): void {
    const nav = document.querySelector('.univers-sidebar-nav');
    if (!nav) return;
    nav.addEventListener(
        'click',
        function (e) {
            const t = e.target as HTMLElement | null;
            const a = t && t.closest ? (t.closest('a') as HTMLAnchorElement | null) : null;
            if (!a || !nav.contains(a)) return;
            let allowed: string[] | undefined;
            if (a.classList.contains('univers-nav-main-link')) {
                allowed = NESTED_LINK_FRAGS['univers-nav-main-link'];
            } else if (a.classList.contains('univers-monde-sublink')) {
                allowed = NESTED_LINK_FRAGS['univers-monde-sublink'];
            } else if (a.classList.contains('univers-tabletop-sublink')) {
                allowed = NESTED_LINK_FRAGS['univers-tabletop-sublink'];
            }
            if (!allowed) return;
            const frag = fragmentFromMondeLink(a);
            if (allowed.indexOf(frag) === -1) return;
            e.preventDefault();
            e.stopPropagation();
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
