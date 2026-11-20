import {artworkScreenTemplate,artworkPanel as panel} from './artwork-screen-template.js';

export const strategyTemplate=artworkScreenTemplate(`<h1 class="scroll-heading" data-box="22,153,895,90">출정 군략 선택</h1>
${panel('20,264,901,466')}<h2 data-box="50,286,540,44">군략 목록 · 6종</h2><p class="copy right" data-box="650,286,241,44">군주 Lv.12</p><div class="strategies"></div>
${panel('20,750,901,416')}<h2 class="detail-name" data-box="50,776,841,54"></h2><p class="effect" data-box="50,850,841,54"></p><p class="description" data-box="50,926,841,72"></p><p class="unlock" data-box="50,1022,841,38"></p><p class="note" data-box="50,1082,841,60">편성과 장수 역할에 맞춰 선택하세요.
군략 효과는 실제 전투의 대상과 조건에 따라 적용됩니다.</p>
${panel('20,1186,901,188')}<h2 data-box="50,1210,841,44">출정 군략</h2><p class="copy gold current" data-box="50,1266,841,38"></p>
<button class="apply" data-tone="green" data-box="20,1394,901,72">군략 적용</button>`);
