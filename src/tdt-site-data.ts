/**
 * Small manifests stay inlined. Large rules/lore JSON are fetched on demand
 * from dist/data/ (copied by tools/copy_site_data.js) so they stay out of the
 * initial main-site.js parse.
 */
import landingCarousels from '../public/data/landing-carousels.json';
import progressiveImages from '../public/data/progressive-images.json';
import type attributesTree from '../public/data/attributes-tree.json';
import type universeLoreEn from '../public/data/universe-lore-en.json';

export type TdtAttributesTreeBundle = typeof attributesTree;
export type TdtLandingCarousels = typeof landingCarousels;
export type TdtUniverseLoreEn = typeof universeLoreEn;
export type TdtProgressiveImages = typeof progressiveImages;

declare global {
    interface Window {
        __TDT_ATTRIBUTES_TREE__?: TdtAttributesTreeBundle;
        __TDT_LANDING_CAROUSELS__?: TdtLandingCarousels;
        __TDT_UNIVERSE_LORE_EN__?: TdtUniverseLoreEn;
        __TDT_PROGRESSIVE_IMAGES__?: TdtProgressiveImages;
    }
}

/** Root-absolute asset path so /site/ (and other subpaths) still hit /assets/…. */
function rootAssetUrl(src: string): string {
    if (!src || /^(https?:|data:|blob:|\/\/|\/)/i.test(src)) return src;
    return '/' + src.replace(/^\.\//, '');
}

function withRootAssetUrls(decks: TdtLandingCarousels): TdtLandingCarousels {
    const out = {} as TdtLandingCarousels;
    (Object.keys(decks) as (keyof TdtLandingCarousels)[]).forEach(function (key) {
        out[key] = (decks[key] || []).map(function (img) {
            return { ...img, src: rootAssetUrl(img.src) };
        });
    });
    return out;
}

window.__TDT_LANDING_CAROUSELS__ = withRootAssetUrls(landingCarousels);
window.__TDT_PROGRESSIVE_IMAGES__ = progressiveImages;

function dataUrl(name: string): string {
    try {
        return new URL('/dist/data/' + name, window.location.origin).href;
    } catch {
        return '/dist/data/' + name;
    }
}

async function fetchJson<T>(name: string): Promise<T> {
    const res = await fetch(dataUrl(name), { credentials: 'same-origin' });
    if (!res.ok) {
        throw new Error('[TDT] Failed to load ' + name + ' (' + res.status + ')');
    }
    return (await res.json()) as T;
}

let attributesTreePromise: Promise<TdtAttributesTreeBundle> | null = null;
let universeLorePromise: Promise<TdtUniverseLoreEn> | null = null;

/** Load attributes-tree.json once; used by system overview / rules UI. */
export function ensureAttributesTree(): Promise<TdtAttributesTreeBundle> {
    if (window.__TDT_ATTRIBUTES_TREE__) {
        return Promise.resolve(window.__TDT_ATTRIBUTES_TREE__);
    }
    if (!attributesTreePromise) {
        attributesTreePromise = fetchJson<TdtAttributesTreeBundle>('attributes-tree.json')
            .then(function (data) {
                window.__TDT_ATTRIBUTES_TREE__ = data;
                return data;
            })
            .catch(function (err) {
                attributesTreePromise = null;
                throw err;
            });
    }
    return attributesTreePromise;
}

/** Load universe-lore-en.json once; used when EN lore panel is shown. */
export function ensureUniverseLoreEn(): Promise<TdtUniverseLoreEn> {
    if (window.__TDT_UNIVERSE_LORE_EN__) {
        return Promise.resolve(window.__TDT_UNIVERSE_LORE_EN__);
    }
    if (!universeLorePromise) {
        universeLorePromise = fetchJson<TdtUniverseLoreEn>('universe-lore-en.json')
            .then(function (data) {
                window.__TDT_UNIVERSE_LORE_EN__ = data;
                return data;
            })
            .catch(function (err) {
                universeLorePromise = null;
                throw err;
            });
    }
    return universeLorePromise;
}
