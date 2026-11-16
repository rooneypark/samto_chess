// Shared approved shell markup. Screen bodies retain their own layouts.
const header="<button id=\"barracks-back\" aria-label=\"뒤로\"></button><div class=\"wallet\"><button aria-label=\"골드\"></button><button aria-label=\"다이아\"></button></div>\n";
export const artworkFooter="<nav class=\"bottom-nav\" aria-label=\"주 메뉴\"><button data-action=\"shop\" aria-label=\"상점\"></button><button data-action=\"barracks\" aria-label=\"병영\"></button><button data-action=\"home\" aria-label=\"성문\" aria-current=\"page\"></button><button data-action=\"alliance\" aria-label=\"동맹\"></button><button data-action=\"arena\" aria-label=\"군웅대전\"></button></nav>\n";
export const artworkScreenTemplate=body=>header+body+artworkFooter;

// Empty scalable panel; content remains separately positioned by each screen.
export const artworkPanel=box=>`<section data-box="${box}"><div class="panel-frame" data-frame="blue"></div></section>`;
