import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,loadState,advance,circuitReady} from '../src/state.js';
import {findPath,walkable} from '../src/navigation.js';
test('the quest cannot skip stages or build a disconnected circuit',()=>{
  const s=freshState();assert.equal(advance(s,3),false);assert.equal(advance(s,0),true);assert.equal(advance(s,1),true);
  assert.equal(advance(s,2),false);s.circuit=[0,2,0];assert.equal(circuitReady(s.circuit),true);assert.equal(advance(s,2),true);
  assert.equal(advance(s,3),true);assert.equal(s.launched,true);assert.equal(advance(s,3),false);
});
test('corrupt saves are normalized instead of breaking the game',()=>{
  assert.deepEqual(loadState({getItem:()=>'{broken'}),freshState());
  const s=loadState({getItem:()=>JSON.stringify({version:2,stage:9,minutes:-4,color:'bad',circuit:['x'],sparks:[2,2,8,'0']})});
  assert.equal(s.stage,0);assert.equal(s.minutes,25);assert.equal(s.color,'lime');assert.deepEqual(s.sparks,[2]);assert.deepEqual(s.circuit,[1,0,3]);
});
test('click-to-walk reaches every agent without crossing obstacles',()=>{
  for(const target of [{x:244,y:244},{x:626,y:244},{x:268,y:442},{x:680,y:442}]){
    const path=findPath({x:456,y:392},target);assert.ok(path.length>0);assert.ok(path.every(p=>walkable(p.x,p.y)));
    const end=path.at(-1);assert.ok(Math.hypot(end.x-target.x,end.y-target.y)<16);
  }
});
test('clicks outside the island resolve to reachable ground',()=>{
  const path=findPath({x:456,y:392},{x:0,y:0});assert.ok(path.length);assert.ok(path.every(p=>walkable(p.x,p.y)));
});
test('rocket approach stays open on visible road and grass',()=>{
  for(const point of [{x:648,y:340},{x:648,y:380},{x:648,y:410},{x:712,y:380}]){
    assert.equal(walkable(point.x,point.y),true,`visible ground at ${point.x},${point.y} should be walkable`);
  }
  assert.equal(walkable(680,405),false,'rocket base should remain solid');
  const path=findPath({x:648,y:340},{x:680,y:442});
  assert.ok(path.length>0);
  assert.ok(path.every(point=>walkable(point.x,point.y)));
});
