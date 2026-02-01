/**
 * Main-site bundle entry: imports scripts in required order for the static site.
 * Built as dist/main-site.js. CSS stays as css/dtd-website.css (Vite inlines CSS into IIFE; no separate file).
 * Do not add framework code here.
 */
import '../public/js/shaders.js';
import '../public/js/dtd-interactive.js';
import '../public/js/gm-system-prompt.js';
import '../public/js/gm-chat.js';
