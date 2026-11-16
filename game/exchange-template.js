import {artworkScreenTemplate,artworkPanel as panel} from './artwork-screen-template.js';

export const exchangeTemplate=artworkScreenTemplate(`${panel('20,264,901,178')}<h2 data-box="50,286,841,44">보유 교환 재화</h2><p class="balance" data-box="50,350,841,50"></p>
${panel('20,462,901,304')}<h2 data-box="50,484,841,44">상품 목록 · 3종</h2><div class="products"></div>
${panel('20,786,901,404')}<h2 class="detail-name" data-box="50,812,841,54"></h2><p class="effect" data-box="50,890,841,54"></p><p class="copy cost" data-box="50,966,841,44"></p><p class="unlock" data-box="50,1030,841,44"></p><p class="exchange-note description" data-box="50,1096,841,64"></p>
${panel('20,1210,901,164')}<h2 data-box="50,1234,841,44">교환 안내</h2><p class="exchange-note" data-box="50,1292,841,60">매일 05시 · 주간 월요일 05시 갱신
선택상자는 교환 전에 받을 대상을 선택합니다.</p>
<button class="apply" data-tone="green" data-box="20,1414,583,64">교환하기</button><button class="home-back" data-tone="blue" data-box="621,1414,300,64">상점으로</button>`);