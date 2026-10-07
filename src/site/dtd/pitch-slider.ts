/**
 * Pitch tab: one investor-deck slide at a time.
 * Left/right buttons and arrow keys move a single step. The deck stops at each end.
 */

export function initPitchSlider(): void {
    const root = document.getElementById('pitch-slider');
    if (!root) return;

    const slides = Array.from(root.querySelectorAll<HTMLElement>('.pitch-slider__slide'));
    const prevBtn = root.querySelector<HTMLButtonElement>('.pitch-slider__nav--prev');
    const nextBtn = root.querySelector<HTMLButtonElement>('.pitch-slider__nav--next');
    if (!slides.length || !prevBtn || !nextBtn) return;

    let index = slides.findIndex((slide) => slide.classList.contains('is-active'));
    if (index < 0) index = 0;

    function show(next: number): void {
        index = Math.max(0, Math.min(slides.length - 1, next));
        slides.forEach((slide, i) => {
            const on = i === index;
            slide.classList.toggle('is-active', on);
            slide.setAttribute('aria-hidden', on ? 'false' : 'true');
        });
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === slides.length - 1;
    }

    prevBtn.addEventListener('click', () => show(index - 1));
    nextBtn.addEventListener('click', () => show(index + 1));

    const viewport = root.querySelector('.pitch-slider__viewport');
    if (viewport) {
        let startX = 0;
        let tracking = false;
        viewport.addEventListener('pointerdown', (event) => {
            if (!(event instanceof PointerEvent) || event.button !== 0) return;
            const target = event.target;
            if (target instanceof Element && target.closest('button, a')) return;
            startX = event.clientX;
            tracking = true;
            viewport.setPointerCapture(event.pointerId);
        });
        viewport.addEventListener('pointerup', (event) => {
            if (!tracking || !(event instanceof PointerEvent)) return;
            tracking = false;
            const dx = event.clientX - startX;
            if (Math.abs(dx) < 48) return;
            show(dx < 0 ? index + 1 : index - 1);
        });
        viewport.addEventListener('pointercancel', () => {
            tracking = false;
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.defaultPrevented) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

        const pitch = document.getElementById('pitch');
        if (!pitch || !pitch.classList.contains('active')) return;

        const target = event.target;
        if (target instanceof Element) {
            if (target.closest('nav, input, textarea, select, [contenteditable="true"], dialog')) return;
            const button = target.closest('button');
            if (button && !root.contains(button)) return;
        }

        event.preventDefault();
        show(event.key === 'ArrowLeft' ? index - 1 : index + 1);
    });

    show(index);
}
