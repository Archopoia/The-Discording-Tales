/**
 * Standalone Navigation Handler
 * Makes tabs and navigation links work locally
 */
(function() {
    'use strict';

    function switchTab(tabId) {
        // Hide all tabs
        const allTabs = document.querySelectorAll('.tab-content');
        allTabs.forEach(function(tab) {
            tab.classList.remove('active');
            tab.style.display = 'none';
        });
        
        // Show the selected tab
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.classList.add('active');
            selectedTab.style.display = 'block';
            
            // Reinitialize slideshows in the newly visible tab
            // Wait a bit for the display change to take effect
            setTimeout(function() {
                if (window.initSlideshows) {
                    // Use the global slideshow initialization function
                    window.initSlideshows();
                } else {
                    // Fallback: initialize slideshows in this tab
                    initSlideshowsInTab(selectedTab);
                }
            }, 100);
            
            // Scroll to top of the page
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }

    function initSlideshowsInTab(tabElement) {
        // Check if Swiper is available
        const SwiperConstructor = window.JetpackSwiper || window.Swiper;
        if (typeof SwiperConstructor === 'undefined') {
            // Swiper not loaded yet, try again later
            setTimeout(function() {
                initSlideshowsInTab(tabElement);
            }, 500);
            return;
        }

        // Find slideshow containers within this tab
        const slideshowContainers = tabElement.querySelectorAll('.wp-block-jetpack-slideshow_container.swiper-container');
        
        slideshowContainers.forEach(function(container) {
            // Skip if already initialized
            if (container.swiper) {
                // Update Swiper to handle visibility change
                if (container.swiper.update) {
                    container.swiper.update();
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
                } : false,
                on: {
                    init: function() {
                        // Ensure first slide is visible
                        container.classList.add('swiper-initialized');
                    }
                }
            };

            // Initialize Swiper
            const swiper = new SwiperConstructor(container, swiperConfig);

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

    function initNavigation() {
        // Initialize: show home tab, hide others
        const allTabs = document.querySelectorAll('.tab-content');
        allTabs.forEach(function(tab) {
            if (tab.id === 'home') {
                tab.classList.add('active');
                tab.style.display = 'block';
            } else {
                tab.classList.remove('active');
                tab.style.display = 'none';
            }
        });
        
        // Handle navigation menu clicks
        const navLinks = document.querySelectorAll('#primary-menu a, .menu a');
        
        navLinks.forEach(function(link) {
            const href = link.getAttribute('href');
            
            // If it's a hash link, switch tabs
            if (href && href.startsWith('#')) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    
                    // Switch to the tab
                    switchTab(targetId);
                    
                    // Update active menu item
                    navLinks.forEach(function(l) {
                        l.parentElement.classList.remove('current-menu-item', 'current_page_item');
                    });
                    link.parentElement.classList.add('current-menu-item', 'current_page_item');
                });
            }
            
            // Disable external WordPress.com links
            if (href && (href.includes('wordpress.com') || href.includes('wp-admin') || href.includes('wp-content'))) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    return false;
                });
                // Remove target="_blank" to keep links local
                link.removeAttribute('target');
                link.removeAttribute('rel');
            }
        });

        // Handle logo and title clicks - switch to home tab
        const logoLinks = document.querySelectorAll('.site-logo-link, .site-title a');
        logoLinks.forEach(function(link) {
            if (link.getAttribute('href') === '#' || link.getAttribute('href') === '#home') {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    switchTab('home');
                    
                    // Update active menu item to home
                    navLinks.forEach(function(l) {
                        l.parentElement.classList.remove('current-menu-item', 'current_page_item');
                    });
                    const homeLink = document.querySelector('#menu-item-2121 a');
                    if (homeLink) {
                        homeLink.parentElement.classList.add('current-menu-item', 'current_page_item');
                    }
                });
            }
        });
        
        // Handle initial hash in URL (if page is loaded with a hash)
        if (window.location.hash) {
            const hash = window.location.hash.substring(1);
            if (document.getElementById(hash)) {
                switchTab(hash);
            }
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavigation);
    } else {
        initNavigation();
    }
})();

