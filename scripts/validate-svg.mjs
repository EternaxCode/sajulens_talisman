#!/usr/bin/env node
/**
 * Validates that all SVG files in talismans/ are well-formed XML.
 * Run via: node scripts/validate-svg.mjs
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { XMLValidator, XMLParser } from 'fast-xml-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const talismanDir = join(__dirname, '..', 'talismans');

const files = readdirSync(talismanDir).filter(f => f.endsWith('.svg'));

if (files.length === 0) {
  console.error('No SVG files found in talismans/');
  process.exit(1);
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

let errors = 0;

for (const file of files) {
  const filePath = join(talismanDir, file);
  const content = readFileSync(filePath, 'utf8');

  // Fast guard: must start with <svg or <?xml
  if (!content.trim().startsWith('<svg') && !content.trim().startsWith('<?xml')) {
    console.error(`FAIL ${file}: does not start with <svg or <?xml`);
    errors++;
    continue;
  }

  // Well-formed XML check
  const valid = XMLValidator.validate(content);
  if (valid !== true) {
    console.error(`FAIL ${file}: XML parse error - ${valid.err.msg} (line ${valid.err.line})`);
    errors++;
    continue;
  }

  // SVG structure check: root element and xmlns
  let parsed;
  try {
    parsed = parser.parse(content);
  } catch (e) {
    console.error(`FAIL ${file}: XML parse error - ${e.message}`);
    errors++;
    continue;
  }

  if (!parsed.svg) {
    console.error(`FAIL ${file}: root element is not <svg>`);
    errors++;
    continue;
  }

  const xmlns = parsed.svg['@_xmlns'];
  if (xmlns !== 'http://www.w3.org/2000/svg') {
    console.error(`FAIL ${file}: missing xmlns="http://www.w3.org/2000/svg"`);
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
