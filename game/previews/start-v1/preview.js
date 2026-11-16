import {artworkShell} from '../../ui-shell.js';
import {placeArtwork,uiComponentsReady} from '../../art-controls.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {nineSlice} from '../../nine-slice.js';
import {startMissions,startFinalReward} from '../../collection.js';
const game=document.querySelector('.game'),$=s=>game.querySelector(s),today=3,claimed=new Set([1]),completed=new Set([1,2]);let selected=2;
const labels={gold:'골드',freeDiamonds:'무료 다이아',trainingTickets:'훈련권',treasureTokens:'보물 재료',heroTokens:'장수 재료'};
const rewardText=r=>Object.entries(r).map(([k,v])=>labels[k]+' '+v).join(' · ');
function note(text='시작 7일 임무 시안입니다. 실제 저장은 변경하지 않습니다.'){const e=document.querySelector('.preview-status');e.textContent=text;e.hidden=false;clearTimeout(note.timer);note.timer=setTimeout(()=>e.hidden=true,2400);}
artworkShell(game,{screen:'home',title:'시작 7일',progress:{gold:12450,diamonds:320}});
startMissions.forEach((m,i)=>{const b=document.createElement('button');b.className='day-button';b.dataset.day=m.day;b.innerHTML='<strong>'+m.day+'일차</strong><span class="day-reward">'+rewardText(m.reward)+'</span><small></small>';placeArtwork(b,i<4?[20+i*230,420,211,166]:[20+(i-4)*307,606,287,166]);b.onclick=()=>{selected=m.day;render();};$('.day-list').append(b);});
await Promise.all([uiComponentsReady,paintArtworkLayout(game)]);
async function render(){game.inert=true;game.setAttribute('aria-busy','true');const painting=[];
for(const b of game.querySelectorAll('[data-day]')){const d=Number(b.dataset.day),state=claimed.has(d)?'✓ 수령 완료':d>today?'잠금 · '+d+'일차 개방':completed.has(d)?'수령 가능':'진행 중';b.querySelector('small').textContent=state;b.classList.toggle('locked',d>today);b.classList.toggle('done',claimed.has(d));b.setAttribute('aria-pressed',String(d===selected));painting.push(nineSlice(b,d===selected?'green':'blue'));}
const m=startMissions[selected-1],locked=selected>today,done=claimed.has(selected);$('.detail-day').textContent=selected+'일차 · '+(done?'수령 완료':locked?'개방 예정':completed.has(selected)?'임무 달성':'진행 중');$('.detail-title').textContent=m.name;$('.detail-copy').textContent=locked?selected+'일차에 열립니다. 이전 임무도 계속 진행할 수 있습니다.':done?'보상을 받았습니다. 다음 임무에 도전해 보세요.':completed.has(selected)?'목표를 달성했습니다. 보상을 받아 주세요.':'현재 장수·보물 모집 4 / 10회';$('.detail-reward').textContent='보상 · '+rewardText(m.reward);$('.claim').disabled=locked||done||!completed.has(selected);$('.claim').textContent=done?'수령 완료':locked?'개방 대기':'보상 받기';$('.go-mission').disabled=locked;$('.bonus-progress').textContent=claimed.size+' / 7 임무 보상 수령';$('.bonus-reward').textContent=rewardText(startFinalReward)+' · A등급 선택상자 1회분';painting.push(nineSlice($('.claim'),$('.claim').disabled?'blue':'green'));await Promise.all([...painting,document.fonts.ready]);game.inert=false;game.setAttribute('aria-busy','false');}
$('.claim').onclick=()=>{claimed.add(selected);render();note('수령 상태 예시입니다. 실제 보상은 지급하지 않습니다.');};$('.go-mission').onclick=()=>note('실제 적용 시 해당 임무 화면으로 이동합니다.');game.querySelectorAll('.home-back,.bottom-nav button,.wallet button,#barracks-back').forEach(b=>b.onclick=()=>note());await render();
