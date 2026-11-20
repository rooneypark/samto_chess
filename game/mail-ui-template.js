import {artworkFooter} from './artwork-screen-template.js';
export const mailTemplate=`
 <button id="barracks-back" aria-label="뒤로"></button>
 <div class="wallet"><button aria-label="골드"></button><button aria-label="다이아"></button></div>
 <h1 class="scroll-heading" data-box="22,153,895,90">우편 보상 수령</h1>
 <section class="mail-summary" data-box="20,264,901,146"><div class="panel-frame" data-frame="blue"></div></section>
 <h2 class="summary-title" data-box="50,286,450,48">받을 보상 <b>2통</b></h2>
 <p class="summary-copy" data-box="50,348,490,34">보관 기한 안에 수령해 주세요.</p>
 <div class="summary-rewards" data-box="560,298,331,68"></div>
 <nav class="section-tabs" aria-label="우편 상태">
  <button data-tab="all" data-tone="green" data-box="20,430,289,74" aria-pressed="true">전체 <small>4</small></button>
  <button data-tab="available" data-tone="blue" data-box="326,430,289,74" aria-pressed="false">미수령 <small>2</small></button>
  <button data-tab="claimed" data-tone="blue" data-box="632,430,289,74" aria-pressed="false">수령 완료 <small>1</small></button>
 </nav>
 <div class="mail-rows" role="group" aria-label="우편 목록"></div>
 <p class="empty-list" data-box="20,524,901,456" hidden>표시할 우편이 없습니다.</p>
 <button class="page-prev" data-tone="blue" data-box="20,1000,170,64" aria-label="이전 우편 페이지">이전</button>
 <p class="page-count" data-box="210,1000,521,64">1 / 2</p>
 <button class="page-next" data-tone="blue" data-box="751,1000,170,64" aria-label="다음 우편 페이지">다음</button>
 <section class="detail-panel" data-box="20,1084,901,276"><div class="panel-frame" data-frame="blue"></div></section>
 <h2 class="detail-title" data-box="50,1106,570,40"></h2>
 <p class="detail-status" data-box="640,1106,251,40"></p>
 <p class="detail-body" data-box="50,1158,841,46"></p>
 <div class="detail-rewards" data-box="50,1216,841,40"></div>
 <button class="delete-mail" data-tone="blue" data-box="50,1276,266,64">우편 삭제</button>
 <button class="claim-mail" data-tone="green" data-box="560,1269,331,71">보상 받기</button>
 <p class="mail-note" data-box="20,1372,901,30">모두 받기는 수령 가능한 우편에만 적용됩니다.</p>
 <button class="claim-all" data-tone="green" data-box="20,1408,901,76">보상 모두 받기</button>
 
 ${artworkFooter}
`;
