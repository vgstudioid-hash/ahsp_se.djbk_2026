let initialized=false;
function directionFor(control){
 if(control.matches('#navigation a,.brand,.skip-link'))return null;
 const explicit=control.dataset.navigation;
 if(explicit==='back'||explicit==='forward')return explicit;
 if(control.id==='previous-page')return 'back';
 if(control.id==='next-page')return 'forward';
 const label=control.textContent.replace(/[←→]/g,'').trim();
 if(/^(Kembali|Sebelumnya|Mundur)\b/i.test(label))return 'back';
 if(/^(Lanjut|Menuju|Berikutnya|Buka|Rekapitulasi|Jelajahi|Pelajari)\b/i.test(label))return 'forward';
 if(control.matches('a.button[href^="#"]'))return 'forward';
 if(control.matches('button,a.button,.quantity-row-link,.text-link')&&/→/.test(control.textContent)&&! /^(Cetak|Ekspor|Impor)\b/i.test(label))return 'forward';
 return null;
}
function decorateActionSymbols(){
 const downloads=new Set(['backup','csv','quantity-csv','recap-csv','smkk-csv','price-template','resource-csv']);
 const uploads=new Set(['import-project','import-rates']);
 const prints=new Set(['print','print-hsd','print-quantity','print-recap','print-smkk']);
 for(const control of document.querySelectorAll('button')){
  const action=control.dataset.action,kind=downloads.has(action)?'download':uploads.has(action)?'upload':prints.has(action)||control.hasAttribute('data-print-ahs')?'print':null;
  const direction=kind==='download'||kind==='upload'||control.matches('[data-move],[data-wbs-shift],[data-smkk-group-toggle],[data-action="toggle-smkk"],#previous-page,#next-page');
  const destructive=control.matches('.trash-button,[data-component-remove],[data-component-last],[data-close-dialog].icon-button,#close-reader');
  control.classList.toggle('symbol-direction',direction);
  control.classList.toggle('symbol-general',!direction&&!destructive);control.classList.toggle('symbol-destructive',destructive);
  if(!kind)continue;
  const walker=document.createTreeWalker(control,NodeFilter.SHOW_TEXT);let text;while(text=walker.nextNode()){const value=text.nodeValue.replace(/[←→↑↓]/g,'');if(value!==text.nodeValue)text.nodeValue=value;}
  if(control.querySelector('svg'))continue;
  const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.classList.add('action-symbol-icon');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');
  icon.innerHTML=kind==='download'?'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>':kind==='upload'?'<path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/>':'<path d="M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6z"/>';
  control.prepend(icon);
 }
}
function decorate(){
 for(const control of document.querySelectorAll('button,a[href]')){
  const direction=directionFor(control);
  if(!direction||control.querySelector('.navigation-direction-icon'))continue;
  // Replace only arrow artwork, preserving functional icons such as Add and Download.
  for(const icon of control.querySelectorAll('svg'))if([...icon.querySelectorAll('path')].some(p=>p.getAttribute('d')==='M4 12h15m-5-5 5 5-5 5'))icon.remove();
  const fullLabel=(control.getAttribute('aria-label')||control.textContent).replace(/[←→]/g,'').replace(/\s+/g,' ').trim();
  if(!control.hasAttribute('aria-label'))control.setAttribute('aria-label',fullLabel|| (direction==='back'?'Kembali':'Lanjut'));
  control.dataset.navigation=direction;
  const walker=document.createTreeWalker(control,NodeFilter.SHOW_TEXT);let text,first=true;
  while(text=walker.nextNode()){
   let value=text.nodeValue.replace(/[←→]/g,'').replace(/\b(?:lanjut(?:kan)?|buka|kembali)\b(?:\s+ke\b)?\s*/gi,'');
   if(first&&value.trim()){value=value.replace(/\S/,c=>c.toLocaleUpperCase('id'));first=false;}
   if(value!==text.nodeValue)text.nodeValue=value;
  }
  const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.classList.add('navigation-direction-icon');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.dataset.direction=direction;
  icon.innerHTML=direction==='back'?'<path d="m11 6-6 6 6 6" stroke="#65b5f0"/><path d="m19 6-6 6 6 6" stroke="#238de1"/>':'<path d="m5 6 6 6-6 6" stroke="#65b5f0"/><path d="m13 6 6 6-6 6" stroke="#238de1"/>';
  control.classList.add('navigation-button');if(direction==='back')control.prepend(icon);else control.append(icon);
 }
 decorateActionSymbols();
 for(const control of document.querySelectorAll('button:not(.nav-overlay),a.button,a.navigation-button,a.quantity-row-link')){control.classList.add('balloon-control');control.classList.toggle('icon-only-control',!control.textContent.trim());}
 for(const button of document.querySelectorAll('button')){
  if(button.hasAttribute('title')&&!button.dataset.autoTooltip)continue;
  const label=button.getAttribute('aria-label')||button.textContent.replace(/\s+/g,' ').trim();
  if(label){button.title=label;button.dataset.autoTooltip='true';}
 }
}
export function initButtonNavigation(){
 if(initialized)return;initialized=true;decorate();let queued=false;
 new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;decorate();});}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','data-navigation']});
}
