import Phaser from '../vendor/phaser.esm.min.js';
import {createArt} from './pixel-art.js';
import {STATIONS} from './state.js';
import {findPath,walkable} from './navigation.js';

const SPARKS = [{x:350,y:253},{x:550,y:253},{x:245,y:321},{x:649,y:321},{x:367,y:440},{x:551,y:440}];

class Outpost extends Phaser.Scene {
  constructor(api) { super('outpost');this.api=api;this.route=[];this.pending=null;this.paused=false;this.zoomed=false;this.touch={}; }
  create() {
    createArt(this);
    const sky=this.add.graphics().setDepth(-20);
    sky.fillStyle(0x1b1b2b);sky.fillRect(-1500,-1500,4000,4000);
    let seed=37;
    const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
    for(let i=0;i<170;i++){
      const x=random()*1060-50,y=random()*760-70,s=random()>.94?3:1;
      const star=this.add.rectangle(x,y,s,s,[0x898198,0xcabbd9,0x5f5a74][i%3]).setDepth(-15).setAlpha(.2+random()*.6);
      if(i%9===0)this.tweens.add({targets:star,alpha:.12,duration:1600+random()*2200,yoyo:true,repeat:-1});
    }
    this.add.image(69,155,'mini-island').setScale(.65).setAlpha(.38).setDepth(-10);
    this.add.image(873,195,'mini-island').setScale(.7).setAlpha(.4).setDepth(-10);
    this.add.image(790,590,'mini-island').setScale(.5).setAlpha(.35).setDepth(-10);
    for(const [x,y,s] of [[120,505,1.4],[750,107,1.2],[100,320,.7],[888,482,1.1],[430,585,1.4]]){
      const cloud=this.add.image(x,y,'cloud').setScale(s).setAlpha(.42).setDepth(-5);
      this.tweens.add({targets:cloud,x:x+28,duration:14000+s*3000,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    }
    // A faceted pixel moon, not a background image.
    const moon=this.add.graphics().setDepth(-12);moon.fillStyle(0x514660);
    for(let y=-25;y<=25;y+=5){const w=Math.floor(Math.sqrt(625-y*y)/5)*5;moon.fillRect(829-w,58+y,w*2,5);}
    moon.fillStyle(0x77637f);moon.fillRect(821,39,20,6);moon.fillRect(834,46,14,13);moon.fillRect(816,66,13,7);
    this.add.image(0,0,'terrain').setOrigin(0).setDepth(0);
    for(const [x,y,s] of [[137,259,1],[142,355,.9],[180,454,1.1],[342,155,.8],[365,194,.6],[559,161,.8],[760,238,1],[794,310,.85],[772,399,.9],[745,496,.85],[600,520,.75],[368,523,.85],[201,189,.65],[131,405,.65]]) {
      this.add.image(x,y,'tree').setOrigin(.5,1).setScale(s).setDepth(y);
    }
    for(const [x,y] of [[190,277],[345,320],[580,304],[740,293],[194,483],[583,490],[380,474],[768,463]])this.add.image(x,y,'rock').setOrigin(.5,1).setDepth(y);
    this.add.image(172,99,'house-z-peak').setOrigin(0).setDepth(220);
    this.add.image(554,99,'house-z-current').setOrigin(0).setDepth(220);
    this.add.image(196,297,'house-z-timber').setOrigin(0).setDepth(418);
    this.add.image(615,348,'launchpad').setOrigin(0).setDepth(412);
    this.rocket=this.add.image(680,415,'rocket').setOrigin(.5,1).setDepth(416).setInteractive({useHandCursor:true});
    this.rocket.on('pointerdown',(pointer,lx,ly,event)=>{event.stopPropagation();this.goToStation(3);});
    // Active terminal lights, water and chimney puffs are separate objects.
    for(let i=0;i<7;i++){
      const ripple=this.add.rectangle(425+i*12,177+(i%3)*12,9,2,0x9cd1be,.55).setDepth(5);
      this.tweens.add({targets:ripple,x:ripple.x+7,alpha:.08,duration:1200+i*200,yoyo:true,repeat:-1});
    }
    this.time.addEvent({delay:1300,loop:true,callback:()=>{
      if(this.paused||this.api.reducedMotion)return;
      const puff=this.add.rectangle(307,296,7,7,0xa298b0,.35).setDepth(300);
      this.tweens.add({targets:puff,y:260,x:316,alpha:0,scale:2,duration:2700,onComplete:()=>puff.destroy()});
    }});
    this.hologram=this.add.text(460,293,'Z',{fontFamily:'Pixel',fontSize:'34px',color:'#d7ff70'}).setOrigin(.5,1).setDepth(310).setAlpha(.85);
    this.tweens.add({targets:this.hologram,y:285,alpha:.5,duration:2000,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    this.agents=[];this.stationLabels=[];
    STATIONS.forEach((station,i)=>{
      const npc=this.add.sprite(station.x+27,station.y+3,`${station.id}-0-0`).setOrigin(.5,1).setDepth(station.y+3);
      this.agents.push(npc);
      const label=this.add.text(station.x,station.y+33,`${station.number}  ${station.name.toUpperCase()}`,{fontFamily:'Pixel',fontSize:'10px',color:'#e0d8c9',backgroundColor:'#262634',padding:{x:7,y:5}}).setOrigin(.5).setDepth(900).setInteractive({useHandCursor:true});
      label.on('pointerdown',(pointer,lx,ly,event)=>{event.stopPropagation();this.goToStation(i);});
      label.on('pointerover',()=>label.setColor('#d7ff70'));label.on('pointerout',()=>this.refreshProgress());
      this.stationLabels.push(label);
      // Keep interaction targets on visible objects so nearby ground remains
      // available for click-to-walk, especially beside the rocket.
      const npcZone=this.add.zone(station.x+27,station.y-13,32,36).setDepth(800).setInteractive({useHandCursor:true});
      npcZone.on('pointerdown',(pointer,lx,ly,event)=>{event.stopPropagation();this.goToStation(i);});
      if(i<3){
        const workshop=this.add.zone(station.x,station.y-82,140,124).setDepth(800).setInteractive({useHandCursor:true});
        workshop.on('pointerdown',(pointer,lx,ly,event)=>{event.stopPropagation();this.goToStation(i);});
      }
      this.tweens.add({targets:npc,x:npc.x+10,duration:3500+i*700,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    });
    this.sparkSprites=[];
    SPARKS.forEach((pos,id)=>{
      if(this.api.state.sparks.includes(id))return;
      const sparkle=this.add.image(pos.x,pos.y,'spark').setOrigin(.5,1).setDepth(pos.y+2);
      this.tweens.add({targets:sparkle,y:pos.y-5,duration:900+id*90,yoyo:true,repeat:-1,ease:'Sine.inOut'});
      this.sparkSprites.push({id,sprite:sparkle,...pos});
    });
    this.player=this.add.sprite(456,392,'human-0-0').setOrigin(.5,1).setDepth(392);
    this.questBeacon=this.add.text(0,0,'!',{fontFamily:'Pixel',fontSize:'14px',color:'#242334',backgroundColor:'#d7ff70',padding:{x:6,y:3}}).setOrigin(.5,1).setDepth(901);
    this.playerLabel=this.add.text(456,352,'YOU',{fontFamily:'Pixel',fontSize:'9px',color:'#eee5ca',backgroundColor:'#242532',padding:{x:5,y:3}}).setOrigin(.5).setDepth(1000);
    this.marker=this.add.graphics().setDepth(8).setVisible(false);
    this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E',false);
    // A quick tap should still move, even between two animation frames.
    this.input.keyboard.on('keydown',event=>{
      if(this.paused||event.repeat)return;
      const vector={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],a:[-1,0],d:[1,0],w:[0,-1],s:[0,1]}[event.key];
      if(!vector)return;
      this.nudge(vector[0],vector[1]);
    });
    this.input.on('pointerdown',pointer=>{
      if(this.paused)return;
      const point=this.cameras.main.getWorldPoint(pointer.x,pointer.y);
      this.pending=null;this.route=findPath(this.player,point);
      if(this.route.length){const end=this.route.at(-1);this.marker.clear().lineStyle(1,0xd7ff70,.8).strokeRect(end.x-6,end.y-3,12,6).setVisible(true);}
    });
    this.scale.on('resize',()=>this.fitCamera());this.fitCamera();
    this.refreshProgress();
    this.api.onReady(this);
    if(this.api.reducedMotion)this.tweens.pauseAll();
    this.game.canvas.setAttribute('aria-label','Playable Z outpost. Walk with arrow keys or WASD, click a destination, or use the mission buttons. Press E near an agent to talk.');
    this.game.canvas.setAttribute('role','application');this.game.canvas.setAttribute('tabindex','0');
  }
  fitCamera(){
    const cam=this.cameras.main,w=this.scale.width,h=this.scale.height;
    this.followMode=this.cameraMode==='follow'||(this.cameraMode!=='map'&&matchMedia('(max-width: 760px)').matches);
    const fit=Math.min(w/960,h/640);
    cam.setZoom(this.followMode?Math.max(1.1,fit*1.6):fit);
    this.stationLabels?.forEach(label=>label.setScale(Math.max(1,.9/cam.zoom)));
    cam.setBounds(-30,-35,1020,700);
    if(this.followMode)cam.startFollow(this.player,true,.12,.12);else{cam.stopFollow();cam.centerOn(470,315);}
  }
  toggleZoom(){this.cameraMode=this.followMode?'map':'follow';this.fitCamera();return this.followMode;}
  nudge(dx,dy){
    if(this.paused)return;
    this.route=[];this.pending=null;
    const x=this.player.x+dx*3,y=this.player.y+dy*3;
    if(walkable(x,y))this.player.setPosition(x,y);
  }
  setPaused(value){this.paused=value;if(value){this.route=[];this.pending=null;this.touch={};this.marker.setVisible(false);this.input.keyboard.resetKeys();}}
  goToStation(index){
    if(this.paused||!this.player)return;
    this.pending=index;const station=STATIONS[index];this.route=findPath(this.player,{x:station.x-12,y:station.y+5});
    this.api.onTravel(index);
    if(!this.route.length&&Math.hypot(this.player.x-station.x,this.player.y-station.y)<45){this.pending=null;this.api.onInteract(index);}
  }
  interact(){if(this.nearest!==null&&this.nearest!==undefined)this.api.onInteract(this.nearest);else this.api.onHint('Walk up to an agent, or choose a mission on the left.');}
  refreshProgress(){
    if(this.questBeacon){
      const current=STATIONS[this.api.state.stage];
      this.questBeacon.setVisible(Boolean(current));
      if(current)this.questBeacon.setPosition(current.x+27,current.y-36);
    }
    this.stationLabels?.forEach((label,i)=>{
      const done=i<this.api.state.stage,active=i===this.api.state.stage;
      label.setText(`${done?'✓':STATIONS[i].number}  ${STATIONS[i].name.toUpperCase()}`);
      label.setColor(done?'#d7ff70':active?'#f2e5c8':'#bcb2c7');
      label.setBackgroundColor(active?'#454034':'#262634');
    });
  }
  update(time,delta){
    if(!this.player||this.paused)return;
    const dt=Math.min(delta,45)/1000,speed=118;
    let dx=0,dy=0;
    if(this.keys.A.isDown||this.keys.LEFT.isDown||this.touch.left)dx--;
    if(this.keys.D.isDown||this.keys.RIGHT.isDown||this.touch.right)dx++;
    if(this.keys.W.isDown||this.keys.UP.isDown||this.touch.up)dy--;
    if(this.keys.S.isDown||this.keys.DOWN.isDown||this.touch.down)dy++;
    const manual=dx||dy;
    if(manual){this.route=[];this.pending=null;this.marker.setVisible(false);const length=Math.hypot(dx,dy);dx/=length;dy/=length;}
    else if(this.route.length){
      const next=this.route[0],vx=next.x-this.player.x,vy=next.y-this.player.y,distance=Math.hypot(vx,vy);
      if(distance<speed*dt+1){this.player.setPosition(next.x,next.y);this.route.shift();}
      else{dx=vx/distance;dy=vy/distance;}
    }
    if(dx||dy){
      const nx=this.player.x+dx*speed*dt,ny=this.player.y+dy*speed*dt;
      if(walkable(nx,this.player.y))this.player.x=nx;if(walkable(this.player.x,ny))this.player.y=ny;
      this.direction=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);
      this.player.setTexture(`human-${this.direction}-${Math.floor(time/125)%4}`);
    }else this.player.setTexture(`human-${this.direction||0}-0`);
    this.player.setDepth(this.player.y);this.playerLabel.setPosition(this.player.x,this.player.y-41);
    if(!this.route.length){this.marker.setVisible(false);if(this.pending!==null){const target=this.pending;this.pending=null;this.api.onInteract(target);return;}}
    const closest=STATIONS.map((s,i)=>({i,d:Math.hypot(s.x-this.player.x,s.y-this.player.y)})).sort((a,b)=>a.d-b.d)[0];
    const nearest=closest.d<48?closest.i:null;
    if(nearest!==this.nearest){this.nearest=nearest;this.api.onNearby(nearest);}
    if(Phaser.Input.Keyboard.JustDown(this.keys.E))this.interact();
    for(const spark of this.sparkSprites){
      if(!spark.sprite.active)continue;
      if(Math.hypot(spark.x-this.player.x,spark.y-this.player.y)<18){
        this.api.onCollect(spark.id);
        this.tweens.killTweensOf(spark.sprite);
        this.tweens.add({targets:spark.sprite,y:spark.sprite.y-32,alpha:0,duration:280,onComplete:()=>spark.sprite.destroy()});
        spark.sprite.active=false;
      }
    }
    if(Math.floor(time/700)%2===0)this.agents.forEach((npc,i)=>npc.setTexture(`${STATIONS[i].id}-0-0`));
    else this.agents.forEach((npc,i)=>npc.setTexture(`${STATIONS[i].id}-0-1`));
    this.api.onPosition?.(Math.round(this.player.x),Math.round(this.player.y));
  }
  launch(onComplete){
    this.paused=true;this.route=[];this.pending=null;
    const cam=this.cameras.main;cam.stopFollow();cam.pan(680,335,700,Phaser.Math.Easing.Sine.InOut);
    if(this.api.reducedMotion){this.rocket.setY(-100);this.time.delayedCall(500,()=>{this.paused=false;onComplete();});return;}
    const flame=this.add.graphics().setDepth(415);
    const exhaust=this.time.addEvent({delay:70,loop:true,callback:()=>{
      flame.clear();flame.fillStyle(0xffb978);flame.fillRect(this.rocket.x-8,this.rocket.y-5,16,20+Math.random()*13);
      flame.fillStyle(0xf3edaa);flame.fillRect(this.rocket.x-4,this.rocket.y-4,8,17);
      const mote=this.add.rectangle(this.rocket.x+(Math.random()-.5)*20,this.rocket.y+15,5,5,0xd7cfb3,.6).setDepth(410);
      this.tweens.add({targets:mote,y:mote.y+40,alpha:0,duration:700,onComplete:()=>mote.destroy()});
    }});
    this.tweens.add({targets:this.rocket,y:this.rocket.y-9,duration:700,yoyo:true,repeat:1,onComplete:()=>{
      this.tweens.add({targets:this.rocket,y:-180,duration:2200,ease:'Cubic.in',onComplete:()=>{
        exhaust.remove();flame.destroy();this.paused=false;this.fitCamera();onComplete();
      }});
    }});
  }
}

export function createWorld(parent,api){
  return new Phaser.Game({type:Phaser.AUTO,parent,backgroundColor:'#1b1b2b',pixelArt:true,roundPixels:true,
    render:{antialias:false,roundPixels:true},scale:{mode:Phaser.Scale.RESIZE,width:parent.clientWidth,height:parent.clientHeight},
    input:{activePointers:3},audio:{noAudio:true},scene:[new Outpost(api)],fps:{target:60,forceSetTimeOut:false},banner:false});
}
