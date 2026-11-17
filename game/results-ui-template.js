import {artworkFooter} from './artwork-screen-template.js';
import {contentBounds} from './art-layout.js';
export const resultsTemplate=`
 <button id="barracks-back" aria-label="전역 선택으로 돌아가기"></button>
 <div class="wallet"><button aria-label="골드 예시 12,450"></button><button aria-label="다이아 예시 320"></button></div>
 <h1 class="scroll-heading" data-box="22,153,895,90">광종 결전 · 일반</h1>
 <section class="victory-scene" data-box="${contentBounds.left},264,${contentBounds.width},518"><div class="environment"></div><div class="panel-frame" data-frame="blue"></div></section>
 <div class="clear-badge" data-box="330,294,281,64"><span>최초 클리어</span></div>
 <h2 class="victory-title" data-box="200,370,541,116">승리</h2>
 <p class="round-summary" data-box="160,539,621,31">5 / 5 라운드 완료</p>
 <div class="victory-generals" aria-label="기존 6장수 독립 원화"></div>
 <section class="reward-panel" data-box="${contentBounds.left},804,${contentBounds.width},254"><div class="panel-frame" data-frame="blue"></div></section>
 <h2 class="section-title" data-box="52,827,550,42">획득 보상</h2><span class="paid-label" data-box="650,827,238,42">✓ 지급 완료</span>
 <div class="reward-item" data-box="52,890,240,140"><div class="panel-frame" data-frame="blue"></div><div class="reward-value"><img src="assets/shop-v2/coin.png" alt=""><strong id="gold-reward">+100</strong></div><small>골드</small></div>
 <div class="reward-item" data-box="350,890,240,140"><div class="panel-frame" data-frame="blue"></div><div class="reward-value"><img src="assets/shop-v2/gem.png" alt=""><strong id="gem-reward">+30</strong></div><small>무료 다이아</small></div>
 <div class="reward-item" data-box="648,890,240,140"><div class="panel-frame" data-frame="blue"></div><div class="reward-value"><strong id="material-reward">+5</strong></div><small>장수 교환재료</small></div>
 <section class="next-stage" data-box="${contentBounds.left},1076,${contentBounds.width},130"><div class="panel-frame" data-frame="blue"></div></section>
 <img class="next-landmark" data-box="49,1090,120,100" alt="사수관 성벽">
 <h2 class="next-title" data-box="194,1093,660,42">다음 전역 · 사수관</h2>
 <p class="next-condition" data-box="194,1149,660,32">황건의 난 클리어 · 군주 Lv.10 필요</p>
 <button id="battle-stats" class="record-button" data-tone="blue" data-box="${contentBounds.left},1226,${contentBounds.width},78">전투 기록</button>
 <button id="result-primary" class="return-campaign" data-tone="green" data-box="${contentBounds.left},1322,582,118">전역으로</button>
 <button id="result-home" class="return-home" data-tone="blue" data-box="620,1322,301,118">성문으로</button>
 <p class="reset-note" data-box="${contentBounds.left},1463,${contentBounds.width},26">보상은 전투 종료 시 자동으로 지급됩니다.</p>
 ${artworkFooter}
`;
