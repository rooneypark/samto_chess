import {artworkScreenTemplate,artworkPanel as panel} from './artwork-screen-template.js';

export const settingsTemplate=artworkScreenTemplate(`<h1 class="scroll-heading" data-box="22,153,895,90">환경 설정</h1>
${panel('20,264,901,526')}<h2 data-box="50,286,841,44">화면 · 전투 연출</h2><div class="settings-list"></div><p class="section-note" data-box="50,738,841,30">선택한 설정은 이 기기에 저장됩니다.</p>
${panel('20,810,901,230')}<h2 data-box="50,834,500,44">효과음</h2><p class="volume-value" data-box="650,834,241,44">50%</p><div class="volume-list"></div><p class="section-note" data-box="50,988,841,30">음량을 선택하세요. 0%는 음소거입니다.</p>
${panel('20,1060,901,230')}<h2 data-box="50,1082,841,44">저장 데이터</h2><button class="utility" data-tone="blue" data-box="50,1144,269,64" data-operation="backup">저장 백업</button><button class="utility" data-tone="blue" data-box="336,1144,269,64" data-operation="restore">백업 복구</button><button class="utility" data-tone="blue" data-box="622,1144,269,64" data-operation="diagnostics">진단 내보내기</button><p class="save-note" data-box="50,1222,841,60">복구 전 현재 저장을 백업합니다.
선택한 백업으로 교체하며, 저장을 합치지 않습니다.</p>
<button class="utility" data-tone="blue" data-box="20,1310,901,64" data-operation="fullscreen">전체 화면</button><p class="footnote" data-box="20,1384,901,26">한국어 · 로컬 저장 · 시각과 순위는 이 기기 기준</p><button class="home-back" data-tone="blue" data-box="20,1414,901,64">성문으로</button>`);
