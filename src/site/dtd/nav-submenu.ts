import { elements, state, TAB_ORDER } from './context';
import { handleHashChange } from './routing';
import { triggerLogoBurst } from './tabs';

function setSubmenuExpanded(item: Element, open: boolean): void {
    const link = item.querySelector(':scope > .tab-link');
    if (!link) return;
    link.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function tabsWrapped(menu: Element): boolean {
    const items = menu.querySelectorAll(':scope > .menu-item');
    let top: number | null = null;
    for (let i = 0; i < items.length; i++) {
        const itemTop = (items[i] as HTMLElement).offsetTop;
        if (top === null) top = itemTop;
        else if (Math.abs(itemTop - top) > 2) return true;
    }
    return false;
}

function placeSubmenu(item: HTMLElement): void {
    const nav = document.getElementById('site-navigation');
    const sub = item.querySelector('.menu-sub') as HTMLElement | null;
    if (!nav || !sub) return;
    const navBox = nav.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    const bridge = Math.max(0, Math.round(navBox.bottom - itemBox.bottom));
    sub.style.setProperty('--menu-bridge', bridge + 'px');
    sub.style.left = '50%';
    sub.style.transform = 'translateX(-50%)';
    const box = sub.getBoundingClientRect();
    const margin = 8;
    let shift = 0;
    if (box.right > window.innerWidth - margin) {
        shift = box.right - (window.innerWidth - margin);
    } else if (box.left < margin) {
        shift = box.left - margin;
    }
    if (shift !== 0) {
        sub.style.transform = 'translateX(calc(-50% - ' + shift + 'px))';
    }
}

function layoutSubmenus(): void {
    const menu = document.getElementById('primary-menu');
    if (!menu) return;
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    const stacked = coarse || tabsWrapped(menu);
    menu.classList.toggle('menu--stacked', stacked);
    menu.querySelectorAll('.menu-item--has-sub').forEach((node) => {
        const item = node as HTMLElement;
        const sub = item.querySelector('.menu-sub') as HTMLElement | null;
        if (!sub) return;
        if (stacked) {
            sub.style.removeProperty('--menu-bridge');
            sub.style.removeProperty('left');
            sub.style.removeProperty('transform');
            return;
        }
        placeSubmenu(item);
    });
}

/**
 * Top-nav hover lists. A click opens that section directly (World, Videogame, Tabletop, About sections).
 */
export function initNavSubmenus(): void {
    layoutSubmenus();
    window.addEventListener('resize', layoutSubmenus);
    window.addEventListener('load', layoutSubmenus);
    const menu = document.getElementById('primary-menu');
    if (menu && typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(function () {
            layoutSubmenus();
        });
        observer.observe(menu);
    }

    document.querySelectorAll('.menu-item--has-sub').forEach((node) => {
        const item = node as HTMLElement;
        item.addEventListener('mouseenter', function () {
            const menu = document.getElementById('primary-menu');
            if (!menu || !menu.classList.contains('menu--stacked')) {
                placeSubmenu(item);
            }
            setSubmenuExpanded(item, true);
        });
        item.addEventListener('mouseleave', function () {
            setSubmenuExpanded(item, false);
        });
        item.addEventListener('focusin', function () {
            const menu = document.getElementById('primary-menu');
            if (!menu || !menu.classList.contains('menu--stacked')) {
                placeSubmenu(item);
            }
            setSubmenuExpanded(item, true);
        });
        item.addEventListener('focusout', function (e) {
            const next = e.relatedTarget;
            if (!(next instanceof Node) || !item.contains(next)) {
                setSubmenuExpanded(item, false);
            }
        });
    });

    document.querySelectorAll('.menu-sub-link').forEach((node) => {
        const link = node as HTMLAnchorElement;
        link.addEventListener('click', function (e) {
            const frag = link.getAttribute('data-subtab');
            const tabId = link.getAttribute('data-tab');
            if (!frag || !tabId) return;
            e.preventDefault();

            if (tabId !== state.currentTab) {
                const currentIdx = TAB_ORDER.indexOf(state.currentTab as (typeof TAB_ORDER)[number]);
                const clickedIdx = TAB_ORDER.indexOf(tabId as (typeof TAB_ORDER)[number]);
                if (currentIdx >= 0 && clickedIdx >= 0) {
                    triggerLogoBurst(clickedIdx > currentIdx ? 'cw' : 'ccw');
                }
            }

            if (history.pushState) {
                history.pushState(null, '', '#' + frag);
                handleHashChange();
            } else {
                window.location.hash = frag;
            }

            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });

            if (elements.menu) {
                elements.menu.classList.remove('active');
                if (elements.menuToggle) {
                    elements.menuToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });
}
