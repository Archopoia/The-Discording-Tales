/**
 * The Discording Tales - Interactive Website JavaScript
 * Handles tab switching, language toggle, content loading, and animations
 *
 * Table of contents (sections):
 *   State, DOM Elements, Hero Images, DOMContentLoaded
 *   Tabs, SubTabs, Peuples, Popovers
 *   initAccordion, initTabPanels (shared helpers)
 *   Combat, Rules sections registry (magic / progression), System overview
 *   Language, Carousel, Menu Toggle, Newsletter, Scroll Animations
 *   Character Sheet, WebGL Shaders
 */

(function() {
    'use strict';

    // ========================================
    // State Management
    // ========================================
    const state = {
        currentTab: 'landing',
        currentLang: 'en',
        carouselIndex: 0,
        carouselInterval: null
    };

    // ========================================
    // DOM Elements
    // ========================================
    const elements = {
        menuToggle: document.getElementById('menu-toggle'),
        menu: document.getElementById('primary-menu'),
        tabLinks: document.querySelectorAll('.tab-link'),
        tabContents: document.querySelectorAll('.tab-content'),
        langButtons: document.querySelectorAll('.lang-btn'),
        newsletterForm: document.getElementById('newsletter-form'),
        carousel: document.getElementById('hero-carousel'), /* legacy; landing uses carousel-lifestyles, carousel-meanings, carousel-stories */
        siteLogo: document.querySelector('.site-logo')
    };

    /** Loose gate for enabling the outpost subscribe control (trimmed; needs @ and domain.tld). */
    function isLooseNewsletterEmail(value) {
        var v = String(value || '').trim();
        if (!v) return false;
        return /\S+@\S+\.\S+/.test(v);
    }

    /** Main nav tab order (left to right) for logo spin direction */
    const TAB_ORDER = ['landing', 'lore', 'univers', 'rules', 'play', 'about'];
    let logoBurstTimeout = null;

    /** After two rAF ticks layout is usually stable (used instead of duplicating nested rAF everywhere). */
    function doubleRaf(fn) {
        requestAnimationFrame(function() {
            requestAnimationFrame(fn);
        });
    }

    // ========================================
    // Image load fade-in (<img> only; add .tdt-img-no-fade to skip)
    // ========================================
    function setupImgFade(img) {
        if (!img || img.nodeType !== 1 || img.tagName !== 'IMG') return;
        if (img.dataset.tdtImgFadeBound === '1') return;

        if (img.classList.contains('tdt-img-no-fade')) {
            img.classList.add('tdt-img-ready');
            img.dataset.tdtImgFadeBound = '1';
            return;
        }

        function reveal() {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                img.classList.add('tdt-img-ready');
                return;
            }
            doubleRaf(function() {
                img.classList.add('tdt-img-ready');
            });
        }

        img.addEventListener('load', reveal);
        img.addEventListener('error', reveal);
        img.dataset.tdtImgFadeBound = '1';

        if (img.complete && img.naturalWidth > 0) {
            reveal();
        }
    }

    function initImgFadeOnLoad() {
        if (document.documentElement.dataset.tdtImgFadeInit === '1') return;
        document.documentElement.dataset.tdtImgFadeInit = '1';

        document.querySelectorAll('img').forEach(setupImgFade);

        if (typeof MutationObserver === 'undefined') return;
        var mo = new MutationObserver(function(mutations) {
            mutations.forEach(function(m) {
                m.addedNodes.forEach(function(node) {
                    if (node.nodeType !== 1) return;
                    if (node.tagName === 'IMG') setupImgFade(node);
                    if (node.querySelectorAll) {
                        node.querySelectorAll('img').forEach(setupImgFade);
                    }
                });
            });
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }

    // Landing carousel slides: public/data/landing-carousels.json (window.__TDT_LANDING_CAROUSELS__)

    // ========================================
    // Initialize on DOM Load
    // ========================================
    
    // Track whether deferred init has run (to avoid double-init)
    let deferredInitDone = false;

    /**
     * Pin main tab bar to viewport top while scrolling (CSS position:sticky is unreliable with
     * this layout). Uses a placeholder to preserve header height when the nav is position:fixed.
     * If deferred init runs before the entrance overlay is dismissed, wait for tdt-entrance-complete
     * so layout measurements are valid.
     */
    function initStickyMainNav() {
        function attach() {
            var nav = document.getElementById('site-navigation');
            var placeholder = document.getElementById('main-navigation-placeholder');
            if (!nav || !placeholder) {
                return;
            }

            var navSlotTop = 0;

            function updateNavSlotTop() {
                if (nav.classList.contains('main-navigation--fixed') && placeholder.classList.contains('is-active')) {
                    navSlotTop = Math.round(placeholder.getBoundingClientRect().top + window.pageYOffset);
                } else {
                    navSlotTop = Math.round(nav.getBoundingClientRect().top + window.pageYOffset);
                }
            }

            function applyFixed() {
                if (!nav.classList.contains('main-navigation--fixed')) {
                    placeholder.style.height = nav.offsetHeight + 'px';
                    placeholder.classList.add('is-active');
                    nav.classList.add('main-navigation--fixed');
                    updateNavSlotTop();
                }
            }

            function clearFixed() {
                if (nav.classList.contains('main-navigation--fixed')) {
                    nav.classList.remove('main-navigation--fixed');
                    placeholder.classList.remove('is-active');
                    placeholder.style.height = '';
                    updateNavSlotTop();
                }
            }

            function onScroll() {
                var y = window.pageYOffset || document.documentElement.scrollTop || 0;
                if (y >= navSlotTop - 1) {
                    applyFixed();
                } else {
                    clearFixed();
                }
            }

            function onResize() {
                var wasFixed = nav.classList.contains('main-navigation--fixed');
                if (wasFixed) {
                    clearFixed();
                }
                updateNavSlotTop();
                if (wasFixed) {
                    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
                    if (y >= navSlotTop - 1) {
                        applyFixed();
                    }
                }
                onScroll();
            }

            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onResize);

            doubleRaf(function() {
                updateNavSlotTop();
                onScroll();
            });
        }

        if (document.body.classList.contains('entrance-active')) {
            window.addEventListener('tdt-entrance-complete', function stickyAfterEntrance() {
                window.removeEventListener('tdt-entrance-complete', stickyAfterEntrance);
                doubleRaf(attach);
            });
            return;
        }

        doubleRaf(attach);
    }
    
    /**
     * Deferred initialization: heavy work that should wait until after entrance click.
     * Called either on tdt-entrance-complete event or on load (fallback safety).
     */
    function initDeferred() {
        if (deferredInitDone) return;
        deferredInitDone = true;
        
        initSubTabs();
        initMapPanZoom();
        initArchiveToggle();
        initZinePages();
        initPeuples();
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
        initWebGLShaders(); // Initialize procedural texture shaders

        initStickyMainNav();
        
        // Handle window resize for WebGL canvases
        window.addEventListener('resize', handleWebGLResize);
    }
    
    document.addEventListener('DOMContentLoaded', function() {
        // Essential: language, tabs, menu (needed even during entrance for deep-links)
        initLanguage();
        initImgFadeOnLoad();
        initTabs();
        initUniversMondeSidebarLinks();
        initMenuToggle();
        initPdfDownloadModal();
        initContactModal();
        
        // Mobile layout: move gallery out of header (SoundCloud lives outside header in markup).
        // The header-bg has CSS filter (drop-shadow) which breaks position:fixed on children.
        if (window.matchMedia('(max-width: 768px)').matches) {
            var gallerySlot = document.getElementById('galleries-cycling-slot');
            var discoverySection = document.querySelector('.discovery-unified-section');
            if (gallerySlot && discoverySection && discoverySection.parentNode) {
                discoverySection.parentNode.insertBefore(gallerySlot, discoverySection);
                gallerySlot.classList.add('mobile-relocated');
            }
        }
        
        // Handle hash changes (for deep linking)
        window.addEventListener('hashchange', handleHashChange);
        
        // Check for initial hash
        handleHashChange();
        
        // Listen for entrance complete to run deferred init
        window.addEventListener('tdt-entrance-complete', initDeferred, { once: true });
        
        // Fallback: run after load only if the entrance overlay is not active.
        // Otherwise WebGL and heavy init would run while the site is display:none behind
        // the loader, wasting GPU/CPU and competing with the entrance animation.
        window.addEventListener('load', function() {
            setTimeout(function() {
                if (document.body.classList.contains('entrance-active')) {
                    return;
                }
                initDeferred();
            }, 100);
        }, { once: true });

        (function initHeaderCreatureBannerReveal() {
            function revealHeaderCreatureBanner() {
                var banner = document.querySelector('.header-creature-banner');
                if (!banner || banner.classList.contains('header-creature-banner--revealed')) {
                    return;
                }
                doubleRaf(function() {
                    banner.classList.add('header-creature-banner--revealed');
                });
            }
            window.addEventListener('tdt-entrance-complete', revealHeaderCreatureBanner, { once: true });
            window.addEventListener('load', function() {
                setTimeout(function() {
                    if (!document.body.classList.contains('entrance-active')) {
                        revealHeaderCreatureBanner();
                    }
                }, 120);
            }, { once: true });
        })();
    });

    // ========================================
    // Tab Navigation System
    // ========================================
    function initTabs() {
        elements.tabLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const tabId = this.getAttribute('data-tab');
                if (elements.siteLogo && tabId !== state.currentTab) {
                    const currentIdx = TAB_ORDER.indexOf(state.currentTab);
                    const clickedIdx = TAB_ORDER.indexOf(tabId);
                    if (currentIdx >= 0 && clickedIdx >= 0) {
                        if (clickedIdx > currentIdx) {
                            triggerLogoBurst('cw');
                        } else {
                            triggerLogoBurst('ccw');
                        }
                    }
                }
                switchTab(tabId);
                
                // Update URL hash without scrolling
                if (history.pushState) {
                    history.pushState(null, null, '#' + tabId);
                }
                
                // Close mobile menu if open
                if (elements.menu) {
                    elements.menu.classList.remove('active');
                    if (elements.menuToggle) {
                        elements.menuToggle.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        });
    }

    function triggerLogoBurst(direction) {
        if (!elements.siteLogo) return;
        if (logoBurstTimeout) {
            clearTimeout(logoBurstTimeout);
            logoBurstTimeout = null;
        }
        elements.siteLogo.classList.remove('logo-spin-cw', 'logo-spin-ccw');
        elements.siteLogo.offsetHeight;
        elements.siteLogo.classList.add(direction === 'cw' ? 'logo-spin-cw' : 'logo-spin-ccw');
        logoBurstTimeout = setTimeout(function() {
            elements.siteLogo.classList.remove('logo-spin-cw', 'logo-spin-ccw');
            logoBurstTimeout = null;
        }, 1000);
    }

    /** Lazy-load Play tab bundles (WebLLM + React sheet) on first visit to #play to speed initial page load. */
    var tdtPlayBundlesPromise = null;
    function loadPlayTabBundles() {
        if (tdtPlayBundlesPromise) {
            return tdtPlayBundlesPromise;
        }
        function injectModuleOnce(src, attr, alreadyLoaded) {
            return new Promise(function(resolve, reject) {
                if (alreadyLoaded && alreadyLoaded()) {
                    resolve();
                    return;
                }
                if (document.querySelector('script[' + attr + ']')) {
                    resolve();
                    return;
                }
                var s = document.createElement('script');
                s.type = 'module';
                s.src = src;
                s.setAttribute(attr, '1');
                s.onload = function() {
                    resolve();
                };
                s.onerror = function() {
                    reject(new Error('Failed to load ' + src));
                };
                document.head.appendChild(s);
            });
        }
        function injectDeferScriptOnce(src, attr, alreadyLoaded) {
            return new Promise(function(resolve, reject) {
                if (alreadyLoaded && alreadyLoaded()) {
                    resolve();
                    return;
                }
                if (document.querySelector('script[' + attr + ']')) {
                    resolve();
                    return;
                }
                var s = document.createElement('script');
                s.src = src;
                s.async = false;
                s.setAttribute(attr, '1');
                s.onload = function() {
                    window.__tdtCharacterSheetLoaded = true;
                    resolve();
                };
                s.onerror = function() {
                    reject(new Error('Failed to load ' + src));
                };
                document.head.appendChild(s);
            });
        }
        tdtPlayBundlesPromise = Promise.all([
            injectModuleOnce('dist/play-webllm.js', 'data-tdt-play-webllm', function() {
                return typeof window.getWebLLMEngine === 'function';
            }),
            injectDeferScriptOnce('dist/character-sheet.js', 'data-tdt-character-sheet', function() {
                return !!window.__tdtCharacterSheetLoaded;
            })
        ]).catch(function() {
            tdtPlayBundlesPromise = null;
        });
        return tdtPlayBundlesPromise;
    }

    function switchTab(tabId, options) {
        options = options || {};
        const skipScrollToTop = options.skipScrollToTop === true;
        const skipEnsureSubTab = options.skipEnsureSubTab === true;

        if (tabId === 'play') {
            loadPlayTabBundles().catch(function() {});
        }

        // Update active states (do not strip .active from the target tab first  -  that would
        // momentarily hide every .tab-content and collapse the page, resetting scroll to the top)
        elements.tabLinks.forEach(link => {
            if (link.getAttribute('data-tab') === tabId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        elements.tabContents.forEach(content => {
            if (content.id !== tabId) {
                content.classList.remove('active');
            }
        });
        const targetContent = document.getElementById(tabId);
        if (targetContent) {
            targetContent.classList.add('active');
            state.currentTab = tabId;
            if (!skipScrollToTop) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            if (!skipEnsureSubTab) {
                ensureFirstSubTabActive(tabId);
            }
            requestAnimationFrame(function() { setLanguage(state.currentLang); });
        }
    }

    /** Normalize location.hash for routing (encoded, leading /, query junk). */
    function getRouteHashFragment() {
        var h = (window.location.hash || '').replace(/^#/, '');
        try {
            h = decodeURIComponent(h);
        } catch (e) { /* keep raw */ }
        h = (h || '').split('?')[0].split('&')[0].trim();
        if (h.indexOf('/') === 0) {
            h = h.replace(/^\/+/, '');
        }
        return h;
    }

    /** Fragment from an in-page <a> (works when href is relative or absolute). */
    function fragmentFromMondeLink(anchor) {
        if (!anchor || anchor.tagName !== 'A') return '';
        try {
            var u = new URL(anchor.href, window.location.href);
            if (u.origin !== window.location.origin) return '';
            var frag = (u.hash || '').replace(/^#/, '').split('?')[0].trim();
            if (frag.indexOf('/') === 0) frag = frag.replace(/^\/+/, '');
            return frag;
        } catch (e1) {
            var raw = anchor.getAttribute('href') || '';
            var m = raw.match(/#([^#?\s]+)/);
            return m ? m[1].trim() : '';
        }
    }

    function handleHashChange() {
        const hash = getRouteHashFragment();
        const validTabs = ['landing', 'lore', 'univers', 'rules', 'play', 'about'];
        const sectionToTab = {
            cosmology: 'lore',
            peoples: 'univers',
            'world-context': 'lore',
            'system-overview': 'univers',
            'character-creation': 'rules',
            progression: 'rules',
            combat: 'rules',
            magic: 'rules'
        };

        if (!hash) {
            switchTab('landing');
            return;
        }
        var archivedHidden = document.body.classList.contains('archived-hidden');
        if (archivedHidden && (hash === 'lore' || hash === 'rules')) {
            if (history.replaceState) history.replaceState(null, null, '#peoples');
            switchTab('univers');
            switchSubTab('univers', 'peoples');
            return;
        }
        if (hash === 'world-map') {
            if (history.replaceState) history.replaceState(null, null, '#map');
            handleHashChange();
            return;
        }
        if (hash === 'map') {
            if (archivedHidden) {
                if (history.replaceState) history.replaceState(null, null, '#peoples');
                switchTab('univers');
                switchSubTab('univers', 'peoples');
                return;
            }
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
            var tab = sectionToTab[hash];
            if (archivedHidden && (tab === 'lore' || tab === 'rules')) {
                if (history.replaceState) history.replaceState(null, null, '#peoples');
                switchTab('univers');
                switchSubTab('univers', 'peoples');
                return;
            }
            switchTab(tab, { skipScrollToTop: true });
            switchSubTab(tab, hash);
            return;
        }
        // System overview in-page anchors: system-overview-uncover, -struggle, -traits, -more, -attributes, -conflicts
        if (hash.indexOf('system-overview') === 0) {
            switchTab('univers', { skipScrollToTop: true });
            switchSubTab('univers', 'system-overview');
            doubleRaf(function() {
                var target = document.getElementById(hash);
                if (target) {
                    var body = target.querySelector('.system-overview-accordion-body');
                    var head = target.querySelector('.system-overview-accordion-head');
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

    // ========================================
    // Universe > World: Peoples | Map (sidebar .univers-monde-in-page-nav + inner panels)
    // ========================================
    function syncUniversMondeSublinkActive(innerId) {
        var nav = document.querySelector('.univers-monde-in-page-nav');
        if (!nav) return;
        nav.querySelectorAll('a.univers-monde-sublink').forEach(function(a) {
            var href = a.getAttribute('href') || '';
            var on = false;
            if (innerId === 'peoples-peoples' && href === '#peoples') on = true;
            if (innerId === 'map' && href === '#map') on = true;
            if (innerId === 'universe-lore' && href === '#universe-lore') on = true;
            a.classList.toggle('active', !!on);
            if (on) {
                a.setAttribute('aria-current', 'page');
            } else {
                a.removeAttribute('aria-current');
            }
        });
    }

    function setUniversWorldInner(innerId) {
        var root = document.getElementById('peoples');
        if (!root) return;
        var panels = root.querySelectorAll('.univers-world-panel');
        panels.forEach(function(p) {
            var isActive = p.id === innerId;
            p.classList.toggle('univers-world-panel--active', isActive);
            if (isActive) {
                p.removeAttribute('aria-hidden');
                p.removeAttribute('inert');
            } else {
                p.setAttribute('aria-hidden', 'true');
                p.setAttribute('inert', '');
            }
        });
        syncUniversMondeSublinkActive(innerId);
    }

    /**
     * Sidebar Monde sub-links (#peoples / #map / #universe-lore): intercept so the browser does not
     * scroll to a hidden fragment target (jumps to top) before JS reveals the panel.
     */
    function initUniversMondeSidebarLinks() {
        var nav = document.querySelector('.univers-monde-in-page-nav');
        if (!nav) return;
        nav.addEventListener(
            'click',
            function(e) {
                var a = e.target && e.target.closest ? e.target.closest('a') : null;
                if (!a || !a.classList.contains('univers-monde-sublink') || !nav.contains(a)) return;
                var frag = fragmentFromMondeLink(a);
                if (frag !== 'peoples' && frag !== 'map' && frag !== 'universe-lore') return;
                e.preventDefault();
                var pushHash = '#' + frag;
                if (history.pushState) {
                    history.pushState(null, null, pushHash);
                    handleHashChange();
                } else {
                    window.location.hash = pushHash;
                }
            },
            true
        );
    }

    /**
     * Universe Map panel: wheel / pinch zoom, drag pan when zoomed (inside circular viewport).
     */
    function initMapPanZoom() {
        var viewport = document.getElementById('map-viewport');
        var layer = document.getElementById('map-pan-zoom-layer');
        var panel = document.getElementById('map');
        if (!viewport || !layer || !panel) return;

        var scale = 1;
        var tx = 0;
        var ty = 0;
        var minScale = 1;
        var maxScale = 12;

        function touchDist(a, b) {
            var dx = a.clientX - b.clientX;
            var dy = a.clientY - b.clientY;
            return Math.sqrt(dx * dx + dy * dy) || 1;
        }

        function clampPan() {
            var w = viewport.clientWidth;
            var h = viewport.clientHeight;
            if (w < 4 || h < 4) return;
            var maxX = (w * (scale - 1)) / 2;
            var maxY = (h * (scale - 1)) / 2;
            if (maxX < 0) maxX = 0;
            if (maxY < 0) maxY = 0;
            tx = Math.max(-maxX, Math.min(maxX, tx));
            ty = Math.max(-maxY, Math.min(maxY, ty));
            if (scale < minScale) scale = minScale;
            if (scale > maxScale) scale = maxScale;
        }

        function applyTransform() {
            clampPan();
            layer.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
        }

        function zoomAtPoint(clientX, clientY, newScale) {
            newScale = Math.max(minScale, Math.min(maxScale, newScale));
            var rect = viewport.getBoundingClientRect();
            var mx = clientX - rect.left;
            var my = clientY - rect.top;
            var cx = rect.width / 2;
            var cy = rect.height / 2;
            var dx = mx - cx;
            var dy = my - cy;
            var oldScale = scale;
            if (Math.abs(oldScale - newScale) < 1e-6) return;
            scale = newScale;
            tx = dx - (dx - tx) * (scale / oldScale);
            ty = dy - (dy - ty) * (scale / oldScale);
            applyTransform();
        }

        function mapPanelVisible() {
            return panel && panel.classList.contains('univers-world-panel--active');
        }

        viewport.addEventListener('wheel', function(e) {
            if (!mapPanelVisible()) return;
            e.preventDefault();
            e.stopPropagation();
            var factor = Math.exp(-e.deltaY * 0.002);
            zoomAtPoint(e.clientX, e.clientY, scale * factor);
        }, { passive: false });

        var mouseDragging = false;
        var mouseLastX = 0;
        var mouseLastY = 0;

        function canPan() {
            return scale > 1.02;
        }

        viewport.addEventListener('mousedown', function(e) {
            if (!mapPanelVisible() || e.button !== 0 || !canPan()) return;
            mouseDragging = true;
            mouseLastX = e.clientX;
            mouseLastY = e.clientY;
            viewport.classList.add('map-viewport--dragging');
            e.preventDefault();
        });

        window.addEventListener('mousemove', function(e) {
            if (!mouseDragging) return;
            tx += e.clientX - mouseLastX;
            ty += e.clientY - mouseLastY;
            mouseLastX = e.clientX;
            mouseLastY = e.clientY;
            applyTransform();
        });

        window.addEventListener('mouseup', function() {
            if (mouseDragging) {
                mouseDragging = false;
                viewport.classList.remove('map-viewport--dragging');
            }
        });

        var touchPanning = false;
        var touchLastX = 0;
        var touchLastY = 0;
        var pinchBaseDist = 0;
        var pinchBaseScale = 1;

        viewport.addEventListener('touchstart', function(e) {
            if (!mapPanelVisible()) return;
            if (e.touches.length === 2) {
                pinchBaseDist = touchDist(e.touches[0], e.touches[1]);
                pinchBaseScale = scale;
                touchPanning = false;
            } else if (e.touches.length === 1 && canPan()) {
                touchPanning = true;
                touchLastX = e.touches[0].clientX;
                touchLastY = e.touches[0].clientY;
            }
        }, { passive: true });

        viewport.addEventListener('touchmove', function(e) {
            if (!mapPanelVisible()) return;
            if (e.touches.length === 2 && pinchBaseDist > 0) {
                e.preventDefault();
                var d = touchDist(e.touches[0], e.touches[1]);
                scale = Math.max(minScale, Math.min(maxScale, pinchBaseScale * (d / pinchBaseDist)));
                applyTransform();
            } else if (e.touches.length === 1 && touchPanning && canPan()) {
                e.preventDefault();
                var t = e.touches[0];
                tx += t.clientX - touchLastX;
                ty += t.clientY - touchLastY;
                touchLastX = t.clientX;
                touchLastY = t.clientY;
                applyTransform();
            }
        }, { passive: false });

        viewport.addEventListener('touchend', function(e) {
            if (e.touches.length < 2) {
                pinchBaseDist = 0;
            }
            if (e.touches.length === 0) {
                touchPanning = false;
            }
        });

        if (typeof ResizeObserver !== 'undefined') {
            var ro = new ResizeObserver(function() {
                clampPan();
                applyTransform();
            });
            ro.observe(viewport);
        }

        applyTransform();
    }

    // ========================================
    // Subtab Navigation (Lore, Rules)
    // ========================================
    function initSubTabs() {
        document.querySelectorAll('.tab-sub-nav').forEach(function(nav) {
            const tabContent = nav.closest('.tab-content');
            if (!tabContent) return;
            const links = nav.querySelectorAll('.tab-sub-nav-link');
            links.forEach(function(link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const href = this.getAttribute('href');
                    const subId = href ? href.replace('#', '') : '';
                    if (!subId) return;
                    switchSubTab(tabContent.id, subId);
                    if (history.pushState) {
                        history.pushState(null, null, '#' + subId);
                    }
                });
            });
        });
        // Set first subtab active when main tab is shown (handled in switchTab)
    }

    function switchSubTab(tabId, subId, universInnerOverride) {
        const tabContent = document.getElementById(tabId);
        if (!tabContent) return;
        const panels = tabContent.querySelectorAll('.tab-sub-panel');
        const links = tabContent.querySelectorAll('.tab-sub-nav-link');
        panels.forEach(function(panel) {
            const isActive = panel.id === subId || panel.getAttribute('data-subtab') === subId;
            panel.classList.toggle('active', !!isActive);
        });
        links.forEach(function(link) {
            const linkHref = link.getAttribute('href');
            const linkSubId = linkHref ? linkHref.replace('#', '') : '';
            link.classList.toggle('active', linkSubId === subId);
        });
        if (tabId === 'univers' && subId === 'peoples') {
            setUniversWorldInner(universInnerOverride || 'peoples-peoples');
        } else if (tabId === 'univers') {
            syncUniversMondeSublinkActive(null);
        }
        // Re-apply current language so all [data-en][data-fr] in newly visible panel are correct
        setLanguage(state.currentLang);
    }

    function ensureFirstSubTabActive(tabId) {
        const tabContent = document.getElementById(tabId);
        if (!tabContent || !tabContent.classList.contains('has-subtabs')) return;
        const links = tabContent.querySelectorAll('.tab-sub-nav-link');
        const archivedHidden = document.body.classList.contains('archived-hidden');
        const firstLink = archivedHidden
            ? Array.prototype.find.call(links, function(link) { return !link.classList.contains('archived-section'); })
            : links[0];
        const firstSubId = firstLink && firstLink.getAttribute('href') ? firstLink.getAttribute('href').replace('#', '') : '';
        if (firstSubId) switchSubTab(tabId, firstSubId);
    }

    var ARCHIVED_SUBTABS = { lore: ['cosmology', 'world-context'], rules: ['character-creation', 'progression', 'combat', 'magic'] };
    var FIRST_NON_ARCHIVED = { lore: 'cosmology', univers: 'peoples', rules: 'character-creation' };

    function initZinePages() {
        var container = document.querySelector('.zine-content');
        if (!container) return;
        var radios = container.querySelectorAll('.zine-page-radio');
        var panels = container.querySelectorAll('.zine-page.zine-page-panel');

        function showPage(value) {
            panels.forEach(function(panel) {
                panel.classList.toggle('zine-page-active', panel.getAttribute('data-page') === value);
            });
        }

        // Desktop: radio change event (fires when label checks a radio via 'for')
        radios.forEach(function(radio) {
            radio.addEventListener('change', function() {
                showPage(this.getAttribute('value'));
            });
        });

        // Mobile fallback: direct click on labels  -  ensures page switch even when
        // the label→radio 'for' mechanism doesn't fire 'change' on some mobile browsers.
        var labels = container.querySelectorAll('.zine-page-nav-label');
        labels.forEach(function(label) {
            label.addEventListener('click', function(e) {
                var radioId = this.getAttribute('for');
                var radio = radioId && document.getElementById(radioId);
                if (radio) {
                    radio.checked = true;
                    showPage(radio.getAttribute('value'));
                }
            });
        });
    }

    function setArchivedVisible(show) {
        var key = 'drd_archived_visible';
        localStorage.setItem(key, show ? 'true' : 'false');
        if (show) {
            document.body.classList.remove('archived-hidden');
        } else {
            document.body.classList.add('archived-hidden');
            var activeTab = document.querySelector('.tab-content.active');
            var tabId = activeTab ? activeTab.id : null;
            if (tabId && ARCHIVED_SUBTABS[tabId]) {
                var activeLink = activeTab.querySelector('.tab-sub-nav-link.active');
                var activeSubId = activeLink && activeLink.getAttribute('href') ? activeLink.getAttribute('href').replace('#', '') : '';
                if (ARCHIVED_SUBTABS[tabId].indexOf(activeSubId) !== -1) {
                    switchSubTab(tabId, FIRST_NON_ARCHIVED[tabId]);
                }
            }
        }
    }

    function initArchiveToggle() {
        var key = 'drd_archived_visible';
        var stored = localStorage.getItem(key);
        var showArchived = stored === 'true';
        if (!showArchived) {
            document.body.classList.add('archived-hidden');
            var activeTab = document.querySelector('.tab-content.active');
            if (activeTab && (activeTab.id === 'lore' || activeTab.id === 'rules')) {
                switchTab('univers');
                switchSubTab('univers', 'peoples');
            }
        } else {
            document.body.classList.remove('archived-hidden');
        }
        document.addEventListener('keydown', function(e) {
            if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
                e.preventDefault();
                var archivedHidden = document.body.classList.contains('archived-hidden');
                setArchivedVisible(archivedHidden);
            }
        });
    }

    // ========================================
    // Peuples Section: Flip cards, view tabs, tree, filter/search
    // ========================================

    /**
     * Show an origin's people list and each people's race list (inline styles + aria).
     * Uses direct children only so it still works after .peoples-tree-origin-content is injected.
     */
    function expandPeoplesTreeOriginSubtree(originNode) {
        if (!originNode) return;
        var childrenEl = null;
        for (var ci = 0; ci < originNode.children.length; ci++) {
            var ch = originNode.children[ci];
            if (ch.classList && ch.classList.contains('peoples-tree-children')) {
                childrenEl = ch;
                break;
            }
        }
            if (!childrenEl) return;
        originNode.setAttribute('aria-expanded', 'true');
        childrenEl.style.removeProperty('display');
        for (var pi = 0; pi < childrenEl.children.length; pi++) {
            var peupleNode = childrenEl.children[pi];
            if (!peupleNode.getAttribute || !peupleNode.getAttribute('data-peuple')) continue;
            var racesEl = peupleNode.querySelector('.peoples-tree-races');
            if (!racesEl) continue;
            peupleNode.setAttribute('aria-expanded', 'true');
            racesEl.classList.remove('peoples-tree-races--collapsed');
        }
    }

    function expandPeoplesTreePeupleRaces(peupleNode) {
        if (!peupleNode) return;
        var racesEl = peupleNode.querySelector('.peoples-tree-races');
        if (!racesEl) return;
        peupleNode.setAttribute('aria-expanded', 'true');
        racesEl.classList.remove('peoples-tree-races--collapsed');
    }

    /** Cached `locales/{en|fr}.json` for race blurbs when flip-card `li` lacks data-title-* (build_i18n not run). */
    var tdtPeoplesLocaleCache = {};

    function slugifyRaceLabelForLocale(label) {
        if (!label || typeof label !== 'string') return '';
        var s = label.trim().toLowerCase();
        try {
            s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        } catch (e0) {
            s = label.trim().toLowerCase();
        }
        s = s.replace(/[''`´]/g, '_');
        s = s.replace(/[\s-]+/g, '_');
        s = s.replace(/[^a-z0-9_]/g, '');
        s = s.replace(/_+/g, '_').replace(/^_|_$/g, '');
        return s;
    }

    function racesJsonKeySuffix(peupleId, raceLabel) {
        var slug = slugifyRaceLabelForLocale(raceLabel);
        if (!slug) return '';
        if (peupleId === 'iqqars') {
            if (slug === 'hauts') return 'iqqars_hauts';
            if (slug === 'bas') return 'iqqars_bas';
        }
        return slug;
    }

    function fetchPeoplesLocaleJson(lang) {
        var l = lang === 'fr' ? 'fr' : 'en';
        if (tdtPeoplesLocaleCache[l]) {
            return Promise.resolve(tdtPeoplesLocaleCache[l]);
        }
        return fetch('locales/' + l + '.json', { credentials: 'same-origin' })
            .then(function(res) {
                if (!res.ok) throw new Error('locale');
                return res.json();
            })
            .then(function(data) {
                tdtPeoplesLocaleCache[l] = data;
                return data;
            })
            .catch(function() {
                return null;
            });
    }

    function raceDescFromFlipCardMini(card, raceLabel, lang) {
        if (!card) return '';
        var want = (raceLabel || '').trim();
        var lis = card.querySelectorAll('.peoples-races-mini li');
        for (var i = 0; i < lis.length; i++) {
            if (lis[i].textContent.trim() === want) {
                return (
                    lis[i].getAttribute('data-title-' + lang) ||
                    lis[i].getAttribute('data-title-en') ||
                    lis[i].getAttribute('data-title-fr') ||
                    lis[i].getAttribute('title') ||
                    ''
                );
            }
        }
        return '';
    }

    function raceDescriptionForPeoplesTree(peoplesSection, raceSpan, lang) {
        var useLang = lang === 'fr' ? 'fr' : 'en';
        var peupleId = raceSpan.getAttribute('data-peuple');
        var raceLabel = raceSpan.getAttribute('data-race') || raceSpan.textContent.trim();
        var card = peoplesSection.querySelector('.peoples-flip-card[data-peuple="' + peupleId + '"]');
        var fromCard = raceDescFromFlipCardMini(card, raceLabel, useLang);
        if (fromCard) return fromCard;
        var loc = tdtPeoplesLocaleCache[useLang];
        var suf = racesJsonKeySuffix(peupleId, raceLabel);
        if (loc && suf && typeof loc['races.' + suf] === 'string') return loc['races.' + suf];
        return '';
    }

    function fillPeoplesTreeRacePanel(peoplesSection, content, raceSpan, langHint) {
        if (content.querySelector('.peoples-tree-race-body')) return;
        var lang = langHint || document.documentElement.lang || 'en';
        var desc = raceDescriptionForPeoplesTree(peoplesSection, raceSpan, lang);
        function paint(text) {
            if (content.querySelector('.peoples-tree-race-body')) return;
            if (content.hasAttribute('hidden')) return;
            var wrap = document.createElement('div');
            wrap.className = 'peoples-tree-race-body';
            var p = document.createElement('p');
            p.textContent = text || '';
            wrap.appendChild(p);
            content.appendChild(wrap);
        }
        if (desc) {
            paint(desc);
            return;
        }
        fetchPeoplesLocaleJson(lang).then(function() {
            paint(raceDescriptionForPeoplesTree(peoplesSection, raceSpan, lang));
        });
    }

    /**
     * Page 22 invectives: click or interval to cycle (see #peoples-invective). Slides: window.TDT_PEOPLES_INVECTIVE_SLIDES (peoples-invective-slides.js).
     */
    function initPeoplesInvectiveRotator(peoplesSection) {
        var root = peoplesSection && peoplesSection.querySelector('#peoples-invective');
        if (!root) return;
        var slides =
            typeof window !== 'undefined' && window.TDT_PEOPLES_INVECTIVE_SLIDES
                ? window.TDT_PEOPLES_INVECTIVE_SLIDES
                : null;
        if (!slides || !slides.length) return;

        var surface = root.querySelector('.peoples-invective__surface');
        var titleEl = root.querySelector('.peoples-invective__title');
        var textEl = root.querySelector('.peoples-invective__text');
        var dotsEl = root.querySelector('.peoples-invective__dots');
        if (!surface || !titleEl || !textEl) return;

        var n = slides.length;
        var i = 0;
        var timer = null;
        var intervalMs = 10000;
        var ivAttr = root.getAttribute('data-invective-interval-ms');
        if (ivAttr) {
            var parsed = parseInt(ivAttr, 10);
            if (!isNaN(parsed) && parsed >= 2000) intervalMs = parsed;
        }

        function stopAuto() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }

        function startAuto() {
            stopAuto();
            if (document.hidden || root.getAttribute('data-invective-paused') === '1') return;
            timer = setInterval(advance, intervalMs);
        }

        function invectiveLang() {
            var l = (document.documentElement.lang || 'en').toLowerCase();
            return l.indexOf('fr') === 0 ? 'fr' : 'en';
        }

        function paint(idx) {
            var s = slides[idx];
            var lang = invectiveLang();
            if (lang === 'fr') {
                titleEl.innerHTML = s.titleFr;
                textEl.textContent = s.bodyFr;
            } else {
                titleEl.innerHTML = s.titleEn;
                textEl.textContent = s.bodyEn;
            }
            if (dotsEl) {
                var dots = dotsEl.querySelectorAll('.peoples-invective__dot');
                dots.forEach(function(dot, j) {
                    dot.classList.toggle('is-active', j === idx);
                });
            }
        }

        function advance() {
            i = (i + 1) % n;
            paint(i);
        }

        function onActivate(ev) {
            if (ev.type === 'keydown' && ev.key !== 'Enter' && ev.key !== ' ') return;
            if (ev.type === 'keydown') ev.preventDefault();
            advance();
            startAuto();
        }

        if (dotsEl) {
            dotsEl.innerHTML = '';
            for (var d = 0; d < n; d++) {
                var span = document.createElement('span');
                span.className = 'peoples-invective__dot' + (d === 0 ? ' is-active' : '');
                dotsEl.appendChild(span);
            }
        }

        paint(0);

        surface.addEventListener('click', onActivate);
        surface.addEventListener('keydown', onActivate);

        function setPaused(paused) {
            if (paused) {
                root.setAttribute('data-invective-paused', '1');
                stopAuto();
            } else {
                root.removeAttribute('data-invective-paused');
                startAuto();
            }
        }

        if (typeof IntersectionObserver !== 'undefined') {
            var io = new IntersectionObserver(
                function(entries) {
                    var vis = entries[0] && entries[0].isIntersecting;
                    setPaused(!vis);
                },
                { threshold: 0.08 }
            );
            io.observe(root);
        } else {
            startAuto();
        }

        document.addEventListener('visibilitychange', function() {
            if (document.hidden) stopAuto();
            else if (root.getAttribute('data-invective-paused') !== '1') startAuto();
        });

        window.addEventListener('tdt-lang-changed', function() {
            paint(i);
        });
    }

    /**
     * Full-screen preview for peoples tree portraits and height chart (click thumb only).
     */
    function initPeoplesPortraitLightbox(peoplesSection) {
        if (!peoplesSection) return;
        var lb = document.getElementById('tdt-peoples-portrait-lightbox');
        var bigImg;
        if (!lb) {
            lb = document.createElement('div');
            lb.id = 'tdt-peoples-portrait-lightbox';
            lb.className = 'tdt-peoples-portrait-lightbox';
            lb.setAttribute('role', 'dialog');
            lb.setAttribute('aria-modal', 'true');
            lb.setAttribute('aria-hidden', 'true');
            lb.hidden = true;
            bigImg = document.createElement('img');
            bigImg.className = 'tdt-peoples-portrait-lightbox__img';
            bigImg.alt = '';
            lb.appendChild(bigImg);
            document.body.appendChild(lb);
        } else {
            bigImg = lb.querySelector('.tdt-peoples-portrait-lightbox__img');
            var legacyClose = lb.querySelector('.tdt-peoples-portrait-lightbox__close');
            if (legacyClose) {
                legacyClose.remove();
            }
            if (!bigImg) {
                bigImg = document.createElement('img');
                bigImg.className = 'tdt-peoples-portrait-lightbox__img';
                bigImg.alt = '';
                lb.appendChild(bigImg);
            }
        }
        if (bigImg) {
            setupImgFade(bigImg);
        }

        var lbPanoramaScale = 1;
        var lbClosing = false;
        var lbCloseTimer = null;
        var lbCloseAnimEnd = null;

        function finishCloseLb() {
            if (lbCloseTimer) {
                clearTimeout(lbCloseTimer);
                lbCloseTimer = null;
            }
            if (lbCloseAnimEnd && lb) {
                lb.removeEventListener('animationend', lbCloseAnimEnd);
                lbCloseAnimEnd = null;
            }
            lbClosing = false;
            if (!lb) return;
            lb.classList.remove('tdt-peoples-portrait-lightbox--closing');
            lb.hidden = true;
            lb.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('tdt-peoples-portrait-lightbox-open');
            lbPanoramaScale = 1;
            if (bigImg) {
                bigImg.classList.remove('tdt-peoples-portrait-lightbox__img--panorama');
                bigImg.style.transform = '';
                bigImg.style.transformOrigin = '';
            }
        }

        function onKeyLb(ev) {
            if (ev.key === 'Escape') {
                closeLb();
            }
        }

        function closeLb() {
            if (!lb || lb.hidden || lbClosing) return;
            lbClosing = true;
            document.removeEventListener('keydown', onKeyLb, true);
            lb.classList.add('tdt-peoples-portrait-lightbox--closing');
            var done = false;
            function complete() {
                if (done) return;
                done = true;
                finishCloseLb();
            }
            lbCloseAnimEnd = function(e) {
                if (e.target !== lb) return;
                if (e.animationName !== 'tdt-peoples-lb-fade-out') return;
                complete();
            };
            lb.addEventListener('animationend', lbCloseAnimEnd);
            lbCloseTimer = setTimeout(complete, 200);
        }

        function openLb(src, variant, sourceImg) {
            if (!src || !bigImg) return;
            if (lbClosing) {
                if (lbCloseTimer) {
                    clearTimeout(lbCloseTimer);
                    lbCloseTimer = null;
                }
                if (lbCloseAnimEnd && lb) {
                    lb.removeEventListener('animationend', lbCloseAnimEnd);
                    lbCloseAnimEnd = null;
                }
                lbClosing = false;
                lb.classList.remove('tdt-peoples-portrait-lightbox--closing');
                lb.style.animation = 'none';
                void lb.offsetWidth;
                lb.style.removeProperty('animation');
            }
            document.removeEventListener('keydown', onKeyLb, true);
            lbPanoramaScale = 1;
            bigImg.style.transform = '';
            bigImg.style.transformOrigin = '';
            bigImg.classList.remove('tdt-img-ready');
            bigImg.src = src;
            bigImg.alt = sourceImg && sourceImg.getAttribute ? sourceImg.getAttribute('alt') || '' : '';
            if (variant === 'panorama') {
                bigImg.classList.add('tdt-peoples-portrait-lightbox__img--panorama');
            } else {
                bigImg.classList.remove('tdt-peoples-portrait-lightbox__img--panorama');
            }
            lb.hidden = false;
            lb.setAttribute('aria-hidden', 'false');
            document.body.classList.add('tdt-peoples-portrait-lightbox-open');
            document.addEventListener('keydown', onKeyLb, true);
        }

        if (!lb.dataset.tdtLbBound) {
            lb.dataset.tdtLbBound = '1';
            lb.addEventListener('click', function() {
                closeLb();
            });
            lb.addEventListener(
                'wheel',
                function(e) {
                    if (lb.hidden || lbClosing || !bigImg) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (!bigImg.classList.contains('tdt-peoples-portrait-lightbox__img--panorama')) return;
                    var rect = bigImg.getBoundingClientRect();
                    var w = rect.width;
                    var h = rect.height;
                    if (w < 2 || h < 2) return;
                    var ox = ((e.clientX - rect.left) / w) * 100;
                    var oy = ((e.clientY - rect.top) / h) * 100;
                    bigImg.style.transformOrigin = ox + '% ' + oy + '%';
                    var factor = Math.exp(-e.deltaY * 0.001);
                    factor = Math.max(0.94, Math.min(1.065, factor));
                    lbPanoramaScale *= factor;
                    if (lbPanoramaScale < 1) lbPanoramaScale = 1;
                    if (lbPanoramaScale > 5) lbPanoramaScale = 5;
                    if (lbPanoramaScale <= 1.001) {
                        lbPanoramaScale = 1;
                        bigImg.style.transform = '';
                        bigImg.style.transformOrigin = '';
                    } else {
                        bigImg.style.transform = 'scale(' + lbPanoramaScale + ')';
                    }
                },
                { passive: false }
            );
        }

        function bindPortraitLightboxTrigger(img, variant) {
            if (img.dataset.tdtPortraitLbBound) return;
            img.dataset.tdtPortraitLbBound = '1';
            img.addEventListener('click', function(ev) {
                ev.preventDefault();
                ev.stopPropagation();
                var s = img.currentSrc || img.getAttribute('src') || '';
                if (s) openLb(s, variant, img);
            });
        }

        peoplesSection.querySelectorAll('img.peoples-tree-portrait').forEach(function(img) {
            bindPortraitLightboxTrigger(img);
        });
        peoplesSection.querySelectorAll('img.peoples-lead__height-chart').forEach(function(img) {
            bindPortraitLightboxTrigger(img, 'panorama');
        });
    }

    function initPeuples() {
        const peoplesSection = document.getElementById('peoples');
        if (!peoplesSection) return;

        // Flip cards: toggle .flipped on the card when See details / Back is clicked
        peoplesSection.querySelectorAll('.peoples-flip-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const card = btn.closest('.peoples-flip-card');
                if (card) card.classList.toggle('flipped');
            });
        });

        // Tree: toggle expand/collapse on Origin nodes (nodes with data-origin)
        peoplesSection.querySelectorAll('.peoples-tree-node[data-origin]').forEach(function(node) {
            const toggle = node.querySelector('.peoples-tree-toggle');
            const children = node.querySelector('.peoples-tree-children');
            if (!children) return;
            function expand() {
                node.setAttribute('aria-expanded', 'true');
                children.style.display = '';
            }
            function collapse() {
                node.setAttribute('aria-expanded', 'false');
                children.style.display = 'none';
            }
            if (node.getAttribute('aria-expanded') === 'true') expand();
            else collapse();
            (toggle || node).addEventListener('click', function(e) {
                e.preventDefault();
                if (node.getAttribute('aria-expanded') === 'true') collapse();
                else expand();
            });
        });

        // Tree: toggle expand/collapse on People nodes (fold/unfold the list of races)
        peoplesSection.querySelectorAll('.peoples-tree-node[data-peuple]').forEach(function(node) {
            const toggle = node.querySelector('.peoples-tree-toggle');
            const racesEl = node.querySelector('.peoples-tree-races');
            if (!racesEl) return;
            function expand() {
                node.setAttribute('aria-expanded', 'true');
                racesEl.classList.remove('peoples-tree-races--collapsed');
            }
            function collapse() {
                node.setAttribute('aria-expanded', 'false');
                racesEl.classList.add('peoples-tree-races--collapsed');
            }
            if (node.getAttribute('aria-expanded') === 'true') expand();
            else collapse();
            (toggle || node).addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (node.getAttribute('aria-expanded') === 'true') collapse();
                else expand();
            });
        });

    }

    // ========================================
    // Popovers: hover-triggered rich content (Peoples, Tetrarchs, etc.)
    // ========================================
    const POPOVER_DELAY_MS = 300;

    function initPopovers() {
        let popoverEl = document.getElementById('tdt-popover');
        if (!popoverEl) {
            popoverEl = document.createElement('div');
            popoverEl.id = 'tdt-popover';
            popoverEl.className = 'tdt-popover';
            popoverEl.setAttribute('role', 'tooltip');
            popoverEl.setAttribute('aria-hidden', 'true');
            const inner = document.createElement('div');
            inner.className = 'tdt-popover-inner';
            popoverEl.appendChild(inner);
            document.body.appendChild(popoverEl);
        }

        const inner = popoverEl.querySelector('.tdt-popover-inner');
        let showTimer = null;
        let hideTimer = null;
        let currentTrigger = null;

        function showPopover(trigger, contentFn, immediate) {
            function doShow() {
                const content = contentFn();
                if (!content) return;
                inner.innerHTML = '';
                inner.appendChild(content);
                popoverEl.classList.add('is-visible');
                popoverEl.setAttribute('aria-hidden', 'false');
                positionPopover(popoverEl, trigger);
                currentTrigger = trigger;
            }
            clearTimeout(hideTimer);
            hideTimer = null;
            if (immediate) {
                clearTimeout(showTimer);
                showTimer = null;
                doShow();
                return;
            }
            if (showTimer) return;
            showTimer = setTimeout(doShow, POPOVER_DELAY_MS);
        }

        function hidePopover() {
            clearTimeout(showTimer);
            showTimer = null;
            hideTimer = setTimeout(function() {
                popoverEl.classList.remove('is-visible');
                popoverEl.setAttribute('aria-hidden', 'true');
                currentTrigger = null;
            }, 50);
        }

        function cancelHide() {
            clearTimeout(hideTimer);
            hideTimer = null;
        }

        function positionPopover(pop, trigger) {
            const rect = trigger.getBoundingClientRect();
            const popRect = pop.getBoundingClientRect();
            const pad = 8;
            let left = rect.left + (rect.width / 2) - (popRect.width / 2);
            let top = rect.bottom + pad;
            if (left < pad) left = pad;
            if (left + popRect.width > window.innerWidth - pad) left = window.innerWidth - popRect.width - pad;
            if (top + popRect.height > window.innerHeight - pad) top = rect.top - popRect.height - pad;
            if (top < pad) top = pad;
            pop.style.left = left + 'px';
            pop.style.top = top + 'px';
        }

        // Peoples: inline accordions in the tree (no popover)
        const peoplesSection = document.getElementById('peoples');
        if (peoplesSection) {
            var PEOPLES_ORIGIN_DESCRIPTIONS = {
                yommes: {
                    en: 'The Yômmes (Aristese, Greyscribes, Navillis, Meridians) were born from wandering Hryôhpéens when the four Pauk Peytsk nurselings guided them beyond their thrones and across the world (whence the Yômmes draw their name of ever-travellers). One branch, the Erréors, went south into hot flooded mangroves and became Meridians and Navillis; later, after cooling and contact with indigenous Bêstres, the Escandirs climbed the windy north-west mountains and became Aristese and Greyscribes. Those who joined neither exodus are remembered as the vanished Aïars. Culturally they are anarchic nomads of a sort, none of their tribes purely hunter-gatherer: they farm, garden and herd on giant mobile halls or mastodon backs, forming tribes, chiefdoms or states defended with hurled and spring-driven arms. Chamanic myth explains their rites and favours, often toward ancestors, around a shared regret that drives collective sacrifice. They often see Ylves as mad or charlatans (abstract law of religion, cannibalism) and Bêstres as bastard filth bewitched by nature to purge; they rue how other origins abuse their small stature.',
                    fr: 'Les Yômmes (Aristois, Griscribes, Navillis, Méridiens) naquirent des Hryôhpéens errants lorsqu\'ils furent guidés par les 4 Pauk Peytsk à voyager au-delà de leurs trônes et de par le monde (d\'où les Yômmes tirent leur nom vieillissant). Une partie migra vers le Sud : les Erréors, dans des mangroves denses, inondées et chaudes, d\'où Méridiens et Navillis ; bien plus tard, refroidissement du climat et Bêstres indigènes, une seconde partition monta au nord-ouest : les Escandirs, Aristois et Griscribes. Ceux qui ne partirent ni avec les Erréors ni avec les Escandirs passent pour ancêtres communs appelés Aïars, aujourd\'hui disparus. Socialement ce sont des nomades anarchistes à leur manière, jamais exclusivement chasseurs-cueilleurs : agriculture, horticulture, pastoralisme sur mastodontes ou bâtiments gigantesques mobiles, en tribus, chefferies ou États aux armes jetées ou bandées, défendus par rites plutôt chamaniques et un regret partagé qui s\'exprime en sacrifices collectifs. Ils perçoivent volontiers les Ylfes comme fous ou charlatans (religion, cannibalisme) et les Bêstres comme immondices bâtardes à purger ; ils regrettent l\'abus de leur petite taille par les autres origines.'
                },
                yorres: {
                    en: 'The Ylves (Tall Ylves, Pale Ylves, Lake Ylves, and Iqqars), though among themselves they call each other Yôrres, settled and first founded their world through their ancestors - the enthroned Hryôhpéens who sat, hoarded and judged at the greedy, mist-fattened tribunal of Withlaï. They often claim their kin\'s bodies through cannibalism to become one with them (probably inheriting this from their passage in the cold cave of Haolûd the frozen, starving), saving and passing on their possessions to whoever uses them best down the ages. It is said they were once a very isolated, small people in lofty valleys otherwise drowned but rich and flowering, among the many mountains of Dümavel that gave them paradisiac longevity, until the world of the Yôrres as they knew it fell from the sky: cooling of their lands and cultures, mountains first smashing their peoples and civilisation, then glacier floods - leading to cannibalism of their own still so present among Yôrres. The Ylves say they descend from the Aryôphéens, "beings of light" descended from the Dûwasaï Harlbhus, the Great Seasonal Fées. Over many years after that catastrophe, most Hylsyôrres (ancestors to all of them) left the mountains southward on lakes, rivers and streams before finding lands hospitable to their rather sedentary life. A Yôrre population stayed (turning from Withlaï\'s set ways), while three colonies settled in other places; most then became Hydryôrres (said to have come out of Haolûd\'s cave), which ties today\'s Lake and Pale Ylves; Tall Ylves (claiming direct descent from Hylsyôrres) settled last. Those who survived in the mountains (or were "cursed", or had lain on the bed of flowers of Wlastaï who floods and quickens) but stayed, climbing higher still, were called Izkyôrres and begot the Iqqar people, so unlike other Yôrres. Ylves eat Yômmes when they no longer understand them through wanting to bend nature by ritual; they see Bêstres as animals grasping nothing of religion\'s use, as resources harvested by, on and through every Bêstre. Fundamentally every people among the Ylves is organised as authoritarian, sedentary bands purifying themselves through often-cannibal consanguinity to found their societies - only Iqqars break or oppose those rules - and you find their tiered city-temples on coasts and in deep lacustrine forests (Iqqars overtop them, sometimes shot at sight). In their myths peopled with spirits yet without priests, gods or ancestors (which shore up conduct and justify traditional orders to keep harmony and hierarchy - except among Iqqars, who stand at opposite dichotomies), they withdraw into the pure solitude of temple-houses, eating whoever could cost them the voice they hear and that guides them (memories, reason, friendships, etc.), or those whose power makes the voices commanding them speak, down to wars fought with guard weapons, balanced, flexible and of antipole.',
                    fr: 'Les Ylfes (Hauts Ylfes, Ylfes pâles, Ylfes des lacs et Iqqars), bien que s\'appelant entre eux les Yôrres, s\'établirent et fondèrent leur monde en premier à travers leurs ancêtres - les Hryôhpéens trônants qui siégeaient, accumulaient et jugeaient au tribunal avare de Withlaï l\'engraissée brumeuse. Ils réclament bien souvent le corps des leurs en les cannibalisant afin de ne faire qu\'un avec eux-mêmes (probablement héritant de leur passage dans la froide cave d\'Haolûd l\'affamé congelé), sauvegardant et transmettant leurs possessions à ceux les utilisant le mieux au fil des âges. Il est dit que les Ylfes furent autrefois issus d\'une population très isolée et de petite taille, vivant au sein de vallées surélevées autrement englouties par l\'eau, mais riches et florissantes, au sein des nombreuses montagnes de Dümavel qui leur donnèrent leur longévité paradisiaque ; puis le monde des Yôrres tel qu\'ils le connurent s\'écroula du ciel et ils s\'éparpillèrent, seuls : refroidissement de leurs terres et cultures, montagnes autrefois les protégeant les auraient engloutis, d\'abord sous les roches se fracassant sur leurs peuples et civilisation, ensuite en libérant les flots des glaciers les inondant, les menant jusqu\'au cannibalisme des leurs encore si présent au sein des Yôrres. Les Ylfes disent qu\'ils descendent des Aryôphéens, ces « êtres de lumières » descendants directement des Dûwasaï Harlbhus, les Grandes Fées saisonnières. Au fil de nombreuses années et suite à leur catastrophe, la majorité des Hylsyôrres (leurs ancêtres à tous) partit des montagnes en naviguant vers le Sud sur les lacs, fleuves et rivières avant de trouver terres hospitalières à leur mode de vie plutôt sédentaire. Une population « Yôrre » resta (se détournant des voies établies du tribunal de Withlaï), tandis que tout au long de leur voyage trois colonies s\'installèrent en différents lieux ; la majorité des Yôrres partit des montagnes vers le Sud sur les lacs, fleuves et rivières, formant les Hydryôrres (qui seraient sortis de la cave d\'Haolûd), avant de lier aujourd\'hui Ylfes des lacs et Ylfes pâles à ce mode de vie originellement sédentaire ; les Hauts Ylfes (se disant descendants directs des Hylsyôrres) furent les derniers à s\'installer. Alors que la majorité des clans Yôrres partit, ceux qui survécurent (ou furent « maudits » selon les autres Ylfes, ou s\'étant reposés sur le lit de fleurs de Wlastaï l\'inondé fécondant) mais restèrent dans les environs - escaladant encore plus les montagnes - auraient été appelés les Izkyôrres, donnant naissance au peuple Iqqar, si différent des Yôrres. Les Ylfes mangent les Yômmes lorsqu\'ils ne les comprennent plus à force de vouloir faire plier la nature par leurs rituels ; autrement, ils voient les Bêstres tels des animaux ne comprenant rien à l\'utilité de la religion, et les prennent comme des ressources recherchées et foisonnantes qu\'ils utilisent en récoltant par, sur et en tout Bêstre. Tout peuple Ylfes est fondamentalement organisé sous la forme de bandes autoritaires et sédentaires se purifiant par la consanguinité souvent cannibale afin d\'établir leurs sociétés, où seuls les Iqqars dérogent (voire s\'opposent) à toutes ces règles ; on trouvera leurs cité-temples à étages sur les côtes et dans les forêts plus ou moins profondes et lacustres, hormis les Iqqars qui les surplombent (et en étant parfois tirés à vu). Dans leurs mythes peuplés d\'esprits mais sans prêtres, dieux ni ancêtres (qui renforcent leurs comportements et justifient leurs ordres traditionnels afin de maintenir l\'harmonie et la hiérarchie - hormis ceux des Iqqars aux opposés dichotomiques), ils se retirent dans la solitude pure de leurs temples-maisons, mangeant ceux pouvant causer la perte de la voix qu\'ils entendent et qui les guide (leurs mémoires, leur raison, leurs amitiés, etc.), ou ceux dont les forces font parler les voix les commandant jusque dans leurs guerres combattues d\'armes de garde, équilibrées, flexibles et d\'antipôle.'
                },
                bestres: {
                    en: 'The Bêstres are an archaic origin of extreme traits shaped in harsh homes and struggles - so extreme that their inspired peoples almost count as origins themselves. Only the inspired peoples here: Slaadeans and Tchalkchaïs. They treat Yômmes as tool-beings who twist nature through sacrifice (and stir new troubles doing so) and watch Ylves as beings cut off from natural force, wholly other. Inspired Bêstres insist Yômmes and Yôrres were clay too, minds stamped into the skull by Asmund\'s scolding fingers, lately at that - a boast other origins mock. Wild and primitive creation tales aside, they know how to survive alone and to keep order, usually by force.',
                    fr: 'Les Bêstres sont une origine archaïque aux traits poussés par l\'intensité de leurs habitats et luttes - au point que leurs peuples inspirés faillent compter comme origines à part. Ici : Slaadéens et Tchalkchaïs. Ils utilisent les Yômmes comme êtres-outils qui manipulent la nature par le sacrifice, tout en créant d\'autres problèmes ; ils voient les Ylfes comme aliénés des forces naturelles, autres. Les Bêstres inspirés prétendent que Yômmes et Yôrres furent aussi de glaise et la pensée écrasée dans le crâne par les doigts réprobateurs d\'Asmund, et récemment encore - prétention jugée ridicule. Au-delà des mythes du sauvage et du primitif, ils savent survivre seuls et imposer l\'ordre, le plus souvent par la force.'
                }
            };

            function buildPeopleAccordionContent(section, peupleId) {
                var card = section.querySelector('.peoples-flip-card[data-peuple="' + peupleId + '"]');
                if (!card) return null;
                var backInner = card.querySelector('.peoples-flip-back-inner');
                if (!backInner) return null;
                var frag = document.createDocumentFragment();
                var backClone = backInner.cloneNode(true);
                backClone.querySelectorAll('.peoples-flip-btn').forEach(function(btn) { btn.remove(); });
                var first = backClone.firstElementChild;
                if (first && first.tagName === 'H5') first.remove();
                backClone.querySelectorAll('.peoples-back-section').forEach(function(sectionEl, i) {
                    if (i < 2 || i === 3) {
                        var h6 = sectionEl.querySelector('h6');
                        if (h6) h6.remove();
                    }
                    if (i === 3) sectionEl.classList.add('peoples-relations-section');
                });
                var attrTable = backClone.querySelector('table.peoples-attr-table');
                if (attrTable) {
                    var rows = attrTable.querySelectorAll('tbody tr');
                    var attrs = [], mods = [];
                    rows.forEach(function(tr) {
                        var tds = tr.querySelectorAll('td');
                        if (tds.length >= 2) {
                            attrs.push(tds[0].textContent.trim());
                            mods.push(tds[1].textContent.trim());
                        }
                    });
                    if (attrs.length && attrs.length === mods.length) {
                        var thead = attrTable.querySelector('thead');
                        var tbody = attrTable.querySelector('tbody');
                        thead.innerHTML = '';
                        var trHead = document.createElement('tr');
                        attrs.forEach(function(a) {
                            var th = document.createElement('th');
                            th.textContent = a;
                            trHead.appendChild(th);
                        });
                        thead.appendChild(trHead);
                        tbody.innerHTML = '';
                        var trBody = document.createElement('tr');
                        mods.forEach(function(m) {
                            var td = document.createElement('td');
                            td.textContent = m;
                            trBody.appendChild(td);
                        });
                        tbody.appendChild(trBody);
                    }
                }
                frag.appendChild(backClone);
                return frag;
            }

            function applyLanguageToPanel(panel, lang) {
                if (!panel || !lang) return;
                panel.querySelectorAll('[data-en][data-fr]').forEach(function(el) {
                    var text = el.getAttribute('data-' + lang);
                    if (text) {
                        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = text;
                        else if (el.tagName === 'OPTION') el.textContent = text;
                        else el.innerHTML = text;
                    }
                });
            }

            var treeWrap = peoplesSection.querySelector('.peoples-tree-wrap');
            if (treeWrap) {
                // Inject people accordion panels (right below name/morality, before races)
                peoplesSection.querySelectorAll('.peoples-tree-node[data-peuple]').forEach(function(node) {
                    var panel = document.createElement('div');
                    panel.className = 'peoples-tree-people-content';
                    panel.setAttribute('aria-expanded', 'false');
                    panel.setAttribute('hidden', '');
                    var racesEl = node.querySelector('.peoples-tree-races');
                    if (racesEl && racesEl.parentNode) {
                        racesEl.parentNode.insertBefore(panel, racesEl);
                    } else {
                        node.appendChild(panel);
                    }
                });
                // Wrap each race in a row and add race accordion panel (no per-race portrait; people use one column image)
                peoplesSection.querySelectorAll('.peoples-tree-races').forEach(function(racesDiv) {
                    var spans = Array.from(racesDiv.querySelectorAll('.peoples-tree-race'));
                    spans.forEach(function(span) {
                        var row = document.createElement('div');
                        row.className = 'peoples-tree-race-row';
                        span.parentNode.insertBefore(row, span);
                        row.appendChild(span);
                        var content = document.createElement('div');
                        content.className = 'peoples-tree-race-content';
                        content.setAttribute('aria-expanded', 'false');
                        content.setAttribute('hidden', '');
                        row.appendChild(content);
                    });
                });
                // Inject origin description panels (after origin name, before children)
                peoplesSection.querySelectorAll('.peoples-tree-node[data-origin]').forEach(function(node) {
                    var originId = node.getAttribute('data-origin');
                    if (!originId || !PEOPLES_ORIGIN_DESCRIPTIONS[originId]) return;
                    var panel = document.createElement('div');
                    panel.className = 'peoples-tree-origin-content';
                    panel.setAttribute('aria-expanded', 'false');
                    panel.setAttribute('hidden', '');
                    var childrenEl = node.querySelector('.peoples-tree-children');
                    if (childrenEl) {
                        node.insertBefore(panel, childrenEl);
                    } else {
                        node.appendChild(panel);
                    }
                });

                treeWrap.addEventListener('click', function(ev) {
                    var target = ev.target;
                    if (target.closest && target.closest('.peoples-tree-origin-name')) {
                        var originNameEl = target.closest('.peoples-tree-origin-name');
                        var originNode = originNameEl.closest('.peoples-tree-node[data-origin]');
                        if (!originNode) return;
                        ev.preventDefault();
                        ev.stopPropagation();
                        var panel = originNode.querySelector('.peoples-tree-origin-content');
                        if (!panel) return;
                        var isExpanded = !panel.hasAttribute('hidden');
                        if (isExpanded) {
                            panel.setAttribute('hidden', '');
                            panel.setAttribute('aria-expanded', 'false');
                        } else {
                            panel.removeAttribute('hidden');
                            panel.setAttribute('aria-expanded', 'true');
                            var originId = originNode.getAttribute('data-origin');
                            var lang = document.documentElement.lang || 'en';
                            var text = (PEOPLES_ORIGIN_DESCRIPTIONS[originId] && PEOPLES_ORIGIN_DESCRIPTIONS[originId][lang]) || '';
                            var body = panel.querySelector('.peoples-tree-origin-body');
                            if (!body) {
                                body = document.createElement('div');
                                body.className = 'peoples-tree-origin-body';
                                panel.appendChild(body);
                            }
                            body.textContent = text;
                            expandPeoplesTreeOriginSubtree(originNode);
                        }
                        return;
                    }
                    if (target.closest && target.closest('.peoples-tree-name')) {
                        var nameEl = target.closest('.peoples-tree-name');
                        var node = nameEl.closest('.peoples-tree-node[data-peuple]');
                        if (!node) return;
                        ev.preventDefault();
                        var panel = node.querySelector('.peoples-tree-people-content');
                        if (!panel) return;
                        var isExpanded = panel.hasAttribute('hidden') === false;
                        if (isExpanded) {
                            panel.setAttribute('hidden', '');
                            panel.setAttribute('aria-expanded', 'false');
                        } else {
                            panel.removeAttribute('hidden');
                            panel.setAttribute('aria-expanded', 'true');
                            expandPeoplesTreePeupleRaces(node);
                            if (!panel.children.length) {
                                var peupleId = node.getAttribute('data-peuple');
                                var content = buildPeopleAccordionContent(peoplesSection, peupleId);
                                if (content) {
                                    panel.appendChild(content);
                                    applyLanguageToPanel(panel, document.documentElement.lang || 'en');
                                }
                            }
                        }
                        return;
                    }
                    if (target.closest && target.closest('.peoples-tree-race')) {
                        var raceSpan = target.closest('.peoples-tree-race');
                        var row = raceSpan.closest('.peoples-tree-race-row');
                        if (!row) return;
                        ev.preventDefault();
                        var content = row.querySelector('.peoples-tree-race-content');
                        if (!content) return;
                        var isExpanded = content.hasAttribute('hidden') === false;
                        if (isExpanded) {
                            content.setAttribute('hidden', '');
                            content.setAttribute('aria-expanded', 'false');
                        } else {
                            content.removeAttribute('hidden');
                            content.setAttribute('aria-expanded', 'true');
                            if (!content.querySelector('.peoples-tree-race-body')) {
                                fillPeoplesTreeRacePanel(
                                    peoplesSection,
                                    content,
                                    raceSpan,
                                    document.documentElement.lang || 'en'
                                );
                            }
                        }
                    }
                });
            }

            initPeoplesPortraitLightbox(peoplesSection);
            initPeoplesInvectiveRotator(peoplesSection);

            if (treeWrap) {
                fetchPeoplesLocaleJson('en');
                fetchPeoplesLocaleJson('fr');
            }

            // Refresh inline accordion content on language change
            try {
                window.addEventListener('tdt-lang-changed', function(ev) {
                    if (!peoplesSection) return;
                    var lang = (ev && ev.detail) || document.documentElement.lang || 'en';
                    fetchPeoplesLocaleJson(lang).then(function() {
                        peoplesSection.querySelectorAll('.peoples-tree-origin-content:not([hidden])').forEach(function(panel) {
                            var originNode = panel.closest('.peoples-tree-node[data-origin]');
                            if (!originNode) return;
                            var originId = originNode.getAttribute('data-origin');
                            var text = (PEOPLES_ORIGIN_DESCRIPTIONS[originId] && PEOPLES_ORIGIN_DESCRIPTIONS[originId][lang]) || '';
                            var body = panel.querySelector('.peoples-tree-origin-body');
                            if (body) body.textContent = text;
                        });
                        peoplesSection.querySelectorAll('.peoples-tree-people-content:not([hidden])').forEach(function(panel) {
                            var node = panel.closest('.peoples-tree-node[data-peuple]');
                            if (!node) return;
                            var peupleId = node.getAttribute('data-peuple');
                            panel.innerHTML = '';
                            var content = buildPeopleAccordionContent(peoplesSection, peupleId);
                            if (content) {
                                panel.appendChild(content);
                                applyLanguageToPanel(panel, lang);
                            }
                        });
                        peoplesSection.querySelectorAll('.peoples-tree-race-content:not([hidden])').forEach(function(panel) {
                            var row = panel.closest('.peoples-tree-race-row');
                            if (!row) return;
                            var raceSpan = row.querySelector('.peoples-tree-race');
                            if (!raceSpan) return;
                            panel.innerHTML = '';
                            fillPeoplesTreeRacePanel(peoplesSection, panel, raceSpan, lang);
                        });
                    });
                });
            } catch (e) {}
        }

        // Only keep popover for tetrarch (hover)
        popoverEl.addEventListener('mouseenter', function() {
            if (currentTrigger && currentTrigger.getAttribute && currentTrigger.getAttribute('data-tetrarch')) cancelHide();
        });
        popoverEl.addEventListener('mouseleave', function() {
            if (currentTrigger && currentTrigger.getAttribute && currentTrigger.getAttribute('data-tetrarch')) hidePopover();
        });

        // Cosmology: tetrarch table rows
        const cosmologySection = document.getElementById('cosmology');
        if (cosmologySection) {
            const tetrarchRows = cosmologySection.querySelectorAll('.tetrarchs-table tbody tr[data-tetrarch]');
            tetrarchRows.forEach(function(tr) {
                const tetrarchId = tr.getAttribute('data-tetrarch');
                if (!tetrarchId) return;
                tr.addEventListener('mouseenter', function() {
                    showPopover(tr, function() {
                        const card = cosmologySection.querySelector('.tetrarchs-grid .genre-card[data-tetrarch="' + tetrarchId + '"]');
                        if (!card) return null;
                        const frag = document.createDocumentFragment();
                        Array.from(card.children).forEach(function(child) {
                            frag.appendChild(child.cloneNode(true));
                        });
                        return frag;
                    });
                });
                tr.addEventListener('mouseleave', hidePopover);
            });
        }

        // Refresh tetrarch popover content on language change (inline peoples/race accordions refresh in their own handler above)
        try {
            window.addEventListener('tdt-lang-changed', function() {
                if (currentTrigger && popoverEl.classList.contains('is-visible')) {
                    const tetrarchId = currentTrigger.getAttribute('data-tetrarch');
                    if (tetrarchId && cosmologySection) {
                        const card = cosmologySection.querySelector('.tetrarchs-grid .genre-card[data-tetrarch="' + tetrarchId + '"]');
                        if (card) {
                            inner.innerHTML = '';
                            Array.from(card.children).forEach(function(child) {
                                inner.appendChild(child.cloneNode(true));
                            });
                        }
                    }
                }
            });
        } catch (e) {}
    }

    // ========================================
    // Shared: Accordion initializer
    // ========================================
    function initAccordion(section, options) {
        if (!section) return;
        var itemSel = options.itemSelector;
        var headSel = options.headSelector;
        var bodySel = options.bodySelector;
        var expandAllSel = options.expandAllSelector;
        var collapseAllSel = options.collapseAllSelector;

        section.querySelectorAll(itemSel).forEach(function(item) {
            var head = item.querySelector(headSel);
            var body = item.querySelector(bodySel);
            if (!head || !body) return;
            head.addEventListener('click', function() {
                var isOpen = body.classList.contains('is-open');
                body.classList.toggle('is-open', !isOpen);
                head.setAttribute('aria-expanded', !isOpen);
            });
        });

        var expandAll = section.querySelector(expandAllSel);
        var collapseAll = section.querySelector(collapseAllSel);
        if (expandAll) {
            expandAll.addEventListener('click', function() {
                section.querySelectorAll(bodySel).forEach(function(b) { b.classList.add('is-open'); });
                section.querySelectorAll(headSel).forEach(function(h) { h.setAttribute('aria-expanded', 'true'); });
            });
        }
        if (collapseAll) {
            collapseAll.addEventListener('click', function() {
                section.querySelectorAll(bodySel).forEach(function(b) { b.classList.remove('is-open'); });
                section.querySelectorAll(headSel).forEach(function(h) { h.setAttribute('aria-expanded', 'false'); });
            });
        }
    }

    // ========================================
    // Shared: Tab-panel initializer
    // ========================================
    function initTabPanels(container, options) {
        if (!container) return;
        var linkSel = options.linkSelector;
        var panelSel = options.panelSelector;
        var linkAttr = options.linkDataAttr;
        var panelAttr = options.panelDataAttr;

        container.querySelectorAll(linkSel).forEach(function(btn) {
            btn.addEventListener('click', function() {
                var tabId = this.getAttribute(linkAttr);
                if (!tabId) return;
                container.querySelectorAll(linkSel).forEach(function(b) { b.classList.remove('active'); });
                container.querySelectorAll(panelSel).forEach(function(p) {
                    p.classList.toggle('active', p.getAttribute(panelAttr) === tabId);
                });
                this.classList.add('active');
            });
        });
    }

    // ========================================
    // Combat Section: Accordion, Tables Tabs, Weapon Filter
    // ========================================
    function initCombat() {
        var combatSection = document.getElementById('combat');
        if (!combatSection) return;

        initAccordion(combatSection, {
            itemSelector: '.combat-accordion-item',
            headSelector: '.combat-accordion-head',
            bodySelector: '.combat-accordion-body',
            expandAllSelector: '.combat-expand-all',
            collapseAllSelector: '.combat-collapse-all'
        });

        initTabPanels(combatSection, {
            linkSelector: '.combat-tab-link',
            panelSelector: '.combat-tables-panel',
            linkDataAttr: 'data-combat-tab',
            panelDataAttr: 'data-combat-panel'
        });

        // Weapon sub-tabs (inside "Armes par type" panel)
        var panelWrap = combatSection.querySelector('#combat-panel-armes-type');
        if (panelWrap) {
            initTabPanels(panelWrap, {
                linkSelector: '.combat-weapon-tab',
                panelSelector: '.combat-weapon-panel',
                linkDataAttr: 'data-weapon-type',
                panelDataAttr: 'data-weapon-panel'
            });
        }

        // Weapon type dropdown: switch to "Armes par type" tab and show that weapon panel
        var weaponTypeSelect = combatSection.querySelector('#combat-weapon-type');
        if (weaponTypeSelect) {
            weaponTypeSelect.addEventListener('change', function() {
                var value = this.value;
                if (!value) return;
                var tabLink = combatSection.querySelector('.combat-tab-link[data-combat-tab="armes-type"]');
                if (tabLink) tabLink.click();
                var wrap = combatSection.querySelector('#combat-panel-armes-type');
                if (!wrap) return;
                wrap.querySelectorAll('.combat-weapon-tab').forEach(function(b) { b.classList.remove('active'); });
                wrap.querySelectorAll('.combat-weapon-panel').forEach(function(p) {
                    p.classList.toggle('active', p.getAttribute('data-weapon-panel') === value);
                });
                var tabBtn = wrap.querySelector('.combat-weapon-tab[data-weapon-type="' + value + '"]');
                if (tabBtn) tabBtn.classList.add('active');
            });
        }

        // Weapon search: filter rows in the visible weapon table
        var weaponSearch = combatSection.querySelector('#combat-weapon-search');
        if (weaponSearch) {
            weaponSearch.addEventListener('input', function() {
                var q = (this.value || '').trim().toLowerCase();
                var activePanel = combatSection.querySelector('.combat-weapon-panel.active');
                if (!activePanel) return;
                var table = activePanel.querySelector('.combat-table--weapons tbody');
                if (!table) return;
                table.querySelectorAll('tr').forEach(function(tr) {
                    var nameCell = tr.querySelector('td:first-child');
                    var text = nameCell ? nameCell.textContent.toLowerCase() : '';
                    tr.classList.toggle('hidden', q && text.indexOf(q) === -1);
                });
            });
        }
    }

    // ========================================
    // Rules: Magic + Progression (declarative; add rows when new accordion+tab blocks match this pattern)
    // ========================================
    var RULES_ACCORDION_TAB_SECTIONS = [
        {
            sectionId: 'magic',
            accordion: {
                itemSelector: '.magic-accordion-item',
                headSelector: '.magic-accordion-head',
                bodySelector: '.magic-accordion-body',
                expandAllSelector: '.magic-expand-all',
                collapseAllSelector: '.magic-collapse-all'
            },
            tabPanels: {
                linkSelector: '.magic-tab-link',
                panelSelector: '.magic-tables-panel',
                linkDataAttr: 'data-magic-tab',
                panelDataAttr: 'data-magic-panel'
            }
        },
        {
            sectionId: 'progression',
            accordion: {
                itemSelector: '.progression-accordion-item',
                headSelector: '.progression-accordion-head',
                bodySelector: '.progression-accordion-body',
                expandAllSelector: '.progression-expand-all',
                collapseAllSelector: '.progression-collapse-all'
            },
            tabPanels: null
        }
    ];

    function initMagicProgressionRulesUi() {
        RULES_ACCORDION_TAB_SECTIONS.forEach(function(block) {
            var section = document.getElementById(block.sectionId);
            if (!section) return;
            initAccordion(section, block.accordion);
            if (block.tabPanels) {
                initTabPanels(section, block.tabPanels);
            }
        });
    }

    // ========================================
    // System Overview (Vue d'ensemble): Accordion
    // ========================================
    function initSystemOverview() {
        var accordionEl = document.getElementById('system-overview-accordion');
        if (!accordionEl) {
            return;
        }

        initAccordion(accordionEl, {
            itemSelector: '.system-overview-accordion-item',
            headSelector: '.system-overview-accordion-head',
            bodySelector: '.system-overview-accordion-body',
            expandAllSelector: '.system-overview-expand-all',
            collapseAllSelector: '.system-overview-collapse-all'
        });

        // Initialize the interactive attributes tree
        initAttributesTree();
    }

    // ========================================
    // Attributes Tree (data: public/data/attributes-tree.json on window.__TDT_ATTRIBUTES_TREE__)
    // ========================================

    function initAttributesTree() {
        var bundle = window.__TDT_ATTRIBUTES_TREE__;
        if (!bundle || !bundle.attributes || !bundle.aptitudePrincipalAttr) {
            console.warn('[DRD] Missing window.__TDT_ATTRIBUTES_TREE__ (attributes-tree.json not injected?)');
            return;
        }
        var APTITUDE_PRINCIPAL_ATTR = bundle.aptitudePrincipalAttr;
        var ATTRIBUTES_TREE_DATA = {
            attributes: bundle.attributes,
            aptitudes: bundle.aptitudes,
            actions: bundle.actions,
            competences: bundle.competences
        };

        var treeEl = document.getElementById('attributes-tree');
        if (!treeEl) {
            return;
        }

        var lang = document.documentElement.lang || 'en';

        // Build the tree HTML
        function buildTree() {
            var html = '';
            var attrOrder = ['FOR', 'AGI', 'DEX', 'VIG', 'EMP', 'PER', 'CRE', 'VOL'];

            attrOrder.forEach(function(attrId) {
                var attr = ATTRIBUTES_TREE_DATA.attributes[attrId];
                if (!attr) return;

                html += '<div class="attributes-tree-node" role="treeitem" aria-expanded="false" data-attribute="' + attrId + '">';
                html += '<span class="attributes-tree-toggle" aria-hidden="true"></span>';
                html += '<span class="attributes-tree-attr-abbrev">' + attr.abbr + '</span>';
                html += '<strong class="attributes-tree-attr-name" data-en="' + attr.name.en + '" data-fr="' + attr.name.fr + '">' + (lang === 'fr' ? attr.name.fr : attr.name.en) + '</strong>';
                html += '<div class="attributes-tree-attr-content" hidden aria-expanded="false"></div>';
                html += '<div class="attributes-tree-children">';

                // Aptitudes for this attribute
                attr.aptitudes.forEach(function(aptId, aptIdx) {
                    var apt = ATTRIBUTES_TREE_DATA.aptitudes[aptId];
                    if (!apt) return;

                    var isPrincipal = aptIdx === 0;
                    var weight = aptIdx === 0 ? '+3' : (aptIdx === 1 ? '+2' : '+1');

                    if (isPrincipal) {
                        // Principal aptitude: full tree with actions/competences/masteries
                        html += '<div class="attributes-tree-node attributes-tree-aptitude-node" role="treeitem" aria-expanded="false" data-aptitude="' + aptId + '">';
                        html += '<span class="attributes-tree-toggle" aria-hidden="true"></span>';
                        html += '<span class="attributes-tree-aptitude-name aptitude-principal" data-en="' + apt.name.en + '" data-fr="' + apt.name.fr + '">' + (lang === 'fr' ? apt.name.fr : apt.name.en) + '</span>';
                        html += '<span class="attributes-tree-weight">' + weight + '</span>';
                        html += '<div class="attributes-tree-aptitude-content" hidden aria-expanded="false"></div>';
                        html += '<div class="attributes-tree-children">';

                        // Actions for this aptitude
                        apt.actions.forEach(function(actId) {
                            var action = ATTRIBUTES_TREE_DATA.actions[actId];
                            if (!action) return;

                            var linkedAttrData = ATTRIBUTES_TREE_DATA.attributes[action.linkedAttr];
                            var linkedAttrAbbr = linkedAttrData ? linkedAttrData.abbr : '';

                            html += '<div class="attributes-tree-node attributes-tree-action-node" role="treeitem" aria-expanded="false" data-action="' + actId + '">';
                            html += '<span class="attributes-tree-toggle" aria-hidden="true"></span>';
                            html += '<span class="attributes-tree-action-name" data-en="' + action.name.en + '" data-fr="' + action.name.fr + '">' + (lang === 'fr' ? action.name.fr : action.name.en) + '</span>';
                            html += '<span class="attributes-tree-linked-attr" title="Linked attribute: ' + linkedAttrAbbr + '">[' + linkedAttrAbbr + ']</span>';
                            html += '<div class="attributes-tree-action-content" hidden aria-expanded="false"></div>';
                            html += '<div class="attributes-tree-children">';

                            // Competences for this action
                            action.competences.forEach(function(compId) {
                                var comp = ATTRIBUTES_TREE_DATA.competences[compId];
                                if (!comp) return;

                                html += '<div class="attributes-tree-node attributes-tree-competence-node" role="treeitem" aria-expanded="false" data-competence="' + compId + '">';
                                html += '<span class="attributes-tree-toggle" aria-hidden="true"></span>';
                                html += '<span class="attributes-tree-competence-name" data-en="' + comp.name.en + '" data-fr="' + comp.name.fr + '">' + (lang === 'fr' ? comp.name.fr : comp.name.en) + '</span>';
                                html += '<div class="attributes-tree-competence-content" hidden aria-expanded="false"></div>';
                                html += '<div class="attributes-tree-children attributes-tree-masteries">';

                                // Masteries for this competence
                                comp.masteries.forEach(function(mastery) {
                                    if (typeof mastery === 'string') {
                                        // Legacy string format
                                        html += '<span class="attributes-tree-mastery">' + mastery + '</span>';
                                    } else {
                                        // New object format with description
                                        var masteryName = mastery.name;
                                        var masteryDesc = mastery.desc ? (lang === 'fr' ? mastery.desc.fr : mastery.desc.en) : '';
                                        if (masteryDesc) {
                                            html += '<span class="attributes-tree-mastery has-tooltip" data-tooltip-en="' + (mastery.desc.en || '').replace(/"/g, '&quot;') + '" data-tooltip-fr="' + (mastery.desc.fr || '').replace(/"/g, '&quot;') + '" title="' + masteryDesc.replace(/"/g, '&quot;') + '">' + masteryName + '</span>';
                                        } else {
                                            html += '<span class="attributes-tree-mastery">' + masteryName + '</span>';
                                        }
                                    }
                                });

                                html += '</div>'; // masteries
                                html += '</div>'; // competence node
                            });

                            html += '</div>'; // action children
                            html += '</div>'; // action node
                        });

                        html += '</div>'; // aptitude children
                        html += '</div>'; // aptitude node
                    } else {
                        // Secondary aptitude: no children, just a reference link to principal attribute
                        var principalAttrId = APTITUDE_PRINCIPAL_ATTR[aptId];
                        var principalAttr = ATTRIBUTES_TREE_DATA.attributes[principalAttrId];
                        var principalAttrName = principalAttr ? (lang === 'fr' ? principalAttr.name.fr : principalAttr.name.en) : '';
                        var seeText = lang === 'fr' ? 'voir ' : 'see ';

                        html += '<div class="attributes-tree-node attributes-tree-aptitude-node attributes-tree-aptitude-secondary" data-aptitude="' + aptId + '" data-see-attribute="' + principalAttrId + '">';
                        html += '<span class="attributes-tree-toggle attributes-tree-toggle-link" aria-hidden="true" title="' + seeText + principalAttrName + '"></span>';
                        html += '<span class="attributes-tree-aptitude-name attributes-tree-aptitude-name-secondary" data-en="' + apt.name.en + '" data-fr="' + apt.name.fr + '">' + (lang === 'fr' ? apt.name.fr : apt.name.en) + '</span>';
                        html += '<span class="attributes-tree-weight">' + weight + '</span>';
                        html += '<span class="attributes-tree-see-link" data-see-attribute="' + principalAttrId + '">(<span data-en="see ' + principalAttr.name.en + '" data-fr="voir ' + principalAttr.name.fr + '">' + seeText + principalAttrName + '</span>)</span>';
                        html += '</div>'; // secondary aptitude node (no children)
                    }
                });

                html += '</div>'; // attribute children
                html += '</div>'; // attribute node
            });

            return html;
        }

        var treeHtml = buildTree();
        treeEl.innerHTML = treeHtml;

        // Toggle expand/collapse handlers
        function setupToggles() {
            treeEl.querySelectorAll('.attributes-tree-node').forEach(function(node) {
                // Skip secondary aptitudes - they have no children to expand
                if (node.classList.contains('attributes-tree-aptitude-secondary')) return;
                
                var toggle = node.querySelector(':scope > .attributes-tree-toggle');
                var children = node.querySelector(':scope > .attributes-tree-children');
                if (!toggle || !children) return;

                function expand() {
                    node.setAttribute('aria-expanded', 'true');
                    children.style.display = '';
                }
                function collapse() {
                    node.setAttribute('aria-expanded', 'false');
                    children.style.display = 'none';
                }

                // Start collapsed
                collapse();

                toggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (node.getAttribute('aria-expanded') === 'true') collapse();
                    else expand();
                });
            });
        }

        // Navigate to a principal attribute and expand it
        function navigateToPrincipalAttribute(attrId) {
            var targetNode = treeEl.querySelector('.attributes-tree-node[data-attribute="' + attrId + '"]');
            if (!targetNode) return;
            
            // Expand the target attribute node
            var toggle = targetNode.querySelector(':scope > .attributes-tree-toggle');
            var children = targetNode.querySelector(':scope > .attributes-tree-children');
            if (children) {
                targetNode.setAttribute('aria-expanded', 'true');
                children.style.display = '';
            }
            
            // Scroll to the target node
            targetNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Add a brief highlight effect
            targetNode.classList.add('attributes-tree-highlight');
            setTimeout(function() {
                targetNode.classList.remove('attributes-tree-highlight');
            }, 1500);
        }

        // Setup click handlers for secondary aptitude toggles and "see" links
        function setupSecondaryAptitudeLinks() {
            // Handle clicks on secondary aptitude toggles
            treeEl.querySelectorAll('.attributes-tree-aptitude-secondary .attributes-tree-toggle-link').forEach(function(toggle) {
                toggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var node = toggle.closest('.attributes-tree-aptitude-secondary');
                    var targetAttrId = node ? node.getAttribute('data-see-attribute') : null;
                    if (targetAttrId) {
                        navigateToPrincipalAttribute(targetAttrId);
                    }
                });
            });
            
            // Handle clicks on "see X" links
            treeEl.querySelectorAll('.attributes-tree-see-link').forEach(function(link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var targetAttrId = link.getAttribute('data-see-attribute');
                    if (targetAttrId) {
                        navigateToPrincipalAttribute(targetAttrId);
                    }
                });
            });
        }

        setupToggles();
        setupSecondaryAptitudeLinks();

        // Click handlers for showing descriptions (event delegation)
        treeEl.addEventListener('click', function(ev) {
            var target = ev.target;
            var lang = document.documentElement.lang || 'en';

            // Attribute name click - toggle both description AND children
            if (target.closest && target.closest('.attributes-tree-attr-name')) {
                var nameEl = target.closest('.attributes-tree-attr-name');
                var node = nameEl.closest('.attributes-tree-node[data-attribute]');
                if (!node) return;
                ev.preventDefault();
                ev.stopPropagation();
                var attrId = node.getAttribute('data-attribute');
                var attr = ATTRIBUTES_TREE_DATA.attributes[attrId];
                if (!attr) return;
                var panel = node.querySelector(':scope > .attributes-tree-attr-content');
                if (panel) {
                    toggleDescPanel(panel, attr.desc[lang] || attr.desc.en);
                }
                // Also toggle children
                toggleNodeChildren(node);
                return;
            }

            // Aptitude name click - toggle both description AND children (for principal aptitudes)
            if (target.closest && target.closest('.attributes-tree-aptitude-name')) {
                var nameEl = target.closest('.attributes-tree-aptitude-name');
                var node = nameEl.closest('.attributes-tree-node[data-aptitude]');
                if (!node) return;
                
                // For secondary aptitudes, navigate instead of showing description
                if (node.classList.contains('attributes-tree-aptitude-secondary')) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    var targetAttrId = node.getAttribute('data-see-attribute');
                    if (targetAttrId) {
                        navigateToPrincipalAttribute(targetAttrId);
                    }
                    return;
                }
                
                ev.preventDefault();
                ev.stopPropagation();
                var aptId = node.getAttribute('data-aptitude');
                var apt = ATTRIBUTES_TREE_DATA.aptitudes[aptId];
                if (!apt) return;
                var panel = node.querySelector(':scope > .attributes-tree-aptitude-content');
                if (panel) {
                    toggleDescPanel(panel, apt.desc[lang] || apt.desc.en);
                }
                // Also toggle children
                toggleNodeChildren(node);
                return;
            }

            // Action name click - toggle both description AND children
            if (target.closest && target.closest('.attributes-tree-action-name')) {
                var nameEl = target.closest('.attributes-tree-action-name');
                var node = nameEl.closest('.attributes-tree-node[data-action]');
                if (!node) return;
                ev.preventDefault();
                ev.stopPropagation();
                var actId = node.getAttribute('data-action');
                var action = ATTRIBUTES_TREE_DATA.actions[actId];
                if (!action) return;
                var panel = node.querySelector(':scope > .attributes-tree-action-content');
                if (panel) {
                    toggleDescPanel(panel, action.desc[lang] || action.desc.en);
                }
                // Also toggle children
                toggleNodeChildren(node);
                return;
            }

            // Competence name click - toggle both description AND children (masteries)
            if (target.closest && target.closest('.attributes-tree-competence-name')) {
                var nameEl = target.closest('.attributes-tree-competence-name');
                var node = nameEl.closest('.attributes-tree-node[data-competence]');
                if (!node) return;
                ev.preventDefault();
                ev.stopPropagation();
                var compId = node.getAttribute('data-competence');
                var comp = ATTRIBUTES_TREE_DATA.competences[compId];
                if (!comp) return;
                var panel = node.querySelector(':scope > .attributes-tree-competence-content');
                if (panel) {
                    toggleDescPanel(panel, comp.desc[lang] || comp.desc.en);
                }
                // Also toggle children (masteries)
                toggleNodeChildren(node);
                return;
            }
        });

        function toggleDescPanel(panel, text) {
            var isExpanded = !panel.hasAttribute('hidden');
            if (isExpanded) {
                panel.setAttribute('hidden', '');
                panel.setAttribute('aria-expanded', 'false');
            } else {
                panel.removeAttribute('hidden');
                panel.setAttribute('aria-expanded', 'true');
                if (!panel.children.length) {
                    var body = document.createElement('div');
                    body.className = 'attributes-tree-desc-body';
                    var p = document.createElement('p');
                    p.textContent = text;
                    body.appendChild(p);
                    panel.appendChild(body);
                } else {
                    var p = panel.querySelector('p');
                    if (p) p.textContent = text;
                }
            }
        }

        // Toggle children visibility for a node
        function toggleNodeChildren(node) {
            var children = node.querySelector(':scope > .attributes-tree-children');
            if (!children) return;
            
            var isExpanded = node.getAttribute('aria-expanded') === 'true';
            if (isExpanded) {
                node.setAttribute('aria-expanded', 'false');
                children.style.display = 'none';
            } else {
                node.setAttribute('aria-expanded', 'true');
                children.style.display = '';
            }
        }

        // Listen for language changes to update the tree
        window.addEventListener('tdt-lang-changed', function(e) {
            var newLang = e.detail || 'en';
            treeEl.querySelectorAll('[data-en][data-fr]').forEach(function(el) {
                var text = el.getAttribute('data-' + newLang);
                if (text) el.textContent = text;
            });
            // Update description panels that are open
            treeEl.querySelectorAll('.attributes-tree-attr-content:not([hidden])').forEach(function(panel) {
                var node = panel.closest('.attributes-tree-node[data-attribute]');
                if (!node) return;
                var attrId = node.getAttribute('data-attribute');
                var attr = ATTRIBUTES_TREE_DATA.attributes[attrId];
                if (!attr) return;
                var p = panel.querySelector('p');
                if (p) p.textContent = attr.desc[newLang] || attr.desc.en;
            });
            treeEl.querySelectorAll('.attributes-tree-aptitude-content:not([hidden])').forEach(function(panel) {
                var node = panel.closest('.attributes-tree-node[data-aptitude]');
                if (!node) return;
                var aptId = node.getAttribute('data-aptitude');
                var apt = ATTRIBUTES_TREE_DATA.aptitudes[aptId];
                if (!apt) return;
                var p = panel.querySelector('p');
                if (p) p.textContent = apt.desc[newLang] || apt.desc.en;
            });
            treeEl.querySelectorAll('.attributes-tree-action-content:not([hidden])').forEach(function(panel) {
                var node = panel.closest('.attributes-tree-node[data-action]');
                if (!node) return;
                var actId = node.getAttribute('data-action');
                var action = ATTRIBUTES_TREE_DATA.actions[actId];
                if (!action) return;
                var p = panel.querySelector('p');
                if (p) p.textContent = action.desc[newLang] || action.desc.en;
            });
            treeEl.querySelectorAll('.attributes-tree-competence-content:not([hidden])').forEach(function(panel) {
                var node = panel.closest('.attributes-tree-node[data-competence]');
                if (!node) return;
                var compId = node.getAttribute('data-competence');
                var comp = ATTRIBUTES_TREE_DATA.competences[compId];
                if (!comp) return;
                var p = panel.querySelector('p');
                if (p) p.textContent = comp.desc[newLang] || comp.desc.en;
            });
            // Update mastery tooltips for language
            treeEl.querySelectorAll('.attributes-tree-mastery.has-tooltip').forEach(function(mastery) {
                var tooltipAttr = 'data-tooltip-' + newLang;
                var fallbackAttr = 'data-tooltip-en';
                var tooltipText = mastery.getAttribute(tooltipAttr) || mastery.getAttribute(fallbackAttr) || '';
                mastery.setAttribute('title', tooltipText);
            });
        });
    }

    // ========================================
    // PDF book download (disclosure dialog)
    // ========================================
    function initPdfDownloadModal() {
        var openBtn = document.getElementById('tdt-open-pdf-modal');
        var dialog = document.getElementById('tdt-pdf-download-dialog');
        var closeBtn = document.getElementById('tdt-pdf-modal-close');
        var downloadBtn = document.getElementById('tdt-pdf-modal-download');
        if (!openBtn || !dialog) return;

        var pdfFileName = 'Des Récits DiscordantsV0.01.pdf';
        var pdfHref = 'assets/' + encodeURIComponent(pdfFileName);

        function triggerPdfDownload() {
            var a = document.createElement('a');
            a.href = pdfHref;
            a.setAttribute('download', pdfFileName);
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

        openBtn.addEventListener('click', function() {
            if (typeof dialog.showModal === 'function') {
                dialog.showModal();
            } else if (window.confirm('This PDF is French-only and a pre-release draft (CC BY-NC-SA 4.0). Download now?')) {
                triggerPdfDownload();
            }
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                if (typeof dialog.close === 'function') dialog.close();
            });
        }

        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                triggerPdfDownload();
                if (typeof dialog.close === 'function') dialog.close();
            });
        }

        dialog.addEventListener('click', function(e) {
            if (e.target === dialog && typeof dialog.close === 'function') {
                dialog.close();
            }
        });
    }

    // ========================================
    // Contact modal (mailto via default mail app)
    // ========================================
    function initContactModal() {
        var openBtn = document.getElementById('tdt-open-contact-modal');
        var dialog = document.getElementById('tdt-contact-dialog');
        var closeBtn = document.getElementById('tdt-contact-modal-close');
        var form = document.getElementById('tdt-contact-form');
        var errEl = document.getElementById('tdt-contact-err-msg');
        if (!openBtn || !dialog || !form) return;

        var mailTo = 'thediscordingtales@gmail.com';

        function contactErrMsg() {
            if (!errEl) return 'Please fill in subject and message.';
            var lang = (typeof state !== 'undefined' && state.currentLang) ? state.currentLang : 'en';
            return errEl.getAttribute('data-' + lang) || errEl.getAttribute('data-en') || 'Please fill in subject and message.';
        }

        openBtn.addEventListener('click', function() {
            if (typeof dialog.showModal === 'function') {
                dialog.showModal();
                try {
                    var sub = document.getElementById('tdt-contact-subject');
                    if (sub) sub.focus();
                } catch (e) {}
            } else {
                window.location.href = 'mailto:' + mailTo;
            }
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                if (typeof dialog.close === 'function') dialog.close();
            });
        }

        dialog.addEventListener('click', function(e) {
            if (e.target === dialog && typeof dialog.close === 'function') {
                dialog.close();
            }
        });

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var nameEl = document.getElementById('tdt-contact-name');
            var subEl = document.getElementById('tdt-contact-subject');
            var bodyEl = document.getElementById('tdt-contact-body');
            var name = nameEl ? nameEl.value.trim() : '';
            var subject = subEl ? subEl.value.trim() : '';
            var body = bodyEl ? bodyEl.value.trim() : '';
            if (!subject || !body) {
                if (errEl) {
                    errEl.removeAttribute('hidden');
                    errEl.textContent = contactErrMsg();
                } else {
                    window.alert(contactErrMsg());
                }
                return;
            }
            if (errEl) errEl.setAttribute('hidden', 'hidden');
            var composed = body;
            if (name) {
                composed = 'From: ' + name + '\n\n' + composed;
            }
            var href = 'mailto:' + mailTo + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(composed);
            window.location.href = href;
            if (typeof dialog.close === 'function') {
                dialog.close();
            }
            form.reset();
        });
    }

    // ========================================
    // Language Toggle System
    // ========================================
    function initLanguage() {
        // Load saved language preference
        const savedLang = localStorage.getItem('tdt-lang') || 'en';
        setLanguage(savedLang);

        elements.langButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const lang = this.getAttribute('data-lang');
                setLanguage(lang);
                localStorage.setItem('tdt-lang', lang);
            });
        });
    }

    // Fallback if build_i18n has not injected #tdt-i18n-strings
    var PAGE_TITLE_EN = 'THE DISCORDING TALES – Under our steps awake those mysteries believed to be warring among the stars…';
    var PAGE_TITLE_FR = 'DES RÉCITS DISCORDANTS – Sous nos pas s\'éveillent ces mystères que l\'on croyait se battre parmi les étoiles…';
    var META_DESCRIPTION_EN = 'For those of us who crave DISCOVERY. A journey through exotic cultures, unexplored lands, weird creatures, and untold ways of thinking and being - yearning to experience the vast potentials, technologies and moralities of worlds unlike ours.';
    var META_DESCRIPTION_FR = 'Pour ceux d\'entre nous qui aspirent à la DÉCOUVERTE. Un voyage à travers des cultures exotiques, des terres inexplorées, des créatures étranges et des façons inédites de penser et d\'être - aspirant à expérimenter les vastes potentiels, technologies et moralités de mondes différents du nôtre.';

    function getPageI18n() {
        var el = document.getElementById('tdt-i18n-strings');
        if (!el || !el.textContent) return null;
        try {
            return JSON.parse(el.textContent);
        } catch (e) {
            return null;
        }
    }

    function setLanguage(lang) {
        state.currentLang = lang;
        document.documentElement.lang = lang;
        try {
            window.dispatchEvent(new CustomEvent('tdt-lang-changed', { detail: lang }));
        } catch (e) {}

        // Page title and meta description: from #tdt-i18n-strings (build_i18n) or fallback
        var pageI18n = getPageI18n();
        var titleEn = (pageI18n && pageI18n.title && pageI18n.title.en) ? pageI18n.title.en : PAGE_TITLE_EN;
        var titleFr = (pageI18n && pageI18n.title && pageI18n.title.fr) ? pageI18n.title.fr : PAGE_TITLE_FR;
        var descEn = (pageI18n && pageI18n.description && pageI18n.description.en) ? pageI18n.description.en : META_DESCRIPTION_EN;
        var descFr = (pageI18n && pageI18n.description && pageI18n.description.fr) ? pageI18n.description.fr : META_DESCRIPTION_FR;
        document.title = lang === 'fr' ? titleFr : titleEn;
        var metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', lang === 'fr' ? descFr : descEn);

        // Update button states
        elements.langButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            }
        });

        // Update all text elements with data-en and data-fr attributes (one language only)
        document.querySelectorAll('[data-en][data-fr]').forEach(element => {
            const text = element.getAttribute(`data-${lang}`);
            if (text) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = text;
                } else if (element.tagName === 'OPTION') {
                    element.textContent = text;
                } else {
                    // Use innerHTML to render HTML tags like <strong>, <em>, etc.
                    element.innerHTML = text;
                }
            }
        });

        // Update aria-label from data-aria-label-en / data-aria-label-fr
        document.querySelectorAll('[data-aria-label-en][data-aria-label-fr]').forEach(element => {
            const label = element.getAttribute(`data-aria-label-${lang}`);
            if (label) element.setAttribute('aria-label', label);
        });

        // Update title from data-title-en / data-title-fr
        document.querySelectorAll('[data-title-en][data-title-fr]').forEach(element => {
            const title = element.getAttribute(`data-title-${lang}`);
            if (title) element.setAttribute('title', title);
        });

        // Update placeholder from data-placeholder-en / data-placeholder-fr (for inputs that use these instead of data-en/data-fr)
        document.querySelectorAll('[data-placeholder-en][data-placeholder-fr]').forEach(element => {
            const placeholder = element.getAttribute(`data-placeholder-${lang}`);
            if (placeholder) element.setAttribute('placeholder', placeholder);
        });

        // Update img alt from data-alt-en / data-alt-fr
        document.querySelectorAll('[data-alt-en][data-alt-fr]').forEach(element => {
            const alt = element.getAttribute(`data-alt-${lang}`);
            if (alt) element.setAttribute('alt', alt);
        });

        // Update tooltips (data-tip) from data-tip-en / data-tip-fr (e.g. combat glossary)
        document.querySelectorAll('[data-tip-en][data-tip-fr]').forEach(element => {
            const tip = element.getAttribute(`data-tip-${lang}`);
            if (tip != null) element.setAttribute('data-tip', tip);
        });

        // Update carousel aria-labels (carousel is built in JS, so update after lang change)
        updateCarouselAriaLabels(lang);
    }

    function updateCarouselAriaLabels(lang) {
        const prevLabel = lang === 'fr' ? 'Image précédente' : 'Previous image';
        const nextLabel = lang === 'fr' ? 'Image suivante' : 'Next image';
        const goToLabel = lang === 'fr' ? 'Aller à la diapositive ' : 'Go to slide ';
        ['carousel-lifestyles', 'carousel-meanings', 'carousel-stories'].forEach(function(id) {
            const el = document.getElementById(id);
            if (!el) return;
            const prevBtn = el.querySelector('.carousel-prev');
            const nextBtn = el.querySelector('.carousel-next');
            if (prevBtn) prevBtn.setAttribute('aria-label', prevLabel);
            if (nextBtn) nextBtn.setAttribute('aria-label', nextLabel);
            if (el) el.querySelectorAll('.carousel-indicators button').forEach((btn, index) => btn.setAttribute('aria-label', goToLabel + (index + 1)));
        });
    }
    // ========================================
    // Image Carousel (per-container: Lifestyles, Meanings, Stories)
    // ========================================
    const carouselStates = {};

    function buildOneCarousel(containerEl, images) {
        if (!containerEl || !images || images.length === 0) return;

        const id = containerEl.id || 'carousel-' + Math.random().toString(36).slice(2);
        carouselStates[id] = { index: 0, interval: null };

        const carouselHTML = `
            <div class="carousel-wrapper">
                <div class="carousel-track">
                    ${images.map((img, index) => `
                        <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                            <img src="${img.src}" alt="${img.alt}" loading="${index === 0 ? 'eager' : 'lazy'}" />
                        </div>
                    `).join('')}
                </div>
                <button class="carousel-prev" aria-label="Previous image">‹</button>
                <button class="carousel-next" aria-label="Next image">›</button>
                <div class="carousel-indicators"></div>
            </div>
        `;
        containerEl.innerHTML = carouselHTML;
        containerEl.querySelectorAll('img').forEach(setupImgFade);

        const indicatorsEl = containerEl.querySelector('.carousel-indicators');
        images.forEach((_, index) => {
            const indicator = document.createElement('button');
            indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
            indicator.classList.toggle('active', index === 0);
            indicator.addEventListener('click', () => {
                carouselStates[id].index = index;
                containerEl.querySelectorAll('.carousel-slide').forEach((s, i) => s.classList.toggle('active', i === index));
                containerEl.querySelectorAll('.carousel-indicators button').forEach((b, i) => b.classList.toggle('active', i === index));
                resetCarouselInterval(id, containerEl, images);
            });
            indicatorsEl.appendChild(indicator);
        });

        const prevBtn = containerEl.querySelector('.carousel-prev');
        const nextBtn = containerEl.querySelector('.carousel-next');
        prevBtn.addEventListener('click', () => {
            const cs = carouselStates[id];
            cs.index = (cs.index - 1 + images.length) % images.length;
            containerEl.querySelectorAll('.carousel-slide').forEach((s, i) => s.classList.toggle('active', i === cs.index));
            containerEl.querySelectorAll('.carousel-indicators button').forEach((b, i) => b.classList.toggle('active', i === cs.index));
            resetCarouselInterval(id, containerEl, images);
        });
        nextBtn.addEventListener('click', () => {
            const cs = carouselStates[id];
            cs.index = (cs.index + 1) % images.length;
            containerEl.querySelectorAll('.carousel-slide').forEach((s, i) => s.classList.toggle('active', i === cs.index));
            containerEl.querySelectorAll('.carousel-indicators button').forEach((b, i) => b.classList.toggle('active', i === cs.index));
            resetCarouselInterval(id, containerEl, images);
        });

        function nextSlide() {
            const cs = carouselStates[id];
            const prevIndex = cs.index;
            cs.index = (cs.index + 1) % images.length;
            containerEl.querySelectorAll('.carousel-slide').forEach((s, i) => s.classList.toggle('active', i === cs.index));
            containerEl.querySelectorAll('.carousel-indicators button').forEach((b, i) => b.classList.toggle('active', i === cs.index));
            /* Fired when we wrapped from last slide to first (completed a full cycle) */
            if (images.length > 1 && prevIndex === images.length - 1 && cs.index === 0) {
                containerEl.dispatchEvent(new CustomEvent('carouselcyclecomplete', { bubbles: true }));
            }
        }
        function resetCarouselInterval() {
            if (carouselStates[id].interval) clearInterval(carouselStates[id].interval);
            carouselStates[id].interval = setInterval(nextSlide, 5000);
        }
        resetCarouselInterval();
    }

    function initCarousel() {
        const lc = window.__TDT_LANDING_CAROUSELS__ || {};
        const lifestylesImages = lc.lifestyles || [];
        const meaningsImages = lc.meanings || [];
        const storiesImages = lc.stories || [];
        const lifestylesEl = document.getElementById('carousel-lifestyles');
        const meaningsEl = document.getElementById('carousel-meanings');
        const storiesEl = document.getElementById('carousel-stories');
        if (lifestylesEl) buildOneCarousel(lifestylesEl, lifestylesImages);
        if (meaningsEl) buildOneCarousel(meaningsEl, meaningsImages);
        if (storiesEl) buildOneCarousel(storiesEl, storiesImages);
        // Legacy single hero carousel (if present)
        if (elements.carousel) {
            buildOneCarousel(elements.carousel, lifestylesImages);
        }
    }

    // ========================================
    // Mobile Menu Toggle
    // ========================================
    function initMenuToggle() {
        if (!elements.menuToggle || !elements.menu) return;

        elements.menuToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            elements.menu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (elements.menu && 
                elements.menuToggle && 
                !elements.menu.contains(e.target) && 
                !elements.menuToggle.contains(e.target)) {
                elements.menu.classList.remove('active');
                elements.menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ========================================
    // Newsletter Form
    // ========================================
    function initNewsletter() {
        /* Resolve at init time: elements.newsletterForm is captured when the script first runs and can be null with some load orders. */
        var form = document.getElementById('newsletter-form');
        if (!form) return;

        var newsletterEmailInput = document.getElementById('newsletter-email');
        var newsletterSubmitBtn = form.querySelector('button.outpost-cta');

        function updateNewsletterSubmitEnabled() {
            if (!newsletterEmailInput || !newsletterSubmitBtn) return;
            newsletterSubmitBtn.disabled = !isLooseNewsletterEmail(newsletterEmailInput.value);
        }

        if (newsletterEmailInput && newsletterSubmitBtn) {
            ['input', 'change', 'blur'].forEach(function(evt) {
                newsletterEmailInput.addEventListener(evt, updateNewsletterSubmitEnabled);
            });
            newsletterEmailInput.addEventListener('paste', function() {
                setTimeout(updateNewsletterSubmitEnabled, 0);
            });
            updateNewsletterSubmitEnabled();
        }

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const emailInput = document.getElementById('newsletter-email');
            const email = emailInput ? emailInput.value : '';
            const honeypotInput = form.querySelector('input[name="website"]');
            const honeypot = honeypotInput ? honeypotInput.value : '';
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.textContent : '';

            if (!email || !isValidEmail(email)) {
                alert(state.currentLang === 'en' 
                    ? 'Please enter a valid email address.' 
                    : 'Veuillez entrer une adresse e-mail valide.');
                return;
            }

            function getApiBaseUrl() {
                if (typeof window.GM_API_URL !== 'undefined' && window.GM_API_URL) {
                    return String(window.GM_API_URL).trim();
                }
                var meta = document.querySelector('meta[name="gm-api-url"]');
                if (meta && meta.getAttribute('content')) {
                    return meta.getAttribute('content').trim();
                }
                return 'http://localhost:8000';
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = state.currentLang === 'en' ? 'Subscribing…' : 'Abonnement…';
            }

            try {
                const res = await fetch(getApiBaseUrl() + '/newsletter/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: String(email).trim(),
                        lang: state.currentLang,
                        source: 'homepage_outpost',
                        honeypot: honeypot || ''
                    })
                });

                if (!res.ok) {
                    let detail = '';
                    try {
                        const data = await res.json();
                        detail = data && data.detail ? String(data.detail) : '';
                    } catch (err) {
                        /* ignore parse errors */
                    }
                    throw new Error(detail || ('HTTP ' + res.status));
                }

                alert(state.currentLang === 'en'
                    ? 'Thank you for subscribing! You will be notified when The Discording Tales launches.'
                    : 'Merci de vous être abonné ! Vous serez notifié au lancement de The Discording Tales.');
                if (emailInput) emailInput.value = '';
                if (honeypotInput) honeypotInput.value = '';
            } catch (err) {
                alert(state.currentLang === 'en'
                    ? 'Subscription is temporarily unavailable. Please try again later.'
                    : 'L’abonnement est temporairement indisponible. Veuillez réessayer plus tard.');
                console.error('[Newsletter] subscribe error:', err);
            } finally {
                if (submitBtn) {
                    submitBtn.textContent = originalBtnText;
                }
                updateNewsletterSubmitEnabled();
            }
        });
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // ========================================
    // Galleries: visible 10s / hidden 10s. Hover shows it; leave hides it. Timer keeps running.
    // When the active gallery's carousel completes a full cycle (all pictures), switch to next gallery+text.
    // ========================================
    function initGalleriesCycling() {
        const slot = document.getElementById('galleries-cycling-slot');
        if (!slot) return;
        const panels = slot.querySelectorAll('.gallery-panel');
        if (panels.length === 0) return;

        /* Start with first gallery */
        panels.forEach((p, j) => p.classList.toggle('active', j === 0));

        /* Start hidden; first pulse at 10s */
        slot.classList.add('galleries-slot-hidden');

        function showNextPanel() {
            const current = Array.from(panels).findIndex(p => p.classList.contains('active'));
            const next = (current + 1) % panels.length;
            panels.forEach((p, j) => p.classList.toggle('active', j === next));
        }

        slot.addEventListener('carouselcyclecomplete', function(e) {
            const activePanel = slot.querySelector('.gallery-panel.active');
            if (activePanel && activePanel.contains(e.target)) {
                showNextPanel();
            }
        });

        /* Click anywhere on the gallery: next picture, or next gallery if on last picture */
        slot.addEventListener('click', function() {
            const activePanel = slot.querySelector('.gallery-panel.active');
            if (!activePanel) return;
            const carousel = activePanel.querySelector('.gallery-carousel--small');
            const nextBtn = activePanel.querySelector('.carousel-next');
            if (!carousel || !nextBtn) return;
            const slideCount = carousel.querySelectorAll('.carousel-slide').length;
            const state = carousel.id && carouselStates[carousel.id];
            const isOnLastSlide = state && slideCount > 0 && state.index === slideCount - 1;
            if (isOnLastSlide) {
                showNextPanel();
            } else {
                nextBtn.click();
            }
        });

        let isHovering = false;
        let hideTimeout = null;

        function pulse() {
            if (isHovering) return;
            slot.classList.remove('galleries-slot-hidden');
            if (hideTimeout) clearTimeout(hideTimeout);
            hideTimeout = setTimeout(function() {
                if (!isHovering) slot.classList.add('galleries-slot-hidden');
                hideTimeout = null;
            }, 2000);
        }

        slot.addEventListener('mouseenter', function() {
            isHovering = true;
            slot.classList.remove('galleries-slot-hidden');
            if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
        });
        slot.addEventListener('mouseleave', function() {
            isHovering = false;
            slot.classList.add('galleries-slot-hidden');
        });

        setInterval(pulse, 11111);
    }

    // ========================================
    // SoundCloud: visible while playing; hover reveals when paused
    // ========================================
    function initSoundCloudCycling() {
        const wrap = document.getElementById('soundcloud-cycling-wrap');
        if (!wrap) return;

        /* Start hidden; hover reveals it. When playing, it stays visible. */
        wrap.classList.add('soundcloud-hidden');

        wrap.addEventListener('mouseenter', function() {
            wrap.classList.remove('soundcloud-hidden');
        });
        wrap.addEventListener('mouseleave', function() {
            if (!wrap.classList.contains('soundcloud-playing')) {
                wrap.classList.add('soundcloud-hidden');
            }
        });
        wrap.addEventListener('focusin', function() {
            wrap.classList.remove('soundcloud-hidden');
        });
        wrap.addEventListener('focusout', function() {
            if (!wrap.classList.contains('soundcloud-playing')) {
                wrap.classList.add('soundcloud-hidden');
            }
        });
    }

    // ========================================
    // SoundCloud: cross the note symbol when music is stopped (Widget API)
    // ========================================
    function initSoundCloudNoteState() {
        const wrap = document.getElementById('soundcloud-cycling-wrap');
        const iframe = document.querySelector('#soundcloud-cycling-wrap .soundcloud-embed');
        if (!iframe) return;
        const vignette = iframe.closest('.soundcloud-vignette');
        if (!vignette) return;

        function bindWidget() {
            if (typeof window.SC === 'undefined' || !window.SC.Widget) {
                setTimeout(bindWidget, 150);
                return;
            }
            // Lazy-load: copy data-src → src so the iframe actually loads.
            // SC.Widget internally calls getAttribute('src') and runs .substr()
            // on it  -  if the attribute is missing the result is null → crash.
            if (!iframe.getAttribute('src') && iframe.dataset.src) {
                iframe.src = iframe.dataset.src;
            }
            var widget = window.SC.Widget(iframe);
            var hasStartedFromEntrance = false;

            function setPlaying(isPlaying) {
                if (!wrap) return;
                wrap.classList.toggle('soundcloud-playing', isPlaying);
                if (isPlaying) {
                    wrap.classList.remove('soundcloud-hidden');
                } else {
                    // Hide when paused unless user is hovering/focusing the container.
                    const isHovering = wrap.matches(':hover');
                    if (!isHovering) wrap.classList.add('soundcloud-hidden');
                }
            }

            function startPlayback() {
                if (!hasStartedFromEntrance) {
                    hasStartedFromEntrance = true;
                    widget.play();
                }
            }

            // --- Click-to-toggle overlay ---
            // A transparent layer on top of the iframe so the whole circle
            // acts as a single play / pause button.
            var overlay = document.createElement('div');
            overlay.className = 'soundcloud-click-overlay';
            overlay.setAttribute('role', 'button');
            overlay.setAttribute('aria-label', 'Toggle music playback');
            overlay.setAttribute('tabindex', '0');
            vignette.appendChild(overlay);

            overlay.addEventListener('click', function(e) {
                e.stopPropagation();       // don't trigger the document-level startPlayback
                widget.isPaused(function(paused) {
                    if (paused) { widget.play(); } else { widget.pause(); }
                });
            });
            overlay.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    overlay.click();
                }
            });

            // Start playback when user enters through keyhole (user interaction unlocks audio)
            window.addEventListener('tdt-entrance-complete', startPlayback, { once: true });

            // Fallback: if no keyhole entrance, start on first user click/touch
            document.addEventListener('click', startPlayback, { once: true });
            document.addEventListener('touchstart', startPlayback, { once: true });

            widget.bind(window.SC.Widget.Events.READY, function() {
                widget.isPaused(function(paused) {
                    vignette.classList.toggle('soundcloud-stopped', paused);
                    setPlaying(!paused);
                });
            });
            widget.bind(window.SC.Widget.Events.PLAY, function() {
                vignette.classList.remove('soundcloud-stopped');
                setPlaying(true);
            });
            widget.bind(window.SC.Widget.Events.PAUSE, function() {
                vignette.classList.add('soundcloud-stopped');
                setPlaying(false);
            });
            widget.bind(window.SC.Widget.Events.FINISH, function() {
                vignette.classList.add('soundcloud-stopped');
                setPlaying(false);
            });

            // Pause SoundCloud when user switches away (e.g. another app on mobile),
            // resume when they come back.
            var scWasPlaying = false;
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    // Page hidden  -  check if playing, then pause
                    widget.isPaused(function(paused) {
                        scWasPlaying = !paused;
                        if (!paused) {
                            widget.pause();
                        }
                    });
                } else {
                    // Page visible again  -  resume if it was playing before
                    if (scWasPlaying) {
                        widget.play();
                        scWasPlaying = false;
                    }
                }
            });
        }
        bindWidget();
    }

    // ========================================
    // Discovery oval: scroll-linked background (picture scrolls as you scroll)
    // ========================================
    function initDiscoveryOvalParallax() {
        const wrap = document.querySelector('.discovery-kickstarter-wrap');
        const inner = document.querySelector('.discovery-kickstarter-inner');
        if (!wrap || !inner) return;

        let ticking = false;
        function updateOvalBg() {
            const y = Math.max(0, Math.min(100, 50 + window.scrollY * 0.06));
            inner.style.setProperty('--oval-bg-y', y + '%');
            ticking = false;
        }
        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(updateOvalBg);
                ticking = true;
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        updateOvalBg();
    }

    // ========================================
    // Scroll Animations
    // ========================================
    function initScrollAnimations() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe all sections
        document.querySelectorAll('.lore-section, .rules-section, .about-section, .feature-card').forEach(section => {
            observer.observe(section);
        });
    }

    // ========================================
    // Go to Play (Character Sheet + GM Chat)
    // ========================================
    function initCharacterSheet() {
        const openButton = document.getElementById('open-character-sheet');
        if (openButton) {
            openButton.addEventListener('click', function() {
                var playLink = document.querySelector('[data-tab="play"]');
                if (playLink) {
                    playLink.click();
                    if (history.pushState) history.pushState(null, null, '#play');
                }
            });
        }
    }

    // ========================================
    // WebGL Shader Initialization
    // Procedural texture generation for maximalist baroque styling
    // ========================================
    function initWebGLShaders() {
        // Wait for shader library to load
        if (typeof window.TDTShaders === 'undefined') {
            console.warn('WebGL shader library not loaded, retrying...');
            setTimeout(initWebGLShaders, 100);
            return;
        }

        // Initialize background marble texture canvas
        const bgCanvas = document.getElementById('bg-marble-canvas');
        if (bgCanvas && window.TDTShaders.applyShader) {
            try {
                window.TDTShaders.applyShader(bgCanvas, 'marble', {
                    uniforms: {
                        u_marbleBase: [0.96, 0.95, 0.91], // Cream
                        u_marbleVein: [0.36, 0.12, 0.12], // Burgundy
                        u_veinDensity: 6.0 // Slightly lower density for background
                    }
                });
            } catch (error) {
                console.warn('Failed to initialize background marble shader:', error);
            }
        }

        // Initialize header gold texture canvas
        const headerCanvas = document.getElementById('header-gold-canvas');
        if (headerCanvas && window.TDTShaders.applyShader) {
            try {
                window.TDTShaders.applyShader(headerCanvas, 'gold', {
                    uniforms: {
                        u_goldColor1: [0.96, 0.90, 0.67], // Bright gold
                        u_goldColor2: [0.75, 0.65, 0.45], // Darker brass
                        u_shimmerSpeed: 0.4 // Slower shimmer for header
                    }
                });
            } catch (error) {
                console.warn('Failed to initialize header gold shader:', error);
            }
        }
    }

    /**
     * Handle window resize for WebGL canvases
     * Ensures procedural textures maintain proper resolution
     */
    function handleWebGLResize() {
        const canvases = document.querySelectorAll('.webgl-bg-canvas, .webgl-header-canvas');
        canvases.forEach(canvas => {
            if (window.TDTShaders && window.TDTShaders.resizeCanvas) {
                const gl = canvas.getContext('webgl');
                if (gl) {
                    window.TDTShaders.resizeCanvas(gl, canvas);
                }
            }
        });
    }

    // Content is already in HTML - no dynamic loading needed
    // Carousel CSS is now in dtd-website.css

    // ========================================
    // COPYRIGHT PROTECTION
    // Discourage casual copying of game content
    // ========================================
    (function initCopyrightProtection() {
        // Disable right-click context menu on game content sections
        document.addEventListener('contextmenu', function(e) {
            var target = e.target;
            // Allow right-click on interactive elements (inputs, textareas, links)
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'A') {
                return;
            }
            // Block on game content areas
            if (target.closest('.section-content, .tab-content, .lore-section, .discovery-unified-section, .rules-content')) {
                e.preventDefault();
                return false;
            }
        });

        // Intercept copy events to add copyright watermark
        document.addEventListener('copy', function(e) {
            var selection = window.getSelection();
            if (selection && selection.toString().length > 50) {
                var copiedText = selection.toString();
                var watermark = '\n\n---\n© 2020-2026 The Discording Tales / Des Récits Discordants. All Rights Reserved.\n'
                    + 'Source: https://archopoia.github.io/The-Discording-Tales/\n'
                    + 'Unauthorized reproduction is prohibited.\n---';
                if (e.clipboardData) {
                    e.clipboardData.setData('text/plain', copiedText + watermark);
                    e.preventDefault();
                }
            }
        });

        // Disable drag on images to prevent easy saving
        document.addEventListener('dragstart', function(e) {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
                return false;
            }
        });

        // Disable keyboard shortcuts for saving/printing on game content
        document.addEventListener('keydown', function(e) {
            // Ctrl+S / Cmd+S (Save page)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                return false;
            }
            // Ctrl+P / Cmd+P (Print)  -  redirect to copyright notice
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                return false;
            }
            // Ctrl+U / Cmd+U (View source)  -  not blockable but we discourage
        });

        // Console warning for developers/scrapers
        if (typeof console !== 'undefined' && console.log) {
            console.log(
                '%c⚠ COPYRIGHT NOTICE',
                'color: #740000; font-size: 18px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);'
            );
            console.log(
                '%c© 2020-2026 The Discording Tales / Des Récits Discordants. All Rights Reserved.\n'
                + 'All content, artwork, game mechanics, lore, names, and creative materials\n'
                + 'are protected by international copyright law.\n'
                + 'No reproduction, distribution, or derivative works permitted without\n'
                + 'express written permission.\n'
                + 'AI/ML training on this content is strictly prohibited.',
                'color: #333; font-size: 12px;'
            );
        }
    })();

})();

