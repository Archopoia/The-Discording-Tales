/**
 * Keyhole entrance: full-screen overlay with glowing keyhole.
 * Click to enter (plays door_unlock, golden flash, then looped chimes).
 * Same behavior as Hugues.W.B.dePingon soundManager entrance.
 *
 * Iris movement is now pure CSS (eyeIrisCalm animation for idle; centers on hover).
 * Button is visible immediately (no JS gating).
 */
(function() {
    'use strict';

    const SOUNDS_BASE = 'assets/sounds/';

    function createFullyPreloadedAudio(src, volume) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.volume = volume;
        audio.src = src;
        audio.load();
        return audio;
    }

    let doorUnlock = null;
    let chimes = null;
    let audioReady = false;
    let chimesPlaying = false;
    /** Single rAF id for chimes volume envelope (replaces tight setInterval fade loops). */
    let chimesEnvelopeRaf = null;

    function cancelChimesEnvelope() {
        if (chimesEnvelopeRaf != null) {
            cancelAnimationFrame(chimesEnvelopeRaf);
            chimesEnvelopeRaf = null;
        }
    }

    /**
     * One rAF loop: fade in, hold, fade out using element.currentTime (no parallel timers).
     */
    function playChimesWithFade() {
        if (!chimesPlaying || !chimes) return;
        cancelChimesEnvelope();
        const el = chimes;
        el.currentTime = 0;
        el.volume = 0;
        const targetVolume = 0.3;
        const fadeInSec = 2;
        const fadeOutSec = 2;
        el.play().catch(function() {});

        var metaWaitFrames = 0;
        function tick() {
            if (!chimesPlaying || !el) {
                chimesEnvelopeRaf = null;
                return;
            }
            const dur = el.duration;
            if (!dur || isNaN(dur) || !isFinite(dur)) {
                metaWaitFrames++;
                if (metaWaitFrames > 300) {
                    chimesEnvelopeRaf = null;
                    el.onended = function() {
                        if (chimesPlaying) {
                            setTimeout(playChimesWithFade, 100);
                        }
                    };
                    return;
                }
                chimesEnvelopeRaf = requestAnimationFrame(tick);
                return;
            }

            const t = el.currentTime;
            const fadeOutStart = Math.max(fadeInSec, dur - fadeOutSec);

            if (t < fadeInSec) {
                el.volume = targetVolume * (fadeInSec > 0 ? t / fadeInSec : 1);
            } else if (t < fadeOutStart) {
                el.volume = targetVolume;
            } else if (t < dur - 0.02) {
                const span = dur - fadeOutStart;
                el.volume = span > 0 ? targetVolume * ((dur - t) / span) : 0;
            } else {
                chimesEnvelopeRaf = null;
                if (chimesPlaying) {
                    el.currentTime = 0;
                    playChimesWithFade();
                }
                return;
            }
            chimesEnvelopeRaf = requestAnimationFrame(tick);
        }

        chimesEnvelopeRaf = requestAnimationFrame(tick);
    }

    function startChimesLoop() {
        if (chimesPlaying) return;
        if (!audioReady || !chimes) return;
        chimesPlaying = true;
        playChimesWithFade();
    }

    // Pause chimes when user switches away (e.g. another app on mobile),
    // resume when they come back.
    var chimesWasPlaying = false;
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            chimesWasPlaying = chimesPlaying;
            if (chimes && chimesPlaying) {
                chimesPlaying = false;
                cancelChimesEnvelope();
                chimes.pause();
            }
        } else {
            if (chimesWasPlaying && chimes && !chimesPlaying) {
                chimesPlaying = true;
                playChimesWithFade();
            }
        }
    });

    function runEntrance() {
        const staticLoader = document.getElementById('static-loader');
        const entranceFill = document.getElementById('entrance-fill');
        const enterButton = document.getElementById('enter-portfolio-btn');
        const hoverZone = document.getElementById('entrance-hover-zone');

        doorUnlock = createFullyPreloadedAudio(SOUNDS_BASE + 'door_unlock.wav', 0.7);
        chimes = createFullyPreloadedAudio(SOUNDS_BASE + 'Chimes.wav', 0.3);
        chimes.loop = false;

        var pendingAudioSignals = 2;
        function markAudioReady() {
            pendingAudioSignals--;
            if (pendingAudioSignals <= 0) {
                audioReady = true;
            }
        }
        doorUnlock.addEventListener('canplaythrough', markAudioReady, { once: true });
        chimes.addEventListener('canplaythrough', markAudioReady, { once: true });
        setTimeout(function() {
            audioReady = true;
        }, 2500);

        let audioUnlocked = false;

        function unlockAudio(playSound) {
            if (audioUnlocked) return;
            audioUnlocked = true;
            if (enterButton) {
                enterButton.classList.add('entrance-exiting');
            }
            if (staticLoader) {
                staticLoader.style.pointerEvents = 'none';
                staticLoader.classList.add('entrance-revealing');
                if (entranceFill) {
                    entranceFill.style.animation = 'fadeOut 0.65s cubic-bezier(0.33, 0, 0.2, 1) forwards';
                }
                if (playSound && doorUnlock) {
                    doorUnlock.currentTime = 0;
                    doorUnlock.play().catch(function() {});
                }
                setTimeout(startChimesLoop, 1000);
                setTimeout(function() {
                    staticLoader.style.display = 'none';
                }, 900);
            } else {
                if (playSound && doorUnlock) {
                    doorUnlock.currentTime = 0;
                    doorUnlock.play().catch(function() {});
                }
                setTimeout(startChimesLoop, 1000);
            }
            document.body.classList.remove('entrance-active');
        }

        if (hoverZone && enterButton) {
            hoverZone.addEventListener('mouseenter', function() {
                enterButton.classList.add('was-hovered');

                var computed = window.getComputedStyle(enterButton);
                var currentTransform = computed.transform;

                enterButton.style.animation = 'none';
                enterButton.style.transition = 'none';
                enterButton.style.transform = currentTransform;

                void enterButton.offsetHeight;

                enterButton.style.transition = 'transform 0.8s ease-in-out';
                enterButton.style.transform = 'translate(0, 0)';
            }, { once: false });

            hoverZone.addEventListener('mouseleave', function() {
                enterButton.style.animation = '';
                enterButton.style.transition = '';
                enterButton.style.transform = '';
            }, { once: false });
        }

        var isTouchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
        var touchActive = false;
        if (hoverZone && !isTouchOnly) {
            hoverZone.addEventListener('touchstart', function(e) {
                e.preventDefault();
                touchActive = true;
                if (enterButton) {
                    enterButton.classList.add('was-hovered');

                    var computed = window.getComputedStyle(enterButton);
                    var currentTransform = computed.transform;
                    enterButton.style.animation = 'none';
                    enterButton.style.transition = 'none';
                    enterButton.style.transform = currentTransform;
                    void enterButton.offsetHeight;
                    enterButton.style.transition = 'transform 0.8s ease-in-out';
                    enterButton.style.transform = 'translate(0, 0)';
                }
                if (staticLoader) {
                    staticLoader.classList.add('touch-hovering');
                }
            }, { passive: false });

            hoverZone.addEventListener('touchend', function(e) {
                if (touchActive) {
                    e.preventDefault();
                    touchActive = false;
                    if (staticLoader) {
                        staticLoader.classList.remove('touch-hovering');
                    }
                    if (enterButton) {
                        enterButton.style.animation = '';
                        enterButton.style.transition = '';
                        enterButton.style.transform = '';
                    }
                    if (enterButton && !window.keyholeClickInProgress) {
                        enterButton.click();
                    }
                }
            }, { passive: false });

            hoverZone.addEventListener('touchcancel', function() {
                touchActive = false;
                if (staticLoader) {
                    staticLoader.classList.remove('touch-hovering');
                }
                if (enterButton) {
                    enterButton.style.animation = '';
                    enterButton.style.transition = '';
                    enterButton.style.transform = '';
                }
            });
        }

        if (hoverZone) {
            hoverZone.addEventListener('click', function(e) {
                if (!touchActive && enterButton) {
                    enterButton.click();
                }
            }, { once: true });
        }

        if (enterButton) {
            enterButton.addEventListener('click', function() {
                window.keyholeClickInProgress = true;
                if (staticLoader) {
                    staticLoader.classList.add('entrance-revealing');
                }

                /* Flash FIRST while content is still display:none  -  avoids multi-second main-thread
                   layout before the animation can run (was: remove entrance-active, then append flash). */
                var flashElement = document.createElement('div');
                flashElement.id = 'golden-flash';
                document.body.appendChild(flashElement);
                var flashBloomMs = 480;
                var flashFadeMs = 420;
                flashElement.style.animation = 'goldenFlashBloom ' + (flashBloomMs / 1000) + 's linear forwards';

                if (entranceFill) {
                    entranceFill.style.animation = 'fadeOut 1.35s cubic-bezier(0.33, 0, 0.15, 1) forwards';
                }
                if (enterButton) {
                    enterButton.classList.add('entrance-exiting');
                }

                if (doorUnlock) {
                    doorUnlock.volume = 0.7;
                    doorUnlock.currentTime = 0;
                    doorUnlock.play().catch(function() {});
                }

                /* Stagger full-page unhide so it doesn't land in the same frame as the composited bloom start. */
                setTimeout(function() {
                    document.body.classList.remove('entrance-active');
                }, 56);

                setTimeout(function() {
                    flashElement.classList.add('golden-flash--fading');
                }, flashBloomMs + 16);

                setTimeout(function() {
                    if (staticLoader) {
                        staticLoader.style.pointerEvents = 'none';
                        staticLoader.style.display = 'none';
                    }
                    if (flashElement.parentNode) {
                        flashElement.parentNode.removeChild(flashElement);
                    }
                    audioUnlocked = true;
                    setTimeout(startChimesLoop, 1000);
                    window.dispatchEvent(new Event('tdt-entrance-complete'));
                }, flashBloomMs + 16 + flashFadeMs + 100);
            }, { once: true });
        }

        document.addEventListener('click', function(e) {
            if (!audioUnlocked && !window.keyholeClickInProgress && e.target !== enterButton && !(e.target && e.target.closest && e.target.closest('#enter-portfolio-btn'))) {
                if (doorUnlock) {
                    doorUnlock.volume = 0.7;
                }
                audioReady = true;
                unlockAudio(true);
                window.dispatchEvent(new Event('tdt-entrance-complete'));
            }
        }, { once: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runEntrance);
    } else {
        runEntrance();
    }
})();
