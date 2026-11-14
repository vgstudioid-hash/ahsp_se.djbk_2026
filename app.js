import { initButtonNavigation } from './button-navigation.05c0ce6186a3.js';
import { normalize } from './search-core.05c0ce6186a3.js';

const icons = {
  home: '<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
  book: '<path d="M3 4h6a4 4 0 0 1 3 2 4 4 0 0 1 3-2h6v15h-6a4 4 0 0 0-3 2 4 4 0 0 0-3-2H3z"/><path d="M12 6v15"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
  external: '<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  chart: '<path d="M4 3v18h17M8 16v-5m5 5V6m5 10v-8"/>',
  layers: '<path d="m3 7 9-5 9 5-9 5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',
  shield: '<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6z"/><path d="m8 12 3 3 5-6"/>',
  water: '<path d="M3 16q3-4 6 0t6 0 6 0M3 21q3-4 6 0t6 0 6 0M12 2s-5 5-5 8a5 5 0 0 0 10 0c0-3-5-8-5-8"/>',
  road: '<path d="M7 3 3 21M17 3l4 18M12 3v3m0 4v4m0 4v3"/>',
  building: '<path d="M5 21V3h14v18M2 21h20M9 7h1m4 0h1M9 11h1m4 0h1M10 21v-6h4v6"/>',
  send: '<path d="m22 2-7 20-4-9L2 9zm0 0L11 13"/>',
  file: '<path d="M5 2h9l5 5v15H5zM14 2v6h5M8 13h8m-8 4h6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  list: '<path d="M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01"/>',
};
const icon = (name, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.file}</svg>`;
const $ = s => document.querySelector(s);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = n => new Intl.NumberFormat('id-ID').format(n);
const main = $('#main');
let docs = [], category = 'Semua', titleQuery = '', view = 'grid', readerDoc = null, readerPage = 1, readerMode = 'pdf', searchId = 0, worker;
const pageCache = new Map();
let saved;
try { saved = JSON.parse(localStorage.getItem('ahsp-bookmarks') || '[]'); if (!Array.isArray(saved)) saved = []; }
catch { saved = []; }
saved = saved.filter(s => s && typeof s.docId === 'string' && Number.isInteger(s.page) && s.page > 0);
let toastTimer;
function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 3200); }
function persist() { try { localStorage.setItem('ahsp-bookmarks', JSON.stringify(saved)); return true; } catch { toast('Penyimpanan browser tidak tersedia. Penanda disimpan selama sesi ini.'); return false; } }
function isSaved(id, page=1) { return saved.some(s => s.docId === id && s.page === page); }
function toggleSaved(id, page=1) {
  if (isSaved(id, page)) { saved = saved.filter(s => s.docId !== id || s.page !== page); toast('Penanda dihapus.'); }
  else { saved.push({ docId: id, page }); toast('Halaman ditambahkan ke Tersimpan.'); }
  persist(); updateNav();
  document.querySelectorAll(`[data-save="${id}"]`).forEach(b => { b.classList.toggle('selected', isSaved(id)); b.setAttribute('aria-pressed', isSaved(id)); b.setAttribute('aria-label', isSaved(id) ? 'Hapus penanda dokumen' : 'Simpan dokumen'); });
  if (readerDoc) updateReaderBookmark();
  if (location.hash.startsWith('#saved')) render();
}
function route() { return (location.hash.slice(1).split('?')[0] || 'home'); }
const names = { home: 'Ikhtisar', library: 'Pustaka Dokumen', fields: 'Bidang Pekerjaan', saved: 'Tersimpan', search: 'Pencarian' };
function updateNav() {
  $('#navigation').innerHTML = [['project','home','Informasi Umum'],['quantity','chart','Quantity Pekerjaan'],['recap','chart','Rekapitulasi RAB'],['rab','list','Rencana Anggaran Biaya (RAB)'],['catalog','grid','Analisa Harga Satuan (AHS)'],['prices','layers','Harga Satuan Dasar (HSD)']].map(([r,i,label])=>`<a href="index.html#${r}">${icon(i)}<span>${label}</span></a>`).join('')+`<a href="#library" class="active" aria-current="page">${icon('book')}<span>Dasar-dasar Perhitungan (Pustaka)</span></a>`;
  $('#breadcrumb-current').textContent = names[route()] || names.home;
}
function blueprint() {
  return `<div class="blueprint" aria-hidden="true"><div class="blueprint-label"><span></span> KNOWLEDGE BUILDS BETTER</div><svg viewBox="0 0 430 270" fill="none"><defs><pattern id="bluegrid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0v22" stroke="currentColor" stroke-opacity=".12" stroke-width=".5"/></pattern></defs><rect width="430" height="270" fill="url(#bluegrid)"/><g stroke="currentColor" stroke-width="1"><path d="m34 192 172-72 185 69-172 72z" opacity=".3"/><path d="m76 183 127-54 130 48-127 55zM76 183v-14l127-53 130 48v13M203 116v13"/><path d="M108 156V90l95-40 94 35v66M108 90l95 35 94-40M203 125v66M120 152V99l70 26v58M216 181v-49l69-29v51M134 156v-51M149 162v-51M164 168v-51M179 174v-51M230 174v-49M245 168v-49M260 162v-49M274 156v-49M120 118l70 26M120 136l70 26M216 151l69-29M216 168l69-29"/><path d="m87 82 116-49 116 43-116 50zM87 82v8l116 43 116-49v-8M203 126v7M163 51v-9l40-17 41 15v9M163 42l40 15 41-17M203 57v10"/><path d="M108 204v15m189-34v15M108 214l189-24M86 95 60 85M86 170l-26-10M66 88v73M339 168l22-10M339 189l22-10M355 160v20" stroke-dasharray="3 4" opacity=".6"/><path d="m57 88 10-5m-10 80 10-5m37 59 8-7m181-16 8-7"/><circle cx="203" cy="32" r="4" fill="#e9bc76" stroke="none"/><path d="M336 62h34m-17-17v34M46 209h18m-9-9v18" opacity=".5"/></g><text x="174" y="237" fill="currentColor" font-size="8" letter-spacing="2" transform="rotate(-8 174 237)">PRESISI DALAM SETIAP DETAIL</text></svg><span class="blueprint-corner">FIG. 01 / KERANGKA REFERENSI</span></div>`;
}
function searchForm(big=false) { return `<form class="search-form ${big?'hero-search':''}" id="search-form" role="search">${icon('search')}<input name="q" id="search-input" type="search" minlength="2" maxlength="120" required placeholder="Cari kata kunci, pekerjaan, atau kode AHSP…" aria-label="Cari isi dokumen" autocomplete="off"><button type="submit">Telusuri ${icon('arrow')}</button></form>`; }
function hero() { return `<section class="hero"><div class="hero-copy"><div class="hero-badge"><span></span> SE DJBK 47/SE/Dk/2026</div><h1>Landasan tepat.<br><span>Perhitungan akurat.</span></h1><p>Seluruh referensi penyusunan perkiraan biaya konstruksi,<br class="desktop-break"> dalam satu ruang yang mudah ditelusuri.</p>${searchForm(true)}<div class="suggestions"><span>Coba cari:</span>${['Beton','Tenaga kerja','SMKK'].map(q=>`<a href="#search?q=${encodeURIComponent(q)}">${q} ${icon('arrow')}</a>`).join('')}</div></div>${blueprint()}</section><div class="stats"><div><span class="stat-icon">${icon('book')}</span><strong>08</strong><span>Dokumen referensi<small>Surat edaran & 7 lampiran</small></span></div><div><span class="stat-icon">${icon('file')}</span><strong>${String(docs.filter(d=>d.available).length).padStart(2,'0')}</strong><span>PDF tersedia<small>Dapat dibaca & diunduh</small></span></div><div><span class="stat-icon">${icon('layers')}</span><strong>${number(docs.reduce((n,d)=>n+(d.pages||0),0))}</strong><span>Halaman sumber<small>Di dalam koleksi tersedia</small></span></div></div>`; }
function card(d) { const marked = isSaved(d.id); return `<article class="document-card ${d.available?'':'unavailable'}"><div class="card-top"><span class="doc-symbol symbol-${d.id}">${icon(d.icon)}</span><button class="icon-button bookmark-button ${marked?'selected':''}" data-save="${d.id}" aria-label="${marked?'Hapus penanda dokumen':'Simpan dokumen'}" aria-pressed="${marked}" ${!d.available?'disabled':''}>${icon('bookmark')}</button></div><div class="card-label">${esc(d.label)} <span>·</span> <span>2026</span></div><h3>${esc(d.title)}</h3><p>${esc(d.description)}</p><div class="card-tags">${d.tags.slice(0,2).map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="card-bottom"><span>${d.available?`${icon('file')} PDF <span class="meta-dot">·</span> ${number(d.pages)} hal.`:`<span class="status-dot"></span> Belum tersedia`}</span>${d.available?`<button class="read-link" data-open="${d.id}">Baca dokumen ${icon('arrow')}</button>`:`<button class="read-link muted" data-unavailable="${d.id}">Info ${icon('arrow')}</button>`}</div></article>`; }
const cats = ['Semua','Pedoman','Keselamatan','Sumber Daya Air','Bina Marga','Cipta Karya'];
function library(home=false) { return `<section class="library-section"><div class="section-heading"><div><div class="eyebrow">${home?'KOLEKSI REFERENSI':'DOKUMEN SUMBER'}</div><h2>${home?'Pustaka dokumen':'Seluruh dokumen, satu tempat.'}</h2><p>Telusuri pedoman dan lampiran sesuai kebutuhan pekerjaan Anda.</p></div>${home?`<a class="text-link" href="#library">Lihat semua dokumen ${icon('arrow')}</a>`:''}</div><div class="library-toolbar"><div class="filter-tabs" role="group" aria-label="Filter kategori">${cats.map(c=>`<button data-category="${c}" class="${category===c?'active':''}" aria-pressed="${category===c}">${c}${c==='Semua'?'<span>8</span>':''}</button>`).join('')}</div><div class="view-toggle" role="group" aria-label="Tampilan dokumen"><button data-view="grid" class="${view==='grid'?'active':''}" aria-label="Tampilan kisi" aria-pressed="${view==='grid'}">${icon('grid')}</button><button data-view="list" class="${view==='list'?'active':''}" aria-label="Tampilan daftar" aria-pressed="${view==='list'}">${icon('list')}</button></div></div>${home?'':`<label class="title-filter">${icon('search')}<input type="search" id="title-filter" placeholder="Filter judul atau topik dokumen…" value="${esc(titleQuery)}" aria-label="Filter judul dokumen"></label>`}<div class="collection-meta"><span id="collection-count"></span><span>Urutan lampiran ${icon('list')}</span></div><div id="document-grid" class="document-grid ${view==='list'?'list-view':''}"></div><div class="source-note">${icon('file')}<p><strong>Referensi yang dapat ditelusuri.</strong> Setiap hasil pencarian terhubung ke halaman PDF sumber. Sebagian halaman hasil pindai belum memiliki teks yang dapat dicari.</p></div></section>`; }
function renderCards() {
  const filtered = docs.filter(d => (category==='Semua'||d.category===category) && normalize([d.title,d.label,d.description,...d.tags].join(' ')).includes(normalize(titleQuery)));
  $('#document-grid').innerHTML = filtered.length ? filtered.map(card).join('') : `<div class="empty-state">${icon('search')}<h3>Tidak ada dokumen yang sesuai</h3><p>Coba kata kunci lain atau pilih kategori Semua.</p><button class="button" id="reset-filters">Reset filter</button></div>`;
  $('#collection-count').textContent = `Menampilkan ${filtered.length} dari ${docs.length} dokumen`;
}
function fields() { return `<section class="page-intro"><div class="eyebrow">REFERENSI MENURUT BIDANG</div><h1>Setiap bidang.<br>Landasan yang sesuai.</h1><p>Pilih bidang pekerjaan untuk membuka lampiran AHSP terkait.</p></section><section class="field-grid">${['iv','v','vi'].map((id,i)=>{const d=docs.find(x=>x.id===id); return `<article class="field-card"><span class="field-number">0${i+1}</span><span class="field-symbol symbol-${id}">${icon(d.icon)}</span><div class="eyebrow">${d.label}</div><h2>${d.category}</h2><p>${d.description}</p>${d.available?`<button class="button" data-open="${id}">Buka referensi ${icon('arrow')}</button>`:'<span class="availability">PDF belum dimuat</span>'}</article>`;}).join('')}</section><div class="source-note">${icon('book')}<p>Gunakan juga <a href="#library">pedoman umum dan acuan penyusunan AHSP</a> untuk melengkapi referensi bidang pekerjaan.</p></div>`; }
function savedPage() { const items = saved.filter(s=>docs.some(d=>d.id===s.docId && d.available)); return `<section class="page-intro"><div class="eyebrow">RUANG BACA ANDA</div><h1>Referensi tersimpan.</h1><p>Penanda halaman disimpan di browser ini untuk memudahkan Anda kembali membaca.</p></section>${items.length?`<div class="saved-list">${items.map(s=>{const d=docs.find(x=>x.id===s.docId); return `<article class="saved-item"><span class="doc-symbol symbol-${d.id}">${icon(d.icon)}</span><div><div class="eyebrow">${d.label} · HALAMAN PDF ${s.page}</div><h3>${d.title}</h3></div><button class="button subtle" data-open="${d.id}" data-page="${s.page}">Lanjut membaca ${icon('arrow')}</button><button class="trash-button icon-button" data-remove="${d.id}" data-page="${s.page}" aria-label="Hapus penanda"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><g transform="translate(4.8 4.8) scale(.6)"><path d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M5 6l1 14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-14M9 10v7M12 10v7M15 10v7"/></g></svg></button></article>`;}).join('')}</div>`:`<div class="empty-state large">${icon('bookmark')}<h2>Pustaka pribadi dimulai di sini.</h2><p>Klik ikon penanda pada dokumen atau halaman yang ingin Anda baca kembali.</p><a href="#library" class="button">Jelajahi dokumen ${icon('arrow')}</a></div>`}`; }
function highlight(text, query) {
  const terms = normalize(query).split(' ').filter(Boolean).map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  if (!terms.length) return esc(text);
  const re = new RegExp(`(${terms.join('|')})`, 'gi');
  return text.split(re).map((part,i)=>i%2?`<mark>${esc(part)}</mark>`:esc(part)).join('');
}
function searchPage() { const params=new URLSearchParams(location.hash.split('?')[1]); const q=(params.get('q')||'').slice(0,120); return `<section class="page-intro search-intro"><div class="eyebrow">PENCARIAN ISI DOKUMEN</div><h1>Temukan referensi Anda.</h1><p>Telusuri teks dalam ${number(docs.filter(d=>d.available).length)} PDF tersedia dan langsung buka halaman sumber.</p>${searchForm()}</section><div id="search-results" aria-live="polite">${q?'<div class="loading-state">Menelusuri isi dokumen…</div>':'<div class="empty-state">Masukkan minimal dua karakter untuk mulai mencari.</div>'}</div>`; }
function runSearch(q) {
  $('#search-input').value=q;
  if (q.trim().length<2) { $('#search-results').innerHTML='<div class="empty-state">Masukkan minimal dua karakter untuk mulai mencari.</div>'; return; }
  if (!worker) {
    worker=new Worker(new URL('./search-worker.05c0ce6186a3.js', import.meta.url),{type:'module'});
    worker.onmessage=({data})=>{
      if(data.id!==searchId || route()!=='search') return;
      const total=data.groups.reduce((n,g)=>n+g.total,0); const query=new URLSearchParams(location.hash.split('?')[1]).get('q')||'';
      const failures=data.groups.filter(g=>g.error).length;
      $('#search-results').innerHTML=`<div class="search-summary"><strong>${number(total)} halaman ditemukan</strong><span>untuk “${esc(query)}” · ${data.groups.filter(g=>g.total).length} dokumen</span></div>${failures?'<div class="warning-note">Sebagian indeks gagal dimuat. Periksa koneksi dan <button id="retry-search">coba lagi</button>.</div>':''}${total?data.groups.filter(g=>g.total).map(g=>{const d=docs.find(d=>d.id===g.docId);return `<section class="result-group"><div class="result-group-heading"><span class="doc-symbol symbol-${d.id}">${icon(d.icon)}</span><div><span class="eyebrow">${d.label}</span><h2>${d.title}</h2></div><span class="result-count">${number(g.total)} halaman</span></div>${g.hits.map(h=>`<button class="search-result" data-open="${d.id}" data-page="${h.page}"><span class="page-tag">HAL. ${h.page}</span><span>${highlight(h.snippet,query)}</span>${icon('arrow')}</button>`).join('')}${g.total>g.hits.length?`<p class="result-limit">Menampilkan ${g.hits.length} dari ${number(g.total)} halaman. Persempit kata kunci untuk hasil lebih spesifik.</p>`:''}</section>`;}).join(''):`<div class="empty-state">${icon('search')}<h2>Belum ada hasil${failures?' yang dapat ditampilkan':''}.</h2><p>Coba istilah lain, kode pekerjaan, atau gunakan kata kunci yang lebih singkat.</p></div>`}<div class="source-note">${icon('file')}<p>Pencarian mencocokkan semua kata kunci dalam satu halaman PDF. Gambar dan halaman hasil pindai tanpa teks tidak termasuk.</p></div>`;
    };
    worker.onerror=()=>{if(route()==='search') $('#search-results').innerHTML='<div class="empty-state"><h2>Pencarian belum dapat dimuat.</h2><p>Periksa koneksi lalu coba kembali.</p><button class="button" id="retry-search">Coba lagi</button></div>';worker.terminate();worker=null;};
  }
  worker.postMessage({id:++searchId,docs,query:q});
}
function closeMenu(){ $('#sidebar').classList.remove('open');$('#nav-overlay').hidden=true;$('#menu-button').setAttribute('aria-expanded','false'); }
function render() {
  updateNav(); closeMenu();
  const r=route();
  if(r==='library') main.innerHTML=library();
  else if(r==='fields') main.innerHTML=fields();
  else if(r==='saved') main.innerHTML=savedPage();
  else if(r==='search') main.innerHTML=searchPage();
  else { titleQuery=''; main.innerHTML=hero()+library(true)+`<section class="guide-banner"><span class="guide-icon">${icon('shield')}</span><div><span class="eyebrow">KESELAMATAN ADALAH BAGIAN DARI PERENCANAAN</span><h2>Kenali biaya penerapan SMKK.</h2><p>Mulai dari identifikasi bahaya hingga kebutuhan sumber daya keselamatan konstruksi.</p></div><button class="button" data-open="iii">Pelajari Lampiran III ${icon('arrow')}</button></section>`; }
  main.insertAdjacentHTML('afterbegin',`<div class="pustaka-view-nav" role="group" aria-label="Tampilan pustaka">${[['home','Ikhtisar'],['library','Dokumen'],['fields','Bidang pekerjaan'],['saved','Tersimpan']].map(([key,label])=>`<a href="#${key}" class="${r===key?'active':''}">${label}</a>`).join('')}</div>`);
  if($('#document-grid')) renderCards();
  if(r==='search') runSearch((new URLSearchParams(location.hash.split('?')[1]).get('q')||'').slice(0,120));
  document.title=`${names[r]||'Ikhtisar'} — Pustaka AHSP 2026`;
}
async function pagesFor(doc) {
  if(!pageCache.has(doc.id)) pageCache.set(doc.id,fetch(doc.index).then(r=>{if(!r.ok)throw Error('Tidak dapat memuat teks');return r.json();}).catch(e=>{pageCache.delete(doc.id);throw e;}));
  return pageCache.get(doc.id);
}
function updateReaderBookmark(){const yes=isSaved(readerDoc.id,readerPage);$('#bookmark-page').classList.toggle('selected',yes);$('#bookmark-page').setAttribute('aria-pressed',yes);$('#bookmark-page').setAttribute('aria-label',yes?'Hapus penanda halaman ini':'Simpan halaman ini');}
async function paintReader() {
  if (!readerDoc) return;
  const doc=readerDoc,page=readerPage,mode=readerMode;
  $('#page-number').value=page;$('#page-number').max=doc.pages;$('#page-total').textContent=`/ ${number(doc.pages)}`;
  $('#previous-page').disabled=page===1;$('#next-page').disabled=page===doc.pages;
  $('#reader-external').href=`${doc.file}#page=${page}`;
  $('#pdf-mode').classList.toggle('active',mode==='pdf');$('#text-mode').classList.toggle('active',mode==='text');updateReaderBookmark();
  if(mode==='pdf') {$('#reader-content').innerHTML=`<object class="pdf-frame" data="${doc.file}#page=${page}" type="application/pdf" aria-label="${esc(doc.title)}"><div class="empty-state"><h3>Agar PDF dapat dibaca di perangkat ini</h3><p>Buka dokumen di tab baru atau gunakan mode Teks dokumen.</p><a class="button" href="${doc.file}#page=${page}" target="_blank" rel="noopener">Buka PDF ${icon('external')}</a></div></object>`;return;}
  $('#reader-content').innerHTML='<div class="loading-state">Memuat teks halaman…</div>';
  try {const pages=await pagesFor(doc);if(readerDoc!==doc||readerPage!==page||readerMode!==mode)return;const text=pages[page-1];$('#reader-content').innerHTML=text.trim()?`<div class="text-page-label">${esc(doc.label)} · HALAMAN PDF ${page}</div><pre class="document-text">${esc(text)}</pre>`:`<div class="empty-state">${icon('file')}<h3>Halaman ini tidak memiliki teks yang dapat dibaca.</h3><p>Gunakan mode PDF asli untuk melihat gambar atau hasil pindai.</p><button class="button" data-pdf-mode>Lihat PDF asli</button></div>`;}catch{if(readerDoc===doc&&readerMode==='text')$('#reader-content').innerHTML='<div class="empty-state"><h3>Teks gagal dimuat.</h3><p>Periksa koneksi atau buka PDF asli.</p><button class="button" data-pdf-mode>Buka PDF asli</button></div>';}
}
function openReader(id,page=1) {
  const doc=docs.find(d=>d.id===id);if(!doc?.available)return;
  readerDoc=doc;readerPage=Math.max(1,Math.min(doc.pages,Number(page)||1));readerMode='pdf';
  $('#reader-title').textContent=doc.title;$('#reader-label').textContent=doc.label;
  $('#reader-download').href=doc.file;$('#reader-download').download=doc.originalName;
  if(!$('#reader').open)$('#reader').showModal();document.body.classList.add('reader-open');paintReader();
}
document.addEventListener('click',e=>{
  const open=e.target.closest('[data-open]');if(open){openReader(open.dataset.open,open.dataset.page);return;}
  const save=e.target.closest('[data-save]');if(save){toggleSaved(save.dataset.save);return;}
  const remove=e.target.closest('[data-remove]');if(remove){toggleSaved(remove.dataset.remove,Number(remove.dataset.page));return;}
  const cat=e.target.closest('[data-category]');if(cat){category=cat.dataset.category;document.querySelectorAll('[data-category]').forEach(b=>{b.classList.toggle('active',b===cat);b.setAttribute('aria-pressed',b===cat);});renderCards();return;}
  const v=e.target.closest('[data-view]');if(v){view=v.dataset.view;$('#document-grid').classList.toggle('list-view',view==='list');document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b===v);b.setAttribute('aria-pressed',b===v);});return;}
  if(e.target.closest('[data-unavailable]')){toast('Dokumen ini belum dimuat. Silakan gunakan dokumen lain yang tersedia.');return;}
  if(e.target.closest('#reset-filters')){category='Semua';titleQuery='';render();}
  if(e.target.closest('#retry-search'))runSearch($('#search-input').value);
  if(e.target.closest('[data-pdf-mode]')){readerMode='pdf';paintReader();}
});
document.addEventListener('input',e=>{if(e.target.id==='title-filter'){titleQuery=e.target.value;renderCards();}});
document.addEventListener('submit',e=>{if(e.target.id==='search-form'){e.preventDefault();const q=new FormData(e.target).get('q').trim();if(q.length<2){toast('Masukkan minimal dua karakter.');return;}const hash=`#search?q=${encodeURIComponent(q)}`;if(location.hash===hash)runSearch(q);else location.hash=hash;}});
$('#menu-button').innerHTML=icon('menu');$('#quick-search-icon').innerHTML=icon('search');$('#close-reader').innerHTML=icon('close');$('#bookmark-page').innerHTML=icon('bookmark');$('#reader-download').innerHTML=icon('download');$('#reader-external').innerHTML=icon('external');
$('#menu-button').onclick=()=>{const open=$('#sidebar').classList.toggle('open');$('#nav-overlay').hidden=!open;$('#menu-button').setAttribute('aria-expanded',open);};$('#nav-overlay').onclick=closeMenu;
$('#quick-search').onclick=()=>{if(route()!=='search')location.hash='#search';setTimeout(()=>$('#search-input')?.focus(),0);};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&!$('#reader').open){e.preventDefault();$('#quick-search').click();}if(e.key==='Escape')closeMenu();});
$('#close-reader').onclick=()=>$('#reader').close();$('#reader').addEventListener('close',()=>{document.body.classList.remove('reader-open');readerDoc=null;});
$('#pdf-mode').onclick=()=>{readerMode='pdf';paintReader();};$('#text-mode').onclick=()=>{readerMode='text';paintReader();};
$('#previous-page').onclick=()=>{if(readerDoc&&readerPage>1){readerPage--;paintReader();}};$('#next-page').onclick=()=>{if(readerDoc&&readerPage<readerDoc.pages){readerPage++;paintReader();}};
$('#page-number').addEventListener('change',e=>{if(!readerDoc)return;readerPage=Math.max(1,Math.min(readerDoc.pages,Math.trunc(Number(e.target.value))||1));paintReader();});
$('#bookmark-page').onclick=()=>{if(readerDoc)toggleSaved(readerDoc.id,readerPage);};
window.addEventListener('hashchange',()=>{render();window.scrollTo({top:0});});
try {const response=await fetch('data/documents.json');if(!response.ok)throw Error('Collection');docs=await response.json();render();}
catch{main.innerHTML='<div class="empty-state large"><h1>Pustaka tidak dapat dimuat.</h1><p>Periksa koneksi lalu muat ulang halaman.</p><button class="button" onclick="location.reload()">Muat ulang</button></div>';}

initButtonNavigation();
