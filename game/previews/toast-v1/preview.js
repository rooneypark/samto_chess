import {artworkScreenTemplate,artworkPanel} from '../../artwork-screen-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
const root=document.querySelector('.game');
const find=selector=>root.querySelector(selector);
root.innerHTML=artworkScreenTemplate(`<h1 class="scroll-heading" data-box="22,153,895,90">군공 상점</h1>
<div class="toast-sample" data-state="success" data-box="20,261,901,82" role="status"><div class="panel-frame" data-frame="blue"></div><strong></strong><span></span></div>
${artworkPanel('20,363,901,178')}<h2 data-box="50,386,841,44">보유 군공</h2><p class="chance" data-box="50,458,841,44">75 군공</p>
${artworkPanel('20,561,901,290')}<h2 data-box="50,585,841,44">주간 교환</h2><p class="chance" data-box="50,660,841,44">보물 교환재료 5개</p><p class="copy" data-box="50,729,841,70">군공 30 · 이번 주 남은 교환 2회</p>
${artworkPanel('20,1030,901,250')}<h2 data-box="50,1054,841,44">토스트 상태 보기</h2>
<button class="pool-tab" data-state="success" data-tone="green" data-box="50,1135,267,88">성공</button>
<button class="pool-tab" data-state="error" data-tone="blue" data-box="337,1135,267,88">실패</button>
<button class="pool-tab" data-state="info" data-tone="blue" data-box="624,1135,267,88">안내</button>
<button class="home-back" data-tone="green" data-box="20,1414,901,64">교환하기</button>`);
await paintArtworkLayout(root,{stablePixels:true});
artworkShell(root,{screen:'arena',title:'군공 상점',progress:{gold:12450,diamonds:320},controlsRoot:root});
const messages={success:['성공','보물 교환재료 5개를 받았습니다.'],error:['실패','군공이 부족합니다.'],info:['안내','주간 교환 한도는 월요일 오전 5시에 갱신됩니다.']};
function show(state){
 const toast=find('.toast-sample');
 toast.dataset.state=state;
 toast.querySelector('strong').textContent=messages[state][0];
 toast.querySelector('span').textContent=messages[state][1];
}
root.querySelectorAll('button[data-state]').forEach(button=>button.onclick=()=>show(button.dataset.state));
find('.home-back').onclick=()=>show('success');
show('success');
root.setAttribute('aria-busy','false');
