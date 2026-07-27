/**
 * Wires DOMContentLoaded, deferred init (post-entrance), and global listeners.
 */
import { doubleRaf, initImgFadeOnLoad } from './dom-utils';
import { initLanguage } from './language';
import { initTabs } from './tabs';
import { handleHashChange } from './routing';
import { initUniversMondeSidebarLinks } from './routing';
import { initPdfDownloadModal } from './modals';
import { initContactModal } from './modals';
import { initSubTabs } from './subtabs';
import { initMapPanZoom } from './subtabs';
import { initArchiveToggle } from './archive';
import { initZinePages } from './subtabs';
import { initPeuples } from './peoples';
import { initPopovers } from './popovers';
import { initCombat } from './rules-ui';
import { initMagicProgressionRulesUi } from './rules-ui';
import { initSystemOverview } from './rules-ui';
import { initCarousel } from './carousel';
import {
    initGalleriesCycling,
    initSoundCloudCycling,
    initSoundCloudNoteState,
    initDiscoveryOvalParallax,
    initScrollAnimations,
    initCharacterSheet,
} from './landing-extra';
import { initNewsletter } from './newsletter';
import { initMenuToggle } from './menu-toggle';
import { initWebGLShaders } from './webgl-site';
import { handleWebGLResize } from './webgl-site';
import { initStickyMainNav } from './nav-sticky';
import { initCopyrightProtection } from './copyright';
import { initAboutContactQuest } from './about-contact-quest';
import { initUniverseLore } from './universe-lore';

let deferredInitDone = false;

function initDeferred(): void {
    if (deferredInitDone) return;
    deferredInitDone = true;

    initSubTabs();
    initMapPanZoom();
    initArchiveToggle();
    initZinePages();
    initPeuples();
    initUniverseLore();
    initPopovers();
    initCombat();
    initMagicProgressionRulesUi();
    initSystemOverview();
    initCarousel();
    initGalleriesCycling();
    initSoundCloudCycling();
    initSoundCloudNoteState();
    initDiscoveryOvalParallax();
    initNewsletter();
    initScrollAnimations();
    initCharacterSheet();
    initWebGLShaders();

    initStickyMainNav();

    window.addEventListener('resize', handleWebGLResize);
}

document.addEventListener('DOMContentLoaded', function () {
    initLanguage();
    initImgFadeOnLoad();
    initTabs();
    initUniversMondeSidebarLinks();
    initMenuToggle();
    initPdfDownloadModal();
    initContactModal();
    initAboutContactQuest();

    if (window.matchMedia('(max-width: 768px)').matches) {
        const gallerySlot = document.getElementById('galleries-cycling-slot');
        const discoverySection = document.querySelector('.discovery-unified-section');
        if (gallerySlot && discoverySection && discoverySection.parentNode) {
            discoverySection.parentNode.insertBefore(gallerySlot, discoverySection);
            gallerySlot.classList.add('mobile-relocated');
        }
    }

    window.addEventListener('hashchange', handleHashChange);

    handleHashChange();

    window.addEventListener('tdt-entrance-complete', initDeferred, { once: true });

    window.addEventListener(
        'load',
        function () {
            setTimeout(function () {
                if (document.body.classList.contains('entrance-active')) {
                    return;
                }
                initDeferred();
            }, 100);
        },
        { once: true }
    );

    (function initHeaderCreatureBannerReveal() {
        function revealHeaderCreatureBanner() {
            const banner = document.querySelector('.header-creature-banner');
            if (!banner || banner.classList.contains('header-creature-banner--revealed')) {
                return;
            }
            doubleRaf(function () {
                banner.classList.add('header-creature-banner--revealed');
            });
        }
        window.addEventListener('tdt-entrance-complete', revealHeaderCreatureBanner, { once: true });
        window.addEventListener(
            'load',
            function () {
                setTimeout(function () {
                    if (!document.body.classList.contains('entrance-active')) {
                        revealHeaderCreatureBanner();
                    }
                }, 120);
            },
            { once: true }
        );
    })();
});

initCopyrightProtection();
