import {artworkScreenTemplate,artworkPanel as panel} from './artwork-screen-template.js';

export const profileTemplate=artworkScreenTemplate(`<h1 class="scroll-heading" data-box="22,153,895,90">군주 성장 · 보상</h1>
${panel('20,264,901,330')}<div class="face" data-box="60,294,205,256"></div><h2 class="heading" data-box="310,294,560,54">군주 · Lv.8</h2><p class="copy xp-label" data-box="310,367,560,38"></p><div class="xp" data-box="310,424,551,30"><i></i></div><p class="copy" data-box="310,478,551,36">출전 장수 6명 · 보유 장수 12 / 49</p><p class="copy" data-box="310,532,551,32">위·촉·오·군웅 모두 등용 가능</p>
${panel('20,614,901,432')}<h2 data-box="50,637,480,44">레벨 달성 보상</h2><p class="copy gold" data-box="660,637,231,44">수령 가능 · 1개</p><div class="rewards"></div><p class="selected-reward" data-box="50,990,841,36"></p>
${panel('20,1066,901,220')}<h2 data-box="50,1090,841,44">다음 기능 해금</h2><p class="unlock-row" data-box="50,1150,841,36"><b>Lv.10</b> 토벌 파견 · 반동탁연합 전역</p><p class="unlock-row" data-box="50,1206,841,36"><b>Lv.12</b> 어려움 난도</p>
<button class="action government" data-tone="blue" data-box="20,1360,190,88" aria-label="내정 · 성내 시설">내정</button>`);
