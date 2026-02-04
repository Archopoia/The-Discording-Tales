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

        document.body.classList.add('entrance-active');

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
            if (enterButton) {
                enterButton.style.display = 'flex';
                enterButton.addEventListener('mouseenter', function() {
                    enterButton.classList.add('was-hovered');
                }, { once: false });
            }
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

                    /* Fade out entrance while map zooms in (zoom triggered by CSS via entrance-revealing class) */
                    if (entranceFill) {
                        entranceFill.style.animation = 'fadeOut 2s ease-in-out forwards';
                    }
                    if (enterButton) {
                        enterButton.style.pointerEvents = 'none';
                        enterButton.style.animation = 'fadeOut 1.5s ease-in-out forwards';
                    }

                    setTimeout(function() {
                        if (staticLoader) {
                            staticLoader.style.pointerEvents = 'none';
                        }
                        audioUnlocked = true;
                        setTimeout(startChimesLoop, 1000);
                        // Signal SoundCloud player to start after user interaction
                        window.dispatchEvent(new Event('tdt-entrance-complete'));
                    }, 2000);
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
