/**
 * Main-site bundle entry: imports scripts in required order for the static site.
 * Built as dist/main-site.js. CSS stays as css/dtd-website.css (Vite inlines CSS into IIFE; no separate file).
 * Do not add framework code here.
 */
import './tdt-site-data';
import '../public/js/keyhole-entrance.js';
import '../public/js/shaders.js';
import '../public/js/peoples-invective-slides.js';
import './site/dtd/bootstrap';
import '../public/js/gm-system-prompt.js';
import '../public/js/gm-chat.js';
