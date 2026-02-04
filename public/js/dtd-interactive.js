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
                    en: 'Physical power and raw might. Determines your ability to exert force, lift heavy objects, and deal damage in melee combat.',
                    fr: 'Puissance physique et force brute. Détermine votre capacité à exercer une force, soulever des objets lourds et infliger des dégâts au corps à corps.'
                },
                aptitudes: ['PUISSANCE', 'ATHLETISME', 'DOMINATION'] // principal first
            },
            AGI: {
                id: 'AGI', abbr: 'AGI',
                name: { en: 'Agility', fr: 'Agilité' },
                desc: {
                    en: 'Speed, flexibility, and coordination. Governs quick movements, reflexes, and the ability to avoid attacks.',
                    fr: 'Vitesse, souplesse et coordination. Régit les mouvements rapides, les réflexes et la capacité à éviter les attaques.'
                },
                aptitudes: ['AISANCE', 'PUISSANCE', 'ATHLETISME']
            },
            DEX: {
                id: 'DEX', abbr: 'DEX',
                name: { en: 'Dexterity', fr: 'Dextérité' },
                desc: {
                    en: 'Fine motor control and precision. Affects accuracy, craftsmanship, and delicate manipulations.',
                    fr: 'Contrôle moteur fin et précision. Affecte la précision, l\'artisanat et les manipulations délicates.'
                },
                aptitudes: ['PRECISION', 'AISANCE', 'PUISSANCE']
            },
            VIG: {
                id: 'VIG', abbr: 'VIG',
                name: { en: 'Vigor', fr: 'Vigueur' },
                desc: {
                    en: 'Endurance, stamina, and physical resilience. Determines how long you can sustain effort and resist exhaustion.',
                    fr: 'Endurance, énergie et résilience physique. Détermine combien de temps vous pouvez soutenir un effort et résister à l\'épuisement.'
                },
                aptitudes: ['ATHLETISME', 'DOMINATION', 'AISANCE']
            },
            EMP: {
                id: 'EMP', abbr: 'EMP',
                name: { en: 'Empathy', fr: 'Empathie' },
                desc: {
                    en: 'Emotional intelligence and social awareness. Governs understanding others, building rapport, and sensing emotions.',
                    fr: 'Intelligence émotionnelle et conscience sociale. Régit la compréhension des autres, la création de liens et la perception des émotions.'
                },
                aptitudes: ['CHARISME', 'REFLEXION', 'DETECTION']
            },
            PER: {
                id: 'PER', abbr: 'PER',
                name: { en: 'Perception', fr: 'Perception' },
                desc: {
                    en: 'Sensory acuity and awareness. Affects your ability to notice details, spot danger, and gather information from your surroundings.',
                    fr: 'Acuité sensorielle et vigilance. Affecte votre capacité à remarquer les détails, repérer le danger et recueillir des informations de votre environnement.'
                },
                aptitudes: ['DETECTION', 'PRECISION', 'CHARISME']
            },
            CRE: {
                id: 'CRE', abbr: 'CRÉ',
                name: { en: 'Creativity', fr: 'Créativité' },
                desc: {
                    en: 'Imagination, ingenuity, and original thinking. Determines your ability to devise novel solutions and artistic expression.',
                    fr: 'Imagination, ingéniosité et pensée originale. Détermine votre capacité à concevoir des solutions nouvelles et l\'expression artistique.'
                },
                aptitudes: ['REFLEXION', 'DETECTION', 'PRECISION']
            },
            VOL: {
                id: 'VOL', abbr: 'VOL',
                name: { en: 'Willpower', fr: 'Volonté' },
                desc: {
                    en: 'Mental fortitude and determination. Governs resistance to fear, manipulation, and the ability to push through adversity.',
                    fr: 'Force mentale et détermination. Régit la résistance à la peur, à la manipulation et la capacité à surmonter l\'adversité.'
                },
                aptitudes: ['DOMINATION', 'CHARISME', 'REFLEXION']
            }
        },
        aptitudes: {
            PUISSANCE: {
                id: 'PUISSANCE',
                name: { en: 'Power', fr: 'Puissance' },
                desc: {
                    en: 'The aptitude of raw force and combat prowess. Governs striking, grappling, and ranged attacks.',
                    fr: 'L\'aptitude de la force brute et des prouesses au combat. Régit les frappes, les saisies et les attaques à distance.'
                },
                attributes: ['FOR', 'AGI', 'DEX'], // weights: +3, +2, +1
                actions: ['FRAPPER', 'NEUTRALISER', 'TIRER']
            },
            AISANCE: {
                id: 'AISANCE',
                name: { en: 'Ease', fr: 'Aisance' },
                desc: {
                    en: 'The aptitude of fluid movement and deft evasion. Governs reactions, stealth, and coordination.',
                    fr: 'L\'aptitude du mouvement fluide et de l\'évasion habile. Régit les réactions, la discrétion et la coordination.'
                },
                attributes: ['AGI', 'DEX', 'VIG'],
                actions: ['REAGIR', 'DEROBER', 'COORDONNER']
            },
            PRECISION: {
                id: 'PRECISION',
                name: { en: 'Precision', fr: 'Précision' },
                desc: {
                    en: 'The aptitude of accuracy and fine manipulation. Governs handling tools, crafting, and intricate work.',
                    fr: 'L\'aptitude de la précision et de la manipulation fine. Régit le maniement des outils, l\'artisanat et le travail minutieux.'
                },
                attributes: ['DEX', 'PER', 'CRE'],
                actions: ['MANIER', 'FACONNER', 'FIGNOLER']
            },
            ATHLETISME: {
                id: 'ATHLETISME',
                name: { en: 'Athletics', fr: 'Athlétisme' },
                desc: {
                    en: 'The aptitude of physical prowess and locomotion. Governs traversal, exertion, and mounted movement.',
                    fr: 'L\'aptitude des prouesses physiques et de la locomotion. Régit les déplacements, l\'effort et les mouvements à cheval.'
                },
                attributes: ['VIG', 'FOR', 'AGI'],
                actions: ['TRAVERSER', 'EFFORCER', 'MANOEUVRER']
            },
            CHARISME: {
                id: 'CHARISME',
                name: { en: 'Charisma', fr: 'Charisme' },
                desc: {
                    en: 'The aptitude of social influence and persuasion. Governs captivating others, convincing them, and performing.',
                    fr: 'L\'aptitude de l\'influence sociale et de la persuasion. Régit la capacité à captiver, convaincre et interpréter.'
                },
                attributes: ['EMP', 'VOL', 'PER'],
                actions: ['CAPTIVER', 'CONVAINCRE', 'INTERPRETER']
            },
            DETECTION: {
                id: 'DETECTION',
                name: { en: 'Detection', fr: 'Détection' },
                desc: {
                    en: 'The aptitude of sensory awareness and investigation. Governs discerning, discovering, and tracking.',
                    fr: 'L\'aptitude de la conscience sensorielle et de l\'investigation. Régit la capacité à discerner, découvrir et pister.'
                },
                attributes: ['PER', 'CRE', 'EMP'],
                actions: ['DISCERNER', 'DECOUVRIR', 'DEPISTER']
            },
            REFLEXION: {
                id: 'REFLEXION',
                name: { en: 'Reflection', fr: 'Réflexion' },
                desc: {
                    en: 'The aptitude of intellectual analysis and knowledge. Governs designing, cultural understanding, and adaptation.',
                    fr: 'L\'aptitude de l\'analyse intellectuelle et du savoir. Régit la conception, la compréhension culturelle et l\'adaptation.'
                },
                attributes: ['CRE', 'EMP', 'VOL'],
                actions: ['CONCEVOIR', 'ACCULTURER', 'ACCLIMATER']
            },
            DOMINATION: {
                id: 'DOMINATION',
                name: { en: 'Domination', fr: 'Domination' },
                desc: {
                    en: 'The aptitude of mental strength and control. Governs discipline, endurance, and taming.',
                    fr: 'L\'aptitude de la force mentale et du contrôle. Régit la discipline, l\'endurance et le dressage.'
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
                desc: { en: 'Deliver blows with weapons or bare hands.', fr: 'Porter des coups avec des armes ou à mains nues.' },
                linkedAttr: 'FOR',
                competences: ['ARME', 'DESARME', 'IMPROVISE']
            },
            NEUTRALISER: {
                id: 'NEUTRALISER',
                name: { en: 'Neutralize', fr: 'Neutraliser' },
                desc: { en: 'Grapple, restrain, and incapacitate opponents.', fr: 'Saisir, immobiliser et neutraliser les adversaires.' },
                linkedAttr: 'AGI',
                competences: ['LUTTE', 'BOTTES', 'RUSES']
            },
            TIRER: {
                id: 'TIRER',
                name: { en: 'Shoot', fr: 'Tirer' },
                desc: { en: 'Attack from range with bows, crossbows, or thrown weapons.', fr: 'Attaquer à distance avec arcs, arbalètes ou armes de jet.' },
                linkedAttr: 'DEX',
                competences: ['BANDE', 'PROPULSE', 'JETE']
            },
            // Aisance actions
            REAGIR: {
                id: 'REAGIR',
                name: { en: 'React', fr: 'Réagir' },
                desc: { en: 'Respond quickly to threats and opportunities.', fr: 'Répondre rapidement aux menaces et opportunités.' },
                linkedAttr: 'AGI',
                competences: ['FLUIDITE', 'ESQUIVE', 'EVASION']
            },
            DEROBER: {
                id: 'DEROBER',
                name: { en: 'Steal', fr: 'Dérober' },
                desc: { en: 'Take things without being noticed.', fr: 'Prendre des choses sans être remarqué.' },
                linkedAttr: 'DEX',
                competences: ['ESCAMOTAGE', 'ILLUSIONS', 'DISSIMULATION']
            },
            COORDONNER: {
                id: 'COORDONNER',
                name: { en: 'Coordinate', fr: 'Coordonner' },
                desc: { en: 'Synchronize movements and maintain balance.', fr: 'Synchroniser les mouvements et maintenir l\'équilibre.' },
                linkedAttr: 'VIG',
                competences: ['GESTUELLE', 'MINUTIE', 'EQUILIBRE']
            },
            // Précision actions
            MANIER: {
                id: 'MANIER',
                name: { en: 'Handle', fr: 'Manier' },
                desc: { en: 'Operate tools, weapons, and vehicles with skill.', fr: 'Manipuler outils, armes et véhicules avec habileté.' },
                linkedAttr: 'DEX',
                competences: ['VISEE', 'CONDUITE', 'HABILETE']
            },
            FACONNER: {
                id: 'FACONNER',
                name: { en: 'Shape', fr: 'Façonner' },
                desc: { en: 'Create and modify objects through craftsmanship.', fr: 'Créer et modifier des objets par l\'artisanat.' },
                linkedAttr: 'PER',
                competences: ['DEBROUILLARDISE', 'BRICOLAGE', 'SAVOIR_FAIRE']
            },
            FIGNOLER: {
                id: 'FIGNOLER',
                name: { en: 'Refine', fr: 'Fignoler' },
                desc: { en: 'Perfect details and solve intricate problems.', fr: 'Perfectionner les détails et résoudre des problèmes complexes.' },
                linkedAttr: 'CRE',
                competences: ['ARTIFICES', 'SECURITE', 'CASSE_TETES']
            },
            // Athlétisme actions
            TRAVERSER: {
                id: 'TRAVERSER',
                name: { en: 'Traverse', fr: 'Traverser' },
                desc: { en: 'Move across terrain by walking, running, or climbing.', fr: 'Se déplacer sur le terrain en marchant, courant ou grimpant.' },
                linkedAttr: 'VIG',
                competences: ['PAS', 'GRIMPE', 'ACROBATIE']
            },
            EFFORCER: {
                id: 'EFFORCER',
                name: { en: 'Exert', fr: 'Efforcer' },
                desc: { en: 'Apply physical strength for lifting, jumping, or swimming.', fr: 'Appliquer la force physique pour soulever, sauter ou nager.' },
                linkedAttr: 'FOR',
                competences: ['POID', 'SAUT', 'NATATION']
            },
            MANOEUVRER: {
                id: 'MANOEUVRER',
                name: { en: 'Maneuver', fr: 'Manœuvrer' },
                desc: { en: 'Navigate unusual environments: flying, burrowing, riding.', fr: 'Naviguer dans des environnements inhabituels : voler, creuser, chevaucher.' },
                linkedAttr: 'AGI',
                competences: ['VOL', 'FOUISSAGE', 'CHEVAUCHEMENT']
            },
            // Charisme actions
            CAPTIVER: {
                id: 'CAPTIVER',
                name: { en: 'Captivate', fr: 'Captiver' },
                desc: { en: 'Draw attention and inspire admiration.', fr: 'Attirer l\'attention et inspirer l\'admiration.' },
                linkedAttr: 'EMP',
                competences: ['SEDUCTION', 'MIMETISME', 'CHANT']
            },
            CONVAINCRE: {
                id: 'CONVAINCRE',
                name: { en: 'Convince', fr: 'Convaincre' },
                desc: { en: 'Persuade others through argument or deception.', fr: 'Persuader les autres par l\'argumentation ou la tromperie.' },
                linkedAttr: 'VOL',
                competences: ['NEGOCIATION', 'TROMPERIE', 'PRESENTATION']
            },
            INTERPRETER: {
                id: 'INTERPRETER',
                name: { en: 'Perform', fr: 'Interpréter' },
                desc: { en: 'Express through music, stories, and artistic performance.', fr: 'S\'exprimer par la musique, les histoires et la performance artistique.' },
                linkedAttr: 'PER',
                competences: ['INSTRUMENTAL', 'INSPIRATION', 'NARRATION']
            },
            // Détection actions
            DISCERNER: {
                id: 'DISCERNER',
                name: { en: 'Discern', fr: 'Discerner' },
                desc: { en: 'Notice details through careful observation.', fr: 'Remarquer les détails par l\'observation attentive.' },
                linkedAttr: 'PER',
                competences: ['VISION', 'ESTIMATION', 'TOUCHER']
            },
            DECOUVRIR: {
                id: 'DECOUVRIR',
                name: { en: 'Discover', fr: 'Découvrir' },
                desc: { en: 'Uncover hidden information through investigation.', fr: 'Découvrir des informations cachées par l\'investigation.' },
                linkedAttr: 'CRE',
                competences: ['INVESTIGATION', 'GOUT', 'RESSENTI']
            },
            DEPISTER: {
                id: 'DEPISTER',
                name: { en: 'Track', fr: 'Dépister' },
                desc: { en: 'Follow trails and sense the environment.', fr: 'Suivre des pistes et percevoir l\'environnement.' },
                linkedAttr: 'EMP',
                competences: ['ODORAT', 'AUDITION', 'INTEROCEPTION']
            },
            // Réflexion actions
            CONCEVOIR: {
                id: 'CONCEVOIR',
                name: { en: 'Design', fr: 'Concevoir' },
                desc: { en: 'Plan and create through intellectual effort.', fr: 'Planifier et créer par l\'effort intellectuel.' },
                linkedAttr: 'CRE',
                competences: ['ARTISANAT', 'MEDECINE', 'INGENIERIE']
            },
            ACCULTURER: {
                id: 'ACCULTURER',
                name: { en: 'Acculturate', fr: 'Acculturer' },
                desc: { en: 'Understand and navigate cultural knowledge.', fr: 'Comprendre et naviguer les savoirs culturels.' },
                linkedAttr: 'EMP',
                competences: ['JEUX', 'SOCIETE', 'GEOGRAPHIE']
            },
            ACCLIMATER: {
                id: 'ACCLIMATER',
                name: { en: 'Acclimate', fr: 'Acclimater' },
                desc: { en: 'Adapt to natural environments and work with nature.', fr: 'S\'adapter aux environnements naturels et travailler avec la nature.' },
                linkedAttr: 'VOL',
                competences: ['NATURE', 'PASTORALISME', 'AGRONOMIE']
            },
            // Domination actions
            DISCIPLINER: {
                id: 'DISCIPLINER',
                name: { en: 'Discipline', fr: 'Discipliner' },
                desc: { en: 'Command others and maintain self-control.', fr: 'Commander les autres et maintenir la maîtrise de soi.' },
                linkedAttr: 'VOL',
                competences: ['COMMANDEMENT', 'OBEISSANCE', 'OBSTINANCE']
            },
            ENDURER: {
                id: 'ENDURER',
                name: { en: 'Endure', fr: 'Endurer' },
                desc: { en: 'Withstand physical hardship and deprivation.', fr: 'Résister aux épreuves physiques et aux privations.' },
                linkedAttr: 'VIG',
                competences: ['GLOUTONNERIE', 'BEUVERIE', 'ENTRAILLES']
            },
            DOMPTER: {
                id: 'DOMPTER',
                name: { en: 'Tame', fr: 'Dompter' },
                desc: { en: 'Control and train creatures and people.', fr: 'Contrôler et dresser créatures et personnes.' },
                linkedAttr: 'FOR',
                competences: ['INTIMIDATION', 'APPRIVOISEMENT', 'DRESSAGE']
            }
        },
        competences: {
            // Puissance - Frapper
            ARME: { id: 'ARME', name: { en: '[Armed]', fr: '[Armé]' }, desc: { en: 'Fighting with melee weapons.', fr: 'Combat avec des armes de mêlée.' }, masteries: ['Arme de Poigne', "d'Antipôle", 'de Parade', 'de Garde', 'Équilibrées', 'Flexibles'] },
            DESARME: { id: 'DESARME', name: { en: '[Unarmed]', fr: '[Désarmé]' }, desc: { en: 'Fighting with bare hands and feet.', fr: 'Combat à mains et pieds nus.' }, masteries: ['Coup sans espace', 'Poings', 'Pieds', 'Coude', 'Genou', 'Corps'] },
            IMPROVISE: { id: 'IMPROVISE', name: { en: '[Improvised]', fr: '[Improvisé]' }, desc: { en: 'Using makeshift weapons.', fr: 'Utilisation d\'armes de fortune.' }, masteries: ['Arme à coupures', 'à pieds', 'rondes', 'de mains', 'de paume', 'de lien', "Jet d'arme improvisée"] },
            // Puissance - Neutraliser
            LUTTE: { id: 'LUTTE', name: { en: '[Wrestling]', fr: '[Lutte]' }, desc: { en: 'Grappling and ground fighting.', fr: 'Saisies et combat au sol.' }, masteries: ['Saisie', 'Bousculade', 'Mise à Terre', 'Projection', 'Soumission'] },
            BOTTES: { id: 'BOTTES', name: { en: '[Techniques]', fr: '[Bottes]' }, desc: { en: 'Special combat techniques.', fr: 'Techniques de combat spéciales.' }, masteries: ['Bloquer', 'Agrippement', 'Entravement', 'Désarmement', "Prise d'arme", "Retournement d'arme"] },
            RUSES: { id: 'RUSES', name: { en: '[Tricks]', fr: '[Ruses]' }, desc: { en: 'Deceptive combat maneuvers.', fr: 'Manœuvres de combat trompeuses.' }, masteries: ['Enchaînement', 'Feinter', 'Contre', 'Hébétement', 'Essouffler', 'Battement', 'Destruction', 'Postures', "Prises d'arme"] },
            // Puissance - Tirer
            BANDE: { id: 'BANDE', name: { en: '[Strung]', fr: '[Bandé]' }, desc: { en: 'Using bows and similar weapons.', fr: 'Utilisation d\'arcs et armes similaires.' }, masteries: ['Encordage (mettre la corde)', 'Surbandé', 'en Tirs Courbés', 'Tirs multiples'] },
            PROPULSE: { id: 'PROPULSE', name: { en: '[Propelled]', fr: '[Propulsé]' }, desc: { en: 'Using crossbows and mechanical launchers.', fr: 'Utilisation d\'arbalètes et lanceurs mécaniques.' }, masteries: ['Tirs Rapprochés', 'Tirs Longue Distance', 'Tirs Imprévisibles', 'Tirs sur 360'] },
            JETE: { id: 'JETE', name: { en: '[Thrown]', fr: '[Jeté]' }, desc: { en: 'Throwing weapons and objects.', fr: 'Lancer d\'armes et d\'objets.' }, masteries: ['de Paume', 'à Manche', 'Rattrapage de jet', 'Jets multiples'] },
            // Aisance - Réagir
            FLUIDITE: { id: 'FLUIDITE', name: { en: '[Fluidity]', fr: '[Fluidité]' }, desc: { en: 'Smooth, flowing movements.', fr: 'Mouvements fluides et coulants.' }, masteries: ['Réactivité', 'Spontanéité', 'Rythmique', 'Feinter', 'Contrer'] },
            ESQUIVE: { id: 'ESQUIVE', name: { en: '[Dodge]', fr: '[Esquive]' }, desc: { en: 'Avoiding attacks.', fr: 'Éviter les attaques.' }, masteries: ['Repositionnante', 'en Roulade', 'Préparée', 'Instinctive'] },
            EVASION: { id: 'EVASION', name: { en: '[Evasion]', fr: '[Évasion]' }, desc: { en: 'Escaping from restraints.', fr: 'S\'échapper des entraves.' }, masteries: ['(Dés)Engagement', 'Faufilage', 'Déliement', 'Délivrement'] },
            // Aisance - Dérober
            ESCAMOTAGE: { id: 'ESCAMOTAGE', name: { en: '[Sleight]', fr: '[Escamotage]' }, desc: { en: 'Pickpocketing and palming.', fr: 'Vol à la tire et escamotage.' }, masteries: ['Espionnant', "d'Objets portés", 'de Véhicules', 'de Créatures'] },
            ILLUSIONS: { id: 'ILLUSIONS', name: { en: '[Illusions]', fr: '[Illusions]' }, desc: { en: 'Creating visual deceptions.', fr: 'Créer des illusions visuelles.' }, masteries: ['Trichantes', 'Spectaculaires', 'de Diversion', 'de Disparition'] },
            DISSIMULATION: { id: 'DISSIMULATION', name: { en: '[Concealment]', fr: '[Dissimulation]' }, desc: { en: 'Hiding oneself and objects.', fr: 'Se cacher soi-même et cacher des objets.' }, masteries: ['Se cacher', 'Cacher des Choses', 'Déplacement silencieux', 'Embuscades/Filatures'] },
            // Aisance - Coordonner
            GESTUELLE: { id: 'GESTUELLE', name: { en: '[Gestures]', fr: '[Gestuelle]' }, desc: { en: 'Expressive body movements.', fr: 'Mouvements corporels expressifs.' }, masteries: ['Danse', 'Posture (au combat)', 'Pantomime', 'Rituelle', 'Athlétique', 'Improvisée'] },
            MINUTIE: { id: 'MINUTIE', name: { en: '[Meticulousness]', fr: '[Minutie]' }, desc: { en: 'Careful, precise handling.', fr: 'Manipulation soigneuse et précise.' }, masteries: ['Délicatesse', 'Doigté', 'Impact', 'Impulsion'] },
            EQUILIBRE: { id: 'EQUILIBRE', name: { en: '[Balance]', fr: '[Équilibre]' }, desc: { en: 'Maintaining stability.', fr: 'Maintenir l\'équilibre.' }, masteries: ['Stabilisant', 'en Sols difficiles', 'Funambule', 'Jonglage', 'Surchargé'] },
            // Précision - Manier
            VISEE: { id: 'VISEE', name: { en: '[Aim]', fr: '[Visée]' }, desc: { en: 'Precise aiming and targeting.', fr: 'Visée et ciblage précis.' }, masteries: ["Mécanismes d'armement", 'Tir à longue distance', 'Tir de soutien', 'en Position difficile', 'Visée multiple'] },
            CONDUITE: { id: 'CONDUITE', name: { en: '[Driving]', fr: '[Conduite]' }, desc: { en: 'Operating vehicles.', fr: 'Conduite de véhicules.' }, masteries: ['Propulsion personnelle', 'Tirée par créatures', 'dans le Risque', 'la Terre', 'les Liquides', 'les Airs', 'le Vide', 'sur Terrain difficile', 'sur Pistes/Rails', 'sur Liquides (glisse)'] },
            HABILETE: { id: 'HABILETE', name: { en: '[Deftness]', fr: '[Habileté]' }, desc: { en: 'Skillful weapon handling.', fr: 'Maniement habile des armes.' }, masteries: ['Une main', 'Deux mains', 'Ambidextrie', 'Recharge/Réarmement', 'Munition en Main', 'Parade'] },
            // Précision - Façonner
            DEBROUILLARDISE: { id: 'DEBROUILLARDISE', name: { en: '[Resourcefulness]', fr: '[Débrouillardise]' }, desc: { en: 'Making do with what\'s available.', fr: 'Se débrouiller avec ce qui est disponible.' }, masteries: ['Monte de camp', 'Orientation', 'Allumage/Extinction', 'Camouflage'] },
            BRICOLAGE: { id: 'BRICOLAGE', name: { en: '[Tinkering]', fr: '[Bricolage]' }, desc: { en: 'Repairing and modifying items.', fr: 'Réparer et modifier des objets.' }, masteries: ['Contrefaçon', 'Raccommodage', 'Amélioration', 'Improvisation'] },
            SAVOIR_FAIRE: { id: 'SAVOIR_FAIRE', name: { en: '[Know-How]', fr: '[Savoir-Faire]' }, desc: { en: 'Specialized crafting knowledge.', fr: 'Connaissances artisanales spécialisées.' }, masteries: ['Alimentaire', 'des Graisses', 'du Papier', 'des Plantes', 'du Textile', 'du Cuir', 'du Verre', 'de la Construction', 'des Métaux', 'des Richesses', 'du Bois', 'de la Lutherie', 'des Arts plastiques', 'des Arts de dessein', 'de la Récolte'] },
            // Précision - Fignoler
            ARTIFICES: { id: 'ARTIFICES', name: { en: '[Devices]', fr: '[Artifices]' }, desc: { en: 'Working with explosive devices.', fr: 'Manipulation d\'engins explosifs.' }, masteries: ['Amorçage', 'Désamorçage', 'Enfumants', 'Explosifs'] },
            SECURITE: { id: 'SECURITE', name: { en: '[Security]', fr: '[Sécurité]' }, desc: { en: 'Locks and security systems.', fr: 'Serrures et systèmes de sécurité.' }, masteries: ['Dévérouillage', 'Verrouillage', 'Copie de serrure', 'Copie de Clef'] },
            CASSE_TETES: { id: 'CASSE_TETES', name: { en: '[Puzzles]', fr: '[Casse-Têtes]' }, desc: { en: 'Solving complex puzzles.', fr: 'Résoudre des casse-têtes complexes.' }, masteries: ["Nœuds d'Attelage", 'de Saisine', 'de Coude', 'de Boucle', 'Épissure de corde', 'Casse-têtes', 'Craque-coffre', 'Puzzles'] },
            // Athlétisme - Traverser
            PAS: { id: 'PAS', name: { en: '[Step]', fr: '[Pas]' }, desc: { en: 'Walking and running.', fr: 'Marcher et courir.' }, masteries: ['Ramper', 'Marcher', 'Courir', 'Charger', 'Pédaler'] },
            GRIMPE: { id: 'GRIMPE', name: { en: '[Climb]', fr: '[Grimpe]' }, desc: { en: 'Scaling surfaces.', fr: 'Escalader des surfaces.' }, masteries: ['Montagnard', 'Glaciaire', 'Descendant', 'en Rappel', 'sur Créature'] },
            ACROBATIE: { id: 'ACROBATIE', name: { en: '[Acrobatics]', fr: '[Acrobatie]' }, desc: { en: 'Aerial maneuvers and tumbling.', fr: 'Manœuvres aériennes et acrobaties.' }, masteries: ['Aérienne', 'Sauts périlleux', 'Chuter', 'Contorsionniste'] },
            // Athlétisme - Efforcer
            POID: { id: 'POID', name: { en: '[Weight]', fr: '[Poid]' }, desc: { en: 'Lifting and carrying.', fr: 'Soulever et porter.' }, masteries: ['Tirer & Pousser', 'Soulever & Ouvrir', 'Porter', 'Lancer', 'Supporter (Équiper)'] },
            SAUT: { id: 'SAUT', name: { en: '[Jump]', fr: '[Saut]' }, desc: { en: 'Leaping and jumping.', fr: 'Sauter et bondir.' }, masteries: ['Sans élan', 'Précis', 'en Longueur', 'en Hauteur', 'de Paroi', 'à la Perche'] },
            NATATION: { id: 'NATATION', name: { en: '[Swimming]', fr: '[Natation]' }, desc: { en: 'Moving through water.', fr: 'Se déplacer dans l\'eau.' }, masteries: ['Plongeant', 'Contre-courant', 'de Compétition', 'Flotter surplace', 'Secourisme', 'Bataille immergée'] },
            // Athlétisme - Manœuvrer
            VOL: { id: 'VOL', name: { en: '[Flight]', fr: '[Vol]' }, desc: { en: 'Flying and gliding.', fr: 'Voler et planer.' }, masteries: ['Planer', 'Piquer', 'Flotter', 'Poussée'] },
            FOUISSAGE: { id: 'FOUISSAGE', name: { en: '[Burrowing]', fr: '[Fouissage]' }, desc: { en: 'Digging and tunneling.', fr: 'Creuser et faire des tunnels.' }, masteries: ['Viscosité & Liquides', 'Sables & Granulaires', 'Terres & Gravats', 'Roches & Solides'] },
            CHEVAUCHEMENT: { id: 'CHEVAUCHEMENT', name: { en: '[Riding]', fr: '[Chevauchement]' }, desc: { en: 'Mounted movement.', fr: 'Déplacement à cheval.' }, masteries: ['Montée en selle', 'Déplacement monté', 'Manœuvres montées', 'Agissement monté'] },
            // Charisme - Captiver
            SEDUCTION: { id: 'SEDUCTION', name: { en: '[Seduction]', fr: '[Séduction]' }, desc: { en: 'Attracting and charming.', fr: 'Attirer et charmer.' }, masteries: ['Attirer', 'faire Émouvoir', 'faire Admirer', 'faire Reconnaître', 'Avoir une Faveur', 'Subvertir à la Déloyauté'] },
            MIMETISME: { id: 'MIMETISME', name: { en: '[Mimicry]', fr: '[Mimétisme]' }, desc: { en: 'Imitating others.', fr: 'Imiter les autres.' }, masteries: ['Sons naturels', 'Êtres sauvages', 'Accents & Dialectes', 'Mimique', 'Interprétation de rôle', 'Déguisement'] },
            CHANT: { id: 'CHANT', name: { en: '[Singing]', fr: '[Chant]' }, desc: { en: 'Vocal performance.', fr: 'Performance vocale.' }, masteries: ['de Poitrine', "de Tête/d'Appel", 'Diphonique', 'Improvisée', 'de Mélodie', 'en Chœur', 'Ventriloque', 'Sifflée'] },
            // Charisme - Convaincre
            NEGOCIATION: { id: 'NEGOCIATION', name: { en: '[Negotiation]', fr: '[Négociation]' }, desc: { en: 'Bargaining and deal-making.', fr: 'Négocier et conclure des accords.' }, masteries: ['Marchandage', 'Corrompre', 'Diplomatie', 'Débattre', 'Enchèrir', 'Renseignement'] },
            TROMPERIE: { id: 'TROMPERIE', name: { en: '[Deception]', fr: '[Tromperie]' }, desc: { en: 'Lying and deceiving.', fr: 'Mentir et tromper.' }, masteries: ['Belles-paroles', 'Bobards', 'Distraire', 'Escroquer', 'Railleries', 'Troller'] },
            PRESENTATION: { id: 'PRESENTATION', name: { en: '[Presentation]', fr: '[Présentation]' }, desc: { en: 'Making good impressions.', fr: 'Faire bonne impression.' }, masteries: ['Première impression', 'Bienséance', 'Enseigner', 'Réseauter', 'Mode', 'Rumeurs'] },
            // Charisme - Interpréter
            INSTRUMENTAL: { id: 'INSTRUMENTAL', name: { en: '[Instrumental]', fr: '[Instrumental]' }, desc: { en: 'Playing musical instruments.', fr: 'Jouer des instruments de musique.' }, masteries: ['Attirer', 'faire Émouvoir', 'faire Admirer', 'faire Reconnaître', 'Avoir une Faveur', 'Subvertir à la Déloyauté'] },
            INSPIRATION: { id: 'INSPIRATION', name: { en: '[Inspiration]', fr: '[Inspiration]' }, desc: { en: 'Motivating and inspiring.', fr: 'Motiver et inspirer.' }, masteries: ['Apaiser', 'Captiver', 'Éduquer', 'Camaraderie', 'Festivité', 'Fanatisme'] },
            NARRATION: { id: 'NARRATION', name: { en: '[Narration]', fr: '[Narration]' }, desc: { en: 'Telling stories.', fr: 'Raconter des histoires.' }, masteries: ['Fabuleuse & Poétique', 'Banalités', 'Ragots & Rumeurs', 'Propagande', 'Plaisanteries', 'Énigmes'] },
            // Détection - Discerner
            VISION: { id: 'VISION', name: { en: '[Vision]', fr: '[Vision]' }, desc: { en: 'Seeing and observing.', fr: 'Voir et observer.' }, masteries: ['Précise & Distante', 'Écritures', 'Lecture sur lèvre', 'Langage corporel'] },
            ESTIMATION: { id: 'ESTIMATION', name: { en: '[Estimation]', fr: '[Estimation]' }, desc: { en: 'Judging value and quality.', fr: 'Évaluer la valeur et la qualité.' }, masteries: ['Valeur des Objets', 'des Aptitudes', 'des Arts', 'de Contrebande', 'de Recélage', 'Fraude fiscale', 'Comptabilité', 'Administration'] },
            TOUCHER: { id: 'TOUCHER', name: { en: '[Touch]', fr: '[Toucher]' }, desc: { en: 'Feeling through touch.', fr: 'Percevoir par le toucher.' }, masteries: ['Textures', 'Températures', 'Lectures à froid', 'Reconnaissance aveugle'] },
            // Détection - Découvrir
            INVESTIGATION: { id: 'INVESTIGATION', name: { en: '[Investigation]', fr: '[Investigation]' }, desc: { en: 'Searching and analyzing.', fr: 'Rechercher et analyser.' }, masteries: ['Fouille', 'Pistage', 'Autopsie', 'Décryptage', 'Profilage', 'Découverte', 'Prospective'] },
            GOUT: { id: 'GOUT', name: { en: '[Taste]', fr: '[Goût]' }, desc: { en: 'Tasting and identifying.', fr: 'Goûter et identifier.' }, masteries: ['Du Salé', "De l'Acide", 'Du Sucré', "De l'Umami", "De l'Amer", 'Culinaires', 'Malaises', 'Secrétions'] },
            RESSENTI: { id: 'RESSENTI', name: { en: '[Feeling]', fr: '[Ressenti]' }, desc: { en: 'Sensing emotions and intent.', fr: 'Percevoir les émotions et intentions.' }, masteries: ['Temps & Climat', 'Êtres sauvages', 'Vérité', 'Mentalisme', 'Émotions & Motivations', 'Se relater'] },
            // Détection - Dépister
            ODORAT: { id: 'ODORAT', name: { en: '[Smell]', fr: '[Odorat]' }, desc: { en: 'Detecting by scent.', fr: 'Détecter par l\'odorat.' }, masteries: ['Parfums mélangés', 'Airs sains & malsains', 'Pistage', 'Détection aveugle'] },
            AUDITION: { id: 'AUDITION', name: { en: '[Hearing]', fr: '[Audition]' }, desc: { en: 'Listening and sound detection.', fr: 'Écouter et détecter les sons.' }, masteries: ['Écoute & Murmures', 'Sons naturels', 'Apprentissage du parlé', 'Écholocation'] },
            INTEROCEPTION: { id: 'INTEROCEPTION', name: { en: '[Interoception]', fr: '[Interoception]' }, desc: { en: 'Internal body awareness.', fr: 'Conscience corporelle interne.' }, masteries: ['Équilibroception', 'Proprioception', 'Faim', 'Soif', 'Suffocation', 'Empoisonnement', 'Émotions', 'Temporalité'] },
            // Réflexion - Concevoir
            ARTISANAT: { id: 'ARTISANAT', name: { en: '[Craftsmanship]', fr: '[Artisanat]' }, desc: { en: 'Creating quality goods.', fr: 'Créer des biens de qualité.' }, masteries: ['Alimentaire', 'des Graisses', 'du Papier', 'des Plantes', 'du Textile', 'du Cuir', 'du Verre', 'de la Construction', 'des Métaux', 'des Richesses', 'du Bois', 'de la Lutherie', 'des Arts plastiques', 'des Arts de dessein', 'de la Récolte'] },
            MEDECINE: { id: 'MEDECINE', name: { en: '[Medicine]', fr: '[Médecine]' }, desc: { en: 'Healing and medical knowledge.', fr: 'Soins et connaissances médicales.' }, masteries: ['Diagnostiquer', 'Thérapie', 'Premiers soins', 'Chirurgie', 'Folies', 'Poisons/Antipoisons'] },
            INGENIERIE: { id: 'INGENIERIE', name: { en: '[Engineering]', fr: '[Ingénierie]' }, desc: { en: 'Technical and mechanical design.', fr: 'Conception technique et mécanique.' }, masteries: ['Civil', 'Mécanique', 'Chimique', 'Énergique', 'Mathématique', 'Recherche académique'] },
            // Réflexion - Acculturer
            JEUX: { id: 'JEUX', name: { en: '[Games]', fr: '[Jeux]' }, desc: { en: 'Playing and understanding games.', fr: 'Jouer et comprendre les jeux.' }, masteries: ["Jeux d'Ambiance", 'de Société', 'de Hasard', "d'Esprit", 'de Rôle', 'Guide de jeu', 'Arbitrage', 'Conceptualisation', 'Parier & Défier', 'Compétition'] },
            SOCIETE: { id: 'SOCIETE', name: { en: '[Society]', fr: '[Société]' }, desc: { en: 'Understanding social structures.', fr: 'Comprendre les structures sociales.' }, masteries: ['Rilique', 'Préhistorique', 'Folklorique', 'Traditionnelle', 'Internationale', 'Linguistique', 'Artistique', 'Légale', 'Illégale', 'Entrepreneurial', 'Économique', 'des Équipements', 'Militaire'] },
            GEOGRAPHIE: { id: 'GEOGRAPHIE', name: { en: '[Geography]', fr: '[Géographie]' }, desc: { en: 'Knowledge of places and lands.', fr: 'Connaissance des lieux et des terres.' }, masteries: ['Localités', 'Astronomie', 'Climats', 'Dangers naturels', 'Milieux Désertiques', 'Humides', 'Tempérés', 'Habités', 'Souterrains', 'Aquatiques', 'Arboricoles', 'Célestes'] },
            // Réflexion - Acclimater
            NATURE: { id: 'NATURE', name: { en: '[Nature]', fr: '[Nature]' }, desc: { en: 'Understanding the natural world.', fr: 'Comprendre le monde naturel.' }, masteries: ['Airs', 'Minéraux', 'Granulaires', 'Eaux', 'Neiges', 'Arbres', 'Herbes', 'Racines', 'Fungi', 'Créatures Volatiles', 'Terrestres', 'Marines', 'Infimes'] },
            PASTORALISME: { id: 'PASTORALISME', name: { en: '[Pastoralism]', fr: '[Pastoralisme]' }, desc: { en: 'Herding and animal husbandry.', fr: 'Élevage et garde de troupeaux.' }, masteries: ['Gouvernance', 'Pâturage', 'Manutention', 'Marquage', 'Traite', 'Tonte', 'Élevage', 'Croisement', 'Abattage', 'Dressage'] },
            AGRONOMIE: { id: 'AGRONOMIE', name: { en: '[Agronomy]', fr: '[Agronomie]' }, desc: { en: 'Farming and agriculture.', fr: 'Agriculture et culture.' }, masteries: ['Labourage', 'Semailles', 'Cultivation', 'Moisson', 'Produits', 'Approvisionnement'] },
            // Domination - Discipliner
            COMMANDEMENT: { id: 'COMMANDEMENT', name: { en: '[Command]', fr: '[Commandement]' }, desc: { en: 'Leading and giving orders.', fr: 'Diriger et donner des ordres.' }, masteries: ['Coup de fouet', "Se jeter à l'eau", 'Retourner les poches', 'Tirer les ficelles', 'Lever les bâtons', 'Dans le chaos', 'La corde au cou', 'Cracher les ordres', 'Roi nu', 'Duelliste'] },
            OBEISSANCE: { id: 'OBEISSANCE', name: { en: '[Obedience]', fr: '[Obéissance]' }, desc: { en: 'Following orders faithfully.', fr: 'Suivre les ordres fidèlement.' }, masteries: ["Courber l'échine", 'Se plier en quatre', 'Lèche-botte', 'Sauter sur la grenade', 'Bouffer dans la main', 'Suivre le troupeau', 'Marquer sa chair', "S'adapter", 'Mimer la bête'] },
            OBSTINANCE: { id: 'OBSTINANCE', name: { en: '[Stubbornness]', fr: '[Obstinance]' }, desc: { en: 'Persistent determination.', fr: 'Détermination persistante.' }, masteries: ['Mains propres (Moralité)', 'Ambitieuse (Motivation)', 'Tête de mule (Personnalité)', 'Respectueuse (Socialité)', 'Fidèle (Disposition)', 'Obsédée (Passion)', 'Martyr'] },
            // Domination - Endurer
            GLOUTONNERIE: { id: 'GLOUTONNERIE', name: { en: '[Gluttony]', fr: '[Gloutonnerie]' }, desc: { en: 'Consuming large quantities.', fr: 'Consommer de grandes quantités.' }, masteries: ["Capacité d'Aspiration", "Contrôle d'Aspiration", "Capacité d'Inhalation", "Contrôle d'Inhalation", "Capacité d'Expiration", "Contrôle d'Expiration", 'Aspiration continue (sans reflux)'] },
            BEUVERIE: { id: 'BEUVERIE', name: { en: '[Drinking]', fr: '[Beuverie]' }, desc: { en: 'Drinking and alcohol tolerance.', fr: 'Boire et tolérance à l\'alcool.' }, masteries: ['Capacité des Mâchoires', "d'Avalement d'Ingurgitation", 'Capacité/Contrôle de Déglutition', 'Résistance au textures Visqueuses', 'Résistance au textures Granuleuses', 'Résistance au textures Épineuses'] },
            ENTRAILLES: { id: 'ENTRAILLES', name: { en: '[Guts]', fr: '[Entrailles]' }, desc: { en: 'Stomach fortitude.', fr: 'Force intestinale.' }, masteries: ['Résistance interne', 'aux Inconfort', 'à la Saleté', "Capacité d'Absorption cutanée", "d'Estomac", 'Pulmonaire', 'Vésicale', 'Rectale'] },
            // Domination - Dompter
            INTIMIDATION: { id: 'INTIMIDATION', name: { en: '[Intimidation]', fr: '[Intimidation]' }, desc: { en: 'Frightening others.', fr: 'Effrayer les autres.' }, masteries: ['Par la Force (coup de pression)', 'Torture', 'Insulte', 'Chantage', 'Terreur', 'Interrogatoire', 'Tête-à-tête', 'Regard noir', 'Voix grave'] },
            APPRIVOISEMENT: { id: 'APPRIVOISEMENT', name: { en: '[Taming]', fr: '[Apprivoisement]' }, desc: { en: 'Calming and befriending.', fr: 'Calmer et apprivoiser.' }, masteries: ['Caresse', 'Apaisement', 'Friandise', 'Main tendue', 'Lire par le regard', 'Habitude', 'Apaiser', 'Motiver', 'Être Monté & Transporter', 'Ordonnée', 'à Combattre'] },
            DRESSAGE: { id: 'DRESSAGE', name: { en: '[Training]', fr: '[Dressage]' }, desc: { en: 'Teaching and conditioning.', fr: 'Enseigner et conditionner.' }, masteries: ['Par Répétition', 'Par Fouet', 'Par Récompense', 'Par Imitation', "en un(e) Bête/Être de jeu", "en un(e) Bête/Être de spectacle", "en un(e) Bête/Être de monte", "en un(e) Bête/Être de travail", "en un(e) Bête/Être de combat", "en un(e) Bête/Être de noblesse", 'Marquage', 'Esclavage', "Briser l'âme"] }
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
                                    html += '<span class="attributes-tree-mastery">' + mastery + '</span>';
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

