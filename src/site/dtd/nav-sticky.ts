// @ts-nocheck
import { doubleRaf } from './dom-utils';

export function initStickyMainNav() {
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
