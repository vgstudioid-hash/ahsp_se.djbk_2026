import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createAIHandler } from '../scripts/ai-api.mjs';
const project={name:'Uji RAB',location:'',owner:'',date:'2026-11-09',items:[],smkk:[],rates:{},overhead:10,tax:12,taxScheme:'dpp11of12'};
async function fixture(fn,options={}){
 const calls=[];const token=crypto.randomUUID();
 const env={OPENAI_API_KEY:'server-only-test-key',AI_ACCESS_TOKEN:token,AI_ALLOWED_ORIGINS:'https://rab.example',...options.env};
 const handler=createAIHandler({env,fetchImpl:async(url,request)=>{calls.push({url,request});return options.response||new Response(JSON.stringify({output:[{content:[{type:'output_text',text:'Harga dasar belum lengkap.'}]}]}),{headers:{'Content-Type':'application/json'}});}});
 const server=http.createServer(async(req,res)=>{if(!await handler(req,res))res.writeHead(404).end();});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const request=(body={project,messages:[{role:'user',content:'Periksa RAB'}]},extra={})=>fetch(`http://127.0.0.1:${server.address().port}/api/analysis`,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Origin:'https://rab.example',...extra},body:JSON.stringify(body)});
 try{await fn({request,calls,token});}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
}
test('AI API authenticates and checks origin before sending any project to OpenAI',()=>fixture(async({request,calls})=>{assert.equal((await request(undefined,{Authorization:'Bearer wrong'})).status,401);assert.equal((await request(undefined,{Origin:'https://evil.example'})).status,403);assert.equal(calls.length,0);}));
test('AI API validates projects and sends recomputed totals without exposing server key',()=>fixture(async({request,calls})=>{assert.equal((await request({project:{},messages:[]})).status,400);assert.equal(calls.length,0);const response=await request();assert.equal(response.status,200);assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://rab.example');const body=await response.text();assert(!body.includes('server-only-test-key'));assert.match(body,/Harga dasar/);const sent=JSON.parse(calls[0].request.body);assert.equal(sent.store,false);assert.equal(calls[0].url,'https://api.openai.com/v1/responses');assert.equal(JSON.parse(sent.input[0].content.split('\n').slice(1).join('\n')).calculated.total,0);}));
test('AI API handles missing configuration and provider failures without leaking details',async()=>{await fixture(async({request,calls})=>{assert.equal((await request()).status,503);assert.equal(calls.length,0);},{env:{OPENAI_API_KEY:''}});await fixture(async({request})=>{const response=await request();assert.equal(response.status,502);assert(!(await response.text()).includes('private-provider-error'));},{response:new Response('private-provider-error',{status:500})});});
test('AI API limits authenticated request rate and payload size',()=>fixture(async({request,calls})=>{assert.equal((await request({padding:'a'.repeat(750001)})).status,413);for(let i=0;i<9;i++)assert.equal((await request()).status,200);assert.equal((await request()).status,429);assert.equal(calls.length,9);}));
