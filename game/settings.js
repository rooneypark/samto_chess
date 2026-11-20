import {durableStore} from './durable-store.js';
import {createGameStore,validateSave} from './store.js';
import {artSet,setArtSet} from './art.js';
import {SAVE_KEY,LEGACY_PROGRESS_KEY,LEGACY_LOBBY_KEY} from './versions.js';
import {activeRoster} from './heroes.js';
export function downloadJson(name,value){const blob=new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export async function bootStore(dialog){
 const raw=localStorage.getItem(SAVE_KEY),legacy=localStorage.getItem(LEGACY_PROGRESS_KEY)||localStorage.getItem(LEGACY_LOBBY_KEY);
 let version;try{version=raw?JSON.parse(raw).version:null;}catch{}
 if((raw&&version===2)||(!raw&&legacy))await new Promise(resolve=>{
  dialog.open('저장 데이터 이관','<p>이전 저장을 발견했습니다. 장수·재화·편성을 새 형식으로 옮깁니다. 다른 계정과 합산하지 않습니다. 먼저 원본 백업을 내려받으세요.</p><div class="modal-actions"><button class="action secondary" id="migration-backup">원본 백업</button><button class="action" id="migration-approve" disabled>이관 승인</button></div>');
  document.querySelector('#migration-backup').onclick=()=>{downloadJson('samguk-legacy-backup.json',{current:raw,progress:localStorage.getItem(LEGACY_PROGRESS_KEY),lobby:localStorage.getItem(LEGACY_LOBBY_KEY)});document.querySelector('#migration-approve').disabled=false;};
  document.querySelector('#migration-approve').onclick=()=>{dialog.dismiss();resolve();};
 });
 try{return await durableStore(()=>createGameStore());}catch(error){
  return new Promise(resolve=>{
   dialog.open('저장 데이터 복구','<p>저장 데이터를 읽지 못했습니다. 원본은 그대로 보존되어 있습니다. 백업 파일을 선택해 복구할 수 있습니다.</p><div class="modal-actions"><button class="action secondary" id="recover-download">현재 원본 내려받기</button><label class="action">백업 선택<input id="recover-file" type="file" accept=".json"></label></div><p id="recover-error" role="alert"></p>');
   document.querySelector('#recover-download').onclick=()=>downloadJson('samguk-damaged-save.json',raw??'');
   document.querySelector('#recover-file').onchange=async e=>{try{const s=validateSave(JSON.parse(await e.target.files[0].text()));localStorage.setItem(SAVE_KEY,JSON.stringify(s));const store=await durableStore(()=>createGameStore());await store.restore(s);dialog.dismiss();resolve(store);}catch(e){document.querySelector('#recover-error').textContent=e.message;}};
  });
 }
}
export function settingsPanel({store,dialog,toast}){
 const s=store.get(),p=s.preferences??{};
 dialog.open('설정',`<label class="setting">움직임 줄이기<input type="checkbox" id="motion" ${s.reducedMotion?'checked':''}></label><label class="setting">큰 글씨<input type="checkbox" id="large-text" ${p.largeText?'checked':''}></label><label class="setting">전법 이펙트 줄이기<input type="checkbox" id="reduced-fx" ${p.reducedFx?'checked':''}></label><label class="setting">새 디자인 그림 (배경·아이콘·초상)<input type="checkbox" id="art-set" ${artSet==='a'?'checked':''}></label><label class="setting">효과음<input id="sound-volume" type="range" min="0" max="100" value="${p.volume??50}"></label><div class="modal-actions"><button class="action secondary" id="fullscreen">전체 화면</button><button class="action secondary" id="save-export">저장 백업</button><button class="action secondary" id="log-export">진단 내보내기</button></div><label>백업 복구<input type="file" id="save-import" accept=".json"></label><p>로컬 저장 · 한국어 · 시각과 순위는 이 기기를 기준으로 합니다.</p>`);
 const update=async fn=>{try{await store.update(fn);}catch(e){toast(e.message);}};
 document.querySelector('#motion').onchange=e=>update(s=>({...s,reducedMotion:e.target.checked}));
 for(const [id,key] of [['large-text','largeText'],['reduced-fx','reducedFx']])document.querySelector('#'+id).onchange=e=>update(s=>({...s,preferences:{...s.preferences,[key]:e.target.checked}}));
 document.querySelector('#sound-volume').onchange=e=>update(s=>({...s,preferences:{...s.preferences,volume:Number(e.target.value)}}));
 document.querySelector('#art-set').onchange=e=>{setArtSet(e.target.checked?'a':'classic');location.reload();};
 const actions=settingsActions({store,dialog,toast});
 document.querySelector('#fullscreen').onclick=actions.fullscreen;
 document.querySelector('#save-export').onclick=actions.backup;
 document.querySelector('#log-export').onclick=actions.diagnostics;
 document.querySelector('#save-import').onchange=e=>actions.restore(e.target.files[0]);
}

// Shared file/fullscreen actions for the classic dialog and approved artwork screen.
export function settingsActions({store,dialog,toast}){
 return {
 backup:()=>downloadJson('samguk-backup.json',store.get()),
 diagnostics:()=>downloadJson('samguk-diagnostics.json',{revision:store.get().revision,ledger:store.get().ledger,battle:store.get().battleRun?.battle}),
 async fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('전체 화면을 지원하지 않습니다.');}},
 async restore(file){if(!file)return;try{const backup=validateSave(JSON.parse(await file.text()));dialog.confirm('백업 복구',`골드 ${backup.gold.toLocaleString()}, 보유 장수 ${activeRoster.filter(hero=>backup.heroes[hero.id]?.owned).length}명. 현재 저장을 백업한 뒤 선택한 파일의 저장으로 교체합니다.`,'복구',async()=>{try{downloadJson('samguk-before-restore.json',store.get());await store.restore(backup);location.reload();}catch(e){toast('복구 실패: '+e.message);}});}catch(e){toast('복구 실패: '+e.message);}}
 };
}
