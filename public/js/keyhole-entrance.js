/**
 * Keyhole entrance: full-screen overlay with glowing keyhole.
 * Click to enter (plays door_unlock, golden flash, then looped chimes).
 * Same behavior as Hugues.W.B.dePingon soundManager entrance.
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

    function runEntrance() {
        const staticLoader = document.getElementById('static-loader');
        const entranceFill = document.getElementById('entrance-fill');
        const enterButton = document.getElementById('enter-portfolio-btn');
        const hoverZone = document.getElementById('entrance-hover-zone');

        document.body.classList.add('entrance-active');

        /* Random iris movement - moves the button randomly like an eye looking around */
        let irisMovementInterval = null;
        let isHovering = false;
        let entranceComplete = false;

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        function moveIrisRandomly() {
            if (!enterButton || entranceComplete) return;
            
            // Different ranges for calm vs restless (hover) state
            let xRange, yRange;
            if (isHovering) {
                // Restless: larger, wider movements
                xRange = 25; // vw
                yRange = 12; // vh
            } else {
                // Calm: smaller, gentler movements
                xRange = 10; // vw
                yRange = 5;  // vh
            }
            
            const x = randomInRange(-xRange, xRange);
            const y = randomInRange(-yRange, yRange);
            enterButton.style.transform = 'translate(' + x + 'vw, ' + y + 'vh)';
        }

        function startIrisMovement() {
            // Move immediately, then at intervals
            moveIrisRandomly();
            // Interval: faster when hovering (400-800ms), slower when calm (1200-2000ms)
            const interval = isHovering ? randomInRange(400, 800) : randomInRange(1200, 2000);
            irisMovementInterval = setTimeout(function() {
                if (!entranceComplete) {
                    startIrisMovement();
                }
            }, interval);
        }

        function stopIrisMovement() {
            if (irisMovementInterval) {
                clearTimeout(irisMovementInterval);
                irisMovementInterval = null;
            }
            entranceComplete = true;
        }

        // Track hover state on the hover zone
        if (hoverZone) {
            hoverZone.addEventListener('mouseenter', function() {
                isHovering = true;
            });
            hoverZone.addEventListener('mouseleave', function() {
                isHovering = false;
            });
        }

        // Start the random movement
        startIrisMovement();

        var styleEl = document.createElement('style');
        styleEl.textContent = '@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }';
        document.head.appendChild(styleEl);

        doorUnlock = createFullyPreloadedAudio(SOUNDS_BASE + 'door_unlock.wav', 0.7);
        chimes = createFullyPreloadedAudio(SOUNDS_BASE + 'Chimes.wav', 0.3);
        chimes.loop = false;
        setTimeout(function() {
            audioReady = true;
        }, 500);

        let audioUnlocked = false;

        function unlockAudio(playSound) {
            if (audioUnlocked) return;
            audioUnlocked = true;
            if (enterButton) {
                enterButton.style.pointerEvents = 'none';
                enterButton.style.animation = 'fadeOut 1.5s ease-in-out forwards';
            }
            if (staticLoader) {
                staticLoader.style.pointerEvents = 'none';
                if (entranceFill) {
                    entranceFill.style.animation = 'fadeOut 1.5s ease-in-out forwards';
                }
                if (playSound && doorUnlock) {
                    doorUnlock.currentTime = 0;
                    doorUnlock.play().catch(function() {});
                }
                setTimeout(startChimesLoop, 1000);
            } else {
                if (playSound && doorUnlock) {
                    doorUnlock.currentTime = 0;
                    doorUnlock.play().catch(function() {});
                }
                setTimeout(startChimesLoop, 1000);
            }
        }

        /* Always show the keyhole and require a click (no autoplay auto-unlock) */
        setTimeout(function() {
            var hoverZone = document.getElementById('entrance-hover-zone');
            if (enterButton) {
                enterButton.style.display = 'flex';
            }
            /* Track hover on the larger central zone */
            if (hoverZone && enterButton) {
                hoverZone.addEventListener('mouseenter', function() {
                    enterButton.classList.add('was-hovered');
                }, { once: false });
            }
            
            /* Touch support: press = hover, release = enter */
            var touchActive = false;
            if (hoverZone) {
                hoverZone.addEventListener('touchstart', function(e) {
                    e.preventDefault(); // Prevent mouse events from firing
                    touchActive = true;
                    isHovering = true;
                    if (enterButton) {
                        enterButton.classList.add('was-hovered');
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
                        isHovering = false;
                        if (staticLoader) {
                            staticLoader.classList.remove('touch-hovering');
                        }
                        // Trigger entrance on release
                        if (enterButton && !window.keyholeClickInProgress) {
                            enterButton.click();
                        }
                    }
                }, { passive: false });
                
                hoverZone.addEventListener('touchcancel', function() {
                    touchActive = false;
                    isHovering = false;
                    if (staticLoader) {
                        staticLoader.classList.remove('touch-hovering');
                    }
                });
            }
            
            /* Click on hover zone triggers entrance (desktop) */
            if (hoverZone) {
                hoverZone.addEventListener('click', function(e) {
                    // Only handle if not a touch event (touch handles its own flow)
                    if (!touchActive && enterButton) {
                        enterButton.click();
                    }
                }, { once: true });
            }
            if (enterButton) {
                enterButton.addEventListener('click', function() {
                    window.keyholeClickInProgress = true;
                    // Stop random iris movement
                    stopIrisMovement();
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

                    /* Create beige/golden flash that expands from center */
                    var flashElement = document.createElement('div');
                    flashElement.id = 'golden-flash';
                    flashElement.style.cssText = 'position: fixed; top: 47%; left: 50%; width: 0; height: 0; background: radial-gradient(circle, rgba(255, 235, 198, 1) 0%, rgba(255, 235, 198, 0.8) 20%, rgba(255, 235, 198, 0.4) 35%, rgba(255, 235, 198, 0.1) 50%, transparent 70%); transform: translate(-50%, -50%); border-radius: 50%; pointer-events: none; z-index: 10001; opacity: 1;';
                    document.body.appendChild(flashElement);
                    flashElement.style.animation = 'goldenFlash 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';

                    /* Fade out entrance while map zooms in (zoom triggered by CSS via entrance-revealing class) */
                    if (entranceFill) {
                        entranceFill.style.animation = 'fadeOut 2s ease-in-out forwards';
                    }
                    if (enterButton) {
                        enterButton.style.pointerEvents = 'none';
                        enterButton.style.animation = 'fadeOut 1.5s ease-in-out forwards';
                    }

                    /* After flash expands, fade it out */
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
                        }
                        if (flashElement.parentNode) {
                            flashElement.parentNode.removeChild(flashElement);
                        }
                        audioUnlocked = true;
                        setTimeout(startChimesLoop, 1000);
                        // Signal SoundCloud player to start after user interaction
                        window.dispatchEvent(new Event('tdt-entrance-complete'));
                    }, 2700);
                }, { once: true });
            }
            document.addEventListener('click', function(e) {
                if (!audioUnlocked && !window.keyholeClickInProgress && e.target !== enterButton && !(e.target && e.target.closest && e.target.closest('#enter-portfolio-btn'))) {
                    if (doorUnlock) {
                        doorUnlock.volume = 0.7;
                    }
                    audioReady = true;
                    unlockAudio(true);
                    // Signal SoundCloud player to start after user interaction
                    window.dispatchEvent(new Event('tdt-entrance-complete'));
                }
            }, { once: true });
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runEntrance);
    } else {
        runEntrance();
    }
})();
