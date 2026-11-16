// Approved arena composition; live values are assigned separately.
export const arenaTemplate=`
 <button id="barracks-back" class="guild-back" aria-label="성문으로 돌아가기"></button>
 <h1 class="scroll-heading" data-box="22,153,895,90">군웅의 격전</h1>
 <nav class="section-tabs" aria-label="대전 메뉴">
  <button data-tone="green" data-box="32,264,281,74" aria-current="page">대전 준비</button>
  <button data-tone="blue" data-box="330,264,281,74">순위표</button>
  <button data-tone="blue" data-box="628,264,281,74">전투 기록</button>
 </nav>
 <section class="rating" data-box="20,354,901,130"><div class="panel-frame" data-frame="blue"></div></section>
 <div class="rating-copy" data-box="54,375,575,90"><span>내 등급 <b>교위</b> <i>·</i> 대전 점수 <strong>1,120</strong></span><small>군공 <b>120</b> <i>·</i> 오늘 보상 <b>0 / 10회</b></small></div>
 <button class="compact" data-tone="blue" data-box="679,386,207,64">시즌·등급</button>
 <section class="duel-stage" data-box="20,502,901,500" aria-label="결투장과 관우·여포 독립 원화"><div class="environment"></div><div class="panel-frame" data-frame="blue"></div></section>
 <div class="challenger player" data-box="62,527,334,75"><small>나의 진영</small><strong>군주 <span>1,120점</span></strong></div>
 <div class="challenger opponent" data-box="545,527,334,75"><small>도전 상대 · NPC</small><strong>산울림 <span>1,124점</span></strong></div>
 <div class="duel-generals"></div><b class="versus" data-box="414,698,113,124">VS</b>
 <p class="stage-note" data-box="55,951,831,32">동일 성장 조건 · 훈련 10 / 각성 3 / 보물 미적용</p>
 <section class="formation" data-box="20,1020,901,156"><div class="panel-frame" data-frame="blue"></div></section>
 <h2 data-box="51,1033,430,39">내 편성 <small>6 / 6</small></h2>
 <button class="compact" data-tone="blue" data-box="695,1029,190,64">편성 변경</button>
 <div class="formation-generals" aria-label="기존 6장수 원화 미리보기"></div>
 <div class="secondary-actions">
  <button data-tone="blue" data-box="32,1196,430,88">다른 상대 보기</button>
  <button data-tone="blue" data-box="480,1196,430,88">대전 규칙</button>
 </div>
 <div class="primary-actions">
  <button data-tone="green" data-box="32,1304,570,136"><strong>대전 시작</strong><small>승리 골드 20 · 군공 10</small></button>
  <button data-tone="blue" data-box="620,1304,290,136"><strong>군공 상점</strong><small>보유 군공 120</small></button>
 </div>
 <p class="reset-note" data-box="32,1463,877,26">매일 05:00 보상 갱신 · 하루 3판 참여 시 다이아 10</p>
`;
