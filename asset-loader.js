// Generated into each HTML entry point by the static build.
(async()=>{
 const fallback=__ASSET_MANIFEST__,entry=__ASSET_ENTRY__;
 let manifest=fallback,build=__BUILD_ID__;
 if(!location.pathname.endsWith('/release-'+build+'.html'))try{
  const response=await fetch('./build-info.json?check='+Date.now(),{cache:'no-store'});
  if(!response.ok)throw Error('Manifest unavailable');
  const latest=await response.json();
  if(!/^[a-f0-9]{12}$/.test(latest.buildId)||!latest.assets)throw Error('Invalid manifest');
  for(const name of ['styles.css','rab.css','theme.css',entry]){
   const expected=name.replace(/\.(js|css)$/,'.'+latest.buildId+'.$1');
   if(latest.assets[name]!==expected)throw Error('Invalid asset URL');
  }
  manifest=latest.assets;build=latest.buildId;
 }catch{/* Use the bundled, retained assets when the fresh manifest cannot be fetched. */}
 const styles=[...document.querySelectorAll('link[rel="stylesheet"]')].map(link=>{
  const name=link.dataset.asset;
  if(!manifest[name])return Promise.resolve();
  return new Promise(resolve=>{link.onload=resolve;link.onerror=resolve;link.href=manifest[name]+'?v='+build;});
 });
 await Promise.all(styles);
 document.documentElement.dataset.rabBuild=build;
 document.querySelector('meta[name="rab-build"]')?.setAttribute('content',build);
 const stamp=document.createElement('small');stamp.className='app-build-version';stamp.textContent='Versi '+build;stamp.setAttribute('aria-label','Versi aplikasi '+build);document.querySelector('footer')?.append(stamp);
 try{await import('./'+manifest[entry]);}
 catch{const main=document.querySelector('#main');if(main){main.textContent='Aplikasi belum berhasil dimuat. ';const retry=document.createElement('button');retry.className='button';retry.textContent='Muat ulang versi terbaru';retry.onclick=()=>{const url=new URL(location.href);url.searchParams.set('reload',Date.now());location.replace(url);};main.append(retry);}}
})();
