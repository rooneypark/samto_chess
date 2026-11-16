import {artworkScreenTemplate,artworkPanel} from '../../artwork-screen-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
const root=document.querySelector('.game');
const find=selector=>root.querySelector(selector);
root.innerHTML=artworkScreenTemplate(`<h1 class="scroll-heading" data-box="22,153,895,90">군공 상점</h1>
${artworkPanel('20,264,901,166')}<h2 data-box="50,288,841,48">보유 군공 · 75</h2>
${artworkPanel('20,450,901,484')}<h2 data-box="50,478,841,48">주간 교환</h2>
<p class="chance" data-box="50,550,841,48">보물 교환재료 5개</p>
<p class="copy" data-box="50,620,841,44">군공 30 · 이번 주 남은 교환 2회</p>
<button class="preview-control" data-tone="green" data-box="50,816,841,64">교환 확인 열기</button>
<div class="dialog-layer"><section role="dialog" aria-modal="true" aria-labelledby="dialog-title">
${artworkPanel('60,526,821,600')}
<h2 id="dialog-title" class="dialog-title" data-box="100,568,741,62">교환 확인</h2>
<p class="dialog-body" data-box="100,660,741,100">군공을 사용해 보물 교환재료를 받으시겠어요?</p>
<div data-box="100,780,741,176"><div class="panel-frame" data-frame="blue"></div></div>
<p class="dialog-label" data-box="128,815,330,42">받는 보상</p><p class="dialog-value" data-box="460,815,353,42">보물 교환재료 5개</p>
<p class="dialog-label" data-box="128,887,330,42">사용 군공</p><p class="dialog-value" data-box="460,887,353,42">30</p>
<button class="pool-tab cancel" data-tone="blue" data-box="100,996,360,80">취소</button>
<button class="pool-tab confirm" data-tone="green" data-box="480,996,361,80">확인</button>
</section></div>`);
await paintArtworkLayout(root,{stablePixels:true});
artworkShell(root,{screen:'arena',title:'군공 상점',progress:{gold:12450,diamonds:320},controlsRoot:root});
const layer=find('.dialog-layer'),trigger=find('.preview-control');
function close(confirmed){
 layer.hidden=true;
 trigger.textContent=confirmed?'확인 완료 · 다시 열기':'교환 확인 열기';
 trigger.focus();
}
trigger.onclick=()=>{layer.hidden=false;find('.cancel').focus();};
find('.cancel').onclick=()=>close(false);
find('.confirm').onclick=()=>close(true);
layer.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();close(false);}
 if(event.key==='Tab'){event.preventDefault();(event.target===find('.cancel')?find('.confirm'):find('.cancel')).focus();}
});
root.setAttribute('aria-busy','false');
