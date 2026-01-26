// Visual Gallery Lightbox JavaScript

(function() {
    'use strict';

    // Get all gallery items and lightbox elements
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');

    let currentIndex = 0;
    const images = [];

    // Extract all images data from gallery items
    galleryItems.forEach((item, index) => {
        const imgSrc = item.getAttribute('data-image-src');
        const imgTitle = item.getAttribute('data-image-title') || '';
        images.push({ src: imgSrc, title: imgTitle });
    });

    // Open lightbox function
    function openLightbox(index) {
        if (index < 0 || index >= images.length) return;
        
        currentIndex = index;
        updateLightboxContent();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Close lightbox function
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Update lightbox content with current image
    function updateLightboxContent() {
        if (images.length === 0) return;
        
        const currentImage = images[currentIndex];
        lightboxImage.src = currentImage.src;
        lightboxImage.alt = currentImage.title;
        lightboxCaption.textContent = currentImage.title;
        lightboxCounter.textContent = `${currentIndex + 1} / ${images.length}`;

        // Show/hide navigation buttons
        if (images.length === 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'block';
            nextBtn.style.display = 'block';
        }
    }

    // Navigate to previous image
    function showPrevious() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateLightboxContent();
    }

    // Navigate to next image
    function showNext() {
        currentIndex = (currentIndex + 1) % images.length;
        updateLightboxContent();
    }

    // Event listeners for gallery items
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            openLightbox(index);
        });
    });

    // Event listeners for lightbox controls
    if (closeBtn) {
        closeBtn.addEventListener('click', closeLightbox);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showPrevious();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showNext();
        });
    }

    // Close lightbox when clicking on the background (not on the image)
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;

        switch(e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                showPrevious();
                break;
            case 'ArrowRight':
                showNext();
                break;
        }
    });

    // Prevent lightbox from closing when clicking on the image
    if (lightboxImage) {
        lightboxImage.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Prevent lightbox from closing when clicking on the caption
    if (lightboxCaption) {
        lightboxCaption.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
})();

