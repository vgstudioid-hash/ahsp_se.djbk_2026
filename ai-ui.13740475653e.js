import { calculateProject } from './rab-core.13740475653e.js';
const sessions=new Map();
let connection={url:'',token:''};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountAssistant(root,getProject){
 const project=getProject(),key=project.id;
 if(!sessions.has(key))sessions.set(key,{messages:[],busy:false});
 const state=sessions.get(key),result=calculateProject(project);
 root.innerHTML=`<div class="ai-card"><h2>${esc(project.name||'Proyek belum diberi nama')}</h2><p>${project.items.filter(i=>!i.heading).length} pekerjaan · ${result.missing} harga dasar belum terisi · Total terhitung Rp ${new Intl.NumberFormat('id-ID').format(result.total)}</p><p>Analisis menggunakan salinan data proyek aktif, termasuk identitas, rincian AHS, harga dasar, dan Quantity. Data dikirim ke OpenAI saat Anda menekan Analisis atau Kirim. Hasil berupa saran untuk diperiksa; data RAB tidak diubah otomatis.</p><details><summary>Pengaturan koneksi AI</summary><label>Alamat layanan AI<input id="ai-url" type="url" placeholder="https://server-anda.example/api/analysis" value="${esc(connection.url)}"></label><label>Token akses layanan<input id="ai-token" type="password" autocomplete="off" value="${esc(connection.token)}"></label><small>Token layanan diberikan oleh pengelola. Jangan masukkan API key OpenAI di sini. Pengaturan hanya disimpan selama halaman terbuka.</small></details><div class="action-row"><button class="button" id="ai-analyze" ${state.busy?'disabled':''}>Analisis RAB otomatis</button><button class="button subtle" id="ai-clear" ${state.busy?'disabled':''}>Bersihkan percakapan</button></div><div id="ai-messages" class="ai-messages" role="log" aria-live="polite">${state.messages.map(m=>`<article><strong>${m.role==='user'?'Anda':'Asisten AI'}</strong><div>${esc(m.content)}</div></article>`).join('')}</div><p id="ai-status" role="status">${state.busy?'Sedang menganalisis…':''}</p><form id="ai-form"><label>Pertanyaan tentang proyek<textarea id="ai-question" maxlength="3000" rows="3" placeholder="Contoh: periksa volume, harga yang belum terisi, dan pekerjaan dengan biaya terbesar." required></textarea></label><button class="button" ${state.busy?'disabled':''}>Kirim</button></form></div>`;
 const status=root.querySelector('#ai-status');
 async function send(question){
  if(state.busy)return;
  connection={url:root.querySelector('#ai-url').value.trim(),token:root.querySelector('#ai-token').value};
  let endpoint;
  try{endpoint=new URL(connection.url||'api/analysis',location.href);if(endpoint.protocol!=='https:'&&!(endpoint.protocol==='http:'&&['localhost','127.0.0.1'].includes(endpoint.hostname)))throw Error();}catch{status.textContent='Alamat layanan AI harus HTTPS.';return;}
  if(!connection.token){status.textContent='Koneksi AI belum diaktifkan. Isi alamat layanan dan token akses dari pengelola pada Pengaturan koneksi AI.';return;}
  if(state.messages.length>=20){status.textContent='Bersihkan percakapan untuk memulai analisis baru.';return;}
  const snapshot=structuredClone(getProject());
  state.busy=true;state.messages.push({role:'user',content:question});mountAssistant(root,getProject);
  try{
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+connection.token},body:JSON.stringify({project:snapshot,messages:state.messages}),signal:AbortSignal.timeout(65000),credentials:'omit'});
   if(!response.headers.get('content-type')?.includes('application/json'))throw Error('Layanan AI belum tersedia pada alamat ini. GitHub Pages memerlukan server AI terpisah.');
   const data=await response.json();if(!response.ok)throw Error(data.error||'Analisis gagal. Coba kembali.');if(typeof data.answer!=='string'||!data.answer.trim())throw Error('Jawaban AI kosong.');
   state.messages.push({role:'assistant',content:data.answer});
  }catch(error){state.messages.pop();state.error=error.name==='TimeoutError'?'Waktu analisis habis. Silakan coba kembali.':error.message;}
  finally{state.busy=false;if(root.isConnected){mountAssistant(root,getProject);if(state.error){root.querySelector('#ai-status').textContent=state.error;state.error='';}}}
 }
 root.querySelector('#ai-form').onsubmit=e=>{e.preventDefault();const q=root.querySelector('#ai-question').value.trim();if(q)send(q);};
 root.querySelector('#ai-analyze').onclick=()=>send('Analisis proyek ini: kelengkapan RAB/AHS/HSD/Quantity, konsistensi volume dan satuan, komponen biaya dominan, perbandingan total dengan pagu, dan daftar tindak lanjut. Pisahkan temuan dari asumsi.');
 root.querySelector('#ai-clear').onclick=()=>{state.messages=[];mountAssistant(root,getProject);};
}
