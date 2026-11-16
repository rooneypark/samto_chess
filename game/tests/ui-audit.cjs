// UI consistency audit (not part of the pass/fail suite). Opens every screen, saves a screenshot and
// measures font families, button label centring, icon-to-text alignment and text overflow.
//   SAMGUK_BASE_URL=http://127.0.0.1:8795/game/ node game/tests/ui-audit.cjs [tab ...]
// Output: test-artifacts/ui-audit/<tab>.png and report.json.
const fs=require('node:fs');
const {launch,start,seed,artifact}=require('./browser-env.cjs');
const tabs=process.argv.slice(2).length?process.argv.slice(2):['home','barracks','shop','alliance','arena','campaign','missions','mail','codex','start','expedition','tower','government','treasure','profile','settings','formation','strategy','exchange','sSelect','rates','pickupRates','products','meritShop','arenaRanking','arenaHistory','arenaSeason','arenaOpponents'];

function measure(){
 const game=document.querySelector('.game'),frame=game.getBoundingClientRect();
 const visible=el=>{if(!el.isConnected)return false;const r=el.getBoundingClientRect();if(r.width<2||r.height<2||r.bottom<frame.top||r.top>frame.bottom)return false;
  for(let n=el;n&&n!==document.body;n=n.parentElement){const s=getComputedStyle(n);if(n.hidden||s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false;}return true;};
 const name=el=>(el.id?'#'+el.id:el.tagName.toLowerCase()+(el.classList.length?'.'+[...el.classList].slice(0,2).join('.'):''))+' "'+(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,18)+'"';
 // Ink box of the text directly inside el and its descendants.
 const textBox=el=>{const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let box=null;
  for(let node;node=walker.nextNode();){if(!node.nodeValue.trim()||!visible(node.parentElement))continue;const range=document.createRange();range.selectNodeContents(node);
   for(const r of range.getClientRects()){if(r.width<1)continue;box=box?{l:Math.min(box.l,r.left),t:Math.min(box.t,r.top),r:Math.max(box.r,r.right),b:Math.max(box.b,r.bottom)}:{l:r.left,t:r.top,r:r.right,b:r.bottom};}}
  return box;};
 const fonts={},sizes={},buttons=[],icons=[],overflow=[];
 const walker=document.createTreeWalker(game,NodeFilter.SHOW_TEXT);
 for(let node;node=walker.nextNode();){const el=node.parentElement;if(!node.nodeValue.trim()||!visible(el))continue;const s=getComputedStyle(el);
  const family=s.fontFamily.split(',')[0].replace(/["']/g,'').trim();(fonts[family]??=[]).length<4&&fonts[family].push(name(el));
  const px=Math.round(parseFloat(s.fontSize)*10)/10;sizes[px]=(sizes[px]||0)+1;}
 for(const el of game.querySelectorAll('button,[role=button],[role=tab]')){if(!visible(el))continue;const r=el.getBoundingClientRect(),t=textBox(el);if(!t)continue;
  const pics=[...el.querySelectorAll('img,.polish-tile,i,svg,canvas.icon')].filter(p=>visible(p)&&p.getBoundingClientRect().width<r.width*.6);
  const dx=(t.l+t.r)/2-(r.left+r.right)/2,dy=(t.t+t.b)/2-(r.top+r.bottom)/2;
  buttons.push({el:name(el),w:Math.round(r.width),h:Math.round(r.height),dx:+dx.toFixed(1),dy:+dy.toFixed(1),icons:pics.length,
   padL:+(t.l-r.left).toFixed(1),padR:+(r.right-t.r).toFixed(1),font:getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g,''),size:+parseFloat(getComputedStyle(el).fontSize).toFixed(1),
   out:t.l<r.left-1||t.r>r.right+1||t.t<r.top-1||t.b>r.bottom+1});}
 // An icon and the text beside it should share a vertical centre.
 for(const pic of game.querySelectorAll('img,.polish-tile,.rw i,i[class*=icon],i.card-faction')){if(!visible(pic))continue;const r=pic.getBoundingClientRect();if(r.width>90||r.height>90)continue;
  const host=pic.parentElement;if(!host)continue;const t=textBox(host);if(!t)continue;const hr=host.getBoundingClientRect();
  const singleLine=t.b-t.t<parseFloat(getComputedStyle(host).fontSize)*1.9;if(!singleLine)continue;
  const sideBySide=r.right<=t.l+2||r.left>=t.r-2;if(!sideBySide)continue;
  icons.push({el:name(host),icon:(pic.getAttribute('src')||pic.className||'').split('/').pop(),dy:+(((r.top+r.bottom)/2)-((t.t+t.b)/2)).toFixed(1),gap:+(r.right<=t.l+2?t.l-r.right:r.left-t.r).toFixed(1),size:Math.round(r.width)+'x'+Math.round(r.height),hostH:Math.round(hr.height)});}
 for(const el of game.querySelectorAll('*')){if(!visible(el)||!el.childNodes.length)continue;if(![...el.childNodes].some(n=>n.nodeType===3&&n.nodeValue.trim()))continue;
  const s=getComputedStyle(el);if(s.overflow==='visible'&&(el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2)&&el.clientWidth>0)overflow.push({el:name(el),sw:el.scrollWidth,cw:el.clientWidth,sh:el.scrollHeight,ch:el.clientHeight});}
 return {fonts,sizes,buttons,icons,overflow};
}

(async()=>{
 const browser=await launch(),report={};
 for(const tab of tabs){
  const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await start(page,{hash:tab==='home'?'':'#'+tab});
   // The government screen opens after the first campaign win; seed that so it can be audited too.
   if(tab==='government'){await seed(page,s=>{s.campaign??={};s.campaign.cleared=true;return s;});await page.evaluate(()=>history.replaceState(null,'','#government'));await page.reload();await page.locator('.game[aria-busy="false"]').waitFor();}
   await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(900);
   await page.screenshot({path:artifact('ui-audit',tab+'.png')});
   report[tab]={hash:await page.evaluate(()=>location.hash),errors,...await page.evaluate(measure)};
  }catch(error){report[tab]={failed:String(error.message).split('\n')[0]};}
  await page.close();
 }
 await browser.close();
 fs.writeFileSync(artifact('ui-audit','report.json'),JSON.stringify(report,null,1));
 for(const [tab,r] of Object.entries(report)){
  if(r.failed){console.log(tab,'FAILED',r.failed);continue;}
  const offY=r.buttons.filter(b=>Math.abs(b.dy)>Math.max(2.5,b.h*.06)),offX=r.buttons.filter(b=>!b.icons&&Math.abs(b.dx)>Math.max(3,b.w*.04)),out=r.buttons.filter(b=>b.out),ic=r.icons.filter(i=>Math.abs(i.dy)>2.5);
  console.log(`\n== ${tab} (${r.hash}) fonts:${Object.keys(r.fonts).join('|')} buttons:${r.buttons.length}`);
  for(const b of offY)console.log('  label off-centre Y',b.dy,b.el,b.w+'x'+b.h);
  for(const b of offX)console.log('  label off-centre X',b.dx,b.el,b.w+'x'+b.h);
  for(const b of out)console.log('  label outside button',b.el);
  for(const i of ic)console.log('  icon/text misaligned',i.dy,i.icon,i.el);
  for(const o of r.overflow.slice(0,6))console.log('  overflow',o.el,o.sw+'/'+o.cw,o.sh+'/'+o.ch);
 }
})();
