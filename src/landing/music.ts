// @ts-nocheck
/** Same track as the main site: Underground Enlightenment.
 *  SoundCloud iframe + API are deferred until the first real user gesture
 *  so they never contend with geo / gate decode on first paint. */
const TRACK = 'https://w.soundcloud.com/player/?url='
  + encodeURIComponent('https://soundcloud.com/the-discording-tales/underground-enlightenment')
  + '&auto_play=true&hide_related=true&show_comments=false&show_user=false'
  + '&show_reposts=false&visual=false&color=740000';

function loadApi() {
  const sc = window.SC;
  if (sc && sc.Widget) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://w.soundcloud.com/player/api.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('SoundCloud API failed'));
    document.head.appendChild(s);
  });
}

function mountAndPlay() {
  if (document.querySelector('iframe.landing-music')) return;
  const iframe = document.createElement('iframe');
  iframe.className = 'landing-music';
  iframe.title = 'Underground Enlightenment';
  iframe.setAttribute('allow', 'autoplay; encrypted-media');
  iframe.src = TRACK;
  document.body.appendChild(iframe);

  loadApi().then(() => {
    const widget = window.SC.Widget(iframe);
    let started = false;
    const play = () => {
      started = true;
      widget.play();
    };
    play();
    window.setTimeout(() => {
      widget.isPaused((paused) => {
        if (!paused) return;
        const go = () => {
          play();
          window.removeEventListener('pointerdown', go, true);
          window.removeEventListener('keydown', go, true);
        };
        window.addEventListener('pointerdown', go, true);
        window.addEventListener('keydown', go, true);
      });
    }, 700);

    let wasPlaying = false;
    document.addEventListener('visibilitychange', () => {
      if (!started) return;
      if (document.hidden) {
        widget.isPaused((paused) => {
          wasPlaying = !paused;
          if (!paused) widget.pause();
        });
      } else if (wasPlaying) {
        widget.play();
        wasPlaying = false;
      }
    });
  }).catch(() => {});
}

export function initLandingMusic() {
  const arm = () => {
    window.removeEventListener('pointerdown', arm, true);
    window.removeEventListener('keydown', arm, true);
    mountAndPlay();
  };
  window.addEventListener('pointerdown', arm, true);
  window.addEventListener('keydown', arm, true);
}
