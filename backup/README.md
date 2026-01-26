# The Discording Tales - Scraped Website

This directory contains a complete, standalone copy of the WordPress site **The Discording Tales** scraped from `https://thediscordingtales.wordpress.com/`.

## 📁 Directory Structure

```
scraped_site/
├── index.html          # Main HTML file (standalone, ready to view)
├── assets/
│   ├── css/           # All CSS stylesheets
│   ├── images/        # All images (logos, backgrounds, slideshow images)
│   ├── fonts/         # Web fonts (WOFF2 format)
│   └── js/            # JavaScript files
└── README.md          # This file
```

## 🚀 How to Use

### View the Site Locally

Simply open `index.html` in any modern web browser:
- Double-click `index.html`
- Or right-click → "Open with" → Your browser
- Or drag and drop `index.html` into your browser

The site should display exactly as it appears on WordPress.com, with all styling, images, and functionality preserved.

### Host the Site

You can host this site on any web server:

1. **Local Server** (for testing):
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Then visit: http://localhost:8000
   ```

2. **GitHub Pages**: Upload the entire `scraped_site` folder to a GitHub repository and enable GitHub Pages

3. **Any Web Hosting**: Upload the `scraped_site` folder contents to your web hosting provider

## 📊 What Was Scraped

- ✅ **236 files** successfully downloaded
- ✅ All CSS stylesheets (including WordPress.com combined CSS)
- ✅ All images (logos, backgrounds, slideshow images, icons)
- ✅ All web fonts (WOFF2 format)
- ✅ All JavaScript files
- ⚠️ 1 file failed (404 error - a background image that no longer exists on the server)

## 🎨 Assets Included

### Images
- Site logo (`symbolpur.png`)
- Background images (`bg.jpg`, `cropped-site-background-1.jpg`)
- Slideshow images (all creature images, world maps, etc.)
- Social media icons
- All content images

### Fonts
- **Fondamento** (for headings) - Google Fonts
- **Vollkorn** (for body text) - Google Fonts
- **Quattrocento** and **Fanwood Text** (theme fonts)

### CSS
- WordPress Gutenberg block styles
- Theme styles (`global.css`)
- Jetpack plugin styles
- Custom inline styles

### JavaScript
- WordPress core scripts
- Jetpack carousel/slideshow functionality
- Social sharing scripts
- Widget scripts

## ⚙️ Technical Details

### Font Loading
The site uses Google Fonts (Fondamento and Vollkorn). These are loaded via:
- Google Fonts API (external CDN) - fonts will load from Google's servers
- Local font files are also included in `assets/fonts/` as backup

### WordPress.com Dependencies
Some functionality may still depend on WordPress.com services:
- Email subscription forms (point to WordPress.com)
- Social sharing buttons (may use WordPress.com APIs)
- Some analytics/tracking scripts

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript must be enabled for slideshows and interactive features
- Responsive design works on mobile devices

## 🔧 Customization

You can edit `index.html` directly to:
- Update content
- Modify styling (CSS is inline and in separate files)
- Change images (replace files in `assets/images/`)
- Update fonts (modify font references in HTML)

## 📝 Notes

- The HTML has been cleaned to use relative paths for all local assets
- External resources (like Google Fonts) still load from their original CDNs
- Some WordPress.com-specific features (like comments, subscriptions) may not work fully offline
- The site is a static snapshot - dynamic content won't update automatically

## 🐛 Known Issues

1. **One missing background image**: `cropped-site-background-1.jpg` returned a 404 error during scraping. The site will still work, but that specific background won't display.

2. **WordPress.com combined CSS**: Some CSS files from WordPress.com's `/_static/` endpoint were downloaded as generic "file" names. These are functional but may need renaming if you want to organize them better.

## 📄 License

This is a scraped copy of content from `https://thediscordingtales.wordpress.com/`. 
Please respect the original site's copyright and terms of use.

---

**Scraped on**: 2025-01-27
**Original Site**: https://thediscordingtales.wordpress.com/
**Total Files**: 236 successfully downloaded

