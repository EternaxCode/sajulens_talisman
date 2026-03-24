#!/usr/bin/env node
/**
 * Scans talismans/ and regenerates the talismans array in index.html.
 * Run via: node scripts/generate-gallery.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const talismanDir = join(root, 'talismans');
const indexPath = join(root, 'index.html');

const START_MARKER = '// AUTO-GENERATED-START';
const END_MARKER = '// AUTO-GENERATED-END';

function parseElement(filename) {
  return filename.split('_')[0];
}

function parseVersion(filename) {
  const match = filename.match(/_v(\d+)\.svg$/);
  return match ? `v${match[1]}` : 'v1';
}

const files = readdirSync(talismanDir)
  .filter(f => f.endsWith('.svg'))
  .sort();

const entries = files.map(file => ({
  file,
  element: parseElement(file),
  version: parseVersion(file),
}));

const arrayLines = entries.map(
  ({ file, element, version }) =>
    `      { file: '${file}', element: '${element}', version: '${version}' },`
);

const generatedBlock = [
  START_MARKER,
  '    const talismans = [',
  ...arrayLines,
  '    ];',
  `    ${END_MARKER}`,
].join('\n');

const html = readFileSync(indexPath, 'utf8');

const startIdx = html.indexOf(START_MARKER);
const endIdx = html.indexOf(END_MARKER);

if (startIdx === -1 || endIdx === -1) {
  console.error('ERROR: AUTO-GENERATED markers not found in index.html');
  process.exit(1);
}

const before = html.slice(0, startIdx);
const after = html.slice(endIdx + END_MARKER.length);

writeFileSync(indexPath, before + generatedBlock + after, 'utf8');

console.log(`Generated ${entries.length} talisman entries in index.html`);
entries.forEach(({ file, element, version }) =>
  console.log(`  ${element} ${version}  ${file}`)
);
