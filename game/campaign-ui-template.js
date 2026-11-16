export const campaignTemplate=`
 <button id="barracks-back" aria-label="성문으로 돌아가기"></button>

 <button id="campaign-catalog" aria-label="전투 선택 · 전체 전역과 군략" title="전체 전역 목록과 군략" class="scroll-heading" data-box="22,153,895,90">전투 선택</button>
 <nav class="section-tabs" aria-label="전역 장 선택"><button data-chapter="yellow" data-tone="green" data-box="32,264,430,74" aria-pressed="true">황건의 난 <small>0 / 3</small></button><button data-chapter="dong" data-tone="blue" data-box="480,264,430,74" aria-pressed="false">반동탁연합 <small>0 / 6</small></button></nav>
 <section class="campaign-map" data-box="20,354,901,650" aria-label="황건의 난에서 사수관과 호뢰관으로 이어지는 진군 경로"><div class="map-art"></div><div class="panel-frame" data-frame="blue"></div></section>
 <svg class="route-lines" data-box="0,0,941,1672" viewBox="0 0 941 1672" aria-hidden="true"><path class="future-route" d="M172 490 H768 V695 H172 V900 H768"/><path class="clear-route" d="M172 490 H768"/><path class="arrows" d="m316 482 12 8-12 8m298-16 12 8-12 8 M760 578l8 12 8-12 M626 687l-12 8 12 8m-298-16-12 8 12 8 M164 783l8 12 8-12 M316 892l12 8-12 8m298-16 12 8-12 8"/></svg>
 <p class="chapter-label" data-box="59,379,650,36">第一章 <b>황건의 난</b><span>황건 진압 · 0 / 3</span></p>
 <p class="chapter-label" data-box="59,584,650,36">第二章 <b>사수관</b><span>반동탁연합 · 전반</span></p>
 <p class="chapter-label" data-box="59,789,650,36">第三章 <b>호뢰관</b><span>반동탁연합 · 후반</span></p>
 <div class="stage-nodes"></div>

 <section class="details" data-box="20,1020,901,264"><div class="panel-frame" data-frame="blue"></div></section>
 <h2 id="campaign-stage-title" data-box="56,1044,650,44"></h2><span class="rounds" data-box="730,1044,150,44">5 라운드</span>
 <p id="stage-condition" data-box="56,1098,830,34"></p>
 <div class="reward-row" data-box="56,1147,830,45"><span id="reward-label">최초 클리어</span><strong id="first-reward"></strong></div>
 <div class="repeat-row" data-box="56,1212,830,36"><span id="extra-reward"></span><span id="repeat-reward"></span></div>
 <button id="campaign-difficulty" class="difficulty" data-tone="blue" data-box="32,1304,290,136" data-note="어려움은 해당 장 전체 클리어 및 군주 Lv.12 달성 후 열립니다."><strong>일반</strong><small>어려움 · 잠김</small></button>
 <button id="campaign-depart" data-tone="green" data-box="340,1304,570,136"><strong>출정 준비</strong><small>도전 비용 없음</small></button>
 <p class="reset-note" data-box="32,1463,877,26">진군 경로에서 전투를 선택하세요 · 군주 정보</p>
`;
