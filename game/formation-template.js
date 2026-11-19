import {artworkScreenTemplate,artworkPanel as panel} from './artwork-screen-template.js';

export const formationTemplate=artworkScreenTemplate(`<h1 class="scroll-heading" data-box="22,153,895,90">출전 장수 편성</h1>
${panel('20,264,901,400')}<h2 data-box="50,286,540,44">출전 장수 · 6 / 6</h2><p class="copy count" data-box="630,286,261,44">번호는 성문 배치 순서</p><div class="formation-party"></div>
<button class="control previous" data-tone="blue" data-box="20,684,289,64">← 앞으로</button><button class="control next" data-tone="blue" data-box="326,684,289,64">뒤로 →</button><button class="control replace" data-tone="green" data-box="632,684,289,64">장수 교체</button>
${panel('20,768,901,254')}<h2 data-box="50,790,430,44">대기 장수</h2><p class="copy count" data-box="500,790,391,44">보유 장수만 표시 · 3명</p><div class="bench"></div>
<div class="synergy-panel" data-box="20,1042,901,290" aria-hidden="true"></div><h2 data-box="50,1058,600,39">세력 시너지</h2><div class="synergies" data-box="50,1102,841,100" aria-label="세력 시너지"></div><div class="bond" data-box="50,1210,841,108" aria-label="활성 인연"></div>
<p class="hint" data-box="20,1346,901,48">편성 기준 예상 효과입니다.
실제 전투에서는 해당 장수 배치 시 적용됩니다.</p><p class="formation-saved" data-box="20,1414,583,64">저장됨</p><button class="save" data-tone="green" data-box="20,1414,583,64">편성 저장</button><button class="home-back" data-tone="blue" data-box="621,1414,300,64">취소 · 병영</button>`);
