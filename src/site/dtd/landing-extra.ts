// @ts-nocheck
import { carouselStates } from './context';

// ========================================
// Galleries: visible 10s / hidden 10s. Hover shows it; leave hides it. Timer keeps running.
// When the active gallery's carousel completes a full cycle (all pictures), switch to next gallery+text.
// ========================================
export function initGalleriesCycling() {
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
            const carState = carousel.id && carouselStates[carousel.id];
            const isOnLastSlide = carState && slideCount > 0 && carState.index === slideCount - 1;
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
export function initSoundCloudCycling() {
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
export function initSoundCloudNoteState() {
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
export function initDiscoveryOvalParallax() {
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
export function initScrollAnimations() {
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
export function initCharacterSheet() {
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
