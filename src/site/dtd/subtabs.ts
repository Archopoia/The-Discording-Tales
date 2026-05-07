// @ts-nocheck
import { state } from './context';
import { setLanguage } from './language';
import { doubleRaf } from './dom-utils';
import { ARCHIVED_SUBTABS } from './archive-constants';

export function syncUniversMondeSublinkActive(innerId: string | null) {
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

export function setUniversWorldInner(innerId: string) {
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

export function initMapPanZoom() {
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

export function initSubTabs() {
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

export function switchSubTab(tabId: string, subId: string, universInnerOverride?: string) {
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

    if (tabId === 'about') {
        doubleRaf(function () {
            var root = document.getElementById('about');
            if (!root || !root.classList.contains('active')) return;
            var main = root.querySelector('.about-tab-sub-nav');
            if (!main || typeof main.scrollIntoView !== 'function') return;
            var smooth = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
            main.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        });
    }
}

export function ensureFirstSubTabActive(tabId: string) {
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

export function initZinePages() {
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
