// Original game-native art. Textures are painted once; Phaser moves and animates
// individual sprites, particles, characters, water, and the launch vehicle.
export function createArt(scene) {
  const make = (key, w, h, paint) => {
    const texture = scene.textures.createCanvas(key, w, h);
    const c = texture.context;
    c.imageSmoothingEnabled = false;
    const rect = (x,y,w,h,color) => {c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
    paint(c,rect);texture.refresh();return texture;
  };
  let seed=7507;
  const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  make('terrain',960,608,(c,r)=>{
    // Stepped cliff silhouettes, minerals and a continuous grass surface.
    for(let x=64;x<876;x+=8){
      const d=(x-464)/407, half=224*Math.sqrt(Math.max(0,1-d*d));
      const top=Math.max(128,Math.round((337-half)/8)*8), bottom=Math.round((337+half)/8)*8;
      const drop=36+Math.floor(random()*5)*8;
      r(x,top+14,8,bottom-top+drop,'#292b43');
      r(x,bottom+12,8,drop-8,random()>.55?'#37374f':'#303149');
      if(random()>.65)r(x,bottom+16,4,16,'#464355');
      r(x,top,8,bottom-top,'#465c4c');
      r(x,bottom-8,8,8,'#839365');r(x,bottom,8,6,'#334c41');
      if(random()>.58)r(x,bottom+6,4,12+Math.floor(random()*20),'#4e6751');
    }
    for(let i=0;i<8200;i++){
      const x=Math.floor(random()*220)*4+40,y=Math.floor(random()*112)*4+120;
      if(((x-464)/402)**2+((y-337)/215)**2>1)continue;
      r(x,y,random()>.8?4:2,2,['#536950','#536950','#5b7053','#3b5649','#667854'][Math.floor(random()*5)]);
    }
    const path=(x,y,w,h)=>{
      r(x-4,y-4,w+8,h+8,'#3b5143');r(x,y,w,h,'#92876b');
      for(let ty=y;ty<y+h;ty+=8)for(let tx=x;tx<x+w;tx+=8){
        if(random()>.55)r(tx+1,ty+2,5,2,random()>.5?'#a89c7a':'#7d795f');
      }
    };
    path(226,236,430,32);path(438,248,32,234);path(248,422,450,32);
    path(230,242,30,196);path(634,246,30,192);path(454,361,80,30);
    path(434,478,50,52); // Arrival pier.
    r(430,494,58,46,'#4a393e');for(let y=497;y<539;y+=8){r(428,y,62,5,'#9d7d63');r(434,y,5,5,'#c49f7d');}
    r(426,491,5,48,'#332d36');r(487,491,5,48,'#332d36');
    // Observatory pond with a pixel-cut shoreline.
    r(404,156,120,66,'#344e46');r(412,150,102,80,'#6e8363');
    r(418,158,90,66,'#346c73');r(410,172,108,38,'#346c73');
    r(426,165,75,55,'#40878a');r(418,179,92,30,'#40878a');
    for(let i=0;i<30;i++)r(420+Math.floor(random()*21)*4,166+Math.floor(random()*12)*4,8,2,'#5b9a95');
    r(429,196,12,4,'#87a264');r(435,192,8,7,'#92ad70');r(485,181,10,5,'#86a36d');
    // Central computer plinth.
    r(420,310,78,38,'#2b303c');r(416,313,86,22,'#5b6570');r(424,307,70,24,'#8e98a0');
    r(432,304,54,18,'#434957');r(440,308,38,9,'#252d39');r(422,337,73,5,'#212632');
    // Forest floor details and flowers away from the main paths.
    for(let i=0;i<270;i++){
      const x=Math.floor(random()*190)*4+84,y=Math.floor(random()*100)*4+140;
      if(((x-464)/385)**2+((y-337)/200)**2>1)continue;
      if((x>215&&x<702&&y>228&&y<273)||(x>237&&x<710&&y>412&&y<462)||(x>428&&x<480))continue;
      const green=random()>.3;r(x,y,2,5,'#8b9d64');r(x-2,y,6,2,green?'#aab571':'#c6a4d5');
      if(!green)r(x,y-2,2,6,'#ddd0bf');
    }
    // Low fences, stepping stones and crates.
    for(const [x,y] of [[153,304],[751,323],[338,502]]){
      r(x,y+8,48,4,'#b39269');r(x,y+17,48,3,'#735e4d');
      for(let j=0;j<4;j++){r(x+j*16,y,4,28,'#685445');r(x+j*16,y,4,3,'#d0b38a');}
    }
    for(const [x,y] of [[327,199],[333,386],[597,390],[710,277]]){
      r(x,y,17,15,'#4b3c37');r(x+1,y+1,14,10,'#a0845d');r(x+3,y+2,2,11,'#c6a377');r(x+11,y+2,2,11,'#6c5542');
    }
  });
  make('tree',64,84,(c,r)=>{
    r(19,70,39,9,'#253e3a');r(29,51,10,29,'#675344');r(31,52,4,25,'#957452');
    const tier=(x,y,w,h)=>{r(x+6,y,w-12,h,'#213f3b');r(x,y+6,w,h-12,'#213f3b');r(x+5,y+5,w-10,h-11,'#345a47');r(x+10,y+3,w-18,8,'#5b7b55');r(x+5,y+11,9,9,'#49714e');};
    tier(5,33,55,36);tier(9,18,47,35);tier(17,3,32,30);r(26,1,14,6,'#729362');
    r(18,42,4,3,'#7c9461');r(40,26,4,3,'#7c9461');r(33,54,6,3,'#5c7c54');
  });
  make('rock',30,22,(c,r)=>{r(2,12,27,8,'#30453d');r(5,6,20,12,'#5c6b69');r(9,2,12,14,'#89928b');r(8,5,12,4,'#b1b39b');r(21,11,5,5,'#414f53');});
  for(const [name,accent,shade] of [['z-peak','#c0a4e8','#76628e'],['z-current','#c2db8e','#768a5a'],['z-timber','#e1a879','#936749']]){
    make(`house-${name}`,144,126,(c,r)=>{
      r(11,111,128,12,'#283e39');r(20,48,110,69,'#282936');r(24,52,102,57,'#676475');
      r(28,55,94,50,'#99938b');r(96,53,28,56,'#77777b');r(26,96,98,10,'#555466');
      for(let y=58;y<94;y+=14)r(28,y,65,2,'#77747c');
      // Large, individually stepped roof and lit eaves.
      r(8,42,128,16,'#272c38');r(16,32,112,18,'#484453');r(24,22,96,17,'#666078');r(32,15,80,15,'#7f7392');
      r(32,16,80,4,accent);r(24,25,95,3,shade);r(17,36,110,3,shade);r(10,47,124,4,accent);
      for(let x=32;x<119;x+=17)r(x,22,3,23,'#524b60');
      // Door and screens.
      r(63,68,23,43,'#282c37');r(67,71,15,32,shade);r(70,72,9,27,accent);r(77,89,3,3,'#fff0c2');
      r(33,65,23,24,'#353842');r(36,68,17,16,accent);r(43,68,2,16,'#7b786c');r(36,75,17,2,'#7b786c');
      r(98,65,21,24,'#353842');r(101,68,15,15,accent);r(108,68,2,15,'#7b786c');
      r(60,109,30,6,'#b0a28a');r(57,115,36,5,'#777775');
      r(20,94,7,19,'#443e46');r(125,94,7,19,'#443e46');
      if(name==='z-peak'){
        r(37,0,3,25,'#c5b9b3');r(32,0,13,3,accent);r(30,6,18,3,'#746979');
        r(97,8,15,16,'#2f3542');r(94,3,21,13,'#b9b5b0');r(97,3,12,7,'#e0dac7');r(106,11,10,3,'#756c8d');
      }
      if(name==='z-current'){
        r(98,15,19,16,'#50664f');r(101,12,7,6,'#b5c983');r(108,9,6,13,'#89a469');
        r(91,94,30,16,'#5c6655');r(95,93,6,6,'#bdd693');r(106,89,4,12,'#c0a4e8');r(116,93,3,6,'#b5c983');
      }
      if(name==='z-timber'){
        r(104,0,14,37,'#444556');r(106,1,10,34,'#82828e');r(102,0,18,6,'#aaa79c');
        r(6,76,20,30,'#333947');r(8,79,14,20,'#737279');r(12,82,6,5,accent);r(12,92,6,3,accent);
      }
    });
  }
  make('launchpad',134,92,(c,r)=>{
    r(9,50,120,35,'#29363c');r(3,40,128,30,'#5e6868');r(13,30,108,40,'#929389');r(20,26,94,43,'#b4b19b');
    r(27,32,80,31,'#555969');r(32,36,71,23,'#76717c');
    for(let x=18;x<115;x+=16){r(x,70,8,4,'#e3c586');r(x,78,8,3,'#777463');}
    r(96,3,6,46,'#4e5261');r(97,2,4,10,'#c5bbac');r(88,0,21,4,'#c9aeff');
  });
  make('rocket',42,82,(c,r)=>{
    r(17,1,8,7,'#eee3cb');r(12,8,18,12,'#ddd7be');r(8,20,26,41,'#bbbeb4');r(11,19,19,40,'#e5e2ca');
    r(11,21,5,30,'#fbf2d6');r(27,23,5,32,'#9999a4');r(14,29,15,16,'#7b678d');r(17,31,9,10,'#a4d5d0');r(17,31,4,4,'#e1f2d9');
    r(4,49,9,19,'#877093');r(0,58,9,14,'#b4a0c4');r(30,49,8,19,'#877093');r(34,58,8,14,'#b4a0c4');
    r(12,59,19,9,'#665969');r(14,68,15,7,'#393745');r(18,68,6,8,'#9b8b88');
  });
  make('spark',14,18,(c,r)=>{r(5,0,4,3,'#efffc6');r(3,3,8,4,'#d7ff70');r(0,7,14,4,'#b7dc71');r(3,11,8,4,'#91b964');r(5,15,4,3,'#759d63');r(5,4,2,7,'#f4ffb5');});
  for(const [name,color,shade] of [['human','#e3dfcb','#aca898'],['z-peak','#c9aeff','#81739f'],['z-current','#d7e59e','#8e9e68'],['z-timber','#ffc28c','#b77c57'],['z-lens','#a7d6da','#6b939f']]){
    for(let direction=0;direction<4;direction++)for(let frame=0;frame<4;frame++){
      make(`${name}-${direction}-${frame}`,24,32,(c,r)=>{
        const bob=frame%2,step=frame===1?2:frame===3?-2:0;
        r(4,27,17,4,'#243b37');r(7,22,4,7+step,shade);r(15,22,4,7-step,shade);
        r(6,28+Math.min(0,step),6,3,'#292b39');r(14,28-Math.max(0,step),6,3,'#292b39');
        r(6,13+bob,14,11,shade);r(8,14+bob,10,8,color);
        r(3,15+bob+step,4,8,color);r(20,15+bob-step,3,8,shade);
        r(4,2+bob,17,14,'#302c3e');r(6,bob,13,18,'#302c3e');r(5,3+bob,15,11,color);r(8,1+bob,9,14,color);
        if(direction===3){r(8,5+bob,10,7,shade);r(9,6+bob,8,4,color);}
        else{
          const fx=direction===1?5:direction===2?10:7;r(fx,5+bob,11,7,'#353441');r(fx+2,7+bob,2,2,'#f7f0bf');r(fx+7,7+bob,2,2,'#f7f0bf');
        }
        if(name==='human'){r(7,bob,12,3,'#c4a6dc');r(9,17+bob,8,2,'#a38aba');}
        else{r(11,-1+bob,2,3,shade);r(10,0,4,2,color);}
      });
    }
  }
  make('cloud',100,36,(c,r)=>{r(16,11,68,21,'#353047');r(30,0,31,32,'#353047');r(5,20,92,11,'#353047');r(23,8,53,21,'#41394f');r(36,2,22,24,'#41394f');r(12,24,70,6,'#493e55');});
  make('mini-island',130,90,(c,r)=>{r(18,23,95,20,'#373349');r(28,43,76,16,'#343047');r(38,59,55,15,'#2c2a40');r(55,74,23,13,'#2b293d');r(13,20,105,9,'#596654');r(24,14,86,7,'#67765b');r(46,8,4,12,'#8e92a7');r(44,5,8,5,'#c2b195');});
}
