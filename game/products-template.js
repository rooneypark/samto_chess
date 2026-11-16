import {artworkScreenTemplate,artworkPanel} from './artwork-screen-template.js';
export const productsTemplate=artworkScreenTemplate(`<h1 class="scroll-heading" data-box="22,153,895,90">상품과 보급</h1>
${artworkPanel('20,264,901,262')}<h2 data-box="50,286,841,44">보급 · 성장 상품</h2><div class="supplies"></div>
${artworkPanel('20,546,901,410')}<h2 data-box="50,568,841,44">다이아 상품</h2><div class="packs"></div>
${artworkPanel('20,976,901,348')}<h2 class="product-heading" data-box="50,1002,841,50"></h2>
<p class="chance" data-box="50,1070,841,44"></p><p class="product-copy" data-box="50,1134,841,154"></p>
<p class="hint" data-box="20,1354,901,44">시험 결제 · 실제 청구 없음</p>
<button class="apply" data-tone="green" data-box="20,1414,583,64">시험 결제</button>
<button class="home-back" data-tone="blue" data-box="621,1414,300,64">상점으로</button>`);
