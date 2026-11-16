import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameStore} from '../store.js';
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
test('unified save preserves formation and growth across reload',()=>{const disk=storage(),s=createGameStore(disk);s.update(v=>{v.order.reverse();v.gold-=20;v.heroes['15'].level++;return v;});assert.deepEqual(createGameStore(disk).get(),s.get());});
test('failed write leaves game state unchanged',()=>{const s=createGameStore({getItem:()=>null,setItem:()=>{throw Error('full')}});const before=s.get();assert.throws(()=>s.update({gold:0}));assert.deepEqual(s.get(),before);});
test('legacy formation migrates without overwriting it',()=>{const disk=storage();disk.setItem('samguk-chess-lobby-v1',JSON.stringify({order:['0','35','16','15','2','1'],reducedMotion:true}));const s=createGameStore(disk);assert.equal(s.get().order[0],'0');assert.equal(s.get().reducedMotion,true);});
