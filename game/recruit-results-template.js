import {artworkScreenTemplate,artworkPanel as panel} from './artwork-screen-template.js';

export const recruitResultsTemplate=artworkScreenTemplate(`<h1 class="scroll-heading" data-box="22,153,895,90">이번 등용 결과</h1>
${panel('20,264,901,554')}<h2 data-box="50,286,841,44">10회 등용 결과</h2><div class="results"></div>
${panel('20,838,901,448')}<div class="full-art"></div><h2 class="detail-title" data-box="355,866,536,50"></h2><p class="result-status" data-box="355,934,536,76"></p><p class="summary skill" data-box="355,1032,536,44"></p><p class="detail-copy skill-text" data-box="355,1094,536,158"></p>
<p class="receipt-note" data-box="20,1306,901,40">신규 합류 6명 · 중복 카드 3장 · 장수 재료 4개</p><p class="hint" data-box="20,1360,901,34">획득 내역은 이미 반영되었습니다. 확인 시 추가 지급되지 않습니다.</p>
<button class="save" data-tone="green" data-box="20,1414,901,64">확인 · 상점으로</button>`);