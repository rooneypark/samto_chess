import {artworkScreenTemplate,artworkPanel as panel} from './artwork-screen-template.js';
export const ratesTemplate=artworkScreenTemplate(`<h1 class="scroll-heading" data-box="22,153,895,90">모집 확률과 보장 안내</h1>
<button class="pool-tab" data-pool="hero" data-tone="green" data-box="20,264,441,64">장수 모집</button><button class="pool-tab" data-pool="treasure" data-tone="blue" data-box="481,264,440,64">보물 모집</button>
${panel('20,348,901,244')}<h2 data-box="50,370,841,44">기본 등급 확률</h2><div class="grades"></div>
${panel('20,612,901,342')}<h2 class="detail-title" data-box="50,638,841,44"></h2><p class="chance" data-box="50,704,841,44"></p><p class="names" data-box="50,770,841,154"></p>
${panel('20,974,901,358')}<h2 data-box="50,1000,841,44">보장 규칙</h2><p class="rules" data-box="50,1070,841,226"></p>
<p class="hint" data-box="20,1354,901,36">골드·다이아 동일 확률 · 장수/보물 보장 횟수는 별도</p>
`);
