import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
try{for(const base of ['audit-bahan-simbol','audit-pilihan-sumber-daya']){
 const page=await browser.newPage();await page.setContent(await readFile(new URL(`../public/reports/${base}.html`,import.meta.url),'utf8'));
 await page.pdf({path:fileURLToPath(new URL(`../public/reports/${base}.pdf`,import.meta.url)),printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font-family:Arial;font-size:8px;color:#52604b;width:100%;text-align:center">Audit Sumber Daya AHSP 2026 · <span class="pageNumber"></span> / <span class="totalPages"></span></div>'});await page.close();console.log(`${base}.pdf selesai`);
}}finally{await browser.close();}
