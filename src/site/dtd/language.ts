import { elements, state } from './context';
import { updateCarouselAriaLabels } from './carousel';

const PAGE_TITLE_EN =
    'THE DISCORDING TALES – Under our steps awake those mysteries believed to be warring among the stars…';
const PAGE_TITLE_FR =
    "DES RÉCITS DISCORDANTS – Sous nos pas s'éveillent ces mystères que l'on croyait se battre parmi les étoiles…";
const META_DESCRIPTION_EN =
    'For those of us who crave DISCOVERY. A journey through exotic cultures, unexplored lands, weird creatures, and untold ways of thinking and being - yearning to experience the vast potentials, technologies and moralities of worlds unlike ours.';
const META_DESCRIPTION_FR =
    "Pour ceux d'entre nous qui aspirent à la DÉCOUVERTE. Un voyage à travers des cultures exotiques, des terres inexplorées, des créatures étranges et des façons inédites de penser et d'être - aspirant à expérimenter les vastes potentiels, technologies et moralités de mondes différents du nôtre.";

function getPageI18n(): { title?: { en: string; fr: string }; description?: { en: string; fr: string } } | null {
    const el = document.getElementById('tdt-i18n-strings');
    if (!el || !el.textContent) return null;
    try {
        return JSON.parse(el.textContent);
    } catch {
        return null;
    }
}

function setMetaContent(selector: string, content: string): void {
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', content);
}

function getLangFromUrl(): string | null {
    const m = /[?&]lang=(fr|en)\b/i.exec(window.location.search);
    return m ? m[1].toLowerCase() : null;
}

export function setLanguage(lang: string): void {
    state.currentLang = lang;
    document.documentElement.lang = lang;
    try {
        window.dispatchEvent(new CustomEvent('tdt-lang-changed', { detail: lang }));
    } catch {
        /* ignore */
    }

    const pageI18n = getPageI18n();
    const titleEn = pageI18n && pageI18n.title && pageI18n.title.en ? pageI18n.title.en : PAGE_TITLE_EN;
    const titleFr = pageI18n && pageI18n.title && pageI18n.title.fr ? pageI18n.title.fr : PAGE_TITLE_FR;
    const descEn =
        pageI18n && pageI18n.description && pageI18n.description.en ? pageI18n.description.en : META_DESCRIPTION_EN;
    const descFr =
        pageI18n && pageI18n.description && pageI18n.description.fr ? pageI18n.description.fr : META_DESCRIPTION_FR;
    const title = lang === 'fr' ? titleFr : titleEn;
    const desc = lang === 'fr' ? descFr : descEn;
    document.title = title;
    setMetaContent('meta[name="description"]', desc);
    setMetaContent('meta[property="og:title"]', title);
    setMetaContent('meta[property="og:description"]', desc);
    setMetaContent('meta[property="og:locale"]', lang === 'fr' ? 'fr_FR' : 'en_US');
    setMetaContent('meta[name="twitter:title"]', title);
    setMetaContent('meta[name="twitter:description"]', desc);

    elements.langButtons.forEach((btn) => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('[data-en][data-fr]').forEach((element) => {
        const el = element as HTMLElement;
        const text = el.getAttribute(`data-${lang}`);
        if (text) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                (el as HTMLInputElement).placeholder = text;
            } else if (el.tagName === 'OPTION') {
                el.textContent = text;
            } else {
                el.innerHTML = text;
            }
        }
    });

    document.querySelectorAll('[data-aria-label-en][data-aria-label-fr]').forEach((element) => {
        const el = element as HTMLElement;
        const label = el.getAttribute(`data-aria-label-${lang}`);
        if (label) el.setAttribute('aria-label', label);
    });

    document.querySelectorAll('[data-title-en][data-title-fr]').forEach((element) => {
        const el = element as HTMLElement;
        const title = el.getAttribute(`data-title-${lang}`);
        if (title) el.setAttribute('title', title);
    });

    document.querySelectorAll('[data-placeholder-en][data-placeholder-fr]').forEach((element) => {
        const el = element as HTMLElement;
        const placeholder = el.getAttribute(`data-placeholder-${lang}`);
        if (placeholder) el.setAttribute('placeholder', placeholder);
    });

    document.querySelectorAll('[data-alt-en][data-alt-fr]').forEach((element) => {
        const el = element as HTMLElement;
        const alt = el.getAttribute(`data-alt-${lang}`);
        if (alt) el.setAttribute('alt', alt);
    });

    document.querySelectorAll('[data-tip-en][data-tip-fr]').forEach((element) => {
        const el = element as HTMLElement;
        const tip = el.getAttribute(`data-tip-${lang}`);
        if (tip != null) el.setAttribute('data-tip', tip);
    });

    updateCarouselAriaLabels(lang);
}

export function initLanguage(): void {
    const savedLang = getLangFromUrl() || localStorage.getItem('tdt-lang') || 'en';
    setLanguage(savedLang);

    elements.langButtons.forEach((btn) => {
        btn.addEventListener('click', function (this: HTMLButtonElement) {
            const lang = this.getAttribute('data-lang');
            if (!lang) return;
            setLanguage(lang);
            localStorage.setItem('tdt-lang', lang);
        });
    });
}
