import {artworkScreenTemplate,artworkPanel} from './artwork-screen-template.js';
export const arenaRecordsTemplate=artworkScreenTemplate(`<h1 class="scroll-heading" data-box="22,153,895,90">군웅대전 순위표</h1>
<button class="pool-tab" data-tab="rank" data-tone="green" data-box="20,264,441,64">순위표</button>
<button class="pool-tab" data-tab="history" data-tone="blue" data-box="481,264,440,64">최근 전적</button>
${artworkPanel('20,348,901,166')}<h2 class="section-title" data-box="50,369,841,44"></h2><p class="record-summary" data-box="50,432,841,44"></p>
${artworkPanel('20,534,901,788')}<div class="record-list" tabindex="0" data-box="50,564,841,728"></div>
<p class="hint" data-box="20,1354,901,38"></p>
<button class="home-back" data-tone="green" data-box="20,1414,901,64">군웅대전으로</button>`);
