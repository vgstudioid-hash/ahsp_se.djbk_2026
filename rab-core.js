export const groups = ['Tenaga kerja', 'Bahan', 'Peralatan'];
export const moneyRound = n => Math.round((n + Number.EPSILON) * 100) / 100;
export function nonnegative(value) {
  const n = typeof value === 'number' ? value : Number(value);
  if (value === '' || value == null || !Number.isFinite(n) || n < 0 || n > 1e15) throw new Error('Angka harus bernilai 0 atau lebih dan tidak melebihi 10^15.');
  return n;
}
export function rateKey(item, component) {
  // Codes such as L.02 cover multiple trades; units OH and jam must stay distinct.
  return JSON.stringify([item.docId || 'manual', component.group, component.name.toLocaleLowerCase('id').replace(/\s+/g, ' ').trim(), component.unit.toLocaleLowerCase('id').trim()]);
}
export function calculateItem(item, rates, overhead) {
  const breakdown = item.components.map(c => {
    const key = rateKey(item, c), price = Object.hasOwn(rates, key) ? rates[key] : null;
    return { ...c, key, price, cost: price == null ? null : moneyRound(c.coefficient * price) };
  });
  const missing = breakdown.filter(c => c.price == null).length;
  const direct = moneyRound(breakdown.reduce((sum, c) => sum + (c.cost ?? 0), 0));
  const margin = moneyRound(direct * overhead / 100);
  const unitPrice = moneyRound(direct + margin);
  return { breakdown, missing, unlinked: !item.heading && !item.components.length, direct, margin, unitPrice, amount: item.heading ? 0 : moneyRound(unitPrice * item.volume) };
}
export function calculateProject(project) {
  const items = project.items.map(item => ({ item, ...calculateItem(item, project.rates, project.overhead) }));
  const subtotal = moneyRound(items.reduce((n, r) => n + r.amount, 0));
  const smkk = moneyRound(project.smkk.reduce((n, r) => n + moneyRound(r.volume * r.price), 0));
  const taxBase = moneyRound(subtotal + smkk);
  const tax = moneyRound(taxBase * project.tax / 100);
  const missingKeys = new Set(items.flatMap(i => i.breakdown.filter(c => c.price == null).map(c => c.key)));
  const work = items.filter(i => !i.item.heading);
  const incomplete = !work.length || missingKeys.size > 0 || work.some(i => i.unlinked || i.item.volume <= 0 || !i.item.title.trim());
  return { items, subtotal, smkk, taxBase, tax, total: moneyRound(taxBase + tax), missing: missingKeys.size, incomplete };
}
export function resources(project) {
  const map = new Map();
  for (const item of project.items) for (const c of item.components) {
    const key = rateKey(item, c);
    if (!map.has(key)) map.set(key, { ...c, key, docId: item.docId, quantity: 0, price: Object.hasOwn(project.rates, key) ? project.rates[key] : null });
    map.get(key).quantity += c.coefficient * item.volume;
  }
  return [...map.values()].sort((a, b) => groups.indexOf(a.group) - groups.indexOf(b.group) || a.name.localeCompare(b.name, 'id'));
}
export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function toCsv(rows) { return '\uFEFF' + rows.map(row => row.map(csvCell).join(';')).join('\r\n'); }
export function readCsv(text) {
  const separator = text.split(/\r?\n/)[0].includes(';') ? ';' : ',';
  const rows = [], row = []; let value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else if (!quoted && value.trim()) throw Error('Format kutipan CSV tidak valid.');
      else quoted = !quoted;
    } else if (char === separator && !quoted) { row.push(value); value = ''; }
    else if (char === '\n' && !quoted) { row.push(value.replace(/\r$/, '')); rows.push([...row]); row.length = 0; value = ''; }
    else value += char;
  }
  if (quoted) throw Error('Kutipan CSV belum ditutup.');
  if (value || row.length) { row.push(value.replace(/\r$/, '')); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim())).map(r => r.map(c => c.replace(/^\uFEFF/, '')));
}
export function importRates(text, project) {
  const rows = readCsv(text);
  if (!rows.length) throw Error('CSV kosong.');
  const header = rows.shift().map(c => c.trim().toLowerCase());
  const keyIndex = header.indexOf('kunci'), priceIndex = header.indexOf('harga');
  if (keyIndex < 0 || priceIndex < 0) throw Error('Gunakan template CSV dengan kolom kunci dan harga.');
  const allowed = new Set(resources(project).map(c => c.key)), rates = { ...project.rates };
  let count = 0;
  for (const row of rows) {
    const key = row[keyIndex], raw = row[priceIndex]?.trim();
    if (!allowed.has(key)) throw Error('CSV memuat sumber daya yang tidak ada pada proyek ini.');
    if (raw === '' || raw == null) continue;
    // CSV template uses decimal dot; Indonesian decimal comma is accepted without thousands separators.
    if (!/^\d+(?:[.,]\d+)?$/.test(raw)) throw Error('Harga harus angka tanpa pemisah ribuan. Contoh: 150000 atau 150000,50.');
    rates[key] = nonnegative(raw.replace(',', '.')); count++;
  }
  return { rates, count };
}
export function validateProject(p) {
  if (!p || typeof p !== 'object' || !Array.isArray(p.items) || !Array.isArray(p.smkk) || p.items.length > 1000 || p.smkk.length > 1000) throw Error('Data proyek tidak valid.');
  for (const field of ['name', 'location', 'owner', 'date']) if (typeof p[field] !== 'string' || p[field].length > 1000) throw Error('Identitas proyek tidak valid.');
  for (const field of ['overhead', 'tax']) if (nonnegative(p[field]) > 100) throw Error('Persentase harus 0–100.');
  if (!p.rates || typeof p.rates !== 'object' || Array.isArray(p.rates)) throw Error('Harga dasar tidak valid.');
  const rates = {};
  for (const [key, value] of Object.entries(p.rates)) { if (key.length > 3000) throw Error('Kunci harga terlalu panjang.'); rates[key] = nonnegative(value); }
  const items = p.items.map(item => {
    for (const k of ['code', 'title', 'unit', 'group']) if (typeof item[k] !== 'string' || item[k].length > 2000) throw Error('Identitas pekerjaan tidak valid.');
    if (!Array.isArray(item.components) || item.components.length > 300 || (item.heading && item.components.length)) throw Error('Rincian analisis tidak valid.');
    const wbsLevel = item.wbsLevel ?? 2;
    if (!Number.isInteger(wbsLevel) || wbsLevel < 1 || wbsLevel > 4) throw Error('Tingkat WBS harus 1–4.');
    if (item.remarks != null && (typeof item.remarks !== 'string' || item.remarks.length > 4000)) throw Error('Keterangan tidak valid.');
    if (item.docId && !['se','i','ii','iii','iv','v','vi','vii'].includes(item.docId)) throw Error('Dokumen sumber tidak valid.');
    const page = Number(item.page || 1); if (!Number.isInteger(page) || page < 1 || page > 10000) throw Error('Halaman sumber tidak valid.');
    return { id: crypto.randomUUID(), code: item.code, title: item.title, unit: item.unit, group: item.group, docId: item.docId || '', page, note: String(item.note || '').slice(0,4000), remarks: item.remarks || '', heading: Boolean(item.heading), wbsLevel, manual: Boolean(item.manual), volume: nonnegative(item.volume), components: item.components.map(c => {
      if (!groups.includes(c.group) || typeof c.name !== 'string' || !c.name.trim() || c.name.length > 1000 || typeof c.unit !== 'string' || !c.unit.trim() || c.unit.length > 50) throw Error('Komponen analisis tidak valid.');
      return { group: c.group, name: c.name, unit: c.unit, coefficient: nonnegative(c.coefficient) };
    }) };
  });
  const smkk = p.smkk.map(r => {
    if (typeof r.name !== 'string' || !r.name.trim() || r.name.length > 1000 || typeof r.unit !== 'string' || r.unit.length > 50) throw Error('Rincian SMKK tidak valid.');
    return { id: crypto.randomUUID(), name: r.name, unit: r.unit, volume: nonnegative(r.volume), price: nonnegative(r.price) };
  });
  return { id: crypto.randomUUID(), name: p.name, location: p.location, owner: p.owner, date: p.date, overhead: Number(p.overhead), tax: Number(p.tax), rates, items, smkk };
}

export function wbsNumbers(items) {
  const counters = [0,0,0,0];
  const alpha = (n, upper) => { let s=''; while(n>0){ n--;s=String.fromCharCode((upper?65:97)+n%26)+s;n=Math.floor(n/26); } return s; };
  return items.map(item => {
    const level = item.wbsLevel ?? 2;
    counters[level-1]++;
    for(let i=level;i<4;i++) counters[i]=0;
    return level===1?alpha(counters[0],true):level===2?String(counters[1]):level===3?alpha(counters[2],false):'-';
  });
}
