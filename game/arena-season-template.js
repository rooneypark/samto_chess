import {artworkScreenTemplate,artworkPanel} from './artwork-screen-template.js';
import {SEASON_DAYS} from './arena-state.js';
export const arenaSeasonTemplate=artworkScreenTemplate(`<h1 class="scroll-heading" data-box="22,153,895,90">군웅대전 시즌 · 등급</h1>
${artworkPanel('20,264,901,192')}<h2 class="current-tier" data-box="50,288,841,48">현재 등급 · 교위</h2><p class="chance current-score" data-box="50,350,841,42">대전 점수 1,120점</p><p class="copy season-end" data-box="50,402,841,36"></p>
${artworkPanel('20,476,901,444')}<h2 data-box="50,500,841,44">등급별 기준 점수</h2><div class="tiers"></div>
${artworkPanel('20,940,901,190')}<h2 class="reward-title" data-box="50,966,841,44"></h2><p class="chance reward" data-box="50,1035,841,46"></p>
${artworkPanel('20,1150,901,236')}<h2 data-box="50,1176,841,44">시즌 정산</h2><p class="rules" data-box="50,1232,841,130">시즌은 ${SEASON_DAYS}일입니다. 한 판 이상 치르면 종료 후 등급 보상이 우편으로 도착합니다.
다음 시즌 시작 점수는 1,000점과의 차이가 절반으로 줄어듭니다.</p>
`);
