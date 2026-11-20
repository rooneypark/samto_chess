import {artworkFooter} from './artwork-screen-template.js';
export const combatRecordTemplate=`
 <button id="barracks-back" aria-label="기록 닫기"></button>
 <div class="wallet"><button aria-label="골드 예시 12,450"></button><button aria-label="다이아 예시 320"></button></div>
 <h1 class="scroll-heading" data-box="22,153,895,90">광종 결전 · 일반</h1>
 <section class="battle-summary" data-box="20,264,901,142"><div class="panel-frame" data-frame="blue"></div></section>
 <strong class="outcome" data-box="52,286,148,94">승리</strong>
 <h2 class="summary-title" data-box="230,285,654,44">최종 라운드 · 5 / 5</h2>
 <p class="summary-copy" data-box="230,344,654,32"></p>
 <nav class="side-tabs" aria-label="진영 선택">
  <button data-side="0" data-tone="green" data-box="20,426,441,74" aria-pressed="true">아군 <small>6명</small></button>
  <button data-side="1" data-tone="blue" data-box="479,426,442,74" aria-pressed="false">적군 <small>6명</small></button>
 </nav>
 <nav class="metric-tabs" aria-label="전투 기록 지표">
  <button data-metric="damage" data-tone="green" data-box="20,518,289,64" aria-pressed="true">피해량</button>
  <button data-metric="healing" data-tone="blue" data-box="326,518,289,64" aria-pressed="false">치유량</button>
  <button data-metric="casts" data-tone="blue" data-box="632,518,289,64" aria-pressed="false">전법 횟수</button>
 </nav>
 <section class="record-panel" data-box="20,602,901,704"><div class="panel-frame" data-frame="blue"></div></section>
 <h2 class="roster-heading" data-box="54,620,330,38">장수별 전투 기록</h2>
 <p class="metric-heading" data-box="420,620,467,38">피해량 · 기여 비중</p>
 <nav class="record-pagination" aria-label="기록 페이지" hidden><button id="record-prev" data-box="610,610,74,64" aria-label="이전 기록 페이지">‹</button><span class="page-number" data-box="690,620,102,38"></span><button id="record-next" data-box="801,610,74,64" aria-label="다음 기록 페이지">›</button></nav>
 <p class="record-empty" data-box="54,810,833,240" hidden>기록된 전투가 없습니다.</p>
 <div class="record-rows" role="group" aria-label="장수 기록"></div>
 <div class="detail-panel" data-box="20,1320,901,64"><div class="panel-frame" data-frame="blue"></div></div>
 <p class="selection-detail" data-box="46,1335,849,34" aria-live="polite"></p>
 <button id="record-return" class="result-back" data-tone="green" data-box="20,1402,582,84">결과로 돌아가기</button>

 ${artworkFooter}
`;
