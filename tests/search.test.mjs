import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { findMatches } from '../search-core.js';

const root = new URL('../public/', import.meta.url);
const docs = JSON.parse(await readFile(new URL('data/documents.json', root), 'utf8'));

test('Every available document has its source PDF and exactly one index entry per PDF page', async () => {
  for (const doc of docs.filter(d => d.available)) {
    const pdf = await readFile(new URL(doc.file, root));
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    assert.equal((await stat(new URL(doc.file, root))).size, doc.bytes);
    const pages = JSON.parse(await readFile(new URL(doc.index, root), 'utf8'));
    assert.equal(pages.length, doc.pages);
    assert.equal(pages.filter(p => p.trim()).length, doc.textPages);
  }
});

test('Real SMKK search returns its source page and handles uppercase and spacing', async () => {
  const doc = docs.find(d => d.id === 'iii');
  const pages = JSON.parse(await readFile(new URL(doc.index, root), 'utf8'));
  const result = findMatches(pages, '  IDENTIFIKASI   BAHAYA ');
  assert(result.total > 0);
  assert(result.hits.some(h => h.page === 1));
  for (const hit of result.hits) assert(pages[hit.page - 1].toLowerCase().includes('bahaya'));
});

test('Search requires all terms on one page and reports full count while limiting results', () => {
  const pages = ['beton', 'tenaga kerja', 'BETON tenaga kerja', 'beton tenaga kerja'];
  const result = findMatches(pages, 'beton kerja', 1);
  assert.equal(result.total, 2);
  assert.equal(result.hits.length, 1);
  assert.equal(result.hits[0].page, 3);
  assert.equal(findMatches(pages, '').total, 0);
  assert.equal(findMatches(pages, 'tidakditemukan123').total, 0);
});

test('Split appendices retain continuous source pages and searchable second parts', async () => {
  for (const [id, count, printed, query] of [['iv', 1689, '1081', 'A.3.07.2b.13'], ['vi', 1563, '5894', '5.1.1.1.37']]) {
    const doc = docs.find(d => d.id === id);
    assert.equal(doc.available, true);
    assert.equal(doc.pages, count);
    assert.equal(doc.sources.length, 2);
    assert.equal(doc.sources[0].startPage, 1);
    assert.equal(doc.sources[0].pages, 800);
    assert.equal(doc.sources[1].startPage, 801);
    assert.equal(doc.sources[1].pages, count - 800);
    const pages = JSON.parse(await readFile(new URL(doc.index, root), 'utf8'));
    assert(pages[800].includes(printed));
    assert(pages[800].includes(query));
    assert(findMatches(pages, query, count).hits.some(h => h.page === 801));
  }
});
