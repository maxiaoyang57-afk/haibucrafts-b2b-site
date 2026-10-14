const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const candidates=['assets/js/analytics.js','assets/v2/components.js','v2-preview/assets/components.js'].filter(p=>fs.existsSync(p));
function fixture(source,eligible=true,privacy={}){
 const inserted=[],masked=[];let observer;
 const form={setAttribute:(...v)=>masked.push(v)};
 const document={querySelectorAll:()=>[form],documentElement:{},createElement:()=>({dataset:{}}),head:{appendChild:s=>inserted.push(s)}};
 const window={navigator:privacy};
 class MutationObserver{constructor(cb){observer=cb;}observe(){}}
 const start=source.indexOf('  function createClarityConsent(');
 const end=source.indexOf('  // End Clarity consent adapter.');
 assert.ok(start>=0 && end>start);
 const code=source.slice(start,end);
 const context=vm.createContext({document,window,MutationObserver});
 const adapter=vm.runInContext(code+'\ncreateClarityConsent("testproject",'+eligible+');',context);
 return {adapter,window,inserted,masked,addForm:()=>observer([{addedNodes:[{matches:()=>true,setAttribute:(...v)=>masked.push(v)}]}])};
}
for(const file of candidates){
 const source=fs.readFileSync(file,'utf8');
 test(file+': only consent loads SDK, once, after masking',()=>{
  const f=fixture(source);f.adapter.update(null);f.adapter.update('denied');
  assert.equal(f.inserted.length,0);assert.equal(f.window.clarity,undefined);
  f.adapter.update('granted');f.adapter.update('granted');
  assert.equal(f.inserted.length,1);assert.equal(f.inserted[0].src,'https://www.clarity.ms/tag/testproject');
  assert.deepEqual(f.masked[0],['data-clarity-mask','true']);
  const call=Array.from(f.window.clarity.q[0]);assert.equal(call[0],'consentv2');
  assert.equal(call[1].analytics_Storage,'granted');assert.equal(call[1].ad_Storage,'denied');
  f.addForm();assert.equal(f.masked.length,2);
 });
 test(file+': withdrawal stops SDK and blocks custom events',()=>{
  const f=fixture(source);f.adapter.update('granted');f.adapter.event('generate_lead');
  assert.equal(f.window.clarity.q.at(-1)[0],'event');
  assert.equal(f.window.clarity.q.at(-1).length,2);
  f.adapter.event('email=buyer@example.com');assert.equal(f.window.clarity.q.at(-1)[1],'generate_lead');
  f.adapter.update('denied');assert.equal(f.window.clarity.q.at(-1)[0],'stop');
  assert.equal(f.window.clarity.q.at(-2)[1].analytics_Storage,'denied');
  const n=f.window.clarity.q.length;f.adapter.event('generate_lead');f.adapter.update('granted');
  assert.equal(f.window.clarity.q.length,n);assert.equal(f.inserted.length,1);
 });
 test(file+': preview hosts and privacy signals never load SDK',()=>{
  for(const [eligible,signal] of [[false,{}],[true,{globalPrivacyControl:true}],[true,{doNotTrack:'1'}]]){
   const f=fixture(source,eligible,signal);f.adapter.update('granted');assert.equal(f.inserted.length,0);
  }
 });
}
if(fs.existsSync('assets/js/analytics.js')){
 test('QULA initializes denied GA consent before config and preserves lead confirmation',()=>{
  const s=fs.readFileSync('assets/js/analytics.js','utf8');
  assert.ok(s.indexOf("gtag('consent','default'")<s.indexOf("gtag('config'"));
  assert.match(s,/qula_pending_inquiry_v1/);assert.match(s,/confirmed_return/);
  assert.match(s,/y5ull9s9j6/);assert.doesNotMatch(s,/yxduu55xlf/);
 });
}else{
 test('HAIBU requires renewed permission and correct project',()=>{
  const s=fs.readFileSync('assets/v2/components.js','utf8');
  assert.match(s,/haibu_analytics_consent_v2/);assert.doesNotMatch(s,/haibu_ga4_consent_v1/);
  assert.match(s,/yxduu55xlf/);assert.doesNotMatch(s,/y5ull9s9j6/);
 });
 test('HAIBU CSP permits Clarity without inline JS or other relaxed restrictions',()=>{
  const cfg=JSON.parse(fs.readFileSync('vercel.json','utf8'));
  const csp=cfg.headers.flatMap(x=>x.headers).find(x=>x.key==='Content-Security-Policy').value;
  for(const directive of ['script-src','connect-src','img-src'])assert.ok(csp.split(';').find(x=>x.trim().startsWith(directive+' ')).includes('https://*.clarity.ms'));
  assert.ok(!csp.split(';').find(x=>x.trim().startsWith('script-src ')).includes('unsafe-inline'));
  assert.match(csp,/frame-ancestors 'none'/);assert.match(csp,/object-src 'none'/);
 });
}
