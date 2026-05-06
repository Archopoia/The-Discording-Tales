// @ts-nocheck
import { tdtPeoplesLocaleCache } from './context';
import { setupImgFade } from './dom-utils';

/**
 * Show an origin's people list and each people's race list (inline styles + aria).
 * Uses direct children only so it still works after .peoples-tree-origin-content is injected.
 */
export function expandPeoplesTreeOriginSubtree(originNode: Element | null) {
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

export function expandPeoplesTreePeupleRaces(peupleNode: Element | null) {
    if (!peupleNode) return;
    var racesEl = peupleNode.querySelector('.peoples-tree-races');
    if (!racesEl) return;
    peupleNode.setAttribute('aria-expanded', 'true');
    racesEl.classList.remove('peoples-tree-races--collapsed');
}

function slugifyRaceLabelForLocale(label: string) {
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

export function fetchPeoplesLocaleJson(lang: string) {
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

export function fillPeoplesTreeRacePanel(peoplesSection, content, raceSpan, langHint) {
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
export function initPeoplesInvectiveRotator(peoplesSection) {
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
export function initPeoplesPortraitLightbox(peoplesSection) {
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

export function initPeuples() {
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
