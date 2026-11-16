import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProgress,grow,statsFor,cardsNeeded} from '../progression.js';
const fresh=()=>loadProgress(['15','1'],{getItem:()=>null});
test('training charges current level once and preserves input',()=>{const s=fresh(),n=grow(s,'15','train');assert.equal(n.gold,12430);assert.equal(n.heroes['15'].level,2);assert.equal(s.gold,12450);assert.deepEqual(statsFor('15',n.heroes['15']),[978,103,30,20,1,1,80]);});
test('insufficient gold/cards and level cap reject growth',()=>{const s=fresh();s.gold=0;assert.throws(()=>grow(s,'15','train'),/골드/);s.gold=12450;assert.throws(()=>grow(s,'15','awaken'),/카드/);s.heroes['15'].level=20;assert.throws(()=>grow(s,'15','train'),/최대/);});
test('S awakening consumes six duplicates and 300 gold, applies HP passive',()=>{const s=fresh();s.heroes['1'].cards=6;const n=grow(s,'1','awaken');assert.equal(cardsNeeded('1',s.heroes['1']),6);assert.equal(n.gold,12150);assert.equal(n.heroes['1'].cards,0);assert.equal(n.heroes['1'].star,2);assert.equal(statsFor('1',n.heroes['1'])[0],1247);});
test('duplicate treasure ownership or corrupt saves reset safely',()=>{const s=fresh();s.heroes['15'].treasure='iron';s.heroes['1'].treasure='iron';assert.deepEqual(loadProgress(['15','1'],{getItem:()=>JSON.stringify(s)}),fresh());assert.deepEqual(loadProgress(['15','1'],{getItem:()=>'{bad'}),fresh());});
