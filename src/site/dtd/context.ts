/**
 * Shared mutable site state and DOM handles (evaluated when the deferred bundle runs).
 */
export const state = {
    currentTab: 'landing',
    currentLang: 'en',
    carouselIndex: 0,
    carouselInterval: null as number | null,
};

export const elements = {
    menuToggle: document.getElementById('menu-toggle') as HTMLElement | null,
    menu: document.getElementById('primary-menu') as HTMLElement | null,
    tabLinks: document.querySelectorAll('.tab-link'),
    tabContents: document.querySelectorAll('.tab-content'),
    langButtons: document.querySelectorAll('.lang-btn'),
    newsletterForm: document.getElementById('newsletter-form') as HTMLElement | null,
    carousel: document.getElementById('hero-carousel') as HTMLElement | null,
    siteLogo: document.querySelector('.site-logo') as HTMLElement | null,
};

/** Main nav tab order (left to right) for logo spin direction */
export const TAB_ORDER = ['landing', 'univers', 'play', 'about'] as const;

/** Per-carousel autoplay state (see carousel.ts) */
export const carouselStates: Record<string, { index: number; interval: ReturnType<typeof setInterval> | null }> = {};

/** Cached locales/{en|fr}.json for peoples race blurbs */
export const tdtPeoplesLocaleCache: Record<string, Record<string, string> | null> = {};
