import {heroes} from './heroes.js';
// The training uses the first and third hero of the formation, so it works for every faction.
const heroName=id=>heroes.find(h=>h.id===id)?.name??'장수';
export const tutorialText=run=>(tutorialSteps[run.tutorial.step]??'').replaceAll('{lead}',heroName(run.deck[0])).replaceAll('{second}',heroName(run.deck[2]));
export const tutorialSteps={1:'[소환]을 눌러 장수를 불러오세요.',2:'소환 버튼으로 {lead}을(를) 모집하세요.',3:'대기칸의 {lead}을(를) 선택한 뒤 아군 칸에 배치하세요.',4:'전투 시작을 누르세요.',5:'마나가 가득 차면 전법을 자동 사용합니다. 확인 후 전투를 계속하세요.',6:'첫 전투를 마쳤습니다. 다음 단계에서 합성을 배웁니다.',7:'{lead}을(를) 한 번 소환하고 기존 {lead}와(과) 겹쳐 합성하세요.',8:'{second}을(를) 소환하고 아군 칸에 배치하세요.',9:'출전 인원 ＋ 버튼으로 인원을 확장하세요. 훈련 은화 4를 지급했습니다.',10:'장수를 선택한 뒤 철검을 눌러 장착하세요.',11:'대기칸에 지급한 의용보병을 선택하고 판매하세요.',12:'전투 기록을 열어 장수별 기여도를 확인하세요.',13:'마지막 라운드에서 장각의 환영을 물리치세요.',14:'훈련 보상 100골드를 받고 성문으로 돌아가세요.',15:'병영에서 장수 훈련을 한 번 진행하세요.'};
export function tutorialGate(run,type){const t=run.tutorial;if(!t||t.step>=13)return;
 const allowed={1:[],2:['summon'],3:['move'],4:['start'],5:[],6:[],7:t.summoned?['move']:['summon'],8:t.summoned?['move']:['summon'],9:['capacity'],10:['equip'],11:['sell'],12:[]};
 if(!(allowed[t.step]??[]).includes(type))throw Error(tutorialText(run));}
export function tutorialAdvance(run,type,before){const t=run.tutorial;if(!t)return;
 if(t.step===2&&type==='summon')t.step=3;
 else if(t.step===3&&type==='move'&&run.units.some(u=>u.hero===run.deck[0]&&u.y>=0))t.step=4;
 else if(t.step===7){if(type==='summon')t.summoned=true;if(run.units.some(u=>u.hero===run.deck[0]&&u.rank===2)){t.step=8;t.summoned=false;}}
 else if(t.step===8){if(type==='summon')t.summoned=true;if(run.units.some(u=>u.hero===run.deck[2]&&u.y>=0)){t.step=9;run.silver+=4;}}
 else if(t.step===9&&type==='capacity'){t.step=10;run.gear.push({type:'sword',rank:1});}
 else if(t.step===10&&type==='equip'){t.step=11;const x=Array.from({length:8},(_,x)=>x).find(x=>!run.units.some(u=>u.y===-1&&u.x===x));run.units.push({id:run.nextId++,hero:'infantry',rank:1,x,y:-1,cost:0,trainingSale:true});}
 else if(t.step===11&&type==='sell'&&before.units.find(u=>u.id===run.lastSold)?.trainingSale)t.step=12;
}
