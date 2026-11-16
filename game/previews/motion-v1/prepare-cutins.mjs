import {heroes} from '../../heroes.js';
import {specs} from '../../progression.js';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('art-source/critical-cutins/v1');fs.mkdirSync(root,{recursive:true});
const poses={
'1':'Guan Yu grips his guandao across his torso, focused before a decisive cleave.',
'2':'Zhang Fei braces his distinctive wavy snake spear across his broad torso, fierce brows, ready to thrust.',
'15':'Zhao Yun leans forward with his silver spear angled into a precise thrust, white plume trailing.',
'16':'Huang Zhong draws his bow with one nocked arrow, seasoned white-bearded archer aiming intensely.',
'35':'Zhuge Liang sweeps his white feather fan forward with a composed gaze, two tiny pale jade tactical sparks.',
'0':'Liu Bei raises his paired swords in a controlled crossed guard before striking, benevolent but determined.',
'32':'Cao Cao draws his sword diagonally before him, red cloak sweeping slightly, a commanding confident gaze.',
'33':'Xiahou Dun, preserve his reference eye covering, braces his polearm for a forceful blow.',
'34':'Zhang Liao grips his curved blade polearm with both hands and winds up for an incisive diagonal sweep.',
'77':'Zhou Yu directs his sword forward with a restrained small warm ember glint, elegant controlled fire command.',
'119':'Lu Bu holds his double-sided halberd across the body in a powerful wind-up, red helmet plumes flowing.',
'infantry':'The volunteer infantryman raises the reference shield and draws back his spear, determined guarded strike.',
'archer':'The volunteer archer draws a single arrow to his cheek on the reference bow, eyes fixed on target.',
'tactician':'The camp adviser opens a small medical scroll in one hand and gestures with the other, a tiny pale green healing glint, no writing.',
'simayi':'Sima Yi brings his feather fan up and points forward, calculating gaze and one small angular lavender spark.',
'dianwei':'Dian Wei winds back his twin short halberds, hulking shoulders and fierce concentrated gaze.',
'guojia':'Guo Jia flicks his feather fan across his chest with a knowing expression, one tiny blue-white tactical glint.',
'xuchu':'Xu Chu draws back his heavy spiked mace in both hands, massive shoulders, clearly preparing a crushing blow.',
'xiahouyuan':'Xiahou Yuan draws his reference bow rapidly with one arrow nocked, focused forward lean.',
'xuhuang':'Xu Huang braces his large crescent battle axe across the chest, both hands on shaft, poised to cleave.',
'xunyu':'Xun Yu presents a small rolled strategy scroll and directs with his free hand, calm precise gesture, one restrained jade glint.',
'yuejin':'Yue Jin lifts his short sword above his shoulder and leans forward for an eager first strike.',
'caohong':'Cao Hong pushes his decorated shield forward with his spear held ready, resolute defensive counterstrike.',
'machao':'Ma Chao levels his spear with a swift forward lean, white helmet plume and green mantle flowing.',
'pangtong':'Pang Tong brings his crooked staff forward, eyes sharp beneath his distinctive cap, two small jade sparks.',
'jiangwei':'Jiang Wei grips his spear across his torso with a balanced precise stance, youthful determined face.',
'weiyan':'Wei Yan winds up his broad curved blade polearm, preserve his reference mask and armor, forceful torso twist.',
'liaohua':'Liao Hua draws his sword across his chest, veteran determined expression and steady guarded stance.',
'zhoucang':'Zhou Cang raises his broad dao in one hand, the other fist forward, strong compact vigilant posture.',
'sunce':'Sun Ce pulls back his reference twin short halberds with confident fierce eyes, red ribbon flicking.',
'luxun':'Lu Xun lifts his reference torch forward in a controlled command gesture, compact angular flame, no large fire cloud.',
'sunquan':'Sun Quan extends his sword diagonally in a firm commanding gesture, preserve his regal red and gold clothing.',
'ganning':'Gan Ning winds his curved blade to the side, confident grin, bells and red headband retained.',
'taishici':'Taishi Ci draws a bow with one arrow, robust shoulders, red ribbons trailing, determined aim.',
'lumeng':'Lu Meng levels his reference spear, a calm tactical gaze and disciplined forward stance.',
'huanggai':'Huang Gai draws back the reference iron whip/chain, white beard and bare muscular shoulders retained, full chain silhouette inside canvas.',
'lusu':'Lu Su extends his strategy scroll in a decisive open hand gesture, composed face, one restrained warm jade glint.',
'sunshangxiang':'Sun Shangxiang draws her bow with one nocked arrow, confident focused gaze, red hair ribbon and red/gold outfit retained.',
'dingfeng':'Ding Feng winds his broad saber across the torso, red scarf moving slightly, determined expression.',
'panzhang':'Pan Zhang readies a short sword and a compact coiled capture rope in his other hand, cunning intense gaze.',
'zhangjue':'Zhang Jue raises his crooked staff with one hand and casts with two fingers, yellow robes retained, one small sharp golden spark.',
'dongzhuo':'Dong Zhuo winds his heavy curved saber, broad heavy torso and purple/gold armor retained, fierce scowl.',
'yuanshao':'Yuan Shao raises his reference spear with an imperious commanding posture, ornate gold armor and purple accents.',
'huatuo':'Hua Tuo raises a slender acupuncture needle with a gentle focused gaze and open other hand, green medicine pouch visible, tiny green healing glint.',
'yanliang':'Yan Liang braces his curved blade polearm for a powerful sweep, purple/gold armor and plume retained.',
'wenchou':'Wen Chou levels his spear for a driving thrust, powerful shoulders, purple headband and gold armor retained.',
'diaochan':'Diao Chan sweeps her pink silk sleeve and open fan in a graceful precise casting gesture, hair ornaments retained, two small petal-shaped accents only.',
'huaxiong':'Hua Xiong raises his broad curved blade polearm across the torso, thick beard and purple fur-trimmed armor retained.',
'gongsunzan':'Gongsun Zan brings his spear forward into a decisive thrust, white plume and white/gold armor retained.'};
const base=`Use case: stylized-concept. Create ONE new transparent animation-ready critical/skill cut-in illustration. Image 1 is the character's identity reference: strictly retain face, hairstyle, headgear, colors, clothing, armor, weapon silhouette, beard, body build and gender. Image 2 is the APPROVED STYLE AND COMPOSITION reference only, depicting Guan Yu: do NOT copy Guan Yu's identity or his weapon for this different character. Match its simple chunky chibi pixel art, stepped dark navy outlines, crisp square clusters, flat limited shading and compact horizontal silhouette. Draw a NEW dynamic three-quarter waist-up preparation pose, clear expressive eyes and visible gripping hands, readable immediately without text. Entire weapon, hands, ornaments and effects must be contained with at least 5% transparent margin on ALL four sides. A composed waist-up cut-in with a natural angular lower robe silhouette, not a rectangular crop. No horse or mount. Transparent RGBA background, no text or letters anywhere, no panel, no frame, no labels, no UI, no gradients, no scenic background, no photorealism, no smooth anime, no giant aura or dragon. Use at most 1-2 small sharp pixel glints, no particle cloud. A single cohesive image, not a sprite sheet or multiple poses. Preserve weapon design from Image 1; don't add weapons that do not fit the character. `;
const file=path.join(root,'manifest.json');
if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify({version:1,status:'in-production',purpose:'one transparent critical/skill preparation cut-in per roster entry; not combat animation frames',approvedStyle:'game/previews/motion-v1/assets/guan-skill-cutin-v2.png',generator:'built-in image_gen',entries:heroes.map(h=>({id:h.id,name:h.name,faction:h.faction,skill:specs[h.id]?.skill,reference:`art-source/characters/v1/${h.id}/front.png`,file:`${h.id}/critical.png`,status:h.id==='1'?'approved-style':'pending',prompt:base+'Character: '+h.name+'. Pose: '+poses[h.id]}))},null,2)+'\n');
// Final cut-ins live as lossless WEBP in game/assets/skill-cutins; no PNG copy is made here.
console.log(file);
