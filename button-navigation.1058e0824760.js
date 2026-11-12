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
function decorate(){
 for(const control of document.querySelectorAll('button,a[href]')){
  const direction=directionFor(control);
  if(!direction||control.querySelector('.navigation-direction-icon'))continue;
  // Replace only arrow artwork, preserving functional icons such as Add and Download.
  for(const icon of control.querySelectorAll('svg'))if([...icon.querySelectorAll('path')].some(p=>p.getAttribute('d')==='M4 12h15m-5-5 5 5-5 5'))icon.remove();
  const walker=document.createTreeWalker(control,NodeFilter.SHOW_TEXT);let text;
  while(text=walker.nextNode()){const value=text.nodeValue.replace(/[←→]/g,'');if(value!==text.nodeValue)text.nodeValue=value;}
  const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.classList.add('navigation-direction-icon');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.dataset.direction=direction;
  icon.innerHTML=direction==='back'?'<path d="m11 6-6 6 6 6" stroke="#65b5f0"/><path d="m19 6-6 6 6 6" stroke="#238de1"/>':'<path d="m5 6 6 6-6 6" stroke="#65b5f0"/><path d="m13 6 6 6-6 6" stroke="#238de1"/>';
  control.classList.add('navigation-button');if(direction==='back')control.prepend(icon);else control.append(icon);
 }
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
