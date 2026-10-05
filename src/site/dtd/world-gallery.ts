import { state } from './context';

type GalleryItem = { src: string; alt: string; altFr: string; group: string };

function caption(item: GalleryItem): string {
    return uiLang() === 'fr' ? item.altFr || item.alt : item.alt;
}

function uiLang(): 'en' | 'fr' {
    return state.currentLang === 'fr' ? 'fr' : 'en';
}

function label(en: string, fr: string): string {
    return uiLang() === 'fr' ? fr : en;
}

export function initWorldGallery(): void {
    const root = document.getElementById('world-gallery');
    if (!root || root.dataset.galleryReady === '1') return;
    const gridNode = root.querySelector('.world-gallery-grid');
    if (!gridNode) return;
    const grid = gridNode;
    root.dataset.galleryReady = '1';

    const decks = window.__TDT_LANDING_CAROUSELS__;
    const items: GalleryItem[] = [];
    (['animal', 'people', 'world', 'culture'] as const).forEach(function (group) {
        (decks?.[group] ?? []).forEach(function (img) {
            if (!img || !img.src) return;
            items.push({ src: img.src, alt: img.alt || '', altFr: img.altFr || img.alt || '', group: group });
        });
    });

    items.forEach(function (item, index) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'world-gallery-card';
        card.dataset.group = item.group;
        card.dataset.index = String(index);

        const img = document.createElement('img');
        img.src = item.src;
        img.alt = caption(item);
        img.loading = 'lazy';
        img.decoding = 'async';

        const cap = document.createElement('span');
        cap.className = 'world-gallery-card__cap';
        cap.textContent = caption(item);

        card.append(img, cap);
        card.addEventListener('click', function () {
            openAt(index);
        });
        grid.appendChild(card);
    });

    const filters = root.querySelectorAll<HTMLButtonElement>('.world-gallery-filter');
    const countEl = root.querySelector('.world-gallery-count');
    let filter = 'all';

    function visibleIndexes(): number[] {
        const found: number[] = [];
        items.forEach(function (item, index) {
            if (filter === 'all' || item.group === filter) found.push(index);
        });
        return found;
    }

    function applyFilter(next: string): void {
        filter = next;
        grid.querySelectorAll<HTMLElement>('.world-gallery-card').forEach(function (card) {
            const show = filter === 'all' || card.dataset.group === filter;
            card.hidden = !show;
        });
        filters.forEach(function (btn) {
            const on = btn.getAttribute('data-filter') === filter;
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        if (countEl) {
            const n = visibleIndexes().length;
            countEl.textContent =
                uiLang() === 'fr'
                    ? n === 1
                        ? '1 image'
                        : n + ' images'
                    : n === 1
                      ? '1 picture'
                      : n + ' pictures';
        }
    }

    filters.forEach(function (btn) {
        btn.addEventListener('click', function () {
            applyFilter(btn.getAttribute('data-filter') || 'all');
        });
    });

    const dialog = document.createElement('dialog');
    dialog.className = 'world-gallery-lightbox';
    dialog.innerHTML =
        '<div class="world-gallery-lightbox__frame">' +
        '<button type="button" class="world-gallery-lightbox__close"></button>' +
        '<button type="button" class="world-gallery-lightbox__prev"></button>' +
        '<figure class="world-gallery-lightbox__figure">' +
        '<img class="world-gallery-lightbox__img" alt="">' +
        '<figcaption class="world-gallery-lightbox__cap"></figcaption>' +
        '</figure>' +
        '<button type="button" class="world-gallery-lightbox__next"></button>' +
        '</div>';
    document.body.appendChild(dialog);

    const closeBtn = dialog.querySelector('.world-gallery-lightbox__close') as HTMLButtonElement;
    const prevBtn = dialog.querySelector('.world-gallery-lightbox__prev') as HTMLButtonElement;
    const nextBtn = dialog.querySelector('.world-gallery-lightbox__next') as HTMLButtonElement;
    const bigImg = dialog.querySelector('.world-gallery-lightbox__img') as HTMLImageElement;
    const bigCap = dialog.querySelector('.world-gallery-lightbox__cap') as HTMLElement;

    let openIndex = 0;

    function paintChrome(): void {
        closeBtn.setAttribute('aria-label', label('Close', 'Fermer'));
        prevBtn.setAttribute('aria-label', label('Previous picture', 'Image précédente'));
        nextBtn.setAttribute('aria-label', label('Next picture', 'Image suivante'));
        closeBtn.textContent = '×';
        prevBtn.textContent = '‹';
        nextBtn.textContent = '›';
    }

    function show(index: number): void {
        const item = items[index];
        if (!item) return;
        openIndex = index;
        const name = caption(item);
        bigImg.src = item.src;
        bigImg.alt = name;
        bigCap.textContent = name;
        const visible = visibleIndexes();
        const at = visible.indexOf(index);
        dialog.setAttribute(
            'aria-label',
            label('Picture ' + (at + 1) + ' of ' + visible.length, 'Image ' + (at + 1) + ' sur ' + visible.length)
        );
    }

    function step(dir: number): void {
        const visible = visibleIndexes();
        if (visible.length === 0) return;
        let at = visible.indexOf(openIndex);
        if (at < 0) at = 0;
        const next = visible[(at + dir + visible.length) % visible.length];
        show(next);
    }

    function openAt(index: number): void {
        paintChrome();
        show(index);
        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        } else {
            dialog.setAttribute('open', '');
        }
    }

    closeBtn.addEventListener('click', function () {
        dialog.close();
    });
    prevBtn.addEventListener('click', function () {
        step(-1);
    });
    nextBtn.addEventListener('click', function () {
        step(1);
    });
    dialog.addEventListener('click', function (e) {
        if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            step(1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            step(-1);
        }
    });

    function paintCaptions(): void {
        grid.querySelectorAll<HTMLElement>('.world-gallery-card').forEach(function (card) {
            const item = items[Number(card.dataset.index)];
            if (!item) return;
            const name = caption(item);
            const thumb = card.querySelector('img');
            const cap = card.querySelector('.world-gallery-card__cap');
            if (thumb) thumb.alt = name;
            if (cap) cap.textContent = name;
        });
    }

    window.addEventListener('tdt-lang-changed', function () {
        paintCaptions();
        applyFilter(filter);
        paintChrome();
        if (dialog.open) show(openIndex);
    });

    paintChrome();
    applyFilter('all');
}
