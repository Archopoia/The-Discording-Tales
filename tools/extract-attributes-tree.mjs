/**
 * Legacy helper: if attributes data is ever pasted back into dtd-interactive.js as
 * var ATTRIBUTES_TREE_DATA / APTITUDE_PRINCIPAL_ATTR, this extracts it to JSON.
 * Normal workflow: edit public/data/attributes-tree.json directly.
 *
 * Usage: node tools/extract-attributes-tree.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const jsPath = path.join(root, 'public', 'js', 'dtd-interactive.js');
const outPath = path.join(root, 'public', 'data', 'attributes-tree.json');

function extractBraceObject(source, openBraceIndex) {
    let i = openBraceIndex;
    if (source[i] !== '{') throw new Error('expected { at ' + i);
    let depth = 0;
    let inString = null;
    let escaped = false;
    for (; i < source.length; i++) {
        const c = source[i];
        if (inString) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (c === '\\') {
                escaped = true;
                continue;
            }
            if (c === inString) {
                inString = null;
                continue;
            }
            continue;
        }
        if (c === "'" || c === '"' || c === '`') {
            inString = c;
            continue;
        }
        if (c === '{') depth++;
        if (c === '}') {
            depth--;
            if (depth === 0) return source.slice(openBraceIndex, i + 1);
        }
    }
    throw new Error('unclosed object literal');
}

const s = fs.readFileSync(jsPath, 'utf8');

const aptMarker = 'var APTITUDE_PRINCIPAL_ATTR = ';
const aptIdx = s.indexOf(aptMarker);
if (aptIdx === -1) throw new Error('APTITUDE_PRINCIPAL_ATTR not found');
const aptOpen = s.indexOf('{', aptIdx);
const aptLiteral = extractBraceObject(s, aptOpen);
const aptitudePrincipalAttr = (0, eval)('(' + aptLiteral + ')');

const dataMarker = 'var ATTRIBUTES_TREE_DATA = ';
const dataIdx = s.indexOf(dataMarker);
if (dataIdx === -1) throw new Error('ATTRIBUTES_TREE_DATA not found');
const dataOpen = s.indexOf('{', dataIdx);
const dataLiteral = extractBraceObject(s, dataOpen);
const tree = (0, eval)('(' + dataLiteral + ')');

const payload = {
    aptitudePrincipalAttr,
    ...tree,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log('Wrote', path.relative(root, outPath));
