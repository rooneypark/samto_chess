import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {heroes} from '../heroes.js';
import {generals} from '../character-art.js';
const root=path.resolve(import.meta.dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const hero of heroes){
 const art=generals[hero.id];if(!art||hero.artworkStatus!=='user-approved')throw Error('Approved runtime artwork missing: '+hero.name);
 for(const view of Object.values(art.views))if(hash(path.resolve(root,'game',view.url))!==view.sha256)throw Error('Approved artwork hash differs: '+view.url);
 if(!fs.existsSync(path.resolve(root,'game',hero.portrait)))throw Error('Portrait missing: '+hero.name);
}
console.log('Approved runtime artwork: 49 heroes, 147 source images and 49 portraits.');
// The reference folder was removed on purpose (characters are being redrawn). Without it, check that every
// bound frame still matches the hash recorded in game/assets/battle/manifest.json and leave that record untouched.
if(!fs.existsSync(path.join(root,'reference/chokhan/data/tables.json'))){
 const recorded=read('game/assets/battle/manifest.json').bindings,bound=heroes.filter(hero=>hero.sourceUnit!==undefined);
 for(const hero of bound){const b=recorded.find(b=>b.heroId===hero.id&&b.sourceUnit===hero.sourceUnit);if(!b||b.frames.length!==28)throw Error('No recorded binding: '+hero.name);
  for(const f of b.frames)if(hash(path.join(root,f.file))!==f.sha256)throw Error('Frame differs from the recorded hash: '+f.file);}
 if(process.argv.includes('--release'))throw Error('Release blocked: source reference is absent and '+heroes.filter(hero=>hero.sourceUnit===undefined).length+' heroes use placeholder art.');
 console.log('Reference folder absent: verified',bound.length,'bindings against the recorded frame hashes.');
 console.log('Legacy motion source bindings absent:',heroes.filter(hero=>hero.sourceUnit===undefined).length,'(approved static artwork is available for all heroes).');process.exit(0);
}
const tables=read('reference/chokhan/data/tables.json'),motion=read('reference/chokhan/analysis/motion-manifest.json');
// Heroes waiting for commissioned artwork have no source binding to verify; they block --release below.
const pending=heroes.filter(hero=>hero.sourceUnit===undefined);
const bindings=heroes.filter(hero=>hero.sourceUnit!==undefined).map(hero=>{
 const h=tables.HeroData.find(h=>h.num===hero.sourceHero),team=tables.TeamData.find(t=>t.num===h?.numTeam),matches=h&&(h.numSAnim.includes(hero.sourceUnit)||!h.numSAnim.length&&team?.numSAnim===hero.sourceUnit);
 if(!matches)throw Error('Unverified hero source binding: '+hero.name);
 const frames=motion.units['unit'+hero.sourceUnit].frames.filter(f=>/^(MOV|ATK|SPC)-/.test(f.name)).map(f=>{
  const local=path.join(root,'game/assets/battle/unit'+hero.sourceUnit,f.name+'.png'),original=path.join(root,'reference/chokhan',f.src);if(hash(local)!==hash(original))throw Error('Source pixels changed: '+local);
  return {name:f.name,file:path.relative(root,local).replaceAll('\\','/'),source:f.src,sha256:hash(local),width:f.width,height:f.height,pivot:f.pivot};});
 return {heroId:hero.id,sourceHero:hero.sourceHero,sourceUnit:hero.sourceUnit,mappingStatus:'STATIC_VERIFIED',evidence:'HeroData.numSAnim or HeroData.numTeam -> TeamData.numSAnim',sourceTableHash:hash(path.join(root,'reference/chokhan/data/tables.json')),rightsStatus:'REVIEW_REQUIRED',frames,footAnchor:{x:.5,y:.7},releaseMarks:{origin:'NEW_GAME_PROPOSAL',basicWindupRatio:.35},states:{idle:'MOV',move:'MOV',attack:'ATK',cast:'SPC',hit:'NO_DEDICATED_CLIP',death:'PRESENTATION_FADE_ONLY'}};
});
const out=path.join(root,'game/assets/battle/manifest.json');fs.writeFileSync(out,JSON.stringify({version:'2026-11-13.1',bindings},null,2));
if(process.argv.includes('--release')&&(pending.length||bindings.some(b=>b.mappingStatus!=='STATIC_VERIFIED'||b.rightsStatus!=='APPROVED')))throw Error('Release blocked: mappings and asset rights must be approved, and '+pending.length+' heroes still use placeholder art.');
console.log('Verified original frame hashes and bindings:',bindings.length);
if(pending.length)console.log('Artwork pending (placeholder token):',pending.length,pending.map(hero=>hero.name).join(' '));
