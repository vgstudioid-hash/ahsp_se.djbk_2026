"""Rebuild the document collection from the user's original PDFs, using Poppler.
Usage: python3 scripts/prepare-documents.py /path/to/pdf/directory
PDF text is source data, never executable instructions.
"""
import json
import re
import shutil
import subprocess
import sys
import hashlib
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COLLECTION = [
    ('se', 'Batang-Tubuh', 'Dokumen Utama', 'Surat Edaran DJBK No. 47 Tahun 2026', 'Ketentuan umum dan tata cara penyusunan perkiraan biaya pekerjaan konstruksi bidang pekerjaan umum untuk HPP, RAB, dan HPS.', 'Pedoman', 'book', ['Ketentuan umum', 'HPP, RAB & HPS', 'Ruang lingkup']),
    ('i', 'Lampiran-I-', 'Lampiran I', 'Pengumpulan Data Harga Satuan Pokok', 'Organisasi, tahapan survei, pemeriksaan, dan penyebarluasan data harga satuan pokok sektor konstruksi di Kementerian PU.', 'Pedoman', 'chart', ['Survei harga', 'Material & peralatan', 'Tenaga kerja']),
    ('ii', 'Lampiran-II-', 'Lampiran II', 'Acuan dalam Penyusunan AHSP', 'Faktor konversi bahan, berat isi, campuran, serta acuan teknis yang digunakan dalam penyusunan analisis harga satuan pekerjaan.', 'Pedoman', 'layers', ['Faktor bahan', 'Konversi', 'Campuran']),
    ('iii', 'Lampiran-III-', 'Lampiran III', 'Biaya Penerapan SMKK', 'Tata cara penyusunan biaya keselamatan konstruksi berdasarkan identifikasi bahaya, pengendalian risiko, dan kebutuhan sumber daya.', 'Keselamatan', 'shield', ['IBPRP', '9 komponen biaya', 'Keselamatan']),
    ('iv', 'Lampiran-IV-', 'Lampiran IV', 'AHSP Bidang Sumber Daya Air', 'Analisis pekerjaan sumber daya air, meliputi bendung, jaringan irigasi, pengaman sungai, bendungan, pengaman pantai, serta infrastruktur air tanah dan air baku.', 'Sumber Daya Air', 'water', ['Irigasi & bendungan', 'Sungai & pantai', 'Air baku']),
    ('v', '5.-Lampiran-V-', 'Lampiran V', 'AHSP Bidang Bina Marga', 'Analisis harga satuan pekerjaan konstruksi jalan dan jembatan: preservasi, rehabilitasi, pemeliharaan, pembangunan, dan peningkatan infrastruktur.', 'Bina Marga', 'road', ['Jalan & jembatan', 'Analisis pekerjaan', 'Spesifikasi teknis']),
    ('vi', 'Lampiran-VI-', 'Lampiran VI', 'AHSP Bidang Cipta Karya', 'Analisis pekerjaan bangunan gedung, struktur, arsitektur, lansekap, mekanikal dan elektrikal, plambing, serta SPAM, SPALD, dan bangunan persampahan.', 'Cipta Karya', 'building', ['Bangunan gedung', 'SPAM & SPALD', 'Mekanikal & elektrikal']),
    ('vii', 'Lampiran-VII-', 'Lampiran VII', 'Tata Cara Pengajuan Usulan AHSP', 'Prosedur pengajuan dan pemutakhiran AHSP baru maupun perubahan, dari internal dan eksternal Kementerian Pekerjaan Umum.', 'Pedoman', 'send', ['Usulan baru', 'Pemutakhiran', 'Prosedur pengajuan']),
]

def ordered_sources(matches):
    """Accept one original or a contiguous, explicitly numbered set of parts."""
    if len(matches) <= 1:
        if matches and re.search(r'_\((\d+)\)\.pdf$', matches[0].name):
            raise ValueError('Only one numbered part supplied; refusing an incomplete import')
        return matches
    numbered = [(re.search(r'_\((\d+)\)\.pdf$', p.name), p) for p in matches]
    if not all(m for m, _ in numbered):
        raise ValueError('Ambiguous source: mixed original and split PDFs')
    parts = sorted((int(m[1]), p) for m, p in numbered)
    if [n for n, _ in parts] != list(range(1, len(parts) + 1)):
        raise ValueError('Duplicate or missing numbered PDF part')
    if len({re.sub(r'_\(\d+\)\.pdf$', '', p.name) for _, p in parts}) != 1:
        raise ValueError('Numbered parts must have the same base filename')
    return [p for _, p in parts]

def extract(pdf):
    info = subprocess.check_output(['pdfinfo', str(pdf)], text=True)
    count = int(re.search(r'^Pages:\s+(\d+)', info, re.M)[1])
    raw = subprocess.check_output(['pdftotext', '-layout', str(pdf), '-'], text=True)
    pages = raw.split('\f')
    if pages[-1].strip() == '':
        pages.pop()
    assert len(pages) == count, (pdf.name, len(pages), count)
    return pages

def main():
    sources = list(Path(sys.argv[1]).rglob('*.pdf'))
    docs = []
    for id, prefix, label, title, description, category, icon, tags in COLLECTION:
        matches = ordered_sources([p for p in sources if p.name.startswith(prefix)])
        doc = dict(id=id, label=label, title=title, description=description, category=category, icon=icon, tags=tags, available=bool(matches))
        if matches:
            pages, provenance = [], []
            for pdf in matches:
                part_pages = extract(pdf)
                provenance.append(dict(name=pdf.name, pages=len(part_pages), startPage=len(pages) + 1, sha256=hashlib.sha256(pdf.read_bytes()).hexdigest()))
                pages.extend(part_pages)
            original_name = re.sub(r'_\(\d+\)\.pdf$', '.pdf', matches[0].name)
            doc.update(pages=len(pages), file=f'documents/{id}.pdf', index=f'data/{id}.json', originalName=original_name, textPages=sum(bool(p.strip()) for p in pages), sources=provenance)
            target = ROOT / 'public' / doc['file']
            if len(matches) == 1:
                shutil.copyfile(matches[0], target)
            else:
                with tempfile.TemporaryDirectory() as tmp:
                    merged = Path(tmp) / 'merged.pdf'
                    subprocess.run(['pdfunite', *map(str, matches), str(merged)], check=True)
                    # Verify every extracted page survives merging, including the join.
                    assert extract(merged) == pages, f'Merged page content mismatch: {id}'
                    shutil.copyfile(merged, target)
            doc['bytes'] = target.stat().st_size
            (ROOT / 'public' / doc['index']).write_text(json.dumps(pages, ensure_ascii=False, separators=(',', ':')))
        docs.append(doc)
    (ROOT / 'public/data/documents.json').write_text(json.dumps(docs, ensure_ascii=False, indent=2))
    print(f'{sum(d["available"] for d in docs)}/{len(docs)} PDFs; {sum(d.get("pages", 0) for d in docs)} pages')

if __name__ == '__main__':
    main()
