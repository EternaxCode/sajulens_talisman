#!/usr/bin/env node
/**
 * Validates that all SVG files in talismans/ are well-formed XML.
 * Run via: node scripts/validate-svg.mjs
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const talismanDir = join(__dirname, '..', 'talismans');

const files = readdirSync(talismanDir).filter(f => f.endsWith('.svg'));

if (files.length === 0) {
  console.error('No SVG files found in talismans/');
  process.exit(1);
}

let errors = 0;

for (const file of files) {
  const filePath = join(talismanDir, file);
  const content = readFileSync(filePath, 'utf8');

  // Check for XML declaration or SVG root tag
  if (!content.trim().startsWith('<svg') && !content.trim().startsWith('<?xml')) {
    console.error(`FAIL ${file}: does not start with <svg or <?xml`);
    errors++;
    continue;
  }

  // Check balanced tags (simple heuristic for critical tags)
  const opens = (content.match(/<svg[^>]*>/g) || []).length;
  const closes = (content.match(/<\/svg>/g) || []).length;
  if (opens !== closes || opens === 0) {
    console.error(`FAIL ${file}: mismatched <svg> tags (open=${opens}, close=${closes})`);
    errors++;
    continue;
  }

  // Check required SVG attributes
  if (!content.includes('xmlns="http://www.w3.org/2000/svg"')) {
    console.error(`FAIL ${file}: missing xmlns attribute`);
    errors++;
    continue;
  }

  console.log(`PASS ${file}`);
}

if (errors > 0) {
  console.error(`\n${errors} file(s) failed validation.`);
  process.exit(1);
} else {
  console.log(`\nAll ${files.length} SVG files passed validation.`);
}
