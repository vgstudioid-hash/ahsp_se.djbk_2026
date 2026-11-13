import { findMatches } from './search-core.87858e59c44c.js';
const cache = new Map();
async function load(doc) {
  if (!cache.has(doc.id)) cache.set(doc.id, fetch(doc.index).then(r => {
    if (!r.ok) throw new Error('Indeks tidak dapat dimuat.');
    return r.json();
  }).catch(e => { cache.delete(doc.id); throw e; }));
  return cache.get(doc.id);
}
self.onmessage = async ({ data: { id, docs, query } }) => {
  const groups = await Promise.all(docs.filter(d => d.available).map(async doc => {
    try { return { docId: doc.id, ...findMatches(await load(doc), query, 12) }; }
    catch { return { docId: doc.id, error: true, total: 0, hits: [] }; }
  }));
  self.postMessage({ id, groups });
};
