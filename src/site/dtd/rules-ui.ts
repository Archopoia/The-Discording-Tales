// @ts-nocheck
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
export function initCombat() {
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

export function initMagicProgressionRulesUi() {
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
export function initSystemOverview() {
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
