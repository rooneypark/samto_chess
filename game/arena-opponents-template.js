import {artworkScreenTemplate,artworkPanel} from './artwork-screen-template.js';
export const arenaOpponentsTemplate=artworkScreenTemplate(`<h1 class="scroll-heading" data-box="22,153,895,90">군웅대전 상대 선택</h1>
${artworkPanel('20,264,901,160')}<h2 data-box="50,288,841,44">내 대전 점수</h2><p class="chance own-score" data-box="50,354,841,44">1,120점 · 교위</p>
${artworkPanel('20,444,901,584')}<h2 data-box="50,469,841,44">대전 상대 · NPC</h2><div class="opponents"></div>
${artworkPanel('20,1048,901,242')}<h2 data-box="50,1073,841,44">선택한 상대</h2><p class="chance opponent-summary" data-box="50,1140,841,46"></p><p class="copy" data-box="50,1202,841,44">선택을 확정하면 군웅대전 준비 화면으로 돌아갑니다.</p>
<button class="pool-tab more" data-tone="blue" data-box="20,1310,901,64">다음 상대 목록</button>
<button class="home-back" data-tone="green" data-box="20,1414,901,64">선택 확정</button>`);
