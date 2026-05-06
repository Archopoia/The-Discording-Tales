import { elements, carouselStates } from './context';
import { setupImgFade } from './dom-utils';

export function updateCarouselAriaLabels(lang: string): void {
    const prevLabel = lang === 'fr' ? 'Image précédente' : 'Previous image';
    const nextLabel = lang === 'fr' ? 'Image suivante' : 'Next image';
    const goToLabel = lang === 'fr' ? 'Aller à la diapositive ' : 'Go to slide ';
    ['carousel-lifestyles', 'carousel-meanings', 'carousel-stories'].forEach(function (id) {
        const el = document.getElementById(id);
        if (!el) return;
        const prevBtn = el.querySelector('.carousel-prev');
        const nextBtn = el.querySelector('.carousel-next');
        if (prevBtn) prevBtn.setAttribute('aria-label', prevLabel);
        if (nextBtn) nextBtn.setAttribute('aria-label', nextLabel);
        el.querySelectorAll('.carousel-indicators button').forEach((btn, index) =>
            btn.setAttribute('aria-label', goToLabel + (index + 1))
        );
    });
}

type CarouselImage = { src: string; alt: string };

export function buildOneCarousel(containerEl: HTMLElement, images: CarouselImage[]): void {
    if (!containerEl || !images || images.length === 0) return;

    const id = containerEl.id || 'carousel-' + Math.random().toString(36).slice(2);
    carouselStates[id] = { index: 0, interval: null };

    const carouselHTML = `
            <div class="carousel-wrapper">
                <div class="carousel-track">
                    ${images
                        .map(
                            (img, index) => `
                        <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                            <img src="${img.src}" alt="${img.alt}" loading="${index === 0 ? 'eager' : 'lazy'}" />
                        </div>
                    `
                        )
                        .join('')}
                </div>
                <button class="carousel-prev" aria-label="Previous image">‹</button>
                <button class="carousel-next" aria-label="Next image">›</button>
                <div class="carousel-indicators"></div>
            </div>
        `;
    containerEl.innerHTML = carouselHTML;
    containerEl.querySelectorAll('img').forEach(function (img) {
        setupImgFade(img as HTMLImageElement);
    });

    const indicatorsEl = containerEl.querySelector('.carousel-indicators') as HTMLElement;
    images.forEach((_, index) => {
        const indicator = document.createElement('button');
        indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
        indicator.classList.toggle('active', index === 0);
        indicator.addEventListener('click', () => {
            carouselStates[id].index = index;
            containerEl.querySelectorAll('.carousel-slide').forEach((s, i) => s.classList.toggle('active', i === index));
            containerEl.querySelectorAll('.carousel-indicators button').forEach((b, i) => b.classList.toggle('active', i === index));
            restartCarouselAutoplay();
        });
        indicatorsEl.appendChild(indicator);
    });

    const prevBtn = containerEl.querySelector('.carousel-prev');
    const nextBtn = containerEl.querySelector('.carousel-next');
    prevBtn!.addEventListener('click', () => {
        const cs = carouselStates[id];
        cs.index = (cs.index - 1 + images.length) % images.length;
        containerEl.querySelectorAll('.carousel-slide').forEach((s, i) => s.classList.toggle('active', i === cs.index));
        containerEl.querySelectorAll('.carousel-indicators button').forEach((b, i) => b.classList.toggle('active', i === cs.index));
        restartCarouselAutoplay();
    });
    nextBtn!.addEventListener('click', () => {
        const cs = carouselStates[id];
        cs.index = (cs.index + 1) % images.length;
        containerEl.querySelectorAll('.carousel-slide').forEach((s, i) => s.classList.toggle('active', i === cs.index));
        containerEl.querySelectorAll('.carousel-indicators button').forEach((b, i) => b.classList.toggle('active', i === cs.index));
        restartCarouselAutoplay();
    });

    function nextSlide() {
        const cs = carouselStates[id];
        const prevIndex = cs.index;
        cs.index = (cs.index + 1) % images.length;
        containerEl.querySelectorAll('.carousel-slide').forEach((s, i) => s.classList.toggle('active', i === cs.index));
        containerEl.querySelectorAll('.carousel-indicators button').forEach((b, i) => b.classList.toggle('active', i === cs.index));
        if (images.length > 1 && prevIndex === images.length - 1 && cs.index === 0) {
            containerEl.dispatchEvent(new CustomEvent('carouselcyclecomplete', { bubbles: true }));
        }
    }
    function restartCarouselAutoplay() {
        if (carouselStates[id].interval) clearInterval(carouselStates[id].interval!);
        carouselStates[id].interval = setInterval(nextSlide, 5000);
    }
    restartCarouselAutoplay();
}

export function initCarousel(): void {
    const lc = window.__TDT_LANDING_CAROUSELS__;
    const lifestylesImages = lc?.lifestyles ?? [];
    const meaningsImages = lc?.meanings ?? [];
    const storiesImages = lc?.stories ?? [];
    const lifestylesEl = document.getElementById('carousel-lifestyles');
    const meaningsEl = document.getElementById('carousel-meanings');
    const storiesEl = document.getElementById('carousel-stories');
    if (lifestylesEl) buildOneCarousel(lifestylesEl, lifestylesImages);
    if (meaningsEl) buildOneCarousel(meaningsEl, meaningsImages);
    if (storiesEl) buildOneCarousel(storiesEl, storiesImages);
    if (elements.carousel) {
        buildOneCarousel(elements.carousel, lifestylesImages);
    }
}
