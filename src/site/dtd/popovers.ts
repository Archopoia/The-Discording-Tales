// @ts-nocheck
import {
    expandPeoplesTreeOriginSubtree,
    expandPeoplesTreePeupleRaces,
    fetchPeoplesLocaleJson,
    fillPeoplesTreeRacePanel,
    initPeoplesPortraitLightbox,
    initPeoplesInvectiveRotator,
} from './peoples';

const POPOVER_DELAY_MS = 300;

export function initPopovers() {
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
                en: 'The Ylves (Great Ylves, Pale Ylves, Lake Ylves, and Iqqars), though among themselves they call each other Yôrres, settled and first founded their world through their ancestors - the enthroned Hryôhpéens who sat, hoarded and judged at the greedy, mist-fattened tribunal of Withlaï. They often claim their kin\'s bodies through cannibalism to become one with them (probably inheriting this from their passage in the cold cave of Haolûd the frozen, starving), saving and passing on their possessions to whoever uses them best down the ages. It is said they were once a very isolated, small people in lofty valleys otherwise drowned but rich and flowering, among the many mountains of Dümavel that gave them paradisiac longevity, until the world of the Yôrres as they knew it fell from the sky: cooling of their lands and cultures, mountains first smashing their peoples and civilisation, then glacier floods - leading to cannibalism of their own still so present among Yôrres. The Ylves say they descend from the Aryôphéens, "beings of light" descended from the Dûwasaï Harlbhus, the Great Seasonal Fées. Over many years after that catastrophe, most Hylsyôrres (ancestors to all of them) left the mountains southward on lakes, rivers and streams before finding lands hospitable to their rather sedentary life. A Yôrre population stayed (turning from Withlaï\'s set ways), while three colonies settled in other places; most then became Hydryôrres (said to have come out of Haolûd\'s cave), which ties today\'s Lake and Pale Ylves; Great Ylves (claiming direct descent from Hylsyôrres) settled last. Those who survived in the mountains (or were "cursed", or had lain on the bed of flowers of Wlastaï who floods and quickens) but stayed, climbing higher still, were called Izkyôrres and begot the Iqqar people, so unlike other Yôrres. Ylves eat Yômmes when they no longer understand them through wanting to bend nature by ritual; they see Bêstres as animals grasping nothing of religion\'s use, as resources harvested by, on and through every Bêstre. Fundamentally every people among the Ylves is organised as authoritarian, sedentary bands purifying themselves through often-cannibal consanguinity to found their societies - only Iqqars break or oppose those rules - and you find their tiered city-temples on coasts and in deep lacustrine forests (Iqqars overtop them, sometimes shot at sight). In their myths peopled with spirits yet without priests, gods or ancestors (which shore up conduct and justify traditional orders to keep harmony and hierarchy - except among Iqqars, who stand at opposite dichotomies), they withdraw into the pure solitude of temple-houses, eating whoever could cost them the voice they hear and that guides them (memories, reason, friendships, etc.), or those whose power makes the voices commanding them speak, down to wars fought with guard weapons, balanced, flexible and of antipole.',
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
