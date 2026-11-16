// Companion to ui-audit.cjs: typography of the shared slots (header title, scroll heading, tabs, panel titles, action bar).
const {launch,start}=require('./browser-env.cjs');
const tabs=process.argv.slice(2).length?process.argv.slice(2):['home','barracks','shop','alliance','arena','campaign','missions','mail','codex','start','expedition','tower','treasure','profile','settings','formation','strategy','exchange','sSelect','rates','products','meritShop','arenaRanking','arenaHistory','arenaSeason','arenaOpponents'];
(async()=>{const browser=await launch();
 for(const tab of tabs){const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1});
  try{await start(page,{hash:tab==='home'?'':'#'+tab});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(700);
   const r=await page.evaluate(()=>{
    const at=(x,y)=>{let el=document.elementFromPoint(x,y);if(!el)return '-';const s=getComputedStyle(el);return Math.round(parseFloat(s.fontSize))+'/'+s.fontWeight+' '+el.tagName.toLowerCase()+'.'+[...el.classList].slice(0,2).join('.')+' "'+el.textContent.trim().slice(0,10)+'"';};
    const vis=el=>{const r=el.getBoundingClientRect();if(r.width<2)return false;for(let n=el;n&&n!==document.body;n=n.parentElement){const s=getComputedStyle(n);if(n.hidden||s.display==='none'||s.visibility==='hidden')return false;}return true;};
    const fs=el=>Math.round(parseFloat(getComputedStyle(el).fontSize));
    const group=sel=>{const m={};for(const el of document.querySelectorAll(sel)){if(!vis(el))continue;const k=fs(el)+'/'+getComputedStyle(el).fontWeight;(m[k]??=[]).push(el.textContent.trim().slice(0,8));}return Object.entries(m).map(([k,v])=>k+'×'+v.length+'('+v[0]+')').join(' ');};
    const bar=[...document.querySelectorAll('button')].filter(b=>vis(b)&&b.getBoundingClientRect().top>1380&&b.getBoundingClientRect().bottom<1500).map(b=>fs(b)+' '+Math.round(b.getBoundingClientRect().height)+'h "'+b.textContent.trim().slice(0,8)+'"').join(' | ');
    return {title:at(470,70),heading:at(470,196),tabs:group('.section-tabs button,[role=tab]'),h2:group('h2,h3'),p:group('p'),bar};});
   console.log('\n== '+tab);for(const [k,v] of Object.entries(r))console.log('  '+k+': '+v);
  }catch(e){console.log('\n== '+tab+' FAILED '+String(e.message).split('\n')[0]);}
  await page.close();}
 await browser.close();})();
