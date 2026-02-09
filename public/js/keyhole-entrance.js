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

    function playChimesWithFade() {
        if (!chimesPlaying || !chimes) return;
        const chimesEl = chimes;
        chimesEl.currentTime = 0;
        chimesEl.volume = 0;
        const fadeInDuration = 2;
        const fadeOutDuration = 2;
        const targetVolume = 0.3;
        chimesEl.play().catch(function() {});

        let fadeInInterval = setInterval(function() {
            if (chimesEl.volume < targetVolume - 0.01) {
                chimesEl.volume = Math.min(chimesEl.volume + 0.01, targetVolume);
            } else {
                clearInterval(fadeInInterval);
            }
        }, (fadeInDuration * 1000) / (targetVolume * 100));

        chimesEl.onended = null;
        const duration = chimesEl.duration;
        if (duration && !isNaN(duration)) {
            const fadeOutStartTime = duration - fadeOutDuration;
            const checkFadeOut = setInterval(function() {
                if (chimesEl.currentTime >= fadeOutStartTime && chimesEl.currentTime < duration) {
                    if (chimesEl.volume > 0.01) {
                        chimesEl.volume = Math.max(chimesEl.volume - 0.01, 0);
                    }
                }
                if (chimesEl.currentTime >= duration - 0.1 || chimesEl.ended) {
                    clearInterval(checkFadeOut);
                    if (chimesPlaying) {
                        setTimeout(playChimesWithFade, 100);
                    }
                }
            }, (fadeOutDuration * 1000) / (targetVolume * 100));
        } else {
            chimesEl.onended = function() {
                if (chimesPlaying) {
                    setTimeout(playChimesWithFade, 100);
                }
            };
        }
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
            // Page is now hidden — remember state and pause
            chimesWasPlaying = chimesPlaying;
            if (chimes && chimesPlaying) {
                chimesPlaying = false;   // stops the re-queue loop
                chimes.pause();
            }
        } else {
            // Page is visible again — resume if it was playing before
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

        // entrance-active class is already on <body> from HTML for instant styling
        // fadeOut keyframes are now defined in CSS (_keyhole.css)

        // Preload audio files
        doorUnlock = createFullyPreloadedAudio(SOUNDS_BASE + 'door_unlock.wav', 0.7);
        chimes = createFullyPreloadedAudio(SOUNDS_BASE + 'Chimes.wav', 0.3);
        chimes.loop = false;
        // Mark audio ready after a brief moment for preloading
        setTimeout(function() {
            audioReady = true;
        }, 300);

        let audioUnlocked = false;

        function unlockAudio(playSound) {
            if (audioUnlocked) return;
            audioUnlocked = true;
            // Use CSS class to properly fade out button + logo
            if (enterButton) {
                enterButton.classList.add('entrance-exiting');
            }
            if (staticLoader) {
                staticLoader.style.pointerEvents = 'none';
                staticLoader.classList.add('entrance-revealing');
                if (entranceFill) {
                    entranceFill.style.animation = 'fadeOut 1.5s ease-in-out forwards';
                }
                if (playSound && doorUnlock) {
                    doorUnlock.currentTime = 0;
                    doorUnlock.play().catch(function() {});
                }
                setTimeout(startChimesLoop, 1000);
                // Fully hide the overlay after fade-out completes so it can't block clicks
                setTimeout(function() {
                    staticLoader.style.display = 'none';
                }, 2000);
            } else {
                if (playSound && doorUnlock) {
                    doorUnlock.currentTime = 0;
                    doorUnlock.play().catch(function() {});
                }
                setTimeout(startChimesLoop, 1000);
            }
            document.body.classList.remove('entrance-active');
        }

        // Set up hover tracking for was-hovered class (used for CSS glow reverse)
        // Also smoothly center the eye iris on hover (capture current animated position, then transition to center)
        if (hoverZone && enterButton) {
            hoverZone.addEventListener('mouseenter', function() {
                enterButton.classList.add('was-hovered');

                // Capture current animated position as a matrix
                var computed = window.getComputedStyle(enterButton);
                var currentTransform = computed.transform;

                // Stop the CSS animation and pin at current position
                enterButton.style.animation = 'none';
                enterButton.style.transition = 'none';
                enterButton.style.transform = currentTransform;

                // Force reflow so browser registers the pinned position
                void enterButton.offsetHeight;

                // Now enable transition and smoothly glide to center
                enterButton.style.transition = 'transform 0.8s ease-in-out';
                enterButton.style.transform = 'translate(0, 0)';
            }, { once: false });

            hoverZone.addEventListener('mouseleave', function() {
                // Remove inline overrides so CSS eyeIrisCalm animation resumes
                enterButton.style.animation = '';
                enterButton.style.transition = '';
                enterButton.style.transform = '';
            }, { once: false });
        }

        // Touch support
        // On mobile (touch-only devices), the hovered state is permanent via CSS,
        // so a simple tap fires the click handler below — no press-to-hover dance needed.
        // On hybrid devices (touch + mouse, e.g. tablets with stylus), keep the old flow.
        var isTouchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
        var touchActive = false;
        if (hoverZone && !isTouchOnly) {
            hoverZone.addEventListener('touchstart', function(e) {
                e.preventDefault(); // Prevent mouse events from firing
                touchActive = true;
                if (enterButton) {
                    enterButton.classList.add('was-hovered');

                    // Smooth centering for touch (same logic as mouseenter)
                    var computed = window.getComputedStyle(enterButton);
                    var currentTransform = computed.transform;
                    enterButton.style.animation = 'none';
                    enterButton.style.transition = 'none';
                    enterButton.style.transform = currentTransform;
                    void enterButton.offsetHeight;
                    enterButton.style.transition = 'transform 0.8s ease-in-out';
                    enterButton.style.transform = 'translate(0, 0)';
                }
                // Add visual class for touch hover state
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
                    // Restore animation
                    if (enterButton) {
                        enterButton.style.animation = '';
                        enterButton.style.transition = '';
                        enterButton.style.transform = '';
                    }
                    // Trigger entrance on release
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
                // Restore animation
                if (enterButton) {
                    enterButton.style.animation = '';
                    enterButton.style.transition = '';
                    enterButton.style.transform = '';
                }
            });
        }

        // Click on hover zone triggers entrance (desktop)
        if (hoverZone) {
            hoverZone.addEventListener('click', function(e) {
                // Only handle if not a touch event (touch handles its own flow)
                if (!touchActive && enterButton) {
                    enterButton.click();
                }
            }, { once: true });
        }

        // Main click handler for the enter button
        if (enterButton) {
            enterButton.addEventListener('click', function() {
                window.keyholeClickInProgress = true;
                // Keep burgundy overlay faded (don't restart if already fading from hover)
                if (staticLoader) {
                    staticLoader.classList.add('entrance-revealing');
                }
                document.body.classList.remove('entrance-active');
                if (doorUnlock) {
                    doorUnlock.volume = 0.7;
                    doorUnlock.currentTime = 0;
                    doorUnlock.play().catch(function() {});
                }

                // Create beige/golden flash that expands from center
                var flashElement = document.createElement('div');
                flashElement.id = 'golden-flash';
                flashElement.style.cssText = 'position: fixed; top: 47%; left: 50%; width: 0; height: 0; background: radial-gradient(circle, rgba(255, 235, 198, 1) 0%, rgba(255, 235, 198, 0.8) 20%, rgba(255, 235, 198, 0.4) 35%, rgba(255, 235, 198, 0.1) 50%, transparent 70%); transform: translate(-50%, -50%); border-radius: 50%; pointer-events: none; z-index: 10001; opacity: 1;';
                document.body.appendChild(flashElement);
                flashElement.style.animation = 'goldenFlash 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';

                // Fade out entrance while map zooms in (zoom triggered by CSS via entrance-revealing class)
                if (entranceFill) {
                    entranceFill.style.animation = 'fadeOut 2s ease-in-out forwards';
                }
                // Use CSS class to properly override all animations and fade out button + logo
                if (enterButton) {
                    enterButton.classList.add('entrance-exiting');
                }

                // After flash expands, fade it out
                setTimeout(function() {
                    flashElement.style.animation = 'none';
                    void flashElement.offsetHeight;
                    flashElement.style.width = '3000px';
                    flashElement.style.height = '3000px';
                    flashElement.style.animation = 'fadeOut 1.5s ease-in-out forwards';
                }, 1200);

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
                    // Signal site to initialize post-entrance (SoundCloud, deferred init, etc.)
                    window.dispatchEvent(new Event('tdt-entrance-complete'));
                }, 2700);
            }, { once: true });
        }

        // Fallback: clicking anywhere else also unlocks audio and dismisses entrance
        document.addEventListener('click', function(e) {
            if (!audioUnlocked && !window.keyholeClickInProgress && e.target !== enterButton && !(e.target && e.target.closest && e.target.closest('#enter-portfolio-btn'))) {
                if (doorUnlock) {
                    doorUnlock.volume = 0.7;
                }
                audioReady = true;
                unlockAudio(true);
                // Signal site to initialize post-entrance
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
