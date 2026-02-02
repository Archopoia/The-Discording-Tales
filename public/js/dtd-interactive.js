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
        carousel: document.getElementById('hero-carousel')
    };

    // ========================================
    // Image Gallery Data (Hero Carousel)
    // ========================================
    const heroImages = [
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

    // ========================================
    // Initialize on DOM Load
    // ========================================
    document.addEventListener('DOMContentLoaded', function() {
        initTabs();
        initSubTabs();
        initPeuples();
        initPopovers();
        initCombat();
        initMagic();
        initProgression();
        initLanguage();
        initCarousel();
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
            }
        });
    }

    function handleHashChange() {
        const hash = window.location.hash.substring(1);
        const validTabs = ['landing', 'lore', 'rules', 'play', 'about'];
        const sectionToTab = {
            cosmology: 'lore',
            peoples: 'lore',
            'world-context': 'lore',
            'system-overview': 'rules',
            'character-creation': 'rules',
            progression: 'rules',
            combat: 'rules',
            magic: 'rules'
        };

        if (!hash) {
            switchTab('landing');
            return;
        }
        if (validTabs.includes(hash)) {
            switchTab(hash);
            return;
        }
        if (sectionToTab[hash]) {
            switchTab(sectionToTab[hash], { skipScrollToTop: true });
            switchSubTab(sectionToTab[hash], hash);
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
        const panels = tabContent.querySelectorAll('.tab-sub-panel');
        const links = tabContent.querySelectorAll('.tab-sub-nav-link');
        const firstLink = links[0];
        const firstSubId = firstLink && firstLink.getAttribute('href') ? firstLink.getAttribute('href').replace('#', '') : '';
        if (firstSubId) switchSubTab(tabId, firstSubId);
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

                treeWrap.addEventListener('click', function(ev) {
                    var target = ev.target;
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
        if (!elements.carousel) return;
        const prevBtn = elements.carousel.querySelector('.carousel-prev');
        const nextBtn = elements.carousel.querySelector('.carousel-next');
        const prevLabel = lang === 'fr' ? 'Image précédente' : 'Previous image';
        const nextLabel = lang === 'fr' ? 'Image suivante' : 'Next image';
        if (prevBtn) prevBtn.setAttribute('aria-label', prevLabel);
        if (nextBtn) nextBtn.setAttribute('aria-label', nextLabel);
        const indicators = elements.carousel.querySelectorAll('.carousel-indicators button');
        const goToLabel = lang === 'fr' ? 'Aller à la diapositive ' : 'Go to slide ';
        indicators.forEach((btn, index) => btn.setAttribute('aria-label', goToLabel + (index + 1)));
    }
    // ========================================
    // Image Carousel
    // ========================================
    function initCarousel() {
        if (!elements.carousel) return;

        // Create carousel HTML
        const carouselHTML = `
            <div class="carousel-wrapper">
                <div class="carousel-track">
                    ${heroImages.map((img, index) => `
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
        
        elements.carousel.innerHTML = carouselHTML;

        // Create indicators
        const indicators = elements.carousel.querySelector('.carousel-indicators');
        heroImages.forEach((_, index) => {
            const indicator = document.createElement('button');
            indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
            indicator.classList.toggle('active', index === 0);
            indicator.addEventListener('click', () => goToSlide(index));
            indicators.appendChild(indicator);
        });

        // Add navigation buttons
        const prevBtn = elements.carousel.querySelector('.carousel-prev');
        const nextBtn = elements.carousel.querySelector('.carousel-next');
        
        if (prevBtn) prevBtn.addEventListener('click', () => previousSlide());
        if (nextBtn) nextBtn.addEventListener('click', () => nextSlide());

        // Set carousel aria-labels to current language
        if (typeof updateCarouselAriaLabels === 'function') {
            updateCarouselAriaLabels(state.currentLang);
        }

        // Auto-play carousel
        startCarousel();
    }

    function goToSlide(index) {
        const slides = elements.carousel.querySelectorAll('.carousel-slide');
        const indicators = elements.carousel.querySelectorAll('.carousel-indicators button');
        
        state.carouselIndex = index;
        
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });
    }

    function nextSlide() {
        const nextIndex = (state.carouselIndex + 1) % heroImages.length;
        goToSlide(nextIndex);
        resetCarousel();
    }

    function previousSlide() {
        const prevIndex = (state.carouselIndex - 1 + heroImages.length) % heroImages.length;
        goToSlide(prevIndex);
        resetCarousel();
    }

    function startCarousel() {
        if (state.carouselInterval) {
            clearInterval(state.carouselInterval);
        }
        state.carouselInterval = setInterval(nextSlide, 5000);
    }

    function resetCarousel() {
        startCarousel();
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

