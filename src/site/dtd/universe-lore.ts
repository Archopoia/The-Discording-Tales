// @ts-nocheck

type UniverseLoreEnBundle = {
    entries?: Record<
        string,
        {
            summary?: string;
            bodyHtml?: string;
        }
    >;
};

const LORE_FR_CACHE = new WeakMap<
    HTMLElement,
    { summary: string; bodyHtml: string }
>();

function loreEnBundle(): UniverseLoreEnBundle | null {
    const w = window as Window & { __TDT_UNIVERSE_LORE_EN__?: UniverseLoreEnBundle };
    return w.__TDT_UNIVERSE_LORE_EN__ || null;
}

function cacheFrenchLoreEntries(root: HTMLElement | null) {
    if (!root) return;
    root.querySelectorAll('.universe-lore-entry[data-lore-id]').forEach(function (entry) {
        const el = entry as HTMLElement;
        if (LORE_FR_CACHE.has(el)) return;
        const summaryEl = el.querySelector('.universe-lore-entry__summary');
        const bodyEl = el.querySelector('.universe-lore-entry__body');
        LORE_FR_CACHE.set(el, {
            summary: summaryEl ? summaryEl.textContent || '' : '',
            bodyHtml: bodyEl ? bodyEl.innerHTML : '',
        });
    });
}

export function applyUniverseLoreLanguage(lang: string) {
    const root = document.getElementById('universe-lore');
    if (!root) return;

    cacheFrenchLoreEntries(root);

    const useEn = lang === 'en';
    const bundle = useEn ? loreEnBundle() : null;
    const entries = bundle && bundle.entries ? bundle.entries : null;

    root.querySelectorAll('.universe-lore-entry[data-lore-id]').forEach(function (entry) {
        const el = entry as HTMLElement;
        const id = el.getAttribute('data-lore-id');
        const cached = LORE_FR_CACHE.get(el);
        if (!id || !cached) return;

        const summaryEl = el.querySelector('.universe-lore-entry__summary');
        const bodyEl = el.querySelector('.universe-lore-entry__body');
        const enEntry = entries && entries[id] ? entries[id] : null;

        if (useEn && enEntry) {
            if (summaryEl && enEntry.summary) summaryEl.textContent = enEntry.summary;
            if (bodyEl && enEntry.bodyHtml) bodyEl.innerHTML = enEntry.bodyHtml;
        } else {
            if (summaryEl) summaryEl.textContent = cached.summary;
            if (bodyEl) bodyEl.innerHTML = cached.bodyHtml;
        }
    });

    const warn = root.querySelector('.universe-lore-auto-translate-warn');
    if (warn) {
        warn.hidden = !useEn;
    }
}

export function initUniverseLore() {
    const root = document.getElementById('universe-lore');
    if (!root) return;

    cacheFrenchLoreEntries(root);

    window.addEventListener('tdt-lang-changed', function (ev) {
        const detail = ev && (ev as CustomEvent).detail;
        applyUniverseLoreLanguage(typeof detail === 'string' ? detail : document.documentElement.lang || 'en');
    });

    applyUniverseLoreLanguage(document.documentElement.lang || 'en');
}
