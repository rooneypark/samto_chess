import {artworkFooter} from './artwork-screen-template.js';
export const missionsTemplate=`
 <button id="barracks-back" aria-label="뒤로"></button>
 <div class="wallet"><button aria-label="골드"></button><button aria-label="다이아"></button></div>
 <section class="attendance-panel" data-box="20,264,901,254"><div class="panel-frame" data-frame="blue"></div></section>
 <h2 class="attendance-title" data-box="50,286,400,45">매일 출석 보상</h2>
 <p class="attendance-copy" data-box="50,335,470,32">오늘은 3일차 · 무료 다이아 20</p>
 <button class="attendance-claim" data-tone="green" data-box="652,286,239,76">출석 받기</button>
 <div class="attendance-days" role="list" aria-label="7일 출석 보상"></div>
 <nav class="section-tabs" aria-label="임무 종류">
  <button data-tab="day" data-tone="green" data-box="20,538,289,74" aria-pressed="true">일일 임무</button>
  <button data-tab="week" data-tone="blue" data-box="326,538,289,74" aria-pressed="false">주간 임무</button>
  <button data-tab="achievement" data-tone="blue" data-box="632,538,289,74" aria-pressed="false">업적</button>
 </nav>
 <h2 class="list-title" data-box="26,630,500,40">오늘의 임무</h2>
 <p class="reset-time" data-box="570,630,345,40">매일 05:00 갱신</p>
 <div class="mission-rows" aria-label="임무 목록"></div>
 <section class="bonus-panel" data-box="20,1214,901,146"><div class="panel-frame" data-frame="blue"></div></section>
 <h2 class="bonus-title" data-box="50,1233,520,40">일일 완료 보너스</h2>
 <div class="bonus-rewards" data-box="50,1280,520,40"></div>
 <p class="bonus-copy" data-box="50,1321,520,28"></p>
 <button class="bonus-claim" data-tone="blue" data-box="652,1245,239,84" disabled>1 / 4 수령</button>
 <p class="mail-note" data-box="20,1372,901,30">완료한 미수령 임무 보상은 우편으로 7일간 보관됩니다.</p>
 <button class="home-back" data-tone="green" data-box="20,1414,901,64">성문으로</button>
 ${artworkFooter}
`;
