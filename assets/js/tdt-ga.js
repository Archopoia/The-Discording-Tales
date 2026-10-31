/**
 * Google Analytics 4 (G-EPPG0VGC9H) with Consent Mode defaults denied until Accept.
 * Exposes window.tdtTrack(eventName, params) for Outpost / CTA events.
 */
(function () {
  var MEASUREMENT_ID = 'G-EPPG0VGC9H';
  var STORAGE_KEY = 'tdt_ga_consent';
  var w = window;

  w.dataLayer = w.dataLayer || [];
  function gtag() {
    w.dataLayer.push(arguments);
  }
  w.gtag = gtag;

  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
  document.head.appendChild(s);

  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, { anonymize_ip: true });

  function setConsent(granted) {
    gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
    });
    try {
      localStorage.setItem(STORAGE_KEY, granted ? '1' : '0');
    } catch (e) {
      /* ignore */
    }
  }

  w.tdtTrack = function (name, params) {
    if (typeof w.gtag !== 'function') return;
    w.gtag('event', name, params || {});
  };

  function hideBar(bar) {
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
  }

  function showBar() {
    if (document.getElementById('tdt-ga-consent')) return;
    var bar = document.createElement('div');
    bar.id = 'tdt-ga-consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Analytics consent');
    bar.innerHTML =
      '<p>We use Google Analytics to count visits (no ads). <a href="/privacy">Privacy</a></p>' +
      '<div class="tdt-ga-consent__actions">' +
      '<button type="button" data-tdt-ga="accept">Accept</button>' +
      '<button type="button" data-tdt-ga="decline" class="tdt-ga-consent__decline">No thanks</button>' +
      '</div>';

    var style = document.createElement('style');
    style.textContent =
      '#tdt-ga-consent{position:fixed;z-index:99999;left:0;right:0;bottom:0;display:flex;flex-wrap:wrap;gap:.75rem 1.25rem;align-items:center;justify-content:space-between;padding:.85rem 1.1rem;background:#1a1010;color:#f3e6d8;font:15px/1.4 Georgia,serif;border-top:1px solid rgba(201,162,39,.35);box-shadow:0 -8px 24px rgba(0,0,0,.35)}' +
      '#tdt-ga-consent p{margin:0;max-width:40rem;font-size:.95rem}' +
      '#tdt-ga-consent a{color:#c9a227}' +
      '.tdt-ga-consent__actions{display:flex;gap:.5rem;flex-shrink:0}' +
      '#tdt-ga-consent button{cursor:pointer;padding:.45rem .9rem;border:1px solid #c9a227;background:rgba(201,162,39,.15);color:#f3e6d8;font:inherit}' +
      '#tdt-ga-consent .tdt-ga-consent__decline{border-color:rgba(243,230,216,.35);background:transparent}';
    document.head.appendChild(style);
    document.body.appendChild(bar);

    bar.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t || !t.getAttribute) return;
      var act = t.getAttribute('data-tdt-ga');
      if (act === 'accept') {
        setConsent(true);
        hideBar(bar);
        w.tdtTrack('analytics_consent', { consent: 'granted' });
      } else if (act === 'decline') {
        setConsent(false);
        hideBar(bar);
      }
    });
  }

  function bindOutbound() {
    document.addEventListener(
      'click',
      function (ev) {
        var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
        if (!a) return;
        var href = a.getAttribute('href') || '';
        if (/discord\.gg|discord\.com/i.test(href)) {
          w.tdtTrack('outbound_click', { link_url: href, link_id: 'discord' });
        } else if (/kickstarter\.com/i.test(href)) {
          w.tdtTrack('outbound_click', { link_url: href, link_id: 'kickstarter' });
        } else if (/itch\.io/i.test(href)) {
          w.tdtTrack('outbound_click', { link_url: href, link_id: 'itch' });
        }
      },
      true,
    );
  }

  function boot() {
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
    if (saved === '1') setConsent(true);
    else if (saved === '0') setConsent(false);
    else showBar();
    bindOutbound();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
