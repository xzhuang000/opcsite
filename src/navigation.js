export const TILE = 16, COLS = 60, ROWS = 38;
export const BUILDINGS = [
  {x:190,y:137,w:110,h:85}, {x:566,y:137,w:120,h:85},
  {x:210,y:341,w:112,h:79},
];
export function onIsland(x, y) {
  const dx = (x - 464) / 407, dy = (y - 337) / 224;
  return dx * dx + dy * dy < 1 && y > 123;
}
export function walkable(x, y) {
  if (!onIsland(x - 6, y) || !onIsland(x + 6, y) || !onIsland(x, y - 6) || !onIsland(x, y + 6)) return false;
  if (BUILDINGS.some(b => x > b.x - 8 && x < b.x + b.w + 8 && y > b.y - 6 && y < b.y + b.h + 7)) return false;
  // The pond and central hologram plinth are physical obstacles.
  if (x > 406 && x < 521 && y > 146 && y < 229) return false;
  if (x > 420 && x < 497 && y > 306 && y < 348) return false;
  // Only the rocket's base is solid. Its old building-sized hitbox covered
  // the visible path and grass on both sides of the launchpad.
  if (x > 658 && x < 702 && y > 390 && y < 422) return false;
  return true;
}
export function findPath(from, to) {
  const key = (x,y) => y * COLS + x;
  const point = n => ({x:(n%COLS)*TILE+TILE/2,y:Math.floor(n/COLS)*TILE+TILE/2});
  const startX = Math.floor(from.x/TILE), startY = Math.floor(from.y/TILE);
  let targetX = Math.floor(to.x/TILE), targetY = Math.floor(to.y/TILE);
  if (!walkable(targetX*TILE+8,targetY*TILE+8)) {
    let best = Infinity;
    for (let y=0;y<ROWS;y++) for (let x=0;x<COLS;x++) {
      const p = point(key(x,y)), d = (p.x-to.x)**2+(p.y-to.y)**2;
      if (d < best && walkable(p.x,p.y)) { best=d;targetX=x;targetY=y; }
    }
  }
  const start=key(startX,startY), goal=key(targetX,targetY), queue=[start], parents=new Map([[start,null]]);
  for (let i=0;i<queue.length;i++) {
    const n=queue[i]; if (n===goal) break;
    const x=n%COLS,y=Math.floor(n/COLS);
    for (const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
      const nx=x+dx,ny=y+dy,k=key(nx,ny),p=point(k);
      if (nx<0||nx>=COLS||ny<0||ny>=ROWS||parents.has(k)||!walkable(p.x,p.y)) continue;
      parents.set(k,n);queue.push(k);
    }
  }
  if (!parents.has(goal)) return [];
  const result=[];for(let n=goal;n!==start;n=parents.get(n)) result.unshift(point(n));
  return result;
}
