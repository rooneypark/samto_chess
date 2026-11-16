import {portraitIds} from './assets/portraits-v4/index.js';

// The approved artwork is the runtime default for every saved profile.
export const ART_KEY='samguk.artSet';
export const artSet='a';
const portraits=new Set(['0','1','2','15','16','32','33','34','35','77','119','infantry','archer','tactician','diaochan','raider','bow','shield','taoist','boss','bandit']);
const currentPortraits=new Set(portraitIds);
export const designPortrait=id=>currentPortraits.has(id)?`assets/portraits-v4/${id}.png`:artSet==='a'&&portraits.has(id)?`assets/design-a/portraits/${id}.png`:undefined;
export function setArtSet(value){localStorage.setItem(ART_KEY,value==='classic'?'classic':'a');}
if(globalThis.document)document.documentElement.dataset.art=artSet;
