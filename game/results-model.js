import {roundCount,roundRule} from './battle-data.js';
import {stages,stageOf,stageName,stageUnlocked,hardUnlocked,chapters,towerStages} from './stages.js';
import {tutorialText} from './tutorial.js';
import {heroes} from './heroes.js';

export const continuesRun=run=>run.mode==='campaign'&&run.outcome==='win'&&run.round<roundCount(run.stageId);
export const canRetry=run=>run.mode==='campaign'&&run.outcome==='loss'&&run.retries<2&&!run.receipt;
const extraNames={heroTokens:'장수 교환재료',treasureTokens:'보물 교환재료',sShards:'S 선택 조각'};
export function resultView(run,state){
 const interim=continuesRun(run),retry=canRetry(run),arena=run.mode==='arena',stage=stageOf(run.stageId),receipt=run.receipt??state.battleReceipts?.[run.id];
 const cards=[],add=(label,value,icon)=>cards.push({label,value,icon});
 if(receipt){
  add('골드','+'+receipt.gold,'coin');
  if(receipt.diamonds)add('무료 다이아','+'+receipt.diamonds,'gem');
  if(receipt.merit)add('군공','+'+receipt.merit);
  for(const [key,value] of Object.entries(receipt.extra??{}))add(extraNames[key]??key,'+'+value);
  if(receipt.hero)add('새 장수 합류',heroes.find(h=>h.id===receipt.hero)?.name??receipt.hero);
  if(arena)add('대전 점수',(receipt.score>=0?'+':'')+receipt.score);
 }else if(interim){
  const rule=roundRule(run.round,run.stageId);add('다음 준비 은화','+'+rule.victorySilver);
  if(rule.equipment&&!run.tutorial)add('전리품','장비 선택');
 }else add('획득 보상','없음');
 let title,condition,landmark=null;
 if(interim){title='다음 라운드 · '+(run.round+1);condition='배치와 은화를 이어서 전투를 준비합니다.';}
 else if(arena){title='군웅대전 · '+(run.match?.opponent.name??'상대');condition=receipt?'대전 점수와 보상이 실제 기록에 반영되었습니다.':'결과 저장 후 군웅대전으로 돌아갑니다.';}
 else if(run.outcome!=='win'){title='';condition=retry?'장수 배치를 바꾸고 다시 도전할 수 있습니다. ('+(2-run.retries)+'회 남음)':'';}
 else{
  const next=Object.values(stage.tower?towerStages:stages).find(s=>s.requires?.includes(stage.stageId));
  if(next){
   const chapterChange=stage.chapterId!==next.chapterId;
   title=(stage.tower?'다음 층 · ':'다음 전역 · ')+(chapterChange?(chapters[next.chapterId]??next.name).replace(/ \(.*/,''):stageName(next.stageId));
   condition=stageUnlocked(state,next.stageId)?(stage.tower?'◆ 도전 가능 · 연무탑에서 다음 층을 선택하세요.':'◆ 도전 가능 · 전역에서 다음 전투를 선택하세요.'):(stage.completes==='황건'?'황건의 난':stageName(stage.stageId))+' 클리어'+(next.lordLevel?' · 군주 Lv.'+next.lordLevel+' 필요':'');
   if(run.difficulty==='hard'&&!hardUnlocked(state,next.stageId))condition='어려움 해금: 해당 장 전체 클리어 · 군주 Lv.12 필요';
   landmark={camp_yellow:'yellow-camp',camp_sishui:'sishui-wall',camp_hulao:'hulao-gate'}[next.chapterId]??null;
  }else{title=stage.tower?'연무탑 30층 완주':'전역 클리어';condition='완료한 전투와 보상 기록을 확인하세요.';}
 }
 if(run.tutorial){title=interim?'다음 훈련 단계':run.outcome==='win'?'병영에서 장수 훈련':title;condition=run.outcome==='win'?tutorialText(run):condition;landmark=null;}
 return {interim,retry,receipt,cards,title,condition,landmark,
  heading:run.tutorial?'기초 훈련':arena?'군웅대전 · '+(run.match?.opponent.name??'상대'):stageName(run.stageId)+' · '+(run.difficulty==='hard'?'어려움':'일반'),
  badge:receipt?.firstClear?'최초 클리어':interim?'라운드 완료':run.outcome==='win'?'클리어':retry?'재정비':'전투 종료',
  primaryId:interim?'battle-next':retry?'battle-retry':'battle-return',
  primaryLabel:interim?'다음 라운드':retry?'다시 도전':run.tutorial?'성문으로':arena?'군웅대전으로':stage.tower?'연무탑으로':'전역으로',
  pending:!receipt&&!interim&&(arena||run.outcome==='win')};
}
