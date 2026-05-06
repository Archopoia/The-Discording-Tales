/**
 * Injects content manifests onto window before the main-site bundle runs.
 * Large site data lives in public/data/*.json; editors update those files directly.
 */
import attributesTree from '../public/data/attributes-tree.json';
import landingCarousels from '../public/data/landing-carousels.json';

export type TdtAttributesTreeBundle = typeof attributesTree;
export type TdtLandingCarousels = typeof landingCarousels;

declare global {
    interface Window {
        __TDT_ATTRIBUTES_TREE__?: TdtAttributesTreeBundle;
        __TDT_LANDING_CAROUSELS__?: TdtLandingCarousels;
    }
}

window.__TDT_ATTRIBUTES_TREE__ = attributesTree;
window.__TDT_LANDING_CAROUSELS__ = landingCarousels;
