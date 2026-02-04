/**
 * The Discording Tales - Interactive Website JavaScript
 * Handles tab switching, language toggle, content loading, and animations
 *
 * Table of contents (sections):
 *   State, DOM Elements, Hero Images, DOMContentLoaded
 *   Tabs, SubTabs, Peuples, Popovers
 *   initAccordion, initTabPanels (shared helpers)
 *   Combat, Magic, Progression
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

    /** Main nav tab order (left to right) for logo spin direction */
    const TAB_ORDER = ['landing', 'lore', 'univers', 'rules', 'play', 'about'];
    let logoBurstTimeout = null;

    // ========================================
    // Image Gallery Data (Landing: three carousels)
    // ========================================
    const lifestylesImages = [
        { src: 'assets/images/png.png', alt: 'The Discording Tales Artwork' },
        { src: 'assets/images/all.png', alt: 'All Creatures' },
        { src: 'assets/images/kharde-entre.png', alt: 'Kharde' },
        { src: 'assets/images/final.png', alt: 'Final Artwork' },
        { src: 'assets/images/all-copy.png', alt: 'All Creatures Copy' },
        { src: 'assets/images/png2.png', alt: 'Artwork 2' },
        { src: 'assets/images/lastvtummattroi.png', alt: 'Lastvtummattroi' },
        { src: 'assets/images/all-copy-1.png', alt: 'All Copy 1' },
        { src: 'assets/images/touteslesraces-2psd-copy.jpg', alt: 'All Races' }
    ];
    const meaningsImages = [
        { src: 'assets/images/title-1-copy-1.png', alt: 'Title' },
        { src: 'assets/images/essence-english-v2-1.png', alt: 'Essence' },
        { src: 'assets/images/things-english.png', alt: 'Things' },
        { src: 'assets/images/roue-desastres.png', alt: 'Roue des astres' }
    ];
    const storiesImages = [
        { src: 'assets/images/iossoluvvaij.png', alt: 'Iossoluvvaij' },
        { src: 'assets/images/current.png', alt: 'Current' },
        { src: 'assets/images/adriuhn.png', alt: 'Adriuhn' },
        { src: 'assets/images/agvalsis.png', alt: 'Agvalsis' },
        { src: 'assets/images/bruysseliand.png', alt: 'Bruysseliand' },
        { src: 'assets/images/dalvvaraad.png', alt: 'Dalvvaraad' },
        { src: 'assets/images/eadryllir.png', alt: 'Eadryllir' },
        { src: 'assets/images/hatroaj.png', alt: 'Hatroaj' },
        { src: 'assets/images/mevyriil.png', alt: 'Mevyriil' },
        { src: 'assets/images/ondusiol.png', alt: 'Ondusiol' },
        { src: 'assets/images/novoworld.jpg', alt: 'Novoworld' },
        { src: 'assets/images/geocosmoseng.jpg', alt: 'Geocosmos' }
    ];

    // ========================================
    // Initialize on DOM Load
    // ========================================
    document.addEventListener('DOMContentLoaded', function() {
        initLanguage();
        initTabs();
        initSubTabs();
        initArchiveToggle();
        initZinePages();
        initPeuples();
        initPopovers();
        initCombat();
        initMagic();
        initProgression();
        initSystemOverview();
        initCarousel();
        initGalleriesCycling();
        initSoundCloudCycling();
        initSoundCloudNoteState();
        initDiscoveryOvalParallax();
        initMenuToggle();
        initNewsletter();
        initScrollAnimations();
        initCharacterSheet();
        initWebGLShaders(); // Initialize procedural texture shaders
        
        // Handle hash changes (for deep linking)
        window.addEventListener('hashchange', handleHashChange);
        
        // Check for initial hash
        handleHashChange();
        
        // Handle window resize for WebGL canvases
        window.addEventListener('resize', handleWebGLResize);
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

    function switchTab(tabId, options) {
        options = options || {};
        const skipScrollToTop = options.skipScrollToTop === true;

        // Update active states
        elements.tabLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-tab') === tabId) {
                link.classList.add('active');
            }
        });

        elements.tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId) {
                content.classList.add('active');
                state.currentTab = tabId;
                if (!skipScrollToTop) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                ensureFirstSubTabActive(tabId);
                requestAnimationFrame(function() { setLanguage(state.currentLang); });
            }
        });
    }

    function handleHashChange() {
        const hash = window.location.hash.substring(1);
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
            requestAnimationFrame(function() {
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

    function switchSubTab(tabId, subId) {
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
        radios.forEach(function(radio) {
            radio.addEventListener('change', function() {
                var value = this.getAttribute('value');
                panels.forEach(function(panel) {
                    panel.classList.toggle('zine-page-active', panel.getAttribute('data-page') === value);
                });
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
                racesEl.style.display = '';
            }
            function collapse() {
                node.setAttribute('aria-expanded', 'false');
                racesEl.style.display = 'none';
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
                    en: 'Humanoids of small stature, the Yômmes descend from the Aïars and split through two great migrations: the Erréors south into mangroves (giving rise to Méridiens and Navillis), then the Escandirs north-west into the mountains (Aristois and Griscribes). They are nomadic in spirit yet practise agriculture, horticulture and pastoralism—tribes, chiefdoms or states—with chamanic rites and a shared sense of regret expressed in collective sacrifice. They tend to see the Yôrres as mad or charlatans for their religion and cannibalism, and the Bêstres as bastard dregs bewitched by natural forces, to be purged; they themselves resent the abuse of their small size by the other origins.',
                    fr: 'Humanoïdes de petite taille, les Yômmes descendent des Aïars et se scindent en deux grandes migrations : les Erréors vers le Sud dans les mangroves (Méridiens et Navillis), puis les Escandirs vers le Nord-Ouest dans les montagnes (Aristois et Griscribes). Nomades dans l\'âme, ils pratiquent agriculture, horticulture et pastoralisme—tribus, chefferies ou états—avec des rites chamaniques et un regret partagé qui s\'exprime par le sacrifice collectif. Ils voient volontiers les Yôrres comme fous ou charlatans pour leur religion et leur cannibalisme, et les Bêstres comme des immondices bâtardes envoûtées par les forces naturelles, à purger ; eux-mêmes regrettent l\'abus de leur petite taille par les autres origines.'
                },
                yorres: {
                    en: 'Elf-like and long-lived, the Yôrres spring from the Hryôhpéens who sat in judgment at Withlaï and the Hydryôrres who travelled by water—giving rise to the Hauts Ylfes, Ylfes pâles, Ylfes des lacs, and the errant Iqqars. They built a sedentary civilisation that was shattered when their world collapsed from the sky; cold and flood drove them to ritual cannibalism and a sacred direction that unites them. They preserve and pass on possessions to those who use them best, and withdraw into the pure solitude of temple-homes. How they view the Yômmes and Bêstres varies from people to people, but they remain bound by lineage, longevity and a morality that feels alien to the others.',
                    fr: 'Proches des elfes et longévifs, les Yôrres descendent des Hryôhpéens qui siégeaient au tribunal de Withlaï et des Hydryôrres qui voyagèrent par les eaux—donnant les Hauts Ylfes, Ylfes pâles, Ylfes des lacs et les Iqqars errants. Ils bâtirent une civilisation sédentaire que l\'effondrement du ciel détruisit ; le froid et les flots les menèrent au cannibalisme rituel et à une direction sacrée qui les unit. Ils sauvegardent et transmettent leurs biens à ceux qui les utilisent le mieux, et se retirent dans la solitude pure de leurs temples-maisons. Leur perception des Yômmes et des Bêstres varie selon les peuples, mais ils restent liés par la lignée, la longévité et une moralité qui demeure étrangère aux autres.'
                },
                bestres: {
                    en: 'Diverse creatures shaped by the Kweryas Gjuaj (the four giants of arms), the Bêstres range from animal and wild to primitive and inspired—of whom only the inspired peoples, the Slaadéens and Tchalkchaïs, are treated here. They emerged from caverns and troglodytic refuges as the world warmed, spreading from desert to forest. They use the Yômmes as living tools who manipulate nature through sacrifice, and observe the Ylfes as beings alienated from natural forces, other. They claim that the Yômmes and Yôrres were in truth also shaped from clay, and that their thought too was pressed into their skulls by the reproving fingers of Asmund—a pretension the other origins find absurd.',
                    fr: 'Créatures diverses façonnées par les Kweryas Gjuaj (les quatre géants d\'armes), les Bêstres vont de l\'animal et du sauvage au primitif et à l\'inspiré—seuls les peuples inspirés, Slaadéens et Tchalkchaïs, sont traités ici. Ils sortirent des cavernes et refuges troglodytes avec le réchauffement du monde, s\'éparpillant du désert à la forêt. Ils utilisent les Yômmes comme êtres-outils manipulant la nature par le sacrifice, et voient les Ylfes comme des êtres aliénés des forces naturelles, autres. Ils prétendent que les Yômmes et les Yôrres furent eux aussi de glaise et que leur pensée fut écrasée en leur crâne par les doigts réprobateurs d\'Asmund—prétention que les autres origines jugent ridicule.'
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
                    if (racesEl) {
                        node.insertBefore(panel, racesEl);
                    } else {
                        node.appendChild(panel);
                    }
                });
                // Wrap each race in a row and add race accordion panel
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
                            if (!content.children.length) {
                                var peupleId = raceSpan.getAttribute('data-peuple');
                                var raceLabel = raceSpan.getAttribute('data-race') || raceSpan.textContent.trim();
                                var card = peoplesSection.querySelector('.peoples-flip-card[data-peuple="' + peupleId + '"]');
                                if (card) {
                                    var lang = document.documentElement.lang || 'en';
                                    var lis = card.querySelectorAll('.peoples-races-mini li');
                                    for (var i = 0; i < lis.length; i++) {
                                        if (lis[i].textContent.trim() === raceLabel) {
                                            var desc = lis[i].getAttribute('data-title-' + lang) || lis[i].getAttribute('data-title-en') || lis[i].getAttribute('data-title-fr') || lis[i].getAttribute('title') || '';
                                            var wrap = document.createElement('div');
                                            wrap.className = 'peoples-tree-race-body';
                                            var p = document.createElement('p');
                                            p.textContent = desc;
                                            wrap.appendChild(p);
                                            content.appendChild(wrap);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Refresh inline accordion content on language change
            try {
                window.addEventListener('tdt-lang-changed', function(ev) {
                    if (!peoplesSection) return;
                    var lang = (ev && ev.detail) || document.documentElement.lang || 'en';
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
                        var peupleId = raceSpan.getAttribute('data-peuple');
                        var raceLabel = raceSpan.getAttribute('data-race') || raceSpan.textContent.trim();
                        var card = peoplesSection.querySelector('.peoples-flip-card[data-peuple="' + peupleId + '"]');
                        panel.innerHTML = '';
                        if (card) {
                            var lis = card.querySelectorAll('.peoples-races-mini li');
                            for (var j = 0; j < lis.length; j++) {
                                if (lis[j].textContent.trim() === raceLabel) {
                                    var desc = lis[j].getAttribute('data-title-' + lang) || lis[j].getAttribute('data-title-en') || lis[j].getAttribute('data-title-fr') || lis[j].getAttribute('title') || '';
                                    var wrap = document.createElement('div');
                                    wrap.className = 'peoples-tree-race-body';
                                    var p = document.createElement('p');
                                    p.textContent = desc;
                                    wrap.appendChild(p);
                                    panel.appendChild(wrap);
                                    break;
                                }
                            }
                        }
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
    // Magic (Rilie) Section: Accordion, Table Tabs
    // ========================================
    function initMagic() {
        var magicSection = document.getElementById('magic');
        if (!magicSection) return;

        initAccordion(magicSection, {
            itemSelector: '.magic-accordion-item',
            headSelector: '.magic-accordion-head',
            bodySelector: '.magic-accordion-body',
            expandAllSelector: '.magic-expand-all',
            collapseAllSelector: '.magic-collapse-all'
        });

        initTabPanels(magicSection, {
            linkSelector: '.magic-tab-link',
            panelSelector: '.magic-tables-panel',
            linkDataAttr: 'data-magic-tab',
            panelDataAttr: 'data-magic-panel'
        });
    }

    // ========================================
    // Progression Section: Accordion (Expand/Collapse)
    // ========================================
    function initProgression() {
        var progressionSection = document.getElementById('progression');
        if (!progressionSection) return;

        initAccordion(progressionSection, {
            itemSelector: '.progression-accordion-item',
            headSelector: '.progression-accordion-head',
            bodySelector: '.progression-accordion-body',
            expandAllSelector: '.progression-expand-all',
            collapseAllSelector: '.progression-collapse-all'
        });
    }

    // ========================================
    // System Overview (Vue d'ensemble): Accordion
    // ========================================
    function initSystemOverview() {
        console.log('[DRD] initSystemOverview called');
        var accordionEl = document.getElementById('system-overview-accordion');
        if (!accordionEl) {
            console.log('[DRD] system-overview-accordion not found');
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
    // Attributes Tree: Interactive hierarchy
    // Attribute -> Aptitude -> Action -> Competence -> Masteries
    // ========================================
    
    // Mapping: which attribute has each aptitude as its principal (first/+3)
    var APTITUDE_PRINCIPAL_ATTR = {
        PUISSANCE: 'FOR',
        AISANCE: 'AGI',
        PRECISION: 'DEX',
        ATHLETISME: 'VIG',
        CHARISME: 'EMP',
        DETECTION: 'PER',
        REFLEXION: 'CRE',
        DOMINATION: 'VOL'
    };

    var ATTRIBUTES_TREE_DATA = {
        attributes: {
            FOR: {
                id: 'FOR', abbr: 'FOR',
                name: { en: 'Strength', fr: 'Force' },
                desc: {
                    en: 'Physical power. Raw bodily might. The ability to lift, move, strike, and damage objects. Strength measures muscular capacity, natural athleticism, and bodily power.',
                    fr: 'Puissance physique. Puissance corporelle pure. La capacité de soulever des objets, de déplacer des objets, de frapper des objets et des personnes et d\'endommager des objets. La force est une mesure de la capacité musculaire. Athlétisme naturel, Pouvoir corporel.'
                },
                aptitudes: ['PUISSANCE', 'ATHLETISME', 'DOMINATION'] // principal first
            },
            AGI: {
                id: 'AGI', abbr: 'AGI',
                name: { en: 'Agility', fr: 'Agilité' },
                desc: {
                    en: 'Finesse, delicacy, dexterity, suppleness, and ease of movement. Covers balanced whole-body motion, quickness and grace, as well as physical harmony—part of perceived beauty.',
                    fr: 'C\'est sa finesse, délicatesse, doigté, souplesse et facilité de mouvement, couvrant à la fois les mouvements équilibrés de tout le corps, la manifestation de la promptitude et grâce dans ses mouvements, ainsi que son harmonie physique, partie de sa beauté perçue.'
                },
                aptitudes: ['AISANCE', 'PUISSANCE', 'ATHLETISME']
            },
            DEX: {
                id: 'DEX', abbr: 'DEX',
                name: { en: 'Dexterity', fr: 'Dextérité' },
                desc: {
                    en: 'Reflexes. Response time. Coordination. Dexterity indicates how easily and synchronously your character responds to the physical world—the ability to perform manual actions with exactitude.',
                    fr: 'Réflexes. Temps de réponse. Coordination. La dextérité indique à quelle aisance et synchronisation votre personnage répond à son monde physique, la capacité à accomplir une action manuelle avec exactitude.'
                },
                aptitudes: ['PRECISION', 'AISANCE', 'PUISSANCE']
            },
            VIG: {
                id: 'VIG', abbr: 'VIG',
                name: { en: 'Vigor', fr: 'Vigueur' },
                desc: {
                    en: 'Solidity. Firmness. Pure physical resilience. Vigor measures your character\'s physical toughness—how far they can push their body and what physical violence they can endure, as well as health-related physical beauty. Health, Energy, Life force.',
                    fr: 'Solidité. Fermeté. Résilience physique pure. La vigueur est une mesure de la dureté physique de votre personnage. Cela indique jusqu\'où il peut pousser son corps et quelle violence physique il peut endurer, mais aussi sa beauté physique purement liée à sa santé. Santé, Énergie, Force vitale.'
                },
                aptitudes: ['ATHLETISME', 'DOMINATION', 'AISANCE']
            },
            EMP: {
                id: 'EMP', abbr: 'EMP',
                name: { en: 'Empathy', fr: 'Empathie' },
                desc: {
                    en: 'Receptivity. Charm. Persuasive force. The ability to perceive and play on emotions, desires, hopes, and needs to influence or recognize others—knowing when and what to say for best impact. Empathy allows understanding emotions, not necessarily feeling them. Here it\'s neutral identification, not compassion. Eloquence.',
                    fr: 'Réceptivité. Charme. Force de persuasion. La capacité de percevoir et jouer sur les émotions, désirs, les espoirs et les besoins des autres pour les influencer ou les reconnaître, mais aussi de savoir quand et de quoi parler pour avoir le meilleur impact. L\'Empathie permet de comprendre les émotions, mais pas forcément de les ressentir ou les accepter. Ici, elle n\'est donc pas forcément liée à la compassion, mais plutôt à l\'identification neutre. Éloquence.'
                },
                aptitudes: ['CHARISME', 'REFLEXION', 'DETECTION']
            },
            PER: {
                id: 'PER', abbr: 'PER',
                name: { en: 'Perception', fr: 'Perception' },
                desc: {
                    en: 'Attention to detail, the ability to determine what\'s happening in the environment and react to events. Also the capacity to notice things and perceive the world through all senses. Speed of thought; how easily you make logical or intuitive leaps. In animals, this encompasses all senses plus hunting, survival, and reproduction instincts. Awareness, Intuition.',
                    fr: 'Elle comprend le souci du détail, la capacité à déterminer ce qui se passe dans l\'environnement et de réagir aux événements. C\'est aussi la capacité à remarquer des choses, à percevoir le monde qui vous entoure, à travers tous vos sens. La rapidité de penser ; mesure avec quelle facilité vous faites des sauts de logique ou d\'intuition. Chez les animaux cela englobe tous les sens, ainsi que la qualité de l\'instinct de chasse, de survie et de reproduction. Conscience, Intuition.'
                },
                aptitudes: ['DETECTION', 'PRECISION', 'CHARISME']
            },
            CRE: {
                id: 'CRE', abbr: 'CRÉ',
                name: { en: 'Creativity', fr: 'Créativité' },
                desc: {
                    en: 'The ability to create, imagine, and innovate—to implement a new concept, a new object, or discover an original solution to a problem. The association of things, ideas, situations, and the unpredictable conjunction of elements enabling discovery. Also cerebral memory—the aptitude to absorb, digest, and memorize information, thus learning more. Mental acuity, Information memory, Analytical capacity.',
                    fr: 'La capacité à créer, à imaginer et à innover, de mettre en œuvre un concept neuf, un objet nouveau ou à découvrir une solution originale à un problème. L\'association des choses, d\'idées, des situations, ainsi que la conjonction imprévisible d\'éléments permettant la découverte. Mais aussi la mémoire cérébrale. L\'aptitude à absorber, digérer, et mémoriser des informations - et donc à en apprendre davantage. Acuité mentale, Mémoire d\'information, Capacité d\'analyse.'
                },
                aptitudes: ['REFLEXION', 'DETECTION', 'PRECISION']
            },
            VOL: {
                id: 'VOL', abbr: 'VOL',
                name: { en: 'Willpower', fr: 'Volonté' },
                desc: {
                    en: 'The concentration and determination to see your character\'s resolution through. The ability to stay focused, ignore distractions, and resist coercion or bullying. In animals, it\'s also the life force to fulfill their instincts (not the quality of instincts themselves), plus their sagacity facing instincts and general composure. Firmness, Command.',
                    fr: 'La concentration et la détermination de voir la résolution de votre personnage s\'accomplir. La capacité de rester concentré, d\'ignorer les distractions et de résister à la coercition ou aux brimades. Chez les animaux, c\'est aussi la force de vie et d\'accomplir leurs instincts, mais pas la qualité des instincts eux-mêmes. C\'est aussi la sagacité face à leurs instincts et leur sang-froid général. Fermeté, Commandement.'
                },
                aptitudes: ['DOMINATION', 'CHARISME', 'REFLEXION']
            }
        },
        aptitudes: {
            PUISSANCE: {
                id: 'PUISSANCE',
                name: { en: 'Power', fr: 'Puissance' },
                desc: {
                    en: 'Combat Power is the experience and current ability to fight in melee or at range, armed or unarmed. Different weapons require different muscles—a bow uses back muscles while a rapier uses forearm. Other Aptitudes may come into play during battle, but this is the direct link to combat and its styles.',
                    fr: 'L\'essentiel est que la Puissance au Combat est l\'expérience et capacité actuelle en la matière, afin de combattre au corps à corps ou à distance, armé ou non. Certaines armes requièrent différents muscles, comme un arc utilisant ceux du dos ou une rapière ceux de l\'avant-bras. D\'autres Aptitudes peuvent rentrer en compte lors d\'une bataille, mais ici c\'est le lien direct avec le combat et ses styles dont il est question.'
                },
                attributes: ['FOR', 'AGI', 'DEX'], // weights: +3, +2, +1
                actions: ['FRAPPER', 'NEUTRALISER', 'TIRER']
            },
            AISANCE: {
                id: 'AISANCE',
                name: { en: 'Ease', fr: 'Aisance' },
                desc: {
                    en: 'Ease represents an individual\'s ability to use their body acrobatically: general balance and ability to resist and escape grapples. It\'s your general ability to shove, fall, dodge, plus your flexibility, stability, balance, freedom of action, fluid movements, and positioning. Ease encompasses all skills related to stealth, hiding, moving silently, as well as pickpocketing and assassination.',
                    fr: 'L\'Aisance d\'un individu représente sa capacité à utiliser son corps de manière acrobatique, et ce qui s\'en suit : l\'équilibre général et la capacité de résister aux étreintes et s\'en évader. C\'est votre aptitude générale à bousculer, chuter, esquiver, ainsi que votre souplesse, stabilité, équilibre, mais aussi votre liberté d\'action, la fluidité de vos mouvements, et votre placement. L\'Aisance englobe toutes les aptitudes liées à l\'art de se faire discret, de se cacher, de marcher silencieusement, mais aussi du vol à la tire et de l\'assassinat.'
                },
                attributes: ['AGI', 'DEX', 'VIG'],
                actions: ['REAGIR', 'DEROBER', 'COORDONNER']
            },
            PRECISION: {
                id: 'PRECISION',
                name: { en: 'Precision', fr: 'Précision' },
                desc: {
                    en: 'Precision encompasses all skills related to coordination and analysis. The skill to drive any vehicle or mount on land, sea, or air. The simple ability to work with your hands, plus practical experience allowing production of objects, often linked to a trade—from cobbler to jeweler. Precision also covers lockpicking, trap-setting, disarming. It\'s the capacity for cunning, finesse, and stratagem.',
                    fr: 'La Précision correspond à toutes les aptitudes liées à la coordination et l\'analyse. L\'habileté pour la conduite de toute sorte de véhicules ou montures sur terre, mer ou dans les airs. La simple capacité à travailler de ses mains, mais aussi la pratique et l\'expérience réelle des connaissances, permettant de produire et/ou fabriquer un objet, souvent en lien avec un métier associé, allant du cordonnier au bijoutier. La Précision englobe aussi toutes les aptitudes liées à l\'art du crochetage, de la trappe, du désamorçage. C\'est la capacité à la ruse, la finesse et au stratagème.'
                },
                attributes: ['DEX', 'PER', 'CRE'],
                actions: ['MANIER', 'FACONNER', 'FIGNOLER']
            },
            ATHLETISME: {
                id: 'ATHLETISME',
                name: { en: 'Athletics', fr: 'Athlétisme' },
                desc: {
                    en: 'Athletics is a being\'s aptitude to physically exercise through running, climbing, throwing, swimming, jumping, sprinting, carrying, and all physical work short or long term. Your Athletics defines your mastery of these elements and the ease of practicing them.',
                    fr: 'L\'Athlétisme, c\'est l\'aptitude d\'un être à s\'exercer physiquement au travers de la course, l\'escalade, le jet, la nage, le saut, le sprint, le transport et tout travail physique sur court et long terme. Votre Athlétisme définit votre maîtrise de ces éléments ainsi que la facilité de les pratiquer.'
                },
                attributes: ['VIG', 'FOR', 'AGI'],
                actions: ['TRAVERSER', 'EFFORCER', 'MANOEUVRER']
            },
            CHARISME: {
                id: 'CHARISME',
                name: { en: 'Charisma', fr: 'Charisme' },
                desc: {
                    en: 'Charisma includes social and rhetorical capabilities between perceptive beings—to suggest, insinuate, incite, seduce, dupe, investigate, bargain, or accustom one to another. It\'s presence, aura, and rhetoric. Also uniquely influenced by physical beauty (Agility and Constitution). It\'s all forms of subterfuge: imitating, mimicking, taking or giving a different appearance to oneself, another, or an object, to pass one thing for another. Also artistic or social self-expression.',
                    fr: 'Le Charisme inclut les capacités sociales et rhétoriques entre êtres perceptifs à suggérer, insinuer, inciter, séduire, duper, investiguer, marchander ou encore accoutumer, de l\'un vers l\'autre. C\'est à la fois la présence, l\'aura et la rhétorique du personnage. Aussi, il est influencé d\'une façon unique par la valeur de Beauté Physique du personnage (son Agilité et sa Constitution). C\'est aussi toutes les formes de subterfuges permettant d\'imiter, de mimer, de prendre ou donner une apparence visuelle, auditive, etc. autre à soi-même, à un autre ou à un objet, afin de faire passer une chose pour une autre. Mais aussi de s\'évoquer artistiquement ou socialement.'
                },
                attributes: ['EMP', 'VOL', 'PER'],
                actions: ['CAPTIVER', 'CONVAINCRE', 'INTERPRETER']
            },
            DETECTION: {
                id: 'DETECTION',
                name: { en: 'Detection', fr: 'Détection' },
                desc: {
                    en: 'Detection includes all senses, from taste to sight, as well as emotional and rational intuition, and finally the aptitude to search and find—deduction. Knowledge of ecosystems and interactions between all things.',
                    fr: 'La Détection inclut tous les sens, du goûter à la vue, ainsi que l\'intuition émotionnelle et rationnelle, et enfin l\'aptitude à chercher et trouver - la déduction. Le savoir des écosystèmes et des interactions entre tous.'
                },
                attributes: ['PER', 'CRE', 'EMP'],
                actions: ['DISCERNER', 'DECOUVRIR', 'DEPISTER']
            },
            REFLEXION: {
                id: 'REFLEXION',
                name: { en: 'Reflection', fr: 'Réflexion' },
                desc: {
                    en: 'Reflection here is education, erudition, and all forms of non-directly-practical instruction and exercise, from tales to science—theoretical information on any subject. It\'s the ability to prevent, identify, and heal all forms of ailments, whether physical, mental, or chronic. A successful roll means the character remembers; otherwise they don\'t know or can\'t recall. Knowledge of things and social activities.',
                    fr: 'La Réflexion est ici l\'éducation, l\'érudition et toute forme d\'instruction et exercice non directement pratiques, du conte à la science, ce sont les informations théoriques de n\'importe quel sujet. C\'est la capacité de prévenir, d\'identifier et de soigner toutes formes de maux, qu\'ils soient physiques, mentaux, ou chroniques. Un jet réussi signifie que le personnage se souvient, autrement il ne le sait pas ou alors il ne peut plus s\'en souvenir. Le savoir des choses et des activités sociales.'
                },
                attributes: ['CRE', 'EMP', 'VOL'],
                actions: ['CONCEVOIR', 'ACCULTURER', 'ACCLIMATER']
            },
            DOMINATION: {
                id: 'DOMINATION',
                name: { en: 'Domination', fr: 'Domination' },
                desc: {
                    en: 'Domination encompasses the ability to impose one\'s will, endure physical and mental hardships, and control other creatures. It\'s strength of character, command, and resistance to external influences.',
                    fr: 'La Domination comprend la capacité à imposer sa volonté, à endurer les épreuves physiques et mentales, et à contrôler les autres créatures. C\'est la force de caractère, le commandement, et la résistance aux influences extérieures.'
                },
                attributes: ['VOL', 'VIG', 'FOR'],
                actions: ['DISCIPLINER', 'ENDURER', 'DOMPTER']
            }
        },
        actions: {
            // Puissance actions
            FRAPPER: {
                id: 'FRAPPER',
                name: { en: 'Strike', fr: 'Frapper' },
                desc: { en: 'The action of delivering offensive blows against an adversary.', fr: 'L\'action de porter des coups offensifs sur un adversaire.' },
                linkedAttr: 'FOR',
                competences: ['ARME', 'DESARME', 'IMPROVISE']
            },
            NEUTRALISER: {
                id: 'NEUTRALISER',
                name: { en: 'Neutralize', fr: 'Neutraliser' },
                desc: { en: 'The action of controlling, immobilizing, or disadvantaging an adversary without necessarily injuring them.', fr: 'L\'action de contrôler, immobiliser ou désavantager un adversaire sans nécessairement le blesser.' },
                linkedAttr: 'AGI',
                competences: ['LUTTE', 'BOTTES', 'RUSES']
            },
            TIRER: {
                id: 'TIRER',
                name: { en: 'Shoot', fr: 'Tirer' },
                desc: { en: 'The action of attacking from range by projecting ammunition.', fr: 'L\'action d\'attaquer à distance en projetant des munitions.' },
                linkedAttr: 'DEX',
                competences: ['BANDE', 'PROPULSE', 'JETE']
            },
            // Aisance actions
            REAGIR: {
                id: 'REAGIR',
                name: { en: 'React', fr: 'Réagir' },
                desc: { en: 'The action of responding quickly to events and threats.', fr: 'L\'action de répondre rapidement aux événements et menaces.' },
                linkedAttr: 'AGI',
                competences: ['FLUIDITE', 'ESQUIVE', 'EVASION']
            },
            DEROBER: {
                id: 'DEROBER',
                name: { en: 'Steal', fr: 'Dérober' },
                desc: { en: 'The action of taking discreetly or concealing oneself.', fr: 'L\'action de prendre discrètement ou de se dissimuler.' },
                linkedAttr: 'DEX',
                competences: ['ESCAMOTAGE', 'ILLUSIONS', 'DISSIMULATION']
            },
            COORDONNER: {
                id: 'COORDONNER',
                name: { en: 'Coordinate', fr: 'Coordonner' },
                desc: { en: 'The action of precisely controlling one\'s body and movements.', fr: 'L\'action de contrôler précisément son corps et ses mouvements.' },
                linkedAttr: 'VIG',
                competences: ['GESTUELLE', 'MINUTIE', 'EQUILIBRE']
            },
            // Précision actions
            MANIER: {
                id: 'MANIER',
                name: { en: 'Handle', fr: 'Manier' },
                desc: { en: 'The action of manipulating tools, weapons, and vehicles with precision.', fr: 'L\'action de manipuler des outils, armes et véhicules avec précision.' },
                linkedAttr: 'DEX',
                competences: ['VISEE', 'CONDUITE', 'HABILETE']
            },
            FACONNER: {
                id: 'FACONNER',
                name: { en: 'Shape', fr: 'Façonner' },
                desc: { en: 'The action of creating, repairing, and modifying objects.', fr: 'L\'action de créer, réparer et modifier des objets.' },
                linkedAttr: 'PER',
                competences: ['DEBROUILLARDISE', 'BRICOLAGE', 'SAVOIR_FAIRE']
            },
            FIGNOLER: {
                id: 'FIGNOLER',
                name: { en: 'Refine', fr: 'Fignoler' },
                desc: { en: 'The action of working with extreme precision on complex mechanisms.', fr: 'L\'action de travailler avec une précision extrême sur des mécanismes complexes.' },
                linkedAttr: 'CRE',
                competences: ['ARTIFICES', 'SECURITE', 'CASSE_TETES']
            },
            // Athlétisme actions
            TRAVERSER: {
                id: 'TRAVERSER',
                name: { en: 'Traverse', fr: 'Traverser' },
                desc: { en: 'The action of moving through different environments.', fr: 'L\'action de se déplacer à travers différents milieux.' },
                linkedAttr: 'VIG',
                competences: ['PAS', 'GRIMPE', 'NATATION']
            },
            EFFORCER: {
                id: 'EFFORCER',
                name: { en: 'Exert', fr: 'Efforcer' },
                desc: { en: 'The action of providing intense physical effort.', fr: 'L\'action de fournir un effort physique intense.' },
                linkedAttr: 'FOR',
                competences: ['PORT', 'SAUT', 'FOUISSAGE']
            },
            MANOEUVRER: {
                id: 'MANOEUVRER',
                name: { en: 'Maneuver', fr: 'Manœuvrer' },
                desc: { en: 'The action of controlling one\'s body in complex situations or on a mount.', fr: 'L\'action de contrôler son corps dans des situations complexes ou sur une monture.' },
                linkedAttr: 'AGI',
                competences: ['VOL', 'ACROBATIE', 'CHEVAUCHEMENT']
            },
            // Charisme actions
            CAPTIVER: {
                id: 'CAPTIVER',
                name: { en: 'Captivate', fr: 'Captiver' },
                desc: { en: 'The action of attracting and holding the attention of others.', fr: 'L\'action d\'attirer et retenir l\'attention des autres.' },
                linkedAttr: 'EMP',
                competences: ['SEDUCTION', 'MIMETISME', 'PRESENTATION']
            },
            CONVAINCRE: {
                id: 'CONVAINCRE',
                name: { en: 'Convince', fr: 'Convaincre' },
                desc: { en: 'The action of persuading others to act according to your wishes.', fr: 'L\'action de persuader les autres d\'agir selon vos souhaits.' },
                linkedAttr: 'VOL',
                competences: ['NEGOCIATION', 'TROMPERIE', 'INSPIRATION']
            },
            INTERPRETER: {
                id: 'INTERPRETER',
                name: { en: 'Perform', fr: 'Interpréter' },
                desc: { en: 'The action of expressing oneself artistically.', fr: 'L\'action de s\'exprimer artistiquement.' },
                linkedAttr: 'PER',
                competences: ['INSTRUMENTAL', 'CHANT', 'NARRATION']
            },
            // Détection actions
            DISCERNER: {
                id: 'DISCERNER',
                name: { en: 'Discern', fr: 'Discerner' },
                desc: { en: 'The action of perceiving precisely through the primary senses.', fr: 'L\'action de percevoir avec précision par les sens principaux.' },
                linkedAttr: 'PER',
                competences: ['VISION', 'AUDITION', 'TOUCHER']
            },
            DECOUVRIR: {
                id: 'DECOUVRIR',
                name: { en: 'Discover', fr: 'Découvrir' },
                desc: { en: 'The action of finding hidden or unknown information.', fr: 'L\'action de trouver des informations cachées ou inconnues.' },
                linkedAttr: 'CRE',
                competences: ['INVESTIGATION', 'ESTIMATION', 'RESSENTI']
            },
            DEPISTER: {
                id: 'DEPISTER',
                name: { en: 'Track', fr: 'Dépister' },
                desc: { en: 'The action of perceiving through secondary and internal senses.', fr: 'L\'action de percevoir par les sens secondaires et internes.' },
                linkedAttr: 'EMP',
                competences: ['ODORAT', 'GOUT', 'INTEROCEPTION']
            },
            // Réflexion actions
            CONCEVOIR: {
                id: 'CONCEVOIR',
                name: { en: 'Design', fr: 'Concevoir' },
                desc: { en: 'The action of creating and planning with technical expertise.', fr: 'L\'action de créer et planifier avec expertise technique.' },
                linkedAttr: 'CRE',
                competences: ['ARTISANAT', 'MEDECINE', 'INGENIERIE']
            },
            ACCULTURER: {
                id: 'ACCULTURER',
                name: { en: 'Acculturate', fr: 'Acculturer' },
                desc: { en: 'The action of knowing and understanding cultures and social activities.', fr: 'L\'action de connaître et comprendre les cultures et activités sociales.' },
                linkedAttr: 'EMP',
                competences: ['JEUX', 'SOCIETE', 'GEOGRAPHIE']
            },
            ACCLIMATER: {
                id: 'ACCLIMATER',
                name: { en: 'Acclimate', fr: 'Acclimater' },
                desc: { en: 'The action of knowing and managing natural environments.', fr: 'L\'action de connaître et gérer les environnements naturels.' },
                linkedAttr: 'VOL',
                competences: ['NATURE', 'PASTORALISME', 'AGRONOMIE']
            },
            // Domination actions
            DISCIPLINER: {
                id: 'DISCIPLINER',
                name: { en: 'Discipline', fr: 'Discipliner' },
                desc: { en: 'The action of commanding, obeying, and resisting through willpower.', fr: 'L\'action de commander, obéir et résister par la force de volonté.' },
                linkedAttr: 'VOL',
                competences: ['COMMANDEMENT', 'OBEISSANCE', 'OBSTINANCE']
            },
            ENDURER: {
                id: 'ENDURER',
                name: { en: 'Endure', fr: 'Endurer' },
                desc: { en: 'The action of physically resisting needs and substances.', fr: 'L\'action de résister physiquement aux besoins et aux substances.' },
                linkedAttr: 'VIG',
                competences: ['GLOUTONNERIE', 'BEUVERIE', 'ENTRAILLES']
            },
            DOMPTER: {
                id: 'DOMPTER',
                name: { en: 'Tame', fr: 'Dompter' },
                desc: { en: 'The action of controlling other creatures through force or gentleness.', fr: 'L\'action de contrôler les autres créatures par la force ou la douceur.' },
                linkedAttr: 'FOR',
                competences: ['INTIMIDATION', 'APPRIVOISEMENT', 'DRESSAGE']
            }
        },
        competences: {
            // Puissance - Frapper
            ARME: { id: 'ARME', name: { en: '[Armed]', fr: '[Armé]' }, desc: { en: 'All hand-held melee weapons. Includes grip weapons (on hands/fingers), antipole weapons (heavy heads like axes/maces), parry weapons (shields), guard weapons (swords), balanced weapons (spears/staffs), and flexible weapons (flails/whips).', fr: 'Toutes les armes de mêlée portées à la main. Inclut les armes de poigne (sur les mains/doigts), d\'antipôle (tête lourde comme haches/masses), de parade (boucliers), de garde (épées), équilibrées (lances/bâtons) et flexibles (fléaux/fouets).' }, masteries: [
                { name: 'Arme de Poigne', desc: { en: 'Weapons on hands, fingers, or replacing the limb - bare fists included', fr: 'Armes sur les mains, doigts, ou remplaçant le membre - poings nus inclus' } },
                { name: "Arme d'Antipôle", desc: { en: 'Heavy-headed weapons (axes, maces, hammers, halberds)', fr: 'Armes à tête lourde (haches, masses, marteaux, hallebardes)' } },
                { name: 'Arme de Parade', desc: { en: 'Defensive weapons (shields, targes, bucklers, parrying daggers)', fr: 'Armes défensives (boucliers, targes, écus, dagues de parade)' } },
                { name: 'Arme de Garde', desc: { en: 'Guard weapons', fr: 'Armes de garde' } },
                { name: 'Armes Équilibrées', desc: { en: 'Blades (swords, rapiers), staffs, weapons with low center of gravity', fr: 'Lames (épées, rapières), bâtons, armes au centre de gravité bas' } },
                { name: 'Armes Flexibles', desc: { en: 'Flexible-body weapons (chains, flails, whips, ropes)', fr: 'Armes à corps flexible (chaînes, fléaux, fouets, cordes)' } }
            ] },
            DESARME: { id: 'DESARME', name: { en: '[Unarmed]', fr: '[Désarmé]' }, desc: { en: 'All blows struck without weapons: fists, feet, elbows, knees, head, whole body. Includes close combat techniques and strikes without room to move.', fr: 'Tous les coups portés sans arme : poings, pieds, coudes, genoux, tête, corps entier. Inclut les techniques de combat rapproché et les coups sans espace pour se déplacer.' }, masteries: [
                { name: 'Coup sans espace', desc: { en: 'Impulsive strikes without momentum, using the whole body in restricted space', fr: 'Coups impulsifs sans élan, utilisant le corps entier dans un espace restreint' } },
                { name: 'Poings', desc: { en: 'All kinds of punches', fr: 'Coups de poing de toutes sortes' } },
                { name: 'Pieds', desc: { en: 'Kicks, heel strikes, sweeps', fr: 'Coups de pied, de talon, balayages' } },
                { name: 'Coude', desc: { en: 'Elbow strikes', fr: 'Coups de coude' } },
                { name: 'Genou', desc: { en: 'Knee strikes', fr: 'Coups de genou' } },
                { name: 'Corps', desc: { en: 'Headbutts, shoulder strikes, body charges', fr: 'Coups de tête, d\'épaule, charges corporelles' } }
            ] },
            IMPROVISE: { id: 'IMPROVISE', name: { en: '[Improvised]', fr: '[Improvisé]' }, desc: { en: 'Fighting with anything that isn\'t a conventional weapon: benches, beer mugs, bottles, tools, furniture, etc.', fr: 'Se battre avec tout ce qui n\'est pas une arme conventionnelle : bancs, chopes de bière, bouteilles, outils, mobilier, etc.' }, masteries: [
                { name: 'Arme à coupures', desc: { en: 'Improvised cutting objects (broken glass, etc.)', fr: 'Objets tranchants improvisés (verre brisé, etc.)' } },
                { name: 'Arme à pieds', desc: { en: 'Objects used with feet', fr: 'Objets utilisés avec les pieds' } },
                { name: 'Arme rondes', desc: { en: 'Round or spherical objects', fr: 'Objets ronds ou sphériques' } },
                { name: 'Arme de mains', desc: { en: 'Objects held in hand', fr: 'Objets tenus en main' } },
                { name: 'Arme de paume', desc: { en: 'Flat objects held in palm', fr: 'Objets plats tenus dans la paume' } },
                { name: 'Arme de lien', desc: { en: 'Ropes, chains, improvised bindings', fr: 'Cordes, chaînes, liens improvisés' } },
                { name: "Jet d'arme improvisée", desc: { en: 'Throwing improvised objects', fr: 'Lancer des objets improvisés' } }
            ] },
            // Puissance - Neutraliser
            LUTTE: { id: 'LUTTE', name: { en: '[Wrestling]', fr: '[Lutte]' }, desc: { en: 'All armed or unarmed wrestling maneuver techniques: grabs, shoves, takedowns, immobilizations, submissions, disarms, weapon destruction, beats, etc.', fr: 'Toutes les techniques des manœuvres de lutte armée ou non : saisies, bousculades, mises à terre, immobilisations, soumissions, désarmements, destruction d\'arme, battements, etc.' }, masteries: [
                { name: 'Saisie', desc: { en: 'Grabbing and holding an adversary or their limbs', fr: 'Attraper et maintenir un adversaire ou ses membres' } },
                { name: 'Bousculade', desc: { en: 'Pushing, shoving, unbalancing', fr: 'Pousser, repousser, déséquilibrer' } },
                { name: 'Mise à Terre', desc: { en: 'Knocking the adversary to the ground', fr: 'Faire tomber l\'adversaire au sol' } },
                { name: 'Projection', desc: { en: 'Throwing the adversary over oneself or at distance', fr: 'Lancer l\'adversaire par-dessus soi ou à distance' } },
                { name: 'Soumission', desc: { en: 'Painful immobilization techniques forcing surrender', fr: 'Techniques d\'immobilisation douloureuses forçant l\'abandon' } }
            ] },
            BOTTES: { id: 'BOTTES', name: { en: '[Techniques]', fr: '[Bottes]' }, desc: { en: 'Special combat techniques using the weapon in particular ways, beyond simple attacks.', fr: 'Techniques spéciales de combat utilisant l\'arme de manière particulière, au-delà des simples attaques.' }, masteries: [
                { name: 'Bloquer', desc: { en: 'Stopping an attack with your weapon', fr: 'Arrêter une attaque avec son arme' } },
                { name: 'Agrippement', desc: { en: 'Using weapon to hook adversary or their equipment', fr: 'Utiliser l\'arme pour accrocher l\'adversaire ou son équipement' } },
                { name: 'Entravement', desc: { en: 'Hindering adversary\'s movements with weapon', fr: 'Gêner les mouvements de l\'adversaire avec l\'arme' } },
                { name: 'Désarmement', desc: { en: 'Making adversary drop their weapon', fr: 'Faire lâcher son arme à l\'adversaire' } },
                { name: "Prise d'arme", desc: { en: 'Seizing adversary\'s weapon', fr: 'S\'emparer de l\'arme de l\'adversaire' } },
                { name: "Retournement d'arme", desc: { en: 'Using adversary\'s weapon against them', fr: 'Utiliser l\'arme de l\'adversaire contre lui' } }
            ] },
            RUSES: { id: 'RUSES', name: { en: '[Tricks]', fr: '[Ruses]' }, desc: { en: 'Feints, deceptions, and combat tactics to gain the advantage.', fr: 'Feintes, tromperies et tactiques de combat pour gagner l\'avantage.' }, masteries: [
                { name: 'Enchaînement', desc: { en: 'Bonus when chaining assault actions', fr: 'Bonus en enchaînant les actions d\'assaut' } },
                { name: 'Feinter', desc: { en: 'Deceiving with false movements', fr: 'Induire en erreur par de faux mouvements' } },
                { name: 'Contre', desc: { en: 'Responding to an attack with an attack', fr: 'Répondre à une attaque par une attaque' } },
                { name: 'Hébétement', desc: { en: 'Stunning or mentally destabilizing adversary', fr: 'Étourdir ou déstabiliser mentalement l\'adversaire' } },
                { name: 'Essouffler', desc: { en: 'Tiring adversary through combat', fr: 'Fatiguer l\'adversaire par le combat' } },
                { name: 'Battement', desc: { en: 'Striking opposing weapon to deflect it', fr: 'Frapper l\'arme adverse pour la dévier' } },
                { name: 'Destruction', desc: { en: 'Damaging or breaking enemy weapon/equipment', fr: 'Abîmer ou briser l\'arme/équipement ennemi' } },
                { name: 'Postures', desc: { en: 'Advantageous combat positions', fr: 'Positions de combat avantageuses' } },
                { name: "Prises d'arme", desc: { en: 'Techniques for seizing a weapon in combat', fr: 'Techniques pour saisir une arme en combat' } }
            ] },
            // Puissance - Tirer
            BANDE: { id: 'BANDE', name: { en: '[Strung]', fr: '[Bandé]' }, desc: { en: 'All hand-drawn ranged weapons firing pellets or arrows: shortbows, longbows, recurve bows, repeating pendulum bows, etc.', fr: 'Toutes les armes à distance bandées à la main et tirant des billes ou flèches : arcs courts, longs, réfléchis, pendules à répétition, etc.' }, masteries: [
                { name: 'Encordage', desc: { en: 'Quickly stringing the bow', fr: 'Mettre la corde rapidement' } },
                { name: 'Surbandé', desc: { en: 'Drawing bow beyond limit for more power', fr: 'Bander l\'arc au-delà de sa limite pour plus de puissance' } },
                { name: 'Tirs Courbés', desc: { en: 'Making arrow curve to avoid obstacles', fr: 'Faire courber la flèche pour éviter des obstacles' } },
                { name: 'Tirs multiples', desc: { en: 'Firing multiple arrows simultaneously', fr: 'Tirer plusieurs flèches simultanément' } }
            ] },
            PROPULSE: { id: 'PROPULSE', name: { en: '[Propelled]', fr: '[Propulsé]' }, desc: { en: 'All ranged weapons using a propulsion mechanism: slings, atlatls, slingshots.', fr: 'Toutes les armes à distance utilisant un mécanisme de propulsion : frondes, propulseurs, lance-pierres.' }, masteries: [
                { name: 'Tirs Rapprochés', desc: { en: 'Spinning vertically to shoot at close range', fr: 'Tournoyer verticalement pour tirer à courte distance' } },
                { name: 'Tirs Longue Distance', desc: { en: 'Spinning laterally to shoot at long range', fr: 'Tournoyer latéralement pour tirer à longue distance' } },
                { name: 'Tirs Imprévisibles', desc: { en: 'Spinning in figure-8 so targets don\'t know who\'s aimed at', fr: 'Tournoyer en figure de 8 pour que les cibles ne sachent pas qui est visé' } },
                { name: 'Tirs sur 360', desc: { en: 'Spinning overhead to shoot in any direction', fr: 'Tournoyer au-dessus de soi pour tirer dans n\'importe quelle direction' } }
            ] },
            JETE: { id: 'JETE', name: { en: '[Thrown]', fr: '[Jeté]' }, desc: { en: 'All weapons thrown directly from the hand: knives, stars, axes, throwing javelins.', fr: 'Toutes les armes jetées directement de la main : couteaux, étoiles, haches, javelots de lancer.' }, masteries: [
                { name: 'de Paume', desc: { en: 'Throwing weapons using fingers or palm (knives, stars, discs)', fr: 'Armes de jet tirées avec les doigts ou la paume (couteaux, étoiles, disques)' } },
                { name: 'à Manche', desc: { en: 'Throwing weapons with handles (javelins, boomerangs, hatchets)', fr: 'Armes de jet ayant un manche (javelots, boomerangs, hachettes)' } },
                { name: 'Rattrapage de jet', desc: { en: 'Catching projectiles or objects in flight', fr: 'Rattraper des projectiles ou objets en vol' } },
                { name: 'Jets multiples', desc: { en: 'Throwing multiple projectiles simultaneously', fr: 'Lancer plusieurs projectiles simultanément' } }
            ] },
            // Aisance - Réagir
            FLUIDITE: { id: 'FLUIDITE', name: { en: '[Fluidity]', fr: '[Fluidité]' }, desc: { en: 'Performing actions more quickly when pressed or limited by time or situation. Reactivity, timing, and perfect rhythm of actions.', fr: 'Faire les actions plus rapidement lorsque pressé ou limité par le temps ou la situation. La réactivité, le timing et le rythme parfait des actions.' }, masteries: [
                { name: 'Réactivité', desc: { en: 'Adds dice to Reactivity roll giving first moments in Conflict', fr: 'Ajoute des dés au jet de Réactivité donnant les 1ers éclats d\'un Conflit' } },
                { name: 'Spontanéité', desc: { en: 'Reduce stagger following Over-reactions', fr: 'Réduire le nombre d\'ébranlements suite à des Surréactions' } },
                { name: 'Rythmique', desc: { en: 'Performing actions with perfect timing and rhythm, synchronizing moments', fr: 'Effectuer des actions avec un timing et un rythme parfaits, synchroniser ses éclats' } },
                { name: 'Feinter', desc: { en: 'Deceiving with false movements to gain advantage', fr: 'Induire en erreur par de faux mouvements pour obtenir un avantage' } },
                { name: 'Contrer', desc: { en: 'Immediately responding to an opposing action', fr: 'Répondre immédiatement à une action adverse' } }
            ] },
            ESQUIVE: { id: 'ESQUIVE', name: { en: '[Dodge]', fr: '[Esquive]' }, desc: { en: 'Avoidance of accidental or sudden damage through reflex, dexterity, and flair.', fr: 'Évitement des dégâts accidentels ou soudains par réflexe, doigté et flair.' }, masteries: [
                { name: 'Repositionnante', desc: { en: 'Dodge that repositions you advantageously', fr: 'Esquive qui vous replace avantageusement' } },
                { name: 'en Roulade', desc: { en: 'Dodge by rolling on the ground', fr: 'Esquive en roulant au sol' } },
                { name: 'Préparée', desc: { en: 'Anticipated and planned dodge', fr: 'Esquive anticipée et planifiée' } },
                { name: 'Instinctive', desc: { en: 'Pure reflex dodge', fr: 'Esquive purement réflexe' } }
            ] },
            EVASION: { id: 'EVASION', name: { en: '[Evasion]', fr: '[Évasion]' }, desc: { en: 'Freeing oneself from a grapple, an embrace, a grab, from beings climbing on us, etc.', fr: 'Se libérer d\'une lutte, d\'une étreinte, d\'une saisie, d\'êtres nous grimpant dessus, etc.' }, masteries: [
                { name: '(Dés)Engagement', desc: { en: 'Quickly entering or exiting through enemy weapon range', fr: 'Sortir ou entrer rapidement à travers la portée de l\'arme ennemie' } },
                { name: 'Faufilage', desc: { en: 'Maneuvering in complex environments, tight spaces, crowded rooms', fr: 'Manœuvrer dans des environnements complexes, espaces restreints, pièces bondées' } },
                { name: 'Déliement', desc: { en: 'Untangling or freeing from bindings (ropes, vines)', fr: 'Se démêler ou se libérer des liens (cordes, lianes, vignes)' } },
                { name: 'Délivrement', desc: { en: 'Untangling or freeing from others\' force and holds (wrestling)', fr: 'Se démêler ou se libérer de la force et des prises d\'autrui (lutte)' } }
            ] },
            // Aisance - Dérober
            ESCAMOTAGE: { id: 'ESCAMOTAGE', name: { en: '[Sleight]', fr: '[Escamotage]' }, desc: { en: 'Pickpocketing, diverting attention when close to target, hiding objects on oneself or others, emptying pockets, etc.', fr: 'Vol à la tire, diversion de l\'attention lorsque proche de la cible, cache d\'objet sur soi ou autrui, faire les poches, etc.' }, masteries: [
                { name: 'Espionnant', desc: { en: 'Discreetly stealing important information', fr: 'Voler des informations importantes de façon discrète' } },
                { name: "d'Objets portés", desc: { en: 'Stealing objects from a person', fr: 'Dérober des objets sur une personne' } },
                { name: 'de Véhicules', desc: { en: 'Taking discreet control of a vehicle', fr: 'Prendre le contrôle discret d\'un véhicule' } },
                { name: 'de Créatures', desc: { en: 'Stealing a creature or person without being discovered', fr: 'Voler une créature ou une personne sans être découvert' } }
            ] },
            ILLUSIONS: { id: 'ILLUSIONS', name: { en: '[Illusions]', fr: '[Illusions]' }, desc: { en: 'Prestidigitation, cheating, sleight of hand, stage magic. The ability to deceive the observer using illusion techniques.', fr: 'Prestidigitation, tricherie, passe-passe, magie de scène. La capacité à tromper l\'observateur en utilisant des techniques d\'illusion.' }, masteries: [
                { name: 'Trichantes', desc: { en: 'Using illusions to cheat at games', fr: 'Utiliser des illusions pour tricher aux jeux' } },
                { name: 'Spectaculaires', desc: { en: 'Staging stunning visual shows', fr: 'Mise en scène de spectacles visuels époustouflants' } },
                { name: 'de Diversion', desc: { en: 'Creating non-existent images or sounds to distract attention', fr: 'Créer des images ou sons inexistants pour distraire l\'attention' } },
                { name: 'de Disparition', desc: { en: 'Making an object or person appear to disappear', fr: 'Faire croire à la disparition d\'un objet ou d\'une personne' } }
            ] },
            DISSIMULATION: { id: 'DISSIMULATION', name: { en: '[Concealment]', fr: '[Dissimulation]' }, desc: { en: 'Camouflage in shadows and silence, the art of not being noticed.', fr: 'Camouflage dans les ombres et le silence, l\'art de ne pas se faire remarquer.' }, masteries: [
                { name: 'Se cacher', desc: { en: 'Becoming invisible using environmental cover', fr: 'Se rendre invisible en utilisant la couverture de l\'environnement' } },
                { name: 'Cacher des Choses', desc: { en: 'Hiding objects or information', fr: 'Masquer des objets ou des informations' } },
                { name: 'Déplacement silencieux', desc: { en: 'Moving without being spotted, without making noise', fr: 'Se déplacer sans être repéré, sans faire de bruits' } },
                { name: 'Embuscades/Filatures', desc: { en: 'Planning and executing ambushes or discreet tails', fr: 'Planifier et exécuter des embuscades ou filatures discrètes' } }
            ] },
            // Aisance - Coordonner
            GESTUELLE: { id: 'GESTUELLE', name: { en: '[Gestures]', fr: '[Gestuelle]' }, desc: { en: 'Graceful or imposing movements, acrobatic, rhythmic. Body expression and dance.', fr: 'Mouvements grâcieux ou imposants, acrobatiques, rythmiques. Expression corporelle et danse.' }, masteries: [
                { name: 'Danse', desc: { en: 'Graceful and attractive movements, dance performance', fr: 'Mouvements gracieux et attractifs, performance de danse' } },
                { name: 'Posture (au combat)', desc: { en: 'Advantageous body positions in combat', fr: 'Positions corporelles avantageuses en combat' } },
                { name: 'Pantomime', desc: { en: 'Expression without words, mime', fr: 'Expression sans paroles, mime' } },
                { name: 'Rituelle', desc: { en: 'Dancing according to religious or spiritual traditions', fr: 'Danser selon des traditions religieuses ou spirituelles' } },
                { name: 'Athlétique', desc: { en: 'Dancing with quick and dynamic movements', fr: 'Danser avec des mouvements rapides et dynamiques' } },
                { name: 'Improvisée', desc: { en: 'Dancing without preestablished plan, with fluidity and creativity', fr: 'Danser sans plan préétabli, avec fluidité et créativité' } }
            ] },
            MINUTIE: { id: 'MINUTIE', name: { en: '[Meticulousness]', fr: '[Minutie]' }, desc: { en: 'The ability to direct power in a graceful and precise way.', fr: 'La capacité à diriger la puissance d\'une façon grâcieuse et précise.' }, masteries: [
                { name: 'Délicatesse', desc: { en: 'Working with extreme delicacy, handling fragile objects', fr: 'Travailler avec extrême délicatesse, manier des objets fragiles' } },
                { name: 'Doigté', desc: { en: 'Controlling applied force with great finger precision', fr: 'Contrôler la force exercée avec une grande précision des doigts' } },
                { name: 'Impact', desc: { en: 'Controlling or adapting blow power to inflict desired force', fr: 'Contrôler ou adapter la puissance d\'un coup pour infliger la force désirée' } },
                { name: 'Impulsion', desc: { en: 'Synchronizing all muscles to produce greatest force with minimum movement', fr: 'Faire concorder tous ses muscles pour produire la plus grande force avec le minimum de mouvement' } }
            ] },
            EQUILIBRE: { id: 'EQUILIBRE', name: { en: '[Balance]', fr: '[Équilibre]' }, desc: { en: 'Tightrope walking, stability, mountaineering, maintaining balance in all circumstances.', fr: 'Marche sur fil, stabilité, alpinisme, maintien de l\'équilibre en toutes circonstances.' }, masteries: [
                { name: 'Stabilisant', desc: { en: 'Maintaining balance to stabilize after being knocked down, shoved', fr: 'Maintenir l\'équilibre pour se stabiliser après avoir été renversé, bousculé' } },
                { name: 'en Sols difficiles', desc: { en: 'Keeping balance on difficult, sloped, slippery surfaces', fr: 'Garder l\'équilibre sur surfaces difficiles, pentues, glissantes' } },
                { name: 'Funambule', desc: { en: 'Performing acrobatics on rope, wire, or very narrow ground', fr: 'Effectuer des acrobaties sur une corde, un fil, ou un sol très étroit' } },
                { name: 'Jonglage', desc: { en: 'Manipulating multiple objects at once without dropping them', fr: 'Manipuler plusieurs objets en même temps sans les faire tomber' } },
                { name: 'Surchargé', desc: { en: 'Carrying loads with balance using entire body', fr: 'Porter des charges avec équilibre en utilisant tout son corps' } }
            ] },
            // Précision - Manier
            VISEE: { id: 'VISEE', name: { en: '[Aim]', fr: '[Visée]' }, desc: { en: 'Aiming and firing all ranged weapons using a mechanism (crossbows, blowguns, firearms, etc.), light or heavy, simple or repeating.', fr: 'La visée et le tir de toutes les armes à distance utilisant un mécanisme (arbalètes, sarbacanes, fusils, etc.), légères ou lourdes, simples ou à répétition.' }, masteries: [
                { name: "Mécanismes d'armement", desc: { en: 'Reduce inertia needed for weapon rearming', fr: 'Réduire l\'inertie nécessaire au réarmement de l\'arme' } },
                { name: 'Tir à longue distance', desc: { en: 'Aiming beyond Range factor', fr: 'Viser au-delà du facteur de Portée' } },
                { name: 'Tir de soutien', desc: { en: 'Covering an ally effortlessly, shooting in reaction', fr: 'Couvrir un allié sans efforts, tirer en réaction' } },
                { name: 'en Position difficile', desc: { en: 'Shooting crouched, prone, through arrow slits', fr: 'Tirer accroupi, couché, dans des meurtrières' } },
                { name: 'Visée multiple', desc: { en: 'Firing multiple munitions simultaneously', fr: 'Tirer plusieurs munitions simultanément' } }
            ] },
            CONDUITE: { id: 'CONDUITE', name: { en: '[Driving]', fr: '[Conduite]' }, desc: { en: 'Vehicles, carriages, or others. Aerial stability, gliding, twirling. Everything concerning vehicle piloting.', fr: 'Véhicules, carrosses ou autres. Stabilité aérienne, planer, virevolter. Tout ce qui concerne le pilotage de véhicules.' }, masteries: [
                { name: 'Propulsion personnelle', desc: { en: 'Pedals, skis, boards, oars', fr: 'À pédales, sur skis, sur planches, à rames' } },
                { name: 'Tirée par créatures', desc: { en: 'Carts, wagons, carriages, chariots', fr: 'Chariots, wagons, carrosses, chars' } },
                { name: 'dans le Risque', desc: { en: 'Risky driving, shortcuts, races', fr: 'Conduire de façon risquée, raccourcis, courses' } },
                { name: 'la Terre', desc: { en: 'Drilling, boring, in tunnels, caves', fr: 'Creusant, forant, dans les tunnels, cavernes' } },
                { name: 'les Liquides', desc: { en: 'Navigation on liquid surfaces (lakes, rivers)', fr: 'Navigation sur surfaces liquides (lacs, rivières)' } },
                { name: 'les Airs', desc: { en: 'High altitude flight and in winds', fr: 'Vol en haute altitude et dans les vents' } },
                { name: 'le Vide', desc: { en: 'Piloting in space with gravity and propulsion knowledge', fr: 'Piloter dans l\'espace avec connaissance de la gravité et propulsion' } },
                { name: 'sur Terrain difficile', desc: { en: 'All-terrain, mountainous, steep', fr: 'Tout-terrains, montagnards, escarpé' } },
                { name: 'sur Pistes/Rails', desc: { en: 'Wagons, trains, guided vehicles', fr: 'Wagons, trains, véhicules guidés' } },
                { name: 'sur Liquides (glisse)', desc: { en: 'Gliding on water, mud, sand', fr: 'Glisser sur l\'eau, la boue, le sable' } }
            ] },
            HABILETE: { id: 'HABILETE', name: { en: '[Deftness]', fr: '[Habileté]' }, desc: { en: 'The simple ability to manipulate and master all things in hands or other forms of prehension.', fr: 'La simple capacité à manipuler et maîtriser toutes les choses en mains ou autres formes de préhension.' }, masteries: [
                { name: 'Une main', desc: { en: 'Handling a tool or weapon in one hand', fr: 'Manier un outil ou une arme dans une seule main' } },
                { name: 'Deux mains', desc: { en: 'Tools and weapons with handle just long enough for two hands', fr: 'Outils et armes avec un manche juste assez long pour deux mains' } },
                { name: 'Ambidextrie', desc: { en: 'Using both hands equally', fr: 'Utiliser les deux mains de façon égale' } },
                { name: 'Recharge/Réarmement', desc: { en: 'Reloading ammunition and rearming ranged weapons', fr: 'Recharger les munitions et réarmer les armes à distance' } },
                { name: 'Munition en Main', desc: { en: 'Increasing ammunition carried in hand', fr: 'Augmenter le nombre de munitions portées en main' } },
                { name: 'Parade', desc: { en: 'Using object to block', fr: 'Utiliser l\'objet pour bloquer' } }
            ] },
            // Précision - Façonner
            DEBROUILLARDISE: { id: 'DEBROUILLARDISE', name: { en: '[Resourcefulness]', fr: '[Débrouillardise]' }, desc: { en: 'Preparation and survival methods for any journey\'s needs: setting up camp, orientation, precautions.', fr: 'Méthodes de préparation et de survie pour les besoins de tout voyage : monter le camp, orientation, précautions.' }, masteries: [
                { name: 'Monte de camp', desc: { en: 'Setting up an efficient camp', fr: 'Établir un campement efficace' } },
                { name: 'Orientation', desc: { en: 'Finding your bearings and way', fr: 'Se repérer et trouver son chemin' } },
                { name: 'Allumage/Extinction', desc: { en: 'Creating and controlling fire', fr: 'Créer et contrôler le feu' } },
                { name: 'Camouflage', desc: { en: 'Concealing a place or objects', fr: 'Dissimuler un lieu ou des objets' } }
            ] },
            BRICOLAGE: { id: 'BRICOLAGE', name: { en: '[Tinkering]', fr: '[Bricolage]' }, desc: { en: 'Counterfeiting, improvement, repair, and improvisation of objects and tools.', fr: 'Contrefaçon, amélioration, réparation et improvisation d\'objets et d\'outils.' }, masteries: [
                { name: 'Contrefaçon', desc: { en: 'Creating copies of objects', fr: 'Créer des copies d\'objets' } },
                { name: 'Raccommodage', desc: { en: 'Repairing damaged objects', fr: 'Réparer des objets endommagés' } },
                { name: 'Amélioration', desc: { en: 'Improving an object\'s capabilities', fr: 'Améliorer les capacités d\'un objet' } },
                { name: 'Improvisation', desc: { en: 'Creating objects with makeshift materials', fr: 'Créer des objets avec des matériaux de fortune' } }
            ] },
            SAVOIR_FAIRE: { id: 'SAVOIR_FAIRE', name: { en: '[Know-How]', fr: '[Savoir-Faire]' }, desc: { en: 'All physical and manual practice of an art. Knowing how to do things, without necessarily knowing why it works—the descriptive and active technique. Linked to repair, maintenance, quality, precision, and craftsmanship consistency.', fr: 'Toute pratique physique et manuelle d\'un art. Savoir-faire ces choses, sans pour autant connaître les vraies raisons de pourquoi une telle chose fonctionne - la technique, descriptive et active. Lié à la réparation, l\'entretien, la qualité, la précision et la constance de l\'artisanat.' }, masteries: [
                { name: 'Alimentaire', desc: { en: 'Food preparation', fr: 'Préparation de nourriture' } },
                { name: 'des Graisses', desc: { en: 'Working with oils and fats', fr: 'Travail des huiles et graisses' } },
                { name: 'du Papier', desc: { en: 'Paper manufacture and work', fr: 'Fabrication et travail du papier' } },
                { name: 'des Plantes', desc: { en: 'Plant work', fr: 'Travail des végétaux' } },
                { name: 'du Textile', desc: { en: 'Weaving, sewing', fr: 'Tissage, couture' } },
                { name: 'du Cuir', desc: { en: 'Tanning and leatherwork', fr: 'Tannage et travail du cuir' } },
                { name: 'du Verre', desc: { en: 'Glassblowing and glasswork', fr: 'Soufflage et travail du verre' } },
                { name: 'de la Construction', desc: { en: 'Building, masonry', fr: 'Bâtiment, maçonnerie' } },
                { name: 'des Métaux', desc: { en: 'Forging, metallurgy', fr: 'Forge, métallurgie' } },
                { name: 'des Richesses', desc: { en: 'Jewelry, goldsmithing', fr: 'Joaillerie, orfèvrerie' } },
                { name: 'du Bois', desc: { en: 'Carpentry, cabinetmaking', fr: 'Menuiserie, ébénisterie' } },
                { name: 'de la Lutherie', desc: { en: 'Instrument making', fr: 'Fabrication d\'instruments' } },
                { name: 'des Arts plastiques', desc: { en: 'Sculpture, modeling', fr: 'Sculpture, modelage' } },
                { name: 'des Arts de dessein', desc: { en: 'Drawing, painting', fr: 'Dessin, peinture' } },
                { name: 'de la Récolte', desc: { en: 'Gathering and harvesting techniques', fr: 'Techniques de cueillette et récolte' } }
            ] },
            // Précision - Fignoler
            ARTIFICES: { id: 'ARTIFICES', name: { en: '[Devices]', fr: '[Artifices]' }, desc: { en: 'Priming and defusing traps or bombs, setting snares.', fr: 'Amorçage et désamorçage de pièges ou de bombes, pose de trappes.' }, masteries: [
                { name: 'Amorçage', desc: { en: 'Triggering devices in controlled manner', fr: 'Déclencher des dispositifs de manière contrôlée' } },
                { name: 'Désamorçage', desc: { en: 'Neutralizing explosive devices', fr: 'Neutraliser les dispositifs explosifs' } },
                { name: 'Enfumants', desc: { en: 'Using substances to generate smoke', fr: 'Utiliser des substances pour générer de la fumée' } },
                { name: 'Explosifs', desc: { en: 'Making and handling explosive substances', fr: 'Fabriquer et manipuler des substances explosives' } }
            ] },
            SECURITE: { id: 'SECURITE', name: { en: '[Security]', fr: '[Sécurité]' }, desc: { en: 'Lockpicking, locking, unlocking, and all locksmithing or copying of keys or locks.', fr: 'Crochetage, verrouillage, déverrouillage et toute serrurerie ou copie de clefs ou de serrures.' }, masteries: [
                { name: 'Déverrouillage', desc: { en: 'Opening doors and locks without key', fr: 'Ouvrir des portes et verrous sans clé' } },
                { name: 'Verrouillage', desc: { en: 'Securing a closure with a lock', fr: 'Sécuriser une fermeture à l\'aide d\'un verrou' } },
                { name: 'Copie de serrure', desc: { en: 'Duplicating a lock', fr: 'Dupliquer une serrure' } },
                { name: 'Copie de Clef', desc: { en: 'Duplicating a key', fr: 'Dupliquer une clé' } }
            ] },
            CASSE_TETES: { id: 'CASSE_TETES', name: { en: '[Puzzles]', fr: '[Casse-Têtes]' }, desc: { en: 'Solving knots, puzzles, and other enigmas requiring both dexterity and intellect.', fr: 'Résolution des nœuds, des puzzles et autres énigmes nécessitant autant un doigté qu\'une forme d\'intellect.' }, masteries: [
                { name: "Nœuds d'Attelage", desc: { en: 'Knots for attaching rope to an object', fr: 'Nœuds pour attacher une corde à un objet' } },
                { name: 'de Saisine', desc: { en: 'Knots for attaching objects together', fr: 'Nœuds pour attacher des objets ensemble' } },
                { name: 'de Coude', desc: { en: 'Knots for attaching ropes together', fr: 'Nœuds pour attacher des cordes ensemble' } },
                { name: 'de Boucle', desc: { en: 'Knots to create attachment point or grip', fr: 'Nœuds pour créer un point d\'attache ou une prise' } },
                { name: 'Épissure de corde', desc: { en: 'Forming semi-permanent joints between ropes', fr: 'Formation de joints semi-permanents entre cordes' } },
                { name: 'Casse-têtes', desc: { en: 'Understanding complex puzzle mechanisms', fr: 'Comprendre les mécanismes complexes des casse-têtes' } },
                { name: 'Craque-coffre', desc: { en: 'Understanding safe security mechanisms', fr: 'Comprendre les mécanismes de sécurité des coffres' } },
                { name: 'Puzzles', desc: { en: 'Solving physical puzzles', fr: 'Résoudre des puzzles physiques' } }
            ] },
            // Athlétisme - Traverser
            PAS: { id: 'PAS', name: { en: '[Step]', fr: '[Pas]' }, desc: { en: 'Walking, running, jogging, crawling, marathon. Also flight for airborne beings or movement without intermediaries (space).', fr: 'Marche, course, jogging, rampe, marathon. Aussi le vol pour ceux dans les airs ou le déplacement sans intermédiaires (espace).' }, masteries: [
                { name: 'Ramper', desc: { en: 'Crawling on belly to avoid obstacles and enemies', fr: 'Se déplacer à plat ventre pour éviter les obstacles et ennemis' } },
                { name: 'Marcher', desc: { en: 'Walking stably to cover long distances', fr: 'Se déplacer en marchant de manière stable pour parcourir de longues distances' } },
                { name: 'Courir', desc: { en: 'Moving quickly to reach destinations or pursue', fr: 'Se déplacer rapidement pour atteindre des destinations ou poursuivre' } },
                { name: 'Charger', desc: { en: 'Moving at maximum speed for brief emergencies', fr: 'Se déplacer à vitesse maximale pour de brèves périodes d\'urgence' } },
                { name: 'Pédaler', desc: { en: 'Moving using rotating mechanisms and pedals', fr: 'Se déplacer en utilisant des mécanismes rotatifs et pédales' } }
            ] },
            GRIMPE: { id: 'GRIMPE', name: { en: '[Climb]', fr: '[Grimpe]' }, desc: { en: 'Climbing trees, mountains, glaciers, or other more or less smooth, sticky surfaces, even on beings themselves.', fr: 'Grimpe dans les arbres, montagnes, glaciers ou autres surfaces plus ou moins lisses, collantes, voire sur des êtres eux-mêmes.' }, masteries: [
                { name: 'Montagnard', desc: { en: 'Mountain climbing', fr: 'Escalade en montagne' } },
                { name: 'Glaciaire', desc: { en: 'Ice climbing', fr: 'Escalade sur glace' } },
                { name: 'Descendant', desc: { en: 'Controlled descent', fr: 'Descente contrôlée' } },
                { name: 'en Rappel', desc: { en: 'Rope descent', fr: 'Descente avec corde' } },
                { name: 'sur Créature', desc: { en: 'Climbing on a living being', fr: 'Grimper sur un être vivant' } }
            ] },
            NATATION: { id: 'NATATION', name: { en: '[Swimming]', fr: '[Natation]' }, desc: { en: 'Swimming, marine rescue, drowning prevention, floating in place for extended periods.', fr: 'Nager, secourisme marin, prévention de la noyade, flotter sur place et longtemps.' }, masteries: [
                { name: 'Plongeant', desc: { en: 'Underwater diving', fr: 'Plongée sous-marine' } },
                { name: 'Contre-courant', desc: { en: 'Swimming against the current', fr: 'Nager contre le courant' } },
                { name: 'de Compétition', desc: { en: 'Fast and technical swimming', fr: 'Nage rapide et technique' } },
                { name: 'Flotter surplace', desc: { en: 'Staying still at the surface', fr: 'Rester immobile à la surface' } },
                { name: 'Secourisme', desc: { en: 'Water rescue', fr: 'Sauvetage en milieu aquatique' } },
                { name: 'Bataille immergée', desc: { en: 'Underwater combat', fr: 'Combat sous l\'eau' } }
            ] },
            // Athlétisme - Efforcer
            PORT: { id: 'PORT', name: { en: '[Carry]', fr: '[Port]' }, desc: { en: 'Carrying, equipping, pushing, pulling, lifting, pressing, opening, closing, throwing any weight or thing with force.', fr: 'Porter, équiper, pousser, tirer, soulever, appuyer, ouvrir, fermer, jeter tout poids ou chose avec force.' }, masteries: [
                { name: 'Tirer & Pousser', desc: { en: 'Handling heavy objects with controlled force', fr: 'Manier les objets lourds avec force contrôlée' } },
                { name: 'Soulever & Ouvrir', desc: { en: 'Lifting and opening heavy objects with maximum efficiency', fr: 'Soulever et ouvrir les objets pesants avec efficacité maximale' } },
                { name: 'Porter', desc: { en: 'Carrying heavy loads over long distances', fr: 'Transporter des charges lourdes sur de longues distances' } },
                { name: 'Lancer', desc: { en: 'Throwing objects with precision and force', fr: 'Jeter des objets avec précision et force' } },
                { name: 'Supporter (Équiper)', desc: { en: 'Wearing heavy equipment comfortably, minimizing movement restrictions', fr: 'Porter des équipements lourds confortablement, minimiser les restrictions de mouvements' } }
            ] },
            SAUT: { id: 'SAUT', name: { en: '[Jump]', fr: '[Saut]' }, desc: { en: 'High jump, long jump, standing jump, etc.', fr: 'Saut en hauteur, en longueur, à pieds joints, etc.' }, masteries: [
                { name: 'Sans élan', desc: { en: 'Jumping without running start', fr: 'Effectuer des sauts sans départ, sans courir' } },
                { name: 'Précis', desc: { en: 'Precise and controlled jumps, landing exactly where desired', fr: 'Faire des sauts précis et contrôlés, atterrir exactement où souhaité' } },
                { name: 'en Longueur', desc: { en: 'Covering long distance in a single jump', fr: 'Couvrir une longue distance en un seul saut' } },
                { name: 'en Hauteur', desc: { en: 'Jumping high in the air', fr: 'Sauter haut dans les airs' } },
                { name: 'de Paroi', desc: { en: 'Wall jumping to reach new heights', fr: 'Sauter des murs pour atteindre de nouvelles hauteurs' } },
                { name: 'à la Perche', desc: { en: 'Jumping using a pole for support', fr: 'Saut en prenant appui sur une perche' } }
            ] },
            FOUISSAGE: { id: 'FOUISSAGE', name: { en: '[Burrowing]', fr: '[Fouissage]' }, desc: { en: 'Digging and moving through ground, or through liquids too dense for normal swimming.', fr: 'Creuser et se déplacer dans les sols, ou dans les liquides trop denses pour y nager normalement.' }, masteries: [
                { name: 'Viscosité & Liquides', desc: { en: 'Moving through thick liquids', fr: 'Se déplacer dans des liquides épais' } },
                { name: 'Sables & Granulaires', desc: { en: 'Digging in sand and granular materials', fr: 'Creuser dans le sable et matériaux granulaires' } },
                { name: 'Terres & Gravats', desc: { en: 'Digging in earth and rubble', fr: 'Creuser dans la terre et les gravats' } },
                { name: 'Roches & Solides', desc: { en: 'Digging in rock and solid materials', fr: 'Creuser dans la roche et matériaux solides' } }
            ] },
            // Athlétisme - Manœuvrer
            VOL: { id: 'VOL', name: { en: '[Flight]', fr: '[Vol]' }, desc: { en: 'Ability to move through the air, whether by wings, magical, or mechanical means.', fr: 'Capacité de se déplacer dans les airs, que ce soit par des ailes, des moyens magiques ou mécaniques.' }, masteries: [
                { name: 'Planer', desc: { en: 'Gliding through air without flapping', fr: 'Glisser dans les airs sans battement d\'ailes' } },
                { name: 'Piquer', desc: { en: 'Diving at high speed', fr: 'Descendre en piqué à grande vitesse' } },
                { name: 'Flotter', desc: { en: 'Staying still in the air', fr: 'Rester immobile dans les airs' } },
                { name: 'Poussée', desc: { en: 'Accelerating in the air', fr: 'Accélérer dans les airs' } }
            ] },
            ACROBATIE: { id: 'ACROBATIE', name: { en: '[Acrobatics]', fr: '[Acrobatie]' }, desc: { en: 'Rolls, contortionism, falls, pirouettes, somersaults, show performance.', fr: 'Roulades, contorsionnisme, chutes, pirouettes, sauts périlleux, performance de spectacle.' }, masteries: [
                { name: 'Aérienne', desc: { en: 'Aerial acrobatics', fr: 'Acrobaties en l\'air' } },
                { name: 'Sauts périlleux', desc: { en: 'Rotations in the air', fr: 'Rotations en l\'air' } },
                { name: 'Chuter', desc: { en: 'Falling in controlled manner', fr: 'Tomber de manière contrôlée' } },
                { name: 'Contorsionniste', desc: { en: 'Extreme body flexibility', fr: 'Flexibilité extrême du corps' } }
            ] },
            CHEVAUCHEMENT: { id: 'CHEVAUCHEMENT', name: { en: '[Riding]', fr: '[Chevauchement]' }, desc: { en: 'Riding any beast to make it move, fight, maneuver, in order to fight oneself while mounted.', fr: 'Chevauchement de toute bête afin de la faire se déplacer, se battre, manœuvrer, afin de s\'y battre soi-même tout en la montant.' }, masteries: [
                { name: 'Montée en selle', desc: { en: 'Quickly mounting a ride', fr: 'Monter rapidement sur une monture' } },
                { name: 'Déplacement monté', desc: { en: 'Moving efficiently on a mount', fr: 'Se déplacer efficacement sur une monture' } },
                { name: 'Manœuvres montées', desc: { en: 'Performing complex maneuvers on a mount', fr: 'Effectuer des manœuvres complexes à dos de monture' } },
                { name: 'Agissement monté', desc: { en: 'Acting (fighting, etc.) while mounted', fr: 'Agir (combattre, etc.) tout en étant monté' } }
            ] },
            // Charisme - Captiver
            SEDUCTION: { id: 'SEDUCTION', name: { en: '[Seduction]', fr: '[Séduction]' }, desc: { en: 'Convincing to disobey or be disloyal, generally through persuasion or false promises, often through sexual excitement. Physical or psychological attraction, grace, health.', fr: 'Convaincre de désobéir ou de déloyauté généralement par la persuasion ou de fausses promesses, souvent à travers l\'excitation sexuelle. Attraction physique ou psychologique, grâce, santé.' }, masteries: [
                { name: 'Attirer', desc: { en: 'Arousing interest and attraction', fr: 'Susciter de l\'intérêt et de l\'attraction' } },
                { name: 'faire Émouvoir', desc: { en: 'Manipulating others\' emotions', fr: 'Manipuler les émotions des autres' } },
                { name: 'faire Admirer', desc: { en: 'Arousing admiration and respect', fr: 'Susciter l\'admiration et le respect' } },
                { name: 'faire Reconnaître', desc: { en: 'Persuading others to recognize your value', fr: 'Persuader les autres de reconnaître votre valeur' } },
                { name: 'Avoir une Faveur', desc: { en: 'Convincing others to do a favor', fr: 'Convaincre les autres de faire une faveur' } },
                { name: 'Subvertir à la Déloyauté', desc: { en: 'Arousing disloyalty toward a third party', fr: 'Susciter la déloyauté envers un tiers' } }
            ] },
            MIMETISME: { id: 'MIMETISME', name: { en: '[Mimicry]', fr: '[Mimétisme]' }, desc: { en: 'Physical imitation and disguises, costumes, roles, animals, social statuses, accents, dialects of a known language.', fr: 'Imitation physique et déguisements, costumes, des rôles, des animaux, et des statuts sociaux, des accents, des dialectes d\'une langue connue.' }, masteries: [
                { name: 'Sons naturels', desc: { en: 'Imitating nature sounds', fr: 'Imiter des sons de la nature' } },
                { name: 'Êtres sauvages', desc: { en: 'Imitating animals', fr: 'Imiter des animaux' } },
                { name: 'Accents & Dialectes', desc: { en: 'Imitating ways of speaking', fr: 'Imiter des façons de parler' } },
                { name: 'Mimique', desc: { en: 'Imitating expressions and gestures', fr: 'Imiter des expressions et gestes' } },
                { name: 'Interprétation de rôle', desc: { en: 'Playing a character convincingly', fr: 'Jouer un personnage de manière convaincante' } },
                { name: 'Déguisement', desc: { en: 'Physically disguising oneself', fr: 'Se travestir physiquement' } }
            ] },
            PRESENTATION: { id: 'PRESENTATION', name: { en: '[Presentation]', fr: '[Présentation]' }, desc: { en: 'Etiquette, formalities, customs, assimilation, respect, networking, fashion, teaching.', fr: 'Étiquette, formalités, coutumes, assimilation, respects, réseautage, mode, enseignement.' }, masteries: [
                { name: 'Première impression', desc: { en: 'Making good impression from first contact', fr: 'Faire bonne impression dès le premier contact' } },
                { name: 'Bienséance', desc: { en: 'Respecting social codes and protocols', fr: 'Respecter les codes sociaux et protocoles' } },
                { name: 'Enseigner', desc: { en: 'Transmitting knowledge', fr: 'Transmettre des connaissances' } },
                { name: 'Réseauter', desc: { en: 'Creating and maintaining contacts', fr: 'Créer et maintenir des contacts' } },
                { name: 'Mode', desc: { en: 'Following or influencing clothing trends', fr: 'Suivre ou influencer les tendances vestimentaires' } },
                { name: 'Rumeurs', desc: { en: 'Spreading or controlling rumors', fr: 'Répandre ou contrôler les rumeurs' } }
            ] },
            // Charisme - Convaincre
            NEGOCIATION: { id: 'NEGOCIATION', name: { en: '[Negotiation]', fr: '[Négociation]' }, desc: { en: 'Bargaining, rhetoric, diplomacy, for auctions, gathering information, corrupting.', fr: 'Marchandage, rhétorique, diplomatie, pour des enchères, se renseigner, corrompre.' }, masteries: [
                { name: 'Marchandage', desc: { en: 'Negotiating prices and exchanges', fr: 'Négocier des prix et des échanges' } },
                { name: 'Corrompre', desc: { en: 'Buying others\' complicity', fr: 'Acheter la complicité d\'autrui' } },
                { name: 'Diplomatie', desc: { en: 'Negotiating agreements between parties', fr: 'Négocier des accords entre parties' } },
                { name: 'Débattre', desc: { en: 'Arguing to convince', fr: 'Argumenter pour convaincre' } },
                { name: 'Enchèrir', desc: { en: 'Participating in auctions', fr: 'Participer à des enchères' } },
                { name: 'Renseignement', desc: { en: 'Obtaining information through conversation', fr: 'Obtenir des informations par la conversation' } }
            ] },
            TROMPERIE: { id: 'TROMPERIE', name: { en: '[Deception]', fr: '[Tromperie]' }, desc: { en: 'Lies, manipulations, scams, trolling, mockery, tall tales, diverting conversation to other subjects.', fr: 'Mensonges, manipulations, escroqueries, troll, railleries, bobards, distraction de la conversation vers d\'autres sujets.' }, masteries: [
                { name: 'Belles-paroles', desc: { en: 'Speaking in flattering and persuasive manner', fr: 'Parler de manière flatteuse et persuasive' } },
                { name: 'Bobards', desc: { en: 'Telling credible lies', fr: 'Raconter des mensonges crédibles' } },
                { name: 'Distraire', desc: { en: 'Diverting conversation attention', fr: 'Détourner l\'attention de la conversation' } },
                { name: 'Escroquer', desc: { en: 'Deceiving to obtain something', fr: 'Tromper pour obtenir quelque chose' } },
                { name: 'Railleries', desc: { en: 'Mocking to destabilize', fr: 'Moquer pour déstabiliser' } },
                { name: 'Troller', desc: { en: 'Provoking emotional reactions', fr: 'Provoquer des réactions émotionnelles' } }
            ] },
            INSPIRATION: { id: 'INSPIRATION', name: { en: '[Inspiration]', fr: '[Inspiration]' }, desc: { en: 'The ability to raise morale and confidence of those around you. Moving hearts, lifting spirits, toward revelry, anger, or even learning.', fr: 'La capacité d\'élever le moral et la confiance de ceux qui vous entourent. Mouvance des cœurs, remonter le moral, vers la fêtardise, la colère voire l\'apprentissage.' }, masteries: [
                { name: 'Apaiser', desc: { en: 'Calming tensions and emotions', fr: 'Calmer les tensions et les émotions' } },
                { name: 'Captiver', desc: { en: 'Holding a group\'s attention', fr: 'Retenir l\'attention d\'un groupe' } },
                { name: 'Éduquer', desc: { en: 'Motivating to learn', fr: 'Motiver à l\'apprentissage' } },
                { name: 'Camaraderie', desc: { en: 'Creating sense of belonging', fr: 'Créer un sentiment d\'appartenance' } },
                { name: 'Festivité', desc: { en: 'Creating party atmosphere', fr: 'Créer une ambiance de fête' } },
                { name: 'Fanatisme', desc: { en: 'Arousing intense devotion', fr: 'Susciter une dévotion intense' } }
            ] },
            // Charisme - Interpréter
            INSTRUMENTAL: { id: 'INSTRUMENTAL', name: { en: '[Instrumental]', fr: '[Instrumental]' }, desc: { en: 'Practice of various musical instruments—whether percussion, wind, vibrating, or improvised.', fr: 'Pratique d\'instruments de musique divers et variés - qu\'ils soient à percussion, à souffle, vibratoire voire improvisés.' }, masteries: [
                { name: 'Attirer', desc: { en: 'Attracting attention through music', fr: 'Attirer l\'attention par la musique' } },
                { name: 'faire Émouvoir', desc: { en: 'Arousing emotions through music', fr: 'Susciter des émotions par la musique' } },
                { name: 'faire Admirer', desc: { en: 'Impressing with virtuosity', fr: 'Impressionner par sa virtuosité' } },
                { name: 'faire Reconnaître', desc: { en: 'Being recognized by musical style', fr: 'Se faire reconnaître par son style musical' } },
                { name: 'Avoir une Faveur', desc: { en: 'Obtaining favors through music', fr: 'Obtenir des faveurs grâce à sa musique' } },
                { name: 'Subvertir à la Déloyauté', desc: { en: 'Influencing through music', fr: 'Influencer par la musique' } }
            ] },
            CHANT: { id: 'CHANT', name: { en: '[Singing]', fr: '[Chant]' }, desc: { en: 'Creation and practice of sung or whistled melodies and/or lyrics, in choir, etc. Copying sounds, cries, and voices, repetition and ventriloquism.', fr: 'Création et pratique de mélodies et/ou paroles chantées ou sifflées, en chœur, etc. Copies des sons, cris et voix, répétition et ventriloquie.' }, masteries: [
                { name: 'de Poitrine', desc: { en: 'Singing using chest voice', fr: 'Chant utilisant la voix de poitrine' } },
                { name: "de Tête/d'Appel", desc: { en: 'Yodel, Kulning, for calling and gathering', fr: 'Yodel, Kulning, pour appeler et rassembler' } },
                { name: 'Diphonique', desc: { en: 'Harmonic and throat singing, resonance manipulation', fr: 'Chants harmoniques et de gorge, manipulation des résonances' } },
                { name: 'Improvisée', desc: { en: 'Spontaneous singing without preparation', fr: 'Chant spontané sans préparation' } },
                { name: 'de Mélodie', desc: { en: 'Singing melodious sounds', fr: 'Chanter des sons mélodieux' } },
                { name: 'en Chœur', desc: { en: 'Group singing in different rhythms', fr: 'Chanter en groupe et en différents rythmes' } },
                { name: 'Ventriloque', desc: { en: 'Voice production seeming to come from elsewhere', fr: 'Production de la voix semblant venir d\'ailleurs' } },
                { name: 'Sifflée', desc: { en: 'All whistling and whistled songs', fr: 'Tous les sifflements et chants sifflés' } }
            ] },
            NARRATION: { id: 'NARRATION', name: { en: '[Narration]', fr: '[Narration]' }, desc: { en: 'Creation, transmission, and writing of stories, riddles, legends, poetry, orally or in writing.', fr: 'Création, transmission et écriture d\'histoire, énigmes, légendes, de poésies, à l\'oral ou à l\'écrit.' }, masteries: [
                { name: 'Fabuleuse & Poétique', desc: { en: 'Telling eloquent and poetic stories with grandiose style', fr: 'Raconter des histoires éloquentes et poétiques avec un style grandiose' } },
                { name: 'Banalités', desc: { en: 'Talking about everyday things to fit in', fr: 'Parler de choses de tous les jours pour s\'intégrer' } },
                { name: 'Ragots & Rumeurs', desc: { en: 'Transmitting rumors intriguingly', fr: 'Transmettre des rumeurs de manière intrigante' } },
                { name: 'Propagande', desc: { en: 'Shaping public opinion through rhetoric', fr: 'Façonner l\'opinion publique par la rhétorique' } },
                { name: 'Plaisanteries', desc: { en: 'Making laugh with humorous stories', fr: 'Faire rire avec des histoires humoristiques' } },
                { name: 'Énigmes', desc: { en: 'Creating captivating mysteries with hidden clues', fr: 'Créer des mystères captivants avec des indices cachés' } }
            ] },
            // Détection - Discerner
            VISION: { id: 'VISION', name: { en: '[Vision]', fr: '[Vision]' }, desc: { en: 'Sight itself, near or at long distance, shape recognition, through mist, sense of images of all kinds, lip reading, night vision, thermal, etc.', fr: 'La vue elle-même, de proche ou à longue distance, reconnaissance des formes, à travers la brume, sens des images de toutes sortes, lecture sur les lèvres, vision dans le noir, thermique, etc.' }, masteries: [
                { name: 'Précise & Distante', desc: { en: 'Seeing with precision at great distance', fr: 'Voir avec précision à grande distance' } },
                { name: 'Écritures', desc: { en: 'Reading and analyzing texts', fr: 'Lire et analyser les textes' } },
                { name: 'Lecture sur lèvre', desc: { en: 'Understanding speech by watching lips', fr: 'Comprendre les paroles en observant les lèvres' } },
                { name: 'Langage corporel', desc: { en: 'Interpreting gestures and postures', fr: 'Interpréter les gestes et postures' } }
            ] },
            AUDITION: { id: 'AUDITION', name: { en: '[Hearing]', fr: '[Audition]' }, desc: { en: 'Sense of sounds of all kinds, whispers, animals, language recognition and learning, blind movement.', fr: 'Sens des sons de toutes sortes, murmures, animaux, reconnaissance et apprentissage des langues, déplacement aveugle.' }, masteries: [
                { name: 'Écoute & Murmures', desc: { en: 'Hearing discreet conversations', fr: 'Entendre les conversations discrètes' } },
                { name: 'Sons naturels', desc: { en: 'Recognizing nature sounds', fr: 'Reconnaître les sons de la nature' } },
                { name: 'Apprentissage du parlé', desc: { en: 'Learning languages by listening', fr: 'Apprendre les langues par l\'écoute' } },
                { name: 'Écholocation', desc: { en: 'Navigating by sound', fr: 'Se repérer par le son' } }
            ] },
            TOUCHER: { id: 'TOUCHER', name: { en: '[Touch]', fr: '[Toucher]' }, desc: { en: 'Sense of textures of all kinds, facial recognition, blind movement, softness, roughness, solidity, temperatures.', fr: 'Sens des textures de toutes sortes, reconnaissance faciale, déplacement aveugle, douceur, rugosités, solidités, températures.' }, masteries: [
                { name: 'Textures', desc: { en: 'Recognizing materials by touch', fr: 'Reconnaître les matériaux par le toucher' } },
                { name: 'Températures', desc: { en: 'Perceiving temperature variations', fr: 'Percevoir les variations de température' } },
                { name: 'Lectures à froid', desc: { en: 'Obtaining information by contact', fr: 'Obtenir des informations par contact' } },
                { name: 'Reconnaissance aveugle', desc: { en: 'Identifying things without seeing', fr: 'Identifier des choses sans voir' } }
            ] },
            // Détection - Découvrir
            INVESTIGATION: { id: 'INVESTIGATION', name: { en: '[Investigation]', fr: '[Investigation]' }, desc: { en: 'Thorough search of things or individuals, tracking. Long-term forced research following clues, evidence, marks, and deposits.', fr: 'Recherche de fond en comble des choses ou individus, traque. Recherche forcée sur long terme en suivant des indices, preuves, marques et dépôts.' }, masteries: [
                { name: 'Fouille', desc: { en: 'Methodically searching a place', fr: 'Rechercher méthodiquement dans un lieu' } },
                { name: 'Pistage', desc: { en: 'Following tracks', fr: 'Suivre des traces' } },
                { name: 'Autopsie', desc: { en: 'Examining a body for clues', fr: 'Examiner un corps pour trouver des indices' } },
                { name: 'Décryptage', desc: { en: 'Deciphering codes and messages', fr: 'Déchiffrer des codes et messages' } },
                { name: 'Profilage', desc: { en: 'Establishing psychological profile', fr: 'Établir un profil psychologique' } },
                { name: 'Découverte', desc: { en: 'Finding hidden things', fr: 'Trouver des choses cachées' } },
                { name: 'Prospective', desc: { en: 'Anticipating future events', fr: 'Anticiper les événements futurs' } }
            ] },
            ESTIMATION: { id: 'ESTIMATION', name: { en: '[Estimation]', fr: '[Estimation]' }, desc: { en: 'Mathematics of sums and such. Estimation of raw materials, manufactured products, value of work, of an individual or beast, their values, worth, strengths, weaknesses, price.', fr: 'Mathématiques des sommes et autres. Estimation des matières premières, des produits manufacturés, valeur du travail, de l\'individu ou la bête, ses valeurs, sa valeur, ses forces, faiblesses, son prix.' }, masteries: [
                { name: 'Valeur des Objets', desc: { en: 'Estimating market value', fr: 'Estimer la valeur marchande' } },
                { name: 'des Aptitudes', desc: { en: 'Evaluating a person\'s capabilities', fr: 'Évaluer les capacités d\'une personne' } },
                { name: 'des Arts', desc: { en: 'Evaluating artistic value', fr: 'Évaluer la valeur artistique' } },
                { name: 'de Contrebande', desc: { en: 'Knowing the black market', fr: 'Connaître le marché noir' } },
                { name: 'de Recélage', desc: { en: 'Evaluating stolen goods', fr: 'Évaluer les biens volés' } },
                { name: 'Fraude fiscale', desc: { en: 'Detecting or performing fraud', fr: 'Détecter ou réaliser des fraudes' } },
                { name: 'Comptabilité', desc: { en: 'Managing and analyzing accounts', fr: 'Gérer et analyser des comptes' } },
                { name: 'Administration', desc: { en: 'Managing organizations', fr: 'Gérer des organisations' } }
            ] },
            RESSENTI: { id: 'RESSENTI', name: { en: '[Feeling]', fr: '[Ressenti]' }, desc: { en: 'Sensing, animal empathy, primitive truths, lies, feelings, sensing, mentalism.', fr: 'Sens, empathie animale, primitivisme des vérités, mensonges, sentiments, ressentis, mentalisme.' }, masteries: [
                { name: 'Temps & Climat', desc: { en: 'Sensing weather changes', fr: 'Pressentir les changements météorologiques' } },
                { name: 'Êtres sauvages', desc: { en: 'Understanding animals', fr: 'Comprendre les animaux' } },
                { name: 'Vérité', desc: { en: 'Detecting lies', fr: 'Détecter les mensonges' } },
                { name: 'Mentalisme', desc: { en: 'Perceiving superficial thoughts', fr: 'Percevoir les pensées superficielles' } },
                { name: 'Émotions & Motivations', desc: { en: 'Understanding what others feel', fr: 'Comprendre ce que ressentent les autres' } },
                { name: 'Se relater', desc: { en: 'Creating empathic connection', fr: 'Créer une connexion empathique' } }
            ] },
            // Détection - Dépister
            ODORAT: { id: 'ODORAT', name: { en: '[Smell]', fr: '[Odorat]' }, desc: { en: 'Sense of smells of all kinds, detection of healthy/unhealthy air, perfumes, blind movement.', fr: 'Sens des odeurs de toutes sortes, détection des airs sains, malsains, des parfums, déplacement aveugle.' }, masteries: [
                { name: 'Parfums mélangés', desc: { en: 'Distinguishing components of a smell', fr: 'Distinguer les composants d\'une odeur' } },
                { name: 'Airs sains & malsains', desc: { en: 'Detecting air quality', fr: 'Détecter la qualité de l\'air' } },
                { name: 'Pistage', desc: { en: 'Following a trail by smell', fr: 'Suivre une piste par l\'odeur' } },
                { name: 'Détection aveugle', desc: { en: 'Navigating by smell', fr: 'Se repérer par l\'odorat' } }
            ] },
            GOUT: { id: 'GOUT', name: { en: '[Taste]', fr: '[Goût]' }, desc: { en: 'Sense of tastes of all kinds, poison detection, cooking recipes, remedies.', fr: 'Sens des goûts de toutes sortes, détection du poison, recettes de cuisine, des remèdes.' }, masteries: [
                { name: 'Du Salé/Acide/Sucré/Umami/Amer', desc: { en: 'Distinguishing basic flavors', fr: 'Distinguer les saveurs de base' } },
                { name: 'Culinaires', desc: { en: 'Recognizing ingredients and recipes', fr: 'Reconnaître les ingrédients et recettes' } },
                { name: 'Malaises', desc: { en: 'Detecting harmful substances or poisons', fr: 'Détecter les substances nocives ou poisons' } },
                { name: 'Secrétions', desc: { en: 'Analyzing bodily fluids', fr: 'Analyser les fluides corporels' } }
            ] },
            INTEROCEPTION: { id: 'INTEROCEPTION', name: { en: '[Interoception]', fr: '[Interoception]' }, desc: { en: 'Internal body senses: balance, distance to limbs, self-poisoning, hunger, thirst, suffocation, or precise recognition of one\'s own emotions.', fr: 'Sens internes à son corps, sens de l\'équilibre, de la distance à ses membres, de l\'empoisonnement de soi, de la faim, de la soif, la suffocation, voire la reconnaissance précise de ses propres émotions.' }, masteries: [
                { name: 'Équilibroception', desc: { en: 'Internal sense of balance', fr: 'Sens de l\'équilibre interne' } },
                { name: 'Proprioception', desc: { en: 'Awareness of limb positions', fr: 'Conscience de la position de ses membres' } },
                { name: 'Faim', desc: { en: 'Perceiving and controlling hunger sensation', fr: 'Percevoir et contrôler la sensation de faim' } },
                { name: 'Soif', desc: { en: 'Perceiving and controlling thirst sensation', fr: 'Percevoir et contrôler la sensation de soif' } },
                { name: 'Suffocation', desc: { en: 'Perceiving lack of air', fr: 'Percevoir le manque d\'air' } },
                { name: 'Empoisonnement', desc: { en: 'Detecting toxins in body', fr: 'Détecter les toxines dans son corps' } },
                { name: 'Émotions', desc: { en: 'Precisely recognizing own emotions', fr: 'Reconnaître précisément ses propres émotions' } },
                { name: 'Temporalité', desc: { en: 'Sense of passing time', fr: 'Sens du temps qui passe' } }
            ] },
            // Réflexion - Concevoir
            ARTISANAT: { id: 'ARTISANAT', name: { en: '[Craftsmanship]', fr: '[Artisanat]' }, desc: { en: 'The theoretical knowledge of arts and trades. Knowing why something works, not just how to do it—the explanatory science rather than descriptive technique.', fr: 'La connaissance théorique des arts et métiers. Savoir pourquoi une chose fonctionne, pas seulement comment la faire - la science explicative plutôt que la technique descriptive.' }, masteries: [
                { name: 'Alimentaire', desc: { en: 'Science of cooking and preservation', fr: 'Science de la cuisine et conservation' } },
                { name: 'des Graisses', desc: { en: 'Science of oils and lubricants', fr: 'Science des huiles et lubrifiants' } },
                { name: 'du Papier', desc: { en: 'Science of paper-making', fr: 'Science de la papeterie' } },
                { name: 'des Plantes', desc: { en: 'Applied botanical science', fr: 'Science botanique appliquée' } },
                { name: 'du Textile', desc: { en: 'Science of weaving and fibers', fr: 'Science du tissage et des fibres' } },
                { name: 'du Cuir', desc: { en: 'Science of tanning', fr: 'Science du tannage' } },
                { name: 'du Verre', desc: { en: 'Science of glasswork', fr: 'Science de la verrerie' } },
                { name: 'de la Construction', desc: { en: 'Architectural science', fr: 'Science architecturale' } },
                { name: 'des Métaux', desc: { en: 'Metallurgical science', fr: 'Science métallurgique' } },
                { name: 'des Richesses', desc: { en: 'Science of precious stones', fr: 'Science des pierres précieuses' } },
                { name: 'du Bois', desc: { en: 'Science of woodworking', fr: 'Science du travail du bois' } },
                { name: 'de la Lutherie', desc: { en: 'Science of musical instruments', fr: 'Science des instruments de musique' } },
                { name: 'des Arts plastiques', desc: { en: 'Science of sculpture', fr: 'Science de la sculpture' } },
                { name: 'des Arts de dessein', desc: { en: 'Science of drawing and painting', fr: 'Science du dessin et de la peinture' } },
                { name: 'de la Récolte', desc: { en: 'Agricultural harvest science', fr: 'Science agricole de la récolte' } }
            ] },
            MEDECINE: { id: 'MEDECINE', name: { en: '[Medicine]', fr: '[Médecine]' }, desc: { en: 'Theoretical knowledge on analysis, fabrication, mixing, and application of remedies, antidotes, and poisons. Physical chronic diseases, mental disorders, traumas. Care and diagnosis of physical injuries, from scratches to amputations, suturing.', fr: 'Connaissances théoriques sur l\'analyse, la fabrication, mélanges et applications des remèdes, antidotes et poisons. Des maladies chroniques physiques, des troubles mentaux, des traumas. Soins et diagnostics des blessures physiques, de l\'égratignure à l\'amputation, couture.' }, masteries: [
                { name: 'Diagnostiquer', desc: { en: 'Identifying diseases and injuries', fr: 'Identifier les maladies et blessures' } },
                { name: 'Thérapie', desc: { en: 'Treatment of mental disorders', fr: 'Traitement des troubles mentaux' } },
                { name: 'Premiers soins', desc: { en: 'Emergency care', fr: 'Soins d\'urgence' } },
                { name: 'Chirurgie', desc: { en: 'Medical operations', fr: 'Opérations médicales' } },
                { name: 'Folies', desc: { en: 'Treatment of psychological disorders', fr: 'Traitement des troubles psychologiques' } },
                { name: 'Poisons/Antipoisons', desc: { en: 'Knowledge of toxins and antidotes', fr: 'Connaissance des toxines et antidotes' } }
            ] },
            INGENIERIE: { id: 'INGENIERIE', name: { en: '[Engineering]', fr: '[Ingénierie]' }, desc: { en: 'Mechanics, alchemy or cooking processes, forging, construction of machines and structures, buildings, aqueducts, bridges, fortifications, innovations, technology-related.', fr: 'Mécanique, processus d\'alchimie ou cuisine, forge, construction de machines et structures, bâtiments, aqueducs, ponts, fortifications, innovations, ce qui est lié à la technologie.' }, masteries: [
                { name: 'Civil', desc: { en: 'Building construction and infrastructure', fr: 'Construction de bâtiments et infrastructures' } },
                { name: 'Mécanique', desc: { en: 'Machines and mechanisms', fr: 'Machines et mécanismes' } },
                { name: 'Chimique', desc: { en: 'Chemical reactions and alchemy', fr: 'Réactions chimiques et alchimie' } },
                { name: 'Énergique', desc: { en: 'Energy sources and transfers', fr: 'Sources et transferts d\'énergie' } },
                { name: 'Mathématique', desc: { en: 'Calculations and modeling', fr: 'Calculs et modélisation' } },
                { name: 'Recherche académique', desc: { en: 'Research methodology', fr: 'Méthodologie de recherche' } }
            ] },
            // Réflexion - Acculturer
            JEUX: { id: 'JEUX', name: { en: '[Games]', fr: '[Jeux]' }, desc: { en: 'The very ability to play games by their rules, not cheating. Card games, dice games, physical games, ball games.', fr: 'La capacité même de jouer aux jeux en leurs règles, et non la triche. Jeux de cartes, de dés, jeux physiques, de ballon.' }, masteries: [
                { name: "Jeux d'Ambiance", desc: { en: 'Light and social games', fr: 'Jeux légers et sociaux' } },
                { name: 'de Société', desc: { en: 'Board and strategy games', fr: 'Jeux de plateau et stratégie' } },
                { name: 'de Hasard', desc: { en: 'Chance-based games', fr: 'Jeux basés sur la chance' } },
                { name: "d'Esprit", desc: { en: 'Thinking games', fr: 'Jeux de réflexion' } },
                { name: 'de Rôle', desc: { en: 'Role-playing games', fr: 'Jeux d\'interprétation' } },
                { name: 'Guide de jeu', desc: { en: 'Running a game session', fr: 'Animer une partie' } },
                { name: 'Arbitrage', desc: { en: 'Judging rules', fr: 'Juger les règles' } },
                { name: 'Conceptualisation', desc: { en: 'Creating new games', fr: 'Créer de nouveaux jeux' } },
                { name: 'Parier & Défier', desc: { en: 'Organizing bets', fr: 'Organiser des paris' } },
                { name: 'Compétition', desc: { en: 'Participating in tournaments', fr: 'Participer à des tournois' } }
            ] },
            SOCIETE: { id: 'SOCIETE', name: { en: '[Society]', fr: '[Société]' }, desc: { en: 'Customs, traditions, moralities, religions, legalities, values, arts, populations, nobility, personalities, current and worldwide.', fr: 'Coutumes, traditions, moralités, religions, légalités, valeurs, arts, populations, noblesse, personnalités, actuelles et de par le monde.' }, masteries: [
                { name: 'Rilique', desc: { en: 'Knowledge of magical/religious traditions', fr: 'Connaissance des traditions magiques/religieuses' } },
                { name: 'Préhistorique', desc: { en: 'Ancient history', fr: 'Histoire ancienne' } },
                { name: 'Folklorique', desc: { en: 'Popular traditions', fr: 'Traditions populaires' } },
                { name: 'Traditionnelle', desc: { en: 'Established customs', fr: 'Coutumes établies' } },
                { name: 'Internationale', desc: { en: 'Relations between peoples', fr: 'Relations entre peuples' } },
                { name: 'Linguistique', desc: { en: 'Languages and dialects', fr: 'Langues et dialectes' } },
                { name: 'Artistique', desc: { en: 'Art history', fr: 'Histoire des arts' } },
                { name: 'Légale', desc: { en: 'Laws and jurisdiction', fr: 'Lois et juridiction' } },
                { name: 'Illégale', desc: { en: 'Criminal underworld', fr: 'Monde criminel' } },
                { name: 'Entrepreneurial', desc: { en: 'Commerce and business', fr: 'Commerce et entreprises' } },
                { name: 'Économique', desc: { en: 'Economic systems', fr: 'Systèmes économiques' } },
                { name: 'des Équipements', desc: { en: 'Equipment knowledge', fr: 'Connaissance du matériel' } },
                { name: 'Militaire', desc: { en: 'Strategy and armies', fr: 'Stratégie et armées' } }
            ] },
            GEOGRAPHIE: { id: 'GEOGRAPHIE', name: { en: '[Geography]', fr: '[Géographie]' }, desc: { en: 'Aerial, terrestrial, maritime, and other environments. Location of countries, cities, villages. Natural dangers, climates, resources. Astronomy.', fr: 'Environnements et milieux aériens, terrestres, marins et autres. Localisation des pays, villes, villages. Dangers naturels, climats, ressources. Astronomie.' }, masteries: [
                { name: 'Localités', desc: { en: 'Knowledge of inhabited places', fr: 'Connaissance des lieux habités' } },
                { name: 'Astronomie', desc: { en: 'Science of celestial bodies', fr: 'Science des astres' } },
                { name: 'Climats', desc: { en: 'Meteorological knowledge', fr: 'Connaissance météorologique' } },
                { name: 'Dangers naturels', desc: { en: 'Environmental risks', fr: 'Risques environnementaux' } },
                { name: 'Milieux Désertiques', desc: { en: 'Arid environments', fr: 'Environnements arides' } },
                { name: 'Humides', desc: { en: 'Swamps and wetlands', fr: 'Marécages et zones humides' } },
                { name: 'Tempérés', desc: { en: 'Temperate zones', fr: 'Zones tempérées' } },
                { name: 'Habités', desc: { en: 'Urban and rural areas', fr: 'Zones urbaines et rurales' } },
                { name: 'Souterrains', desc: { en: 'Caves and caverns', fr: 'Grottes et cavernes' } },
                { name: 'Aquatiques', desc: { en: 'Underwater environments', fr: 'Milieux sous-marins' } },
                { name: 'Arboricoles', desc: { en: 'Forests and canopies', fr: 'Forêts et canopées' } },
                { name: 'Célestes', desc: { en: 'High altitude and skies', fr: 'Haute altitude et cieux' } }
            ] },
            // Réflexion - Acclimater
            NATURE: { id: 'NATURE', name: { en: '[Nature]', fr: '[Nature]' }, desc: { en: 'Knowing the products one seeks to hunt, trap, fish, or gather. General and deep knowledge of crystals, metals, rocks, earth, sand. Trees, plants, herbs, roots, all non-mobile organic beings. Fungi included. Flying, terrestrial, marine animals, insects, all mobile organic beings.', fr: 'Permet de connaître les produits que l\'on cherche à chasser, trapper, pêcher ou cueillir. Connaissance générale et profonde des cristaux, métaux, roches, terres, sables. Arbres, plantes, herbes, racines, tout être organique ne pouvant se déplacer. Champignons inclus. Animaux volants, terrestres, marins, insectes, ou tout être organique pouvant se déplacer.' }, masteries: [
                { name: 'Airs', desc: { en: 'Knowledge of atmosphere', fr: 'Connaissance de l\'atmosphère' } },
                { name: 'Minéraux', desc: { en: 'Rocks, crystals, metals', fr: 'Roches, cristaux, métaux' } },
                { name: 'Granulaires', desc: { en: 'Sands, earths, gravels', fr: 'Sables, terres, graviers' } },
                { name: 'Eaux', desc: { en: 'Hydrology', fr: 'Hydrologie' } },
                { name: 'Neiges', desc: { en: 'Frozen environments', fr: 'Environnements gelés' } },
                { name: 'Arbres', desc: { en: 'Tree knowledge', fr: 'Connaissance des arbres' } },
                { name: 'Herbes', desc: { en: 'Herbaceous plants', fr: 'Plantes herbacées' } },
                { name: 'Racines', desc: { en: 'Underground plants', fr: 'Plantes souterraines' } },
                { name: 'Fungi', desc: { en: 'Mushrooms and molds', fr: 'Champignons et moisissures' } },
                { name: 'Créatures Volatiles', desc: { en: 'Birds and flying insects', fr: 'Oiseaux et insectes volants' } },
                { name: 'Terrestres', desc: { en: 'Land animals', fr: 'Animaux terrestres' } },
                { name: 'Marines', desc: { en: 'Aquatic fauna', fr: 'Faune aquatique' } },
                { name: 'Infimes', desc: { en: 'Micro-organisms and small creatures', fr: 'Micro-organismes et petites créatures' } }
            ] },
            PASTORALISME: { id: 'PASTORALISME', name: { en: '[Pastoralism]', fr: '[Pastoralisme]' }, desc: { en: 'Breeding, handling, and transporting animals, shepherding, marking, grazing, watching, milking, shearing.', fr: 'Élevage, manutention et transport d\'animaux, bergerie, marquage, pâturage, surveillance, traite, tonte.' }, masteries: [
                { name: 'Gouvernance', desc: { en: 'Herd management', fr: 'Gestion d\'un troupeau' } },
                { name: 'Pâturage', desc: { en: 'Finding and managing pastures', fr: 'Trouver et gérer les pâturages' } },
                { name: 'Manutention', desc: { en: 'Animal handling', fr: 'Manipulation des animaux' } },
                { name: 'Marquage', desc: { en: 'Animal identification', fr: 'Identification des bêtes' } },
                { name: 'Traite', desc: { en: 'Milk extraction', fr: 'Extraction du lait' } },
                { name: 'Tonte', desc: { en: 'Wool harvesting', fr: 'Récolte de la laine' } },
                { name: 'Élevage', desc: { en: 'Controlled breeding', fr: 'Reproduction contrôlée' } },
                { name: 'Croisement', desc: { en: 'Genetic selection', fr: 'Sélection génétique' } },
                { name: 'Abattage', desc: { en: 'Controlled slaughter', fr: 'Mise à mort contrôlée' } },
                { name: 'Dressage', desc: { en: 'Training work animals', fr: 'Formation des animaux de travail' } }
            ] },
            AGRONOMIE: { id: 'AGRONOMIE', name: { en: '[Agronomy]', fr: '[Agronomie]' }, desc: { en: 'Plowing, sowing, supplying soils and plants, harvesting, maintenance.', fr: 'Labourage, semailles, approvisionnements des sols et plants, récoltes, maintenance.' }, masteries: [
                { name: 'Labourage', desc: { en: 'Soil preparation', fr: 'Préparation des sols' } },
                { name: 'Semailles', desc: { en: 'Seed planting', fr: 'Plantation des graines' } },
                { name: 'Cultivation', desc: { en: 'Crop maintenance', fr: 'Entretien des cultures' } },
                { name: 'Moisson', desc: { en: 'Crop harvesting', fr: 'Récolte des cultures' } },
                { name: 'Produits', desc: { en: 'Harvest transformation', fr: 'Transformation des récoltes' } },
                { name: 'Approvisionnement', desc: { en: 'Agricultural resource management', fr: 'Gestion des ressources agricoles' } }
            ] },
            // Domination - Discipliner
            COMMANDEMENT: { id: 'COMMANDEMENT', name: { en: '[Command]', fr: '[Commandement]' }, desc: { en: 'The ability to give orders and be obeyed. Leadership, natural authority, ability to mobilize and direct others.', fr: 'La capacité de donner des ordres et de se faire obéir. Leadership, autorité naturelle, capacité à mobiliser et diriger les autres.' }, masteries: [
                { name: 'Coup de fouet', desc: { en: 'Direct and authoritarian orders', fr: 'Ordres directs et autoritaires' } },
                { name: "Se jeter à l'eau", desc: { en: 'Leading by example', fr: 'Mener par l\'exemple' } },
                { name: 'Retourner les poches', desc: { en: 'Inspiring generosity/sacrifice', fr: 'Inspirer la générosité/sacrifice' } },
                { name: 'Tirer les ficelles', desc: { en: 'Group manipulation', fr: 'Manipulation de groupe' } },
                { name: 'Lever les bâtons', desc: { en: 'Mobilizing against an enemy', fr: 'Mobiliser contre un ennemi' } },
                { name: 'Dans le chaos', desc: { en: 'Commanding in critical situations', fr: 'Commander en situation critique' } },
                { name: 'La corde au cou', desc: { en: 'Maintaining discipline', fr: 'Maintenir la discipline' } },
                { name: 'Cracher les ordres', desc: { en: 'Quick combat orders', fr: 'Ordres rapides en combat' } },
                { name: 'Roi nu', desc: { en: 'Authority without title', fr: 'Autorité sans titre' } },
                { name: 'Duelliste', desc: { en: 'Commanding in duels', fr: 'Commander en duel' } }
            ] },
            OBEISSANCE: { id: 'OBEISSANCE', name: { en: '[Obedience]', fr: '[Obéissance]' }, desc: { en: 'The ability to strategically submit, follow orders, and adapt to a hierarchy.', fr: 'La capacité de se soumettre stratégiquement, de suivre les ordres et de s\'adapter à une hiérarchie.' }, masteries: [
                { name: "Courber l'échine", desc: { en: 'Submitting with dignity', fr: 'Se soumettre avec dignité' } },
                { name: 'Se plier en quatre', desc: { en: 'Obeying with zeal', fr: 'Obéir avec zèle' } },
                { name: 'Lèche-botte', desc: { en: 'Flattering superiors', fr: 'Flatter les supérieurs' } },
                { name: 'Sauter sur la grenade', desc: { en: 'Sacrificing for the group', fr: 'Se sacrifier pour le groupe' } },
                { name: 'Bouffer dans la main', desc: { en: 'Gaining trust', fr: 'Gagner la confiance' } },
                { name: 'Suivre le troupeau', desc: { en: 'Integrating into a group', fr: 'S\'intégrer à un groupe' } },
                { name: 'Marquer sa chair', desc: { en: 'Showing loyalty', fr: 'Montrer sa loyauté' } },
                { name: "S'adapter", desc: { en: 'Adjusting behavior', fr: 'Ajuster son comportement' } },
                { name: 'Mimer la bête', desc: { en: 'Imitating to integrate', fr: 'Imiter pour s\'intégrer' } }
            ] },
            OBSTINANCE: { id: 'OBSTINANCE', name: { en: '[Stubbornness]', fr: '[Obstinance]' }, desc: { en: 'Mental resistance against addictions, withdrawals, fears, crises, and upheavals. The ability to maintain one\'s will against adversity.', fr: 'Résistance mentale face aux addictions, sevrages, peurs, crises, et bouleversements. La capacité de maintenir sa volonté face à l\'adversité.' }, masteries: [
                { name: 'Mains propres (Moralité)', desc: { en: 'Maintaining moral principles', fr: 'Maintenir ses principes moraux' } },
                { name: 'Ambitieuse (Motivation)', desc: { en: 'Pursuing goals despite obstacles', fr: 'Poursuivre ses objectifs malgré les obstacles' } },
                { name: 'Tête de mule (Personnalité)', desc: { en: 'Resisting pressures to change', fr: 'Résister aux pressions de changement' } },
                { name: 'Respectueuse (Socialité)', desc: { en: 'Maintaining propriety under pressure', fr: 'Maintenir les convenances sous pression' } },
                { name: 'Fidèle (Disposition)', desc: { en: 'Staying loyal despite temptations', fr: 'Rester loyal malgré les tentations' } },
                { name: 'Obsédée (Passion)', desc: { en: 'Pursuing passion despite costs', fr: 'Poursuivre une passion malgré les coûts' } },
                { name: 'Martyr', desc: { en: 'Enduring suffering for a cause', fr: 'Endurer la souffrance pour une cause' } }
            ] },
            // Domination - Endurer
            GLOUTONNERIE: { id: 'GLOUTONNERIE', name: { en: '[Gluttony]', fr: '[Gloutonnerie]' }, desc: { en: 'Ability to absorb, suck, and retain substances efficiently. Breath and aspiration control.', fr: 'Capacité à absorber, aspirer et retenir les substances avec efficacité. Contrôle de la respiration et de l\'aspiration.' }, masteries: [
                { name: "Capacité/Contrôle d'Aspiration", desc: { en: 'Sucking large quantities of air or liquid', fr: 'Aspirer de grandes quantités d\'air ou de liquide' } },
                { name: "Capacité/Contrôle d'Inspiration", desc: { en: 'Holding breath', fr: 'Retenir sa respiration' } },
                { name: "Capacité/Contrôle d'Expiration", desc: { en: 'Controlled exhaling', fr: 'Expirer de manière contrôlée' } },
                { name: 'Aspiration continue (sans reflux)', desc: { en: 'Sucking without interruption', fr: 'Aspirer sans interruption' } }
            ] },
            BEUVERIE: { id: 'BEUVERIE', name: { en: '[Drinking]', fr: '[Beuverie]' }, desc: { en: 'Ability to ingest large quantities of food and drink, to chew and swallow difficult substances.', fr: 'Capacité à ingérer de grandes quantités de nourriture et de boisson, à mâcher et avaler des substances difficiles.' }, masteries: [
                { name: 'Capacité des Mâchoires', desc: { en: 'Jaw strength and endurance', fr: 'Force et endurance de la mâchoire' } },
                { name: "d'Avalement", desc: { en: 'Swallowing large quantities', fr: 'Avaler de grosses quantités' } },
                { name: "d'Ingurgitation", desc: { en: 'Eating quickly', fr: 'Manger rapidement' } },
                { name: 'Capacité/Contrôle de Déglutition', desc: { en: 'Swallowing difficult substances', fr: 'Avaler des substances difficiles' } },
                { name: 'Résistance aux textures Visqueuses', desc: { en: 'Handling slimy textures', fr: 'Supporter les textures gluantes' } },
                { name: 'Résistance aux textures Granuleuses', desc: { en: 'Handling rough textures', fr: 'Supporter les textures rugueuses' } },
                { name: 'Résistance aux textures Épineuses', desc: { en: 'Handling prickly textures', fr: 'Supporter les textures piquantes' } }
            ] },
            ENTRAILLES: { id: 'ENTRAILLES', name: { en: '[Guts]', fr: '[Entrailles]' }, desc: { en: 'Internal body resistance: organ capacity, tolerance to discomfort, dirt, skin absorption.', fr: 'Résistance interne du corps : capacité des organes, tolérance aux inconforts, à la saleté, absorption cutanée.' }, masteries: [
                { name: 'Résistance interne', desc: { en: 'Facing internal problems without damage', fr: 'Faire face aux problèmes internes sans dommages' } },
                { name: 'aux Inconfort', desc: { en: 'Adapting to uncomfortable conditions', fr: 'S\'adapter aux conditions inconfortables' } },
                { name: 'à la Saleté', desc: { en: 'Surviving in unhealthy environments', fr: 'Survivre dans un environnement malsain' } },
                { name: "Capacité d'Absorption cutanée", desc: { en: 'Absorbing through skin efficiently', fr: 'Absorber à travers la peau efficacement' } },
                { name: "Capacité d'Estomac", desc: { en: 'Resisting digestive problems', fr: 'Résister aux problèmes digestifs' } },
                { name: 'Capacité Pulmonaire', desc: { en: 'Breathing efficiently', fr: 'Respirer efficacement' } },
                { name: 'Capacité Vésicale', desc: { en: 'Bladder control', fr: 'Contrôler sa vessie' } },
                { name: 'Capacité Rectale', desc: { en: 'Maintaining good digestion', fr: 'Maintenir une bonne digestion' } }
            ] },
            // Domination - Dompter
            INTIMIDATION: { id: 'INTIMIDATION', name: { en: '[Intimidation]', fr: '[Intimidation]' }, desc: { en: 'Knowing where to press to cause pain, fear, or simple physical or psychological terror.', fr: 'Savoir où appuyer pour faire mal, peur, ou la simple terreur physique ou psychologique.' }, masteries: [
                { name: 'Par la Force (coup de pression)', desc: { en: 'Showing physical force to impress', fr: 'Faire preuve de force physique pour impressionner' } },
                { name: 'Torture', desc: { en: 'Using pain to obtain information', fr: 'Utiliser la douleur pour obtenir des informations' } },
                { name: 'Insulte', desc: { en: 'Saying hurtful words to destabilize', fr: 'Dire des paroles blessantes pour déstabiliser' } },
                { name: 'Chantage', desc: { en: 'Threatening to reveal information', fr: 'Menacer de révéler des informations' } },
                { name: 'Terreur', desc: { en: 'Sowing terror to make bend', fr: 'Semer la terreur pour faire plier' } },
                { name: 'Interrogatoire', desc: { en: 'Conducting interrogation for information', fr: 'Mener un interrogatoire pour obtenir des informations' } },
                { name: 'Tête-à-tête', desc: { en: 'Intimidating face to face', fr: 'Intimider en face à face' } },
                { name: 'Regard noir', desc: { en: 'Intimidating by look', fr: 'Intimider par le regard' } },
                { name: 'Voix grave', desc: { en: 'Intimidating by voice', fr: 'Intimider par la voix' } }
            ] },
            APPRIVOISEMENT: { id: 'APPRIVOISEMENT', name: { en: '[Taming]', fr: '[Apprivoisement]' }, desc: { en: 'Gentle approach to gain creatures\' trust, calm them, and pacify them.', fr: 'Approche douce pour gagner la confiance des créatures, les calmer et les pacifier.' }, masteries: [
                { name: 'Caresse', desc: { en: 'Soothing touch', fr: 'Toucher apaisant' } },
                { name: 'Apaisement', desc: { en: 'Calming and pacifying a creature', fr: 'Calmer et pacifier une créature' } },
                { name: 'Friandise', desc: { en: 'Using food to gain trust', fr: 'Utiliser de la nourriture pour gagner la confiance' } },
                { name: 'Main tendue', desc: { en: 'Non-threatening approach', fr: 'Approche non menaçante' } },
                { name: 'Lire par le regard', desc: { en: 'Understanding creature\'s state', fr: 'Comprendre l\'état d\'une créature' } },
                { name: 'Habitude', desc: { en: 'Creating reassuring routine', fr: 'Créer une routine rassurante' } },
                { name: 'Apaiser', desc: { en: 'Calming agitated creature', fr: 'Calmer une créature agitée' } },
                { name: 'Motiver', desc: { en: 'Encouraging a creature', fr: 'Encourager une créature' } },
                { name: 'Être Monté & Transporter', desc: { en: 'Allowing to be ridden', fr: 'Permettre d\'être chevauché' } },
                { name: 'Ordonnée', desc: { en: 'Responding to simple orders', fr: 'Répondre aux ordres simples' } },
                { name: 'à Combattre', desc: { en: 'Fighting alongside master', fr: 'Participer à un combat aux côtés du maître' } }
            ] },
            DRESSAGE: { id: 'DRESSAGE', name: { en: '[Training]', fr: '[Dressage]' }, desc: { en: 'Strict training of creatures through different methods: repetition, reward, punishment, imitation.', fr: 'Formation stricte des créatures par différentes méthodes : répétition, récompense, punition, imitation.' }, masteries: [
                { name: 'Par Répétition', desc: { en: 'Teaching through repeated practice', fr: 'Enseigner par la pratique répétée' } },
                { name: 'Par Fouet', desc: { en: 'Teaching through punishment', fr: 'Enseigner par la punition' } },
                { name: 'Par Récompense', desc: { en: 'Teaching through reward', fr: 'Enseigner par la récompense' } },
                { name: 'Par Imitation', desc: { en: 'Teaching by example', fr: 'Enseigner par l\'exemple' } },
                { name: 'Bête de jeu', desc: { en: 'Training for entertainment', fr: 'Dresser pour le divertissement' } },
                { name: 'Bête de spectacle', desc: { en: 'Training for performances', fr: 'Dresser pour les performances' } },
                { name: 'Bête de monte', desc: { en: 'Training to be ridden', fr: 'Dresser pour être chevauché' } },
                { name: 'Bête de travail', desc: { en: 'Training for labor', fr: 'Dresser pour le labeur' } },
                { name: 'Bête de combat', desc: { en: 'Training for combat', fr: 'Dresser pour le combat' } },
                { name: 'Bête de noblesse', desc: { en: 'Training for prestige', fr: 'Dresser pour le prestige' } },
                { name: 'Marquage', desc: { en: 'Physically marking ownership', fr: 'Marquer physiquement l\'appartenance' } },
                { name: 'Esclavage', desc: { en: 'Total submission', fr: 'Soumettre totalement' } },
                { name: "Briser l'âme", desc: { en: 'Destroying creature\'s will', fr: 'Détruire la volonté d\'une créature' } }
            ] }
        }
    };

    function initAttributesTree() {
        var treeEl = document.getElementById('attributes-tree');
        if (!treeEl) {
            console.log('[DRD] attributes-tree element not found');
            return;
        }
        console.log('[DRD] Building attributes tree...');

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
        console.log('[DRD] Attributes tree built with', treeEl.querySelectorAll('.attributes-tree-node[data-attribute]').length, 'attributes');

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
    var META_DESCRIPTION_EN = 'For those of us who crave DISCOVERY. A journey through exotic cultures, unexplored lands, weird creatures, and untold ways of thinking and being—yearning to experience the vast potentials, technologies and moralities of worlds unlike ours.';
    var META_DESCRIPTION_FR = 'Pour ceux d\'entre nous qui aspirent à la DÉCOUVERTE. Un voyage à travers des cultures exotiques, des terres inexplorées, des créatures étranges et des façons inédites de penser et d\'être—aspirant à expérimenter les vastes potentiels, technologies et moralités de mondes différents du nôtre.';

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
        if (!elements.newsletterForm) return;

        elements.newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = document.getElementById('newsletter-email');
            const email = emailInput ? emailInput.value : '';

            if (!email || !isValidEmail(email)) {
                alert(state.currentLang === 'en' 
                    ? 'Please enter a valid email address.' 
                    : 'Veuillez entrer une adresse e-mail valide.');
                return;
            }

            // Here you would normally send the email to your server
            // For now, just show a success message
            alert(state.currentLang === 'en'
                ? 'Thank you for subscribing! You will be notified when The Discording Tales launches.'
                : 'Merci de vous être abonné ! Vous serez notifié au lancement de The Discording Tales.');

            // Reset form
            if (emailInput) emailInput.value = '';
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
    // SoundCloud: pulse visible 3s every 10s (hint). Hover shows it; leave hides it.
    // ========================================
    function initSoundCloudCycling() {
        const wrap = document.getElementById('soundcloud-cycling-wrap');
        if (!wrap) return;

        /* Start hidden; first pulse at 10s */
        wrap.classList.add('soundcloud-hidden');

        let isHovering = false;
        let hideTimeout = null;

        function pulse() {
            if (isHovering) return;
            wrap.classList.remove('soundcloud-hidden');
            if (hideTimeout) clearTimeout(hideTimeout);
            hideTimeout = setTimeout(function() {
                if (!isHovering) wrap.classList.add('soundcloud-hidden');
                hideTimeout = null;
            }, 2000);
        }

        wrap.addEventListener('mouseenter', function() {
            isHovering = true;
            wrap.classList.remove('soundcloud-hidden');
            if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
        });
        wrap.addEventListener('mouseleave', function() {
            isHovering = false;
            wrap.classList.add('soundcloud-hidden');
        });

        setInterval(pulse, 10000);
    }

    // ========================================
    // SoundCloud: cross the note symbol when music is stopped (Widget API)
    // ========================================
    function initSoundCloudNoteState() {
        const iframe = document.querySelector('#soundcloud-cycling-wrap .soundcloud-embed');
        if (!iframe) return;
        const vignette = iframe.closest('.soundcloud-vignette');
        if (!vignette) return;

        function bindWidget() {
            if (typeof window.SC === 'undefined' || !window.SC.Widget) {
                setTimeout(bindWidget, 150);
                return;
            }
            var widget = window.SC.Widget(iframe);
            var hasStartedFromEntrance = false;

            function startPlayback() {
                if (!hasStartedFromEntrance) {
                    hasStartedFromEntrance = true;
                    widget.play();
                }
            }

            // Start playback when user enters through keyhole (user interaction unlocks audio)
            window.addEventListener('tdt-entrance-complete', startPlayback, { once: true });

            // Fallback: if no keyhole entrance, start on first user click/touch
            document.addEventListener('click', startPlayback, { once: true });
            document.addEventListener('touchstart', startPlayback, { once: true });

            widget.bind(window.SC.Widget.Events.READY, function() {
                widget.isPaused(function(paused) {
                    vignette.classList.toggle('soundcloud-stopped', paused);
                });
            });
            widget.bind(window.SC.Widget.Events.PLAY, function() {
                vignette.classList.remove('soundcloud-stopped');
            });
            widget.bind(window.SC.Widget.Events.PAUSE, function() {
                vignette.classList.add('soundcloud-stopped');
            });
            widget.bind(window.SC.Widget.Events.FINISH, function() {
                vignette.classList.add('soundcloud-stopped');
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

})();

