import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const lines = fs.readFileSync(path.join(root, 'public/js/dtd-interactive.js'), 'utf8').split(/\r?\n/);

function strip(s) {
    return s
        .split('\n')
        .map((l) => l.replace(/^    /, ''))
        .join('\n');
}

const rules = strip(lines.slice(1821, 2423).join('\n')); // 1822-2423 accordion through attributes tree
const rulesHead = `import { elements } from './context';
import { carouselStates } from './context';
import { setupImgFade } from './dom-utils';

`;

const modals = strip(lines.slice(2424, 2548).join('\n')); // pdf + contact 2425-2548
const modalsHead = `import { state } from './context';

`;

const newsletter = strip(lines.slice(2788, 2892).join('\n')); // 2789-2892
const newsletterHead = `import { state } from './context';

`;

const landing = strip(lines.slice(2893, 3173).join('\n')); // galleries ... character sheet
const landingHead = `import { carouselStates } from './context';

`;

const webgl = strip(lines.slice(3174, 3234).join('\n'));
const webglHead = '';

const sticky = strip(lines.slice(126, 205).join('\n')); // initStickyMainNav 127-205
const stickyHead = `import { doubleRaf } from './dom-utils';

`;

const copyright = strip(lines.slice(3237, 3301).join('\n')); // initCopyrightProtection IIFE inner

fs.writeFileSync(path.join(root, 'src/site/dtd/rules-ui.ts'), rulesHead + rules + '\n', 'utf8');
fs.writeFileSync(path.join(root, 'src/site/dtd/modals.ts'), modalsHead + modals + '\n', 'utf8');
fs.writeFileSync(path.join(root, 'src/site/dtd/newsletter.ts'), newsletterHead + newsletter + '\n', 'utf8');
fs.writeFileSync(path.join(root, 'src/site/dtd/landing-extra.ts'), landingHead + landing + '\n', 'utf8');
fs.writeFileSync(path.join(root, 'src/site/dtd/webgl-site.ts'), webglHead + webgl + '\n', 'utf8');
fs.writeFileSync(path.join(root, 'src/site/dtd/nav-sticky.ts'), stickyHead + sticky + '\n', 'utf8');
fs.writeFileSync(path.join(root, 'src/site/dtd/copyright.ts'), copyright + '\n', 'utf8');
console.log('extracted rules, modals, newsletter, landing, webgl, sticky, copyright');
