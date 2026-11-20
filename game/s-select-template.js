import {artworkScreenTemplate,artworkPanel as panel} from './artwork-screen-template.js';
import {S_SELECT_COST} from './collection.js';

export const sSelectTemplate=artworkScreenTemplate(`<h1 class="scroll-heading" data-box="22,153,895,90">S 등급 장수 선택</h1>
${panel('20,264,901,126')}<h2 data-box="50,286,540,44">S 선택 조각 · 60 / 60</h2><p class="copy" data-box="50,338,841,30">조각 ${S_SELECT_COST}개로 S등급 장수 1명 확정 획득</p>
${panel('20,410,901,412')}<h2 data-box="50,432,841,44">선택 가능한 장수</h2><div class="roster"></div>
<button class="previous" data-tone="blue" data-box="20,842,269,64">← 이전</button><p class="page-label" data-box="310,856,321,40"></p><button class="next" data-tone="blue" data-box="652,842,269,64">다음 →</button>
${panel('20,926,901,400')}<div class="full-art"></div><h2 class="detail-title" data-box="355,954,536,50"></h2><p class="copy ownership" data-box="355,1024,536,38"></p><p class="summary skill" data-box="355,1084,536,44"></p><p class="detail-copy skill-text" data-box="355,1144,536,150"></p>
<p class="hint" data-box="20,1346,901,48">미등용 장수는 새로 합류합니다.
보유 장수의 중복 획득은 기존 각성·재료 규칙을 따릅니다.</p><button class="save" data-tone="green" data-box="20,1414,901,64">선택 조각 60개 · 교환</button>`);