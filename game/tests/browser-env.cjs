// Shared environment for the browser checks.
//  - playwright-core comes from the project dependencies (npm install at the repository root).
//  - The browser is an installed Chromium-family channel or SAMGUK_BROWSER_PATH; no fixed path.
//  - Every launch is a fresh, isolated profile, so IndexedDB starts empty and user saves are untouched.
//  - Saved state is read from IndexedDB (the authoritative store), never from the localStorage mirror.
//  - Screenshots, videos and audit files go to test-artifacts/ (SAMGUK_ARTIFACTS overrides).
const path=require('node:path'),fs=require('node:fs');
let chromium;
try{({chromium}=require('playwright-core'));}
catch{throw Error('playwright-core를 찾지 못했습니다. 저장소 루트에서 "npm install"을 실행하세요.');}

const baseUrl=(process.env.SAMGUK_BASE_URL??'http://127.0.0.1:8780/game/').replace(/\/*$/,'/');
const artifactRoot=path.resolve(process.env.SAMGUK_ARTIFACTS??path.join(__dirname,'..','..','test-artifacts'));
function artifact(...parts){const file=path.join(artifactRoot,...parts);fs.mkdirSync(path.dirname(file),{recursive:true});return file;}

async function launch(options={}){
 const executablePath=process.env.SAMGUK_BROWSER_PATH;
 const channels=executablePath?[undefined]:(process.env.SAMGUK_BROWSER_CHANNEL?[process.env.SAMGUK_BROWSER_CHANNEL]:['msedge','chrome','chromium']);
 const failures=[];
 for(const channel of channels){
  try{return await chromium.launch({headless:process.env.SAMGUK_HEADED!=='1',...(executablePath?{executablePath}:{channel}),...options});}
  catch(error){failures.push((channel??executablePath)+': '+String(error.message).split('\n')[0]);}
 }
 throw Error('사용할 브라우저를 찾지 못했습니다. Edge나 Chrome을 설치하거나 SAMGUK_BROWSER_PATH를 지정하세요.\n'+failures.join('\n'));
}

// The profile as committed to IndexedDB, or null before the first commit.
function savedState(page){
 return page.evaluate(()=>new Promise((resolve,reject)=>{
  const open=indexedDB.open('samguk-chess',1);
  open.onupgradeneeded=()=>open.result.createObjectStore('profile');
  open.onerror=()=>reject(open.error);
  open.onsuccess=()=>{const db=open.result,read=db.transaction('profile').objectStore('profile').get('main');
   read.onsuccess=()=>{db.close();resolve(read.result??null);};read.onerror=()=>{db.close();reject(read.error);};};
 }));
}
// Waits until the committed profile satisfies the predicate and returns it (save acknowledgement).
async function waitForSave(page,predicate,{timeout=20000,message='저장 상태'}={}){
 const deadline=Date.now()+timeout;let last;
 for(;;){
  last=await savedState(page);
  let ok=false;try{ok=!!(last&&predicate(last));}catch{ok=false;}
  if(ok)return last;
  if(Date.now()>deadline)throw Error(message+' 대기 시간 초과');
  await page.waitForTimeout(50);
 }
}
// Changes the profile through the real store transaction, then reloads so the page boots from it.
// mutate(state, modules) runs inside the page; modules = {services, battleRun, battleEngine, battleData}.
async function seed(page,mutate){
 await page.evaluate(async source=>{
  const mutate=(0,eval)('('+source+')');
  const [{durableStore},{createGameStore},services,battleRun,battleEngine,battleData]=await Promise.all(['./durable-store.js','./store.js','./services.js','./battle-run.js','./battle-engine.js','./battle-data.js'].map(file=>import(new URL(file,document.baseURI).href)));
  const store=await durableStore(()=>createGameStore({getItem:()=>null,setItem(){}}));
  try{await store.transact(state=>mutate(state,{services,battleRun,battleEngine,battleData})??state);}finally{store.close();}
 },mutate.toString());
 await page.reload();
}

// Opens the game directly; optional faction seeds a legacy profile for compatibility checks.
// lord (default 20) is the lord level the profile starts at, so level-gated screens are open; lord:1 tests the gates.
async function start(page,{hash='',faction=null,wait=true,lord=20}={}){
 await page.goto(baseUrl+hash);
 if(!wait)return;
 await page.locator('.game[aria-busy="false"]').waitFor();
 if(lord>1||faction){
  await page.evaluate(async ([id,lord])=>{
   const [{durableStore},{createGameStore},services]=await Promise.all(['./durable-store.js','./store.js','./services.js'].map(file=>import(new URL(file,document.baseURI).href)));
   const store=await durableStore(()=>createGameStore({getItem:()=>null,setItem(){}}));
   try{await store.transact(state=>{if(id)state.faction=id;let xp=0;for(let level=1;level<lord;level++)xp+=services.lordXpForNext(level);services.prepareServices(state).lord.xp=xp;return state;});}finally{store.close();}
  },[faction,lord]);
  // Initial Lv.1 boot may correctly redirect a locked deep link to home.
  // Restore the requested entry only after the isolated fixture unlocks it.
  if(hash)await page.evaluate(value=>history.replaceState(null,'',value),hash);
  await page.reload();
 }
 await page.locator('.game[aria-busy="false"]').waitFor();
}

module.exports={launch,start,baseUrl,artifact,artifactRoot,savedState,waitForSave,seed};
