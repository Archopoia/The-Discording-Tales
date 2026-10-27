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

export function initTopbarDensity() {
  const bar = document.querySelector<HTMLElement>('.topbar');
  if (!bar) return;
  const onScroll = () => {
    bar.classList.toggle('is-dense', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
