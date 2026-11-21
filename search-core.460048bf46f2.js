export const normalize = value => value.normalize('NFKC').toLocaleLowerCase('id').replace(/\s+/g, ' ').trim();

export function findMatches(pages, query, limit = 60) {
  const terms = normalize(query).split(' ').filter(Boolean);
  if (!terms.length) return { total: 0, hits: [] };
  let total = 0;
  const hits = [];
  pages.forEach((page, i) => {
    const normalized = normalize(page);
    if (!terms.every(term => normalized.includes(term))) return;
    total++;
    if (hits.length >= limit) return;
    const start = Math.max(0, normalized.indexOf(terms[0]) - 90);
    const compact = page.normalize('NFKC').replace(/\s+/g, ' ').trim();
    hits.push({ page: i + 1, snippet: (start ? '…' : '') + compact.slice(start, start + 310) + (compact.length > start + 310 ? '…' : '') });
  });
  return { total, hits };
}
