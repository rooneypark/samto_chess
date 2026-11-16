// Approved alliance composition; dynamic content is assigned with textContent.
export const allianceTemplate=`
 <button id="barracks-back" class="guild-back" aria-label="성문으로 돌아가기"></button>
 <h1 class="scroll-heading" data-box="22,153,895,90">청운동맹</h1>
 <nav class="section-tabs" aria-label="동맹 메뉴">
  <button data-tone="green" data-box="32,264,281,74" aria-current="page">동맹 본부</button>
  <button data-tone="blue" data-box="330,264,281,74">동맹원</button>
  <button data-tone="blue" data-box="628,264,281,74">활동 기록</button>
 </nav>
 <section class="headquarters" data-box="20,354,901,410" aria-label="산속 동맹 본부와 관우·제갈량 독립 원화">
  <div class="environment"></div><div class="panel-frame" data-frame="blue"></div>
 </section>
 <div class="general-lineup"></div>
 <p class="guild-stats" data-box="44,695,853,48"><span>군주 <b>청운</b></span><i></i><span>동맹원 <b>12 / 30</b></span><i></i><span>내 공헌 <b>120</b></span></p>
 <p class="notice guild-notice" data-box="22,782,895,90"><b>공지</b><span>군량을 모아 함께 토벌을 준비합시다.</span></p>
 <section class="cooperation" data-box="20,895,901,270" aria-label="공동 토벌 준비">
  <div class="panel-frame" data-frame="blue"></div>
 </section>
 <h2 data-box="54,919,620,45">공동 토벌 준비</h2><span class="period" data-box="725,925,160,35">주간 협력</span>
 <div class="preparation" data-box="55,984,660,24" role="progressbar" aria-label="토벌 준비도" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"><i></i></div>
 <b class="percentage" data-box="746,971,136,46">60<span>%</span></b>
 <p class="helper" data-box="55,1025,790,31">준비도 100% 달성 시 동맹 토벌 개방</p>
 <div class="cooperation-actions">
  <button data-tone="green" data-box="52,1079,268,66">군량 지원</button>
  <button data-tone="blue" data-box="336,1079,268,66">군자금 기부</button>
  <button data-tone="blue" data-box="620,1079,268,66">토벌 정보</button>
 </div>
 <div class="activity-buttons">
  <button data-tone="green" data-box="32,1187,430,130"><strong>동맹 출석</strong><small>골드 50 · 공헌 5</small></button>
  <button data-tone="blue" data-box="480,1187,430,130"><strong>동맹 상점</strong><small>공헌으로 보상 교환</small></button>
  <button data-tone="blue" data-box="32,1337,430,112"><strong>동맹 연구</strong><small>둔전 개간 · 행군 훈련</small></button>
  <button data-tone="blue" data-box="480,1337,430,112"><strong>동맹 관리</strong><small>공지 · 가입 신청</small></button>
 </div>
 <p class="reset-note" data-box="32,1463,877,26">매일 05:00 출석·기부 갱신 · 주간 협력은 월요일 갱신</p>
`;
