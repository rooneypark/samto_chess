export const heroes = [
  {
    "id": "1",
    "name": "관우",
    "role": "전열 공격",
    "portrait": "assets/portraits-v4/1.png",
    "sourceUnit": 142,
    "sourceHero": 1,
    "sourcePose": "MOV-7",
    "faction": "촉"
  },
  {
    "id": "2",
    "name": "장비",
    "role": "방어",
    "portrait": "assets/portraits-v4/2.png",
    "sourceUnit": 145,
    "sourceHero": 2,
    "sourcePose": "MOV-7",
    "faction": "촉"
  },
  {
    "id": "15",
    "name": "조운",
    "role": "기동 전사",
    "portrait": "assets/portraits-v4/15.png",
    "sourceUnit": 148,
    "sourceHero": 15,
    "sourcePose": "MOV-7",
    "faction": "촉"
  },
  {
    "id": "16",
    "name": "황충",
    "role": "궁수",
    "portrait": "assets/portraits-v4/16.png",
    "sourceUnit": 209,
    "sourceHero": 16,
    "sourcePose": "MOV-7",
    "faction": "촉"
  },
  {
    "id": "35",
    "name": "제갈량",
    "role": "책사",
    "portrait": "assets/portraits-v4/35.png",
    "sourceUnit": 215,
    "sourceHero": 35,
    "sourcePose": "MOV-7",
    "faction": "촉"
  },
  {
    "id": "0",
    "name": "유비",
    "role": "지원",
    "portrait": "assets/portraits-v4/0.png",
    "sourceUnit": 139,
    "sourceHero": 0,
    "sourcePose": "MOV-7",
    "faction": "촉"
  },
  {
    "id": "32",
    "name": "조조",
    "role": "지휘",
    "faction": "위",
    "portrait": "assets/portraits-v4/32.png",
    "sourceHero": 32,
    "sourceUnit": 154,
    "sourcePose": "MOV-7",
    "bindingEvidence": "HeroData.numSAnim[0]",
    "mappingStatus": "STATIC_VERIFIED"
  },
  {
    "id": "33",
    "name": "하후돈",
    "role": "반격",
    "faction": "위",
    "portrait": "assets/portraits-v4/33.png",
    "sourceHero": 33,
    "sourceUnit": 244,
    "sourcePose": "MOV-7",
    "bindingEvidence": "HeroData.numSAnim[0]",
    "mappingStatus": "STATIC_VERIFIED"
  },
  {
    "id": "34",
    "name": "장료",
    "role": "기동",
    "faction": "위",
    "portrait": "assets/portraits-v4/34.png",
    "sourceHero": 34,
    "sourceUnit": 158,
    "sourcePose": "MOV-7",
    "bindingEvidence": "HeroData.numSAnim[0]",
    "mappingStatus": "STATIC_VERIFIED"
  },
  {
    "id": "77",
    "name": "주유",
    "role": "화공",
    "faction": "오",
    "portrait": "assets/portraits-v4/77.png",
    "sourceHero": 77,
    "sourceUnit": 176,
    "sourcePose": "MOV-7",
    "bindingEvidence": "HeroData.numSAnim[0]",
    "mappingStatus": "STATIC_VERIFIED"
  },
  {
    "id": "119",
    "name": "여포",
    "role": "광전사",
    "faction": "군웅",
    "portrait": "assets/portraits-v4/119.png",
    "sourceHero": 119,
    "sourceUnit": 163,
    "sourcePose": "MOV-7",
    "bindingEvidence": "HeroData.numSAnim[0]",
    "mappingStatus": "STATIC_VERIFIED"
  },
  {
    "id": "infantry",
    "name": "의용보병",
    "role": "근접",
    "faction": "군웅",
    "portrait": "assets/portraits-v4/infantry.png",
    "sourceHero": 210,
    "sourceUnit": 0,
    "sourcePose": "MOV-7",
    "bindingEvidence": "HeroData.numTeam -> TeamData.numSAnim",
    "mappingStatus": "STATIC_VERIFIED"
  },
  {
    "id": "archer",
    "name": "의용궁병",
    "role": "원거리",
    "faction": "군웅",
    "portrait": "assets/portraits-v4/archer.png",
    "sourceHero": 234,
    "sourceUnit": 18,
    "sourcePose": "MOV-7",
    "bindingEvidence": "HeroData.numTeam -> TeamData.numSAnim",
    "mappingStatus": "STATIC_VERIFIED"
  },
  {
    "id": "tactician",
    "name": "군영참모",
    "role": "지원",
    "faction": "군웅",
    "portrait": "assets/portraits-v4/tactician.png",
    "sourceHero": 334,
    "sourceUnit": 63,
    "sourcePose": "MOV-7",
    "bindingEvidence": "HeroData.numTeam -> TeamData.numSAnim",
    "mappingStatus": "STATIC_VERIFIED"
  }
];

// Additional roster entries share the same approved artwork resolver below.
import {extraHeroes} from './roster-data.js';
heroes.push(...extraHeroes.map(hero=>({...hero})));
import {designPortrait} from './art.js';
import {characterSource} from './character-art.js';
for(const hero of heroes){const portrait=designPortrait(hero.id);if(portrait)hero.portrait=portrait;const source=characterSource(hero.id);if(source){hero.sprite=source;hero.artworkStatus='user-approved';hero.art='approved';}}
