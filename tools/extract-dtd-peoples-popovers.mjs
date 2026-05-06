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

const peoplesBody = strip(lines.slice(937, 1436).join('\n')); // 938-1436
const peoplesHead = `import { tdtPeoplesLocaleCache } from './context';
import { setupImgFade } from './dom-utils';

`;

const popoversBody = strip(lines.slice(1440, 1820).join('\n')); // 1441-1820
const popoversHead = `import {
    expandPeoplesTreeOriginSubtree,
    expandPeoplesTreePeupleRaces,
    fetchPeoplesLocaleJson,
    fillPeoplesTreeRacePanel,
    initPeoplesPortraitLightbox,
    initPeoplesInvectiveRotator,
} from './peoples';

`;

fs.writeFileSync(path.join(root, 'src/site/dtd/peoples.ts'), peoplesHead + peoplesBody + '\n', 'utf8');
fs.writeFileSync(path.join(root, 'src/site/dtd/popovers.ts'), popoversHead + popoversBody + '\n', 'utf8');
console.log('Wrote peoples.ts and popovers.ts');
