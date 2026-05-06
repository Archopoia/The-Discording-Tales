/**
 * Injects content manifests onto window before legacy IIFE scripts run.
 * Keeps large JSON out of dtd-interactive.js and allows editors to update data files only.
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
