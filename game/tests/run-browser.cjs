// Runs the browser checks against a private local server.
//   node game/tests/run-browser.cjs            all acceptance checks
//   node game/tests/run-browser.cjs shop battle   only the named ones
// Set SAMGUK_BASE_URL to test a server that is already running (no server is started then).
const {spawn}=require('node:child_process'),path=require('node:path');
const repo=path.resolve(__dirname,'..','..');
const checks=['toast-ui-browser','dialog-art-browser','dialog-content-browser','arena-opponents-ui-browser','arena-season-ui-browser','arena-records-ui-browser','merit-shop-ui-browser','products-ui-browser','pickup-rates-ui-browser','rates-ui-browser','treasure-results-flow-browser','treasure-results-ui-browser','recruit-results-flow-browser','recruit-results-ui-browser','s-select-flow-browser','s-select-ui-browser','exchange-flow-browser','exchange-ui-browser','strategy-flow-browser','strategy-ui-browser','formation-flow-browser','formation-ui-browser','settings-flow-browser','settings-ui-browser','profile-flow-browser','profile-ui-browser','treasure-flow-browser','treasure-ui-browser','government-flow-browser','government-ui-browser','side-margins-browser','shared-scroll-browser','original-layout-browser','tower-flow-browser','tower-alpha-browser','expedition-flow-browser','start-flow-browser','codex-flow-browser','approved-ui-browser','durable-store-browser','gate-lobby-browser','ui-components-browser','ui-shell-browser','campaign-browser','campaign-ui-browser','campaign-flow-browser','results-ui-browser','results-flow-browser','combat-record-ui-browser','combat-record-flow-browser','mail-ui-browser','mail-flow-browser','missions-ui-browser','missions-flow-browser','shop-ui-browser','alliance-ui-browser','arena-ui-browser','battle-browser','battle-alignment-browser','battle-ui-browser','battle-feedback-browser','art-test-browser','tile-effects-browser'];
const reviews=['battle-review','mixed-battle-review'];
const wanted=process.argv.slice(2).map(name=>name.replace(/\.cjs$/,''));
const selected=wanted.length?wanted.map(name=>[...checks,...reviews].find(c=>c===name||c===name+'-browser')??name):checks;

function startServer(){
 return new Promise((resolve,reject)=>{
  const candidates=process.env.SAMGUK_PYTHON?[[process.env.SAMGUK_PYTHON,[]]]:[['py',['-3']],['python',[]],['python3',[]]];
  const attempt=index=>{
   if(index>=candidates.length)return reject(Error('Python을 찾지 못했습니다. SAMGUK_PYTHON으로 실행 파일을 지정하거나 SAMGUK_BASE_URL로 이미 실행 중인 서버를 지정하세요.'));
   const [command,prefix]=candidates[index];
   const child=spawn(command,[...prefix,'-B',path.join('game','server.py'),'--port','8790'],{cwd:repo,stdio:['ignore','pipe','pipe']});
   let settled=false,output='';
   child.on('error',()=>{if(!settled){settled=true;attempt(index+1);}});
   child.on('exit',code=>{if(!settled){settled=true;code===null?attempt(index+1):reject(Error('서버 시작 실패: '+output));}});
   child.stderr.on('data',data=>{output+=data;});
   child.stdout.on('data',data=>{output+=data;const url=output.match(/https?:\/\/\S+/)?.[0];if(url&&!settled){settled=true;resolve({url,stop:()=>child.kill()});}});
  };
  attempt(0);
 });
}
const run=(name,env)=>new Promise(resolve=>{
 const started=Date.now(),child=spawn(process.execPath,[path.join('game','tests',name+'.cjs')],{cwd:repo,env,stdio:'inherit'});
 child.on('exit',code=>resolve({name,ok:code===0,seconds:((Date.now()-started)/1000).toFixed(1)}));
});

(async()=>{
 const server=process.env.SAMGUK_BASE_URL?null:await startServer();
 const env={...process.env,SAMGUK_BASE_URL:process.env.SAMGUK_BASE_URL??server.url};
 console.log('server',env.SAMGUK_BASE_URL);
 const results=[];
 try{for(const name of selected){console.log('\n== '+name);results.push(await run(name,env));}}
 finally{server?.stop();}
 console.log('\n'+results.map(r=>`${r.ok?'PASS':'FAIL'} ${r.name} (${r.seconds}s)`).join('\n'));
 const failed=results.filter(r=>!r.ok).length;
 console.log(`${results.length-failed}/${results.length} browser checks passed`);
 process.exitCode=failed?1:0;
})().catch(error=>{console.error(error.message);process.exitCode=1;});
