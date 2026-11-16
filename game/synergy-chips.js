// Turns the synergy line ("위 2 · 촉 2 · 도원결의") into faction chips and bond tags.
// The element's text content stays exactly "세력 시너지 · <text>", so readers and checks see the same string.
const factionIcons={'위':'wei','촉':'shu','오':'wu','군웅':'qun'};
const escape=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function renderSynergy(element,text){
 const tokens=String(text).split(' · ');
 const chips=tokens.map(token=>{
  const m=token.match(/^(위|촉|오|군웅)(\s*)(\d+)(.*)$/);
  if(!m)return `<span class="syn-tag${token==='없음'?' none':''}">${escape(token)}</span>`;
  const count=Number(m[3]),tier=count>=6?3:count>=4?2:count>=2?1:0;
  return `<span class="syn-chip" data-faction="${m[1]}" data-tier="${tier}"><i style="background-image:url('assets/ui-temp/faction-${factionIcons[m[1]]}.png')"></i>${escape(m[1])}${m[2]}<b>${m[3]}</b>${escape(m[4])}</span>`;
 }).join('<span class="syn-sep"> · </span>');
 // One inline flow inside the bar: the bar is a flex box, and separate flex items would break the text into lines.
 element.innerHTML='<span class="syn-flow"><span class="syn-label">세력 시너지 · </span>'+chips+'</span>';
}
