/**
 * Initialize Jetpack Slideshow blocks with Swiper
 * This script initializes Swiper instances for all slideshows on the page
 */
(function() {
    'use strict';

    function initSlideshows() {
        // Find all slideshow containers
        const slideshowContainers = document.querySelectorAll('.wp-block-jetpack-slideshow_container.swiper-container');
        
        if (!slideshowContainers.length) {
            return;
        }

        // Check if Swiper is available (JetpackSwiper or standard Swiper)
        const SwiperConstructor = window.JetpackSwiper || window.Swiper;
        if (typeof SwiperConstructor === 'undefined') {
            console.warn('Swiper is not loaded. Slideshows will not work.');
            // Try again after a delay
            setTimeout(initSlideshows, 1000);
            return;
        }

        slideshowContainers.forEach(function(container) {
            // Check if container is in a visible tab
            const tabContent = container.closest('.tab-content');
            if (tabContent && tabContent.style.display === 'none') {
                // Skip slideshows in hidden tabs - they'll be initialized when tab becomes visible
                return;
            }

            // Skip if already initialized
            if (container.swiper) {
                // Update Swiper if it exists (in case tab was just shown)
                if (container.swiper.update) {
                    setTimeout(function() {
                        container.swiper.update();
                    }, 100);
                }
                return;
            }

            // Get the slideshow block element (parent)
            const slideshowBlock = container.closest('.wp-block-jetpack-slideshow');
            
            if (!slideshowBlock) {
                return;
            }

            // Get configuration from data attributes
            const autoplay = slideshowBlock.getAttribute('data-autoplay') === 'true';
            const delay = (parseInt(slideshowBlock.getAttribute('data-delay'), 10) || 5000) * 5;
            const effect = slideshowBlock.getAttribute('data-effect') || 'slide';

            // Get navigation elements
            const prevButton = slideshowBlock.querySelector('.wp-block-jetpack-slideshow_button-prev');
            const nextButton = slideshowBlock.querySelector('.wp-block-jetpack-slideshow_button-next');
            const pagination = slideshowBlock.querySelector('.wp-block-jetpack-slideshow_pagination');
            const pauseButton = slideshowBlock.querySelector('.wp-block-jetpack-slideshow_button-pause');

            // Swiper configuration
            const swiperConfig = {
                speed: effect === 'fade' ? 5000 : 2500,
                effect: effect,
                fadeEffect: effect === 'fade' ? {
                    crossFade: true
                } : undefined,
                slidesPerView: 1,
                spaceBetween: 0,
                loop: true,
                observer: true,
                observeParents: true,
                observeSlideChildren: true,
                autoplay: autoplay ? {
                    delay: delay,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true
                } : false,
                pagination: pagination ? {
                    el: pagination,
                    clickable: true,
                    type: 'bullets'
                } : false,
                navigation: (prevButton && nextButton) ? {
                    nextEl: nextButton,
                    prevEl: prevButton
                } : false
            };

            // Initialize Swiper (use JetpackSwiper if available, otherwise Swiper)
            const SwiperClass = window.JetpackSwiper || window.Swiper;
            const swiper = new SwiperClass(container, swiperConfig);
            
            // Mark as initialized immediately
            container.classList.add('swiper-initialized');
            
            // Update Swiper after initialization to ensure proper sizing
            setTimeout(function() {
                if (swiper.update) {
                    swiper.update();
                    swiper.updateSize();
                    swiper.updateSlides();
                }
            }, 100);

            // Handle pause/play button if it exists
            if (pauseButton && autoplay) {
                let isPaused = false;
                
                pauseButton.addEventListener('click', function() {
                    if (isPaused) {
                        swiper.autoplay.start();
                        pauseButton.setAttribute('aria-label', 'Pause Slideshow');
                        pauseButton.classList.remove('swiper-paused');
                        isPaused = false;
                    } else {
                        swiper.autoplay.stop();
                        pauseButton.setAttribute('aria-label', 'Play Slideshow');
                        pauseButton.classList.add('swiper-paused');
                        isPaused = true;
                    }
                });
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSlideshows);
    } else {
        // DOM already loaded
        initSlideshows();
    }

    // Also try after a short delay in case Swiper loads late
    setTimeout(initSlideshows, 500);

    // Make initSlideshows available globally for tab switching
    window.initSlideshows = initSlideshows;
})();

