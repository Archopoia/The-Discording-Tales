import { elements } from './context';

export function initMenuToggle(): void {
    if (!elements.menuToggle || !elements.menu) return;

    elements.menuToggle.addEventListener('click', function () {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', String(!isExpanded));
        elements.menu!.classList.toggle('active');
    });

    document.addEventListener('click', function (e) {
        const t = e.target as Node;
        if (
            elements.menu &&
            elements.menuToggle &&
            !elements.menu.contains(t) &&
            !elements.menuToggle.contains(t)
        ) {
            elements.menu.classList.remove('active');
            elements.menuToggle.setAttribute('aria-expanded', 'false');
        }
    });
}
