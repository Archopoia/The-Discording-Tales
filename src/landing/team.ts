// @ts-nocheck
/**
 * Craft filter for the team roster. Keeps the plain accessible pattern
 * from the original IIFE (aria-pressed on buttons, hidden on cards).
 */
export function initTeam() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-filter]'));
  const people = Array.from(document.querySelectorAll<HTMLElement>('.person'));
  if (!buttons.length || !people.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const craft = btn.getAttribute('data-filter') || 'all';
      buttons.forEach((o) => o.setAttribute('aria-pressed', o === btn ? 'true' : 'false'));
      people.forEach((p) => {
        const show = craft === 'all' || p.getAttribute('data-craft') === craft;
        p.hidden = !show;
      });
    });
  });
}

export function initContact() {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const who = String(data.get('from') || '').trim();
    const message = String(data.get('message') || '').trim();
    if (!message) {
      (form.elements.namedItem('message') as HTMLTextAreaElement).focus();
      return;
    }
    const body = (who ? who + '\n\n' : '') + message;
    window.location.href = 'mailto:thediscordingtales@gmail.com?subject='
      + encodeURIComponent('The Discording Tales')
      + '&body=' + encodeURIComponent(body);
  });
}

export function initJumpNav() {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.jump a'));
  if (!links.length) return;
  const sections = links
    .map((l) => document.querySelector<HTMLElement>(l.getAttribute('href') || ''))
    .filter(Boolean) as HTMLElement[];
  if (!('IntersectionObserver' in window) || !sections.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = '#' + (entry.target as HTMLElement).id;
      links.forEach((l) => {
        if (l.getAttribute('href') === id) l.setAttribute('aria-current', 'true');
        else l.removeAttribute('aria-current');
      });
      const current = document.querySelector<HTMLAnchorElement>('.jump a[aria-current="true"]');
      if (current && current.parentElement) {
        const nav = current.parentElement as HTMLElement;
        const left = current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2;
        nav.scrollTo({ left: Math.max(0, left), behavior: 'auto' });
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0.01 });

  sections.forEach((s) => io.observe(s));
}

export function initTopbarDensity() {
  const bar = document.querySelector<HTMLElement>('.topbar');
  if (!bar) return;
  const onScroll = () => {
    bar.classList.toggle('is-dense', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
