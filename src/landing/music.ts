// @ts-nocheck
/** Same track as the main site: Underground Enlightenment.
 *  Starts when the gate lifts. A scripted click does not unlock audio,
 *  so if the browser blocks that, the first real tap or key starts it. */
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

export function initLandingMusic() {
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
    const arm = () => {
      const go = () => {
        play();
        window.removeEventListener('pointerdown', go, true);
        window.removeEventListener('keydown', go, true);
      };
      window.addEventListener('pointerdown', go, true);
      window.addEventListener('keydown', go, true);
    };
    const begin = () => {
      play();
      window.setTimeout(() => {
        widget.isPaused((paused) => { if (paused) arm(); });
      }, 700);
    };
    if (document.documentElement.getAttribute('data-landing-ready') === 'true') begin();
    else document.addEventListener('tdt-landing-ready', begin, { once: true });

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
