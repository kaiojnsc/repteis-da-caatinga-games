/**
 * js/topdown.js – Fase 3: Jacaré-de-papo-amarelo
 * Répteis da Caatinga – O Museu Vivo
 */
;(function () {
  'use strict';

  const TILE = 64, COLS = 25, ROWS = 15;
  const WORLD_W = COLS * TILE, WORLD_H = ROWS * TILE; // 1600 × 960
  const W = 800, H = 428, TIMER_MAX = 300;

  /* ── TILEMAP (0=água, 1=margem, 2=ponte) ── */
  const TILEMAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ];

  /* tile type at world pixel position */
  function tileAt(wx, wy) {
    const c = Math.floor(wx / TILE), r = Math.floor(wy / TILE);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return 1;
    return TILEMAP[r][c];
  }

  /* ── PEIXES ── */
  const FISH_POS = [
    {x:160,y:128},{x:320,y:192},{x:512,y:256},{x:704,y:192},{x:900,y:320},
    {x:1100,y:160},{x:1300,y:256},{x:1450,y:128},{x:240,y:576},{x:480,y:640},
    {x:700,y:700},{x:950,y:576},{x:1150,y:640},{x:1350,y:700},{x:1500,y:576},
    {x:850,y:850},{x:400,y:820},
  ];

  /* ── LIXO ── */
  const TRASH_POS = [
    {x:250,y:200},{x:900,y:150},{x:1400,y:300},{x:400,y:700},{x:1100,y:800},{x:700,y:500},
  ];

  /* ── DOM ── */
  const canvas  = document.getElementById('gameCanvas');
  const ctx     = canvas.getContext('2d');
  const elPts   = document.getElementById('hud-pontos');
  const elTimer = document.getElementById('hud-timer');
  const elFish  = document.getElementById('hud-peixes');
  const elStun  = document.getElementById('hud-stun');
  const btnPausa= document.getElementById('btn-pausa');
  const btnMudo = document.getElementById('btn-mudo');

  const imgJacare = new Image(); imgJacare.src = 'assets/jacara.png';

  /* ── ESTADO ── */
  let G, keys, lastTime, rafId, timerId, frame = 0;
  let mudo = false;

  function criarEstado() {
    return {
      player: {x:800, y:400, vx:0, vy:0, w:52, h:34,
               stunned:false, stunTimer:0, angle:0},
      fish:   FISH_POS.map(p=>({...p,alive:true})),
      trash:  TRASH_POS.map(p=>({...p,alive:true})),
      boats:  [
        {x:100,  y:200, vx:80,  w:90,h:34},
        {x:1400, y:480, vx:-90, w:90,h:34},
        {x:400,  y:720, vx:70,  w:90,h:34},
      ],
      score:0, fishGot:0,
      timeLeft:TIMER_MAX, tempoJogado:0,
      alive:true, paused:false, gameStarted:false,
      camX:0, camY:0,
      msgText:'', msgTimer:0,
      placaPopup:false,
      placaScore:false,
    };
  }

  /* ── INICIAR ── */
  function iniciarJogo() {
    G = criarEstado();
    G.gameStarted = true;
    keys = {};
    lastTime = performance.now();
    clearInterval(timerId);
    if (window.AudioEngine) window.AudioEngine.tocarTrack('gameplay');
    timerId = setInterval(function(){
      if (!G.alive||G.paused) return;
      G.timeLeft = Math.max(0, G.timeLeft-1);
      G.tempoJogado++;
      atualizarHUD();
      if (G.timeLeft<=0) finalizarFase();
    }, 1000);
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
    document.getElementById('overlay-gameover').classList.remove('ativo');
    document.getElementById('overlay-pausa').classList.remove('ativo');
    fecharPlacaPopup();
    atualizarHUD();
  }

  /* ── LOOP ── */
  function loop(now) {
    if (!G.alive) return;
    rafId = requestAnimationFrame(loop);
    let dt = Math.min((now-lastTime)/1000, 0.05);
    lastTime = now;
    frame++;
    if (!G.paused) { update(dt); desenhar(); }
  }

  /* ── UPDATE ── */
  function update(dt) {
    const p = G.player;

    /* Stun */
    if (p.stunned) {
      p.stunTimer -= dt;
      if (p.stunTimer <= 0) { p.stunned = false; elStun.style.display='none'; }
      p.vx = 0; p.vy = 0;
    } else {
      /* Input */
      let dx=0, dy=0;
      if (keys['ArrowLeft'] ||keys['a']||keys['A']) dx-=1;
      if (keys['ArrowRight']||keys['d']||keys['D']) dx+=1;
      if (keys['ArrowUp']   ||keys['w']||keys['W']) dy-=1;
      if (keys['ArrowDown'] ||keys['s']||keys['S']) dy+=1;
      /* Normalizar diagonal */
      if (dx!==0&&dy!==0) { dx*=0.7071; dy*=0.7071; }
      const spd = 160;
      if (dx!==0||dy!==0) {
        p.vx = dx*spd; p.vy = dy*spd;
        p.angle = Math.atan2(dy, dx);
      } else {
        p.vx *= 0.85; p.vy *= 0.85;
      }
    }

    /* Mover e checar colisão com tiles sólidos */
    const nx = p.x + p.vx*dt;
    const ny = p.y + p.vy*dt;

    /* Checar 4 cantos */
    function solidAt(wx,wy){ return tileAt(wx,wy)===1; }
    const hl = p.w/2-2, hh = p.h/2-2;

    const blockX = solidAt(nx-hl,p.y-hh)||solidAt(nx+hl,p.y-hh)||
                   solidAt(nx-hl,p.y+hh)||solidAt(nx+hl,p.y+hh);
    if (!blockX) p.x = nx;

    const blockY = solidAt(p.x-hl,ny-hh)||solidAt(p.x+hl,ny-hh)||
                   solidAt(p.x-hl,ny+hh)||solidAt(p.x+hl,ny+hh);
    if (!blockY) p.y = ny;

    p.x = Math.max(p.w/2, Math.min(WORLD_W-p.w/2, p.x));
    p.y = Math.max(p.h/2, Math.min(WORLD_H-p.h/2, p.y));

    /* Câmera */
    G.camX = Math.max(0, Math.min(WORLD_W-W, p.x - W/2));
    G.camY = Math.max(0, Math.min(WORLD_H-H, p.y - H/2));

    /* Peixes */
    G.fish.forEach(function(f){
      if (!f.alive) return;
      if (dist(p,f)<26) { f.alive=false; G.score+=15; G.fishGot++;
        if (window.AudioEngine) window.AudioEngine.sfx('coletar');
        atualizarHUD();
        if (G.fishGot>=17) finalizarFase(); }
    });

    /* Lixo */
    G.trash.forEach(function(t){
      if (!t.alive) return;
      if (dist(p,t)<28) {
        t.alive=false; G.score=Math.max(0,G.score-5);
        if (window.AudioEngine) window.AudioEngine.sfx('dano');
        mostrarMsg('-5 🗑️',1.5); atualizarHUD();
      }
    });

    /* Barcos */
    G.boats.forEach(function(b){
      b.x += b.vx*dt;
      if (b.x > WORLD_W+100) b.x=-100;
      if (b.x < -100) b.x=WORLD_W+100;
      if (!p.stunned && aabb(p, b)) {
        p.stunned=true; p.stunTimer=2; p.vx=0; p.vy=0;
        elStun.style.display='block';
      }
    });

    /* Placa Açude Velho */
    if (!G.placaScore && dist(p,{x:750,y:480})<40) {
      G.placaScore=true; G.score+=50; atualizarHUD();
      abrirPlacaPopup();
    }

    /* Mensagem */
    if (G.msgTimer>0) G.msgTimer-=dt;
  }

  function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }
  function aabb(p,b){ return Math.abs(p.x-b.x)<(p.w/2+b.w/2) && Math.abs(p.y-b.y)<(p.h/2+b.h/2); }

  /* ── DESENHAR ── */
  function desenhar() {
    ctx.save();
    ctx.translate(-G.camX, -G.camY);

    /* ─ Tiles ─ */
    for (let r=0;r<ROWS;r++) {
      for (let c=0;c<COLS;c++) {
        const tx=c*TILE, ty=r*TILE, t=TILEMAP[r][c];
        if (t===0) {
          /* Água */
          const wv = Math.sin(frame*0.04 + c*0.5 + r*0.3)*6;
          const gr=ctx.createLinearGradient(tx,ty,tx+TILE,ty+TILE);
          gr.addColorStop(0,'#0A2A3A'); gr.addColorStop(1,'#0F3A50');
          ctx.fillStyle=gr; ctx.fillRect(tx,ty,TILE,TILE);
          /* Ondas */
          ctx.strokeStyle=`rgba(30,120,180,${0.2+Math.abs(Math.sin(frame*.03+c))*0.2})`;
          ctx.lineWidth=1.5;
          ctx.beginPath();
          ctx.moveTo(tx+8+wv,ty+TILE/3);
          ctx.quadraticCurveTo(tx+TILE/2,ty+TILE/3-5,tx+TILE-8+wv,ty+TILE/3);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(tx+12-wv,ty+TILE*2/3);
          ctx.quadraticCurveTo(tx+TILE/2,ty+TILE*2/3+5,tx+TILE-12-wv,ty+TILE*2/3);
          ctx.stroke();
        } else if (t===1) {
          /* Margem */
          ctx.fillStyle='#1A4A18'; ctx.fillRect(tx,ty,TILE,TILE);
          /* Gramas */
          ctx.fillStyle='#2A6A28';
          for (let g=0;g<4;g++) {
            const gx=tx+8+g*14, gy=ty+TILE-12;
            ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx-3,gy-10); ctx.lineTo(gx+3,gy-10); ctx.fill();
          }
          ctx.fillStyle='#3A7A38';
          ctx.beginPath(); ctx.ellipse(tx+TILE/2,ty+TILE/2,TILE/2-4,TILE/2-4,0,0,Math.PI*2); ctx.fill();
        } else if (t===2) {
          /* Ponte */
          ctx.fillStyle='#5A3A10'; ctx.fillRect(tx,ty,TILE,TILE);
          /* Tábuas */
          ctx.fillStyle='#6B4A18';
          for(let tb=0;tb<4;tb++) { ctx.fillRect(tx+2,ty+2+tb*15,TILE-4,12); }
          /* Postes */
          ctx.fillStyle='#3A2008';
          ctx.fillRect(tx+4,ty,8,TILE); ctx.fillRect(tx+TILE-12,ty,8,TILE);
          /* Ripple */
          ctx.strokeStyle=`rgba(90,58,16,${0.3+Math.sin(frame*.05)*0.2})`;
          ctx.lineWidth=2;
          ctx.beginPath(); ctx.ellipse(tx+8,ty+TILE,10,4,0,0,Math.PI*2); ctx.stroke();
        }
      }
    }

    /* ─ Placa Açude Velho ─ */
    ctx.save();
    const psc=1+Math.sin(frame*.05)*.04;
    ctx.translate(750,480); ctx.scale(psc,psc);
    ctx.fillStyle='#5A3A00'; ctx.fillRect(-50,-18,100,36);
    ctx.fillStyle='#F5E6C8'; ctx.font='bold 11px Teko'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('📍 AÇUDE VELHO',0,0);
    ctx.restore();

    /* ─ Lixo ─ */
    G.trash.forEach(function(t){
      if(!t.alive) return;
      const fl=Math.sin(frame*.07)*4;
      ctx.fillStyle='#00BBBB'; ctx.fillRect(t.x-11,t.y-14+fl,22,28);
      ctx.fillStyle='rgba(0,180,180,0.5)'; ctx.font='16px serif'; ctx.textAlign='center';
      ctx.fillText('🗑️',t.x,t.y+fl+4);
    });

    /* ─ Peixes ─ */
    G.fish.forEach(function(f){
      if(!f.alive) return;
      const osc=Math.sin(frame*.08+f.x*.01)*5;
      /* Corpo */
      ctx.fillStyle='#2060CC';
      ctx.beginPath(); ctx.ellipse(f.x,f.y+osc,10,6,0,0,Math.PI*2); ctx.fill();
      /* Cauda */
      ctx.fillStyle='#1848AA';
      ctx.beginPath(); ctx.moveTo(f.x-8,f.y+osc); ctx.lineTo(f.x-16,f.y+osc-5); ctx.lineTo(f.x-16,f.y+osc+5); ctx.fill();
      /* Brilho */
      ctx.fillStyle='rgba(150,200,255,0.6)';
      ctx.beginPath(); ctx.ellipse(f.x+2,f.y+osc-1,4,2,-.3,0,Math.PI*2); ctx.fill();
    });

    /* ─ Barcos ─ */
    G.boats.forEach(function(b){
      const dir=b.vx>0?1:-1;
      ctx.save();
      if(dir<0){ctx.scale(-1,1); ctx.translate(-b.x*2-b.w,0);}
      /* Casco */
      ctx.fillStyle='#8B4513';
      ctx.beginPath(); ctx.roundRect(b.x,b.y,b.w,b.h,6); ctx.fill();
      /* Detalhe */
      ctx.fillStyle='#A0522D';
      ctx.fillRect(b.x+8,b.y+4,b.w-16,b.h/2-4);
      /* Motor */
      ctx.fillStyle='#555';
      ctx.fillRect(b.x+b.w-14,b.y+b.h-8,12,10);
      /* Espuma */
      ctx.fillStyle='rgba(255,255,255,0.4)';
      ctx.beginPath(); ctx.ellipse(b.x-10,b.y+b.h/2,8,4,0,0,Math.PI*2); ctx.fill();
      ctx.restore();
    });

    /* ─ Player (Jacaré) ─ */
    const p=G.player;
    const blink=p.stunned && Math.floor(Date.now()/120)%2===0;
    if(!blink){
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(p.angle);
      if(p.stunned){ctx.fillStyle='rgba(255,50,50,0.4)'; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);}
      if(imgJacare.complete&&imgJacare.naturalWidth){
        ctx.drawImage(imgJacare,-p.w/2,-p.h/2,p.w,p.h);
      } else {
        /* Corpo */
        ctx.fillStyle=p.stunned?'#8B2020':'#2A5A18';
        ctx.beginPath(); ctx.ellipse(0,0,p.w/2,p.h/2,0,0,Math.PI*2); ctx.fill();
        /* Focinho */
        ctx.fillStyle='#1A4A10';
        ctx.beginPath(); ctx.ellipse(p.w/2,0,p.w/4,p.h/4,0,0,Math.PI*2); ctx.fill();
        /* Olhos */
        ctx.fillStyle='#FFD700';
        ctx.beginPath(); ctx.arc(p.w/4,-p.h/4,5,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(p.w/4,p.h/4,5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#000';
        ctx.beginPath(); ctx.arc(p.w/4+1,-p.h/4,2,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(p.w/4+1,p.h/4,2,0,Math.PI*2); ctx.fill();
        /* Papo amarelo */
        ctx.fillStyle='rgba(255,200,0,0.6)';
        ctx.beginPath(); ctx.ellipse(0,p.h/2-4,p.w/3,8,0,0,Math.PI); ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore(); /* fim câmera */

    /* ─ HUD overlay (sem câmera) ─ */
    /* Barra de progresso */
    const bw=200,bh=6,bx=W/2-bw/2,by=H-14;
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle='#2060CC';
    ctx.fillRect(bx,by,bw*Math.min(1,G.fishGot/17),bh);
    ctx.strokeStyle='rgba(32,96,204,0.5)'; ctx.lineWidth=1; ctx.strokeRect(bx,by,bw,bh);

    /* Mensagem flutuante */
    if(G.msgTimer>0){
      ctx.save(); ctx.globalAlpha=Math.min(1,G.msgTimer);
      ctx.fillStyle='#FF8888'; ctx.font='bold 15px "Press Start 2P"';
      ctx.textAlign='center'; ctx.fillText(G.msgText,W/2,55);
      ctx.restore();
    }
  }

  /* ── HUD ── */
  function atualizarHUD(){
    elPts.textContent=String(G.score).padStart(5,'0');
    elFish.textContent=G.fishGot+'/17';
    const m=Math.floor(G.timeLeft/60),s=G.timeLeft%60;
    elTimer.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
    elTimer.style.color=G.timeLeft<=30?'#FF4444':'#F5E6C8';
  }

  /* ── ESTRELAS ── */
  function calcEstrelas(){
    if(G.tempoJogado>=240) return 5;
    if(G.tempoJogado>=180) return 4;
    if(G.score>=220) return 3;
    if(G.score>=120) return 2;
    return 1;
  }

  /* ── FINALIZAR ── */
  function finalizarFase(){
    if(!G.alive) return;
    G.alive=false;
    clearInterval(timerId);
    if (window.AudioEngine) { window.AudioEngine.sfx('vitoria'); window.AudioEngine.pararTudo(); }
    const e=calcEstrelas();
    window.Progresso.salvarFase(3,G.score,e,G.tempoJogado);
    setTimeout(function(){ window.location.href='resultado.html?fase=3'; },800);
  }

  /* ── PAUSA ── */
  function togglePausa(){
    if(!G.gameStarted) return;
    G.paused=!G.paused;
    btnPausa.textContent=G.paused?'▶':'⏸';
    document.getElementById('overlay-pausa').classList.toggle('ativo',G.paused);
    if(!G.paused){ lastTime=performance.now(); rafId=requestAnimationFrame(loop); }
  }

  function mostrarMsg(txt,dur){ G.msgText=txt; G.msgTimer=dur; }

  /* ── PLACA POPUP ── */
  function abrirPlacaPopup(){
    document.getElementById('popup-placa').style.display='flex';
  }
  function fecharPlacaPopup(){
    const el=document.getElementById('popup-placa');
    if(el) el.style.display='none';
  }

  /* ── CONTROLES ── */
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'||e.key==='p'||e.key==='P'){togglePausa();return;}
    keys[e.key]=true;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  });
  document.addEventListener('keyup',function(e){ keys[e.key]=false; });

  /* Mobile joystick */
  ['mb-up','mb-down','mb-left','mb-right',
   'mb-ul','mb-ur','mb-dl','mb-dr'].forEach(function(id){
    const el=document.getElementById(id);
    if(!el) return;
    const map={'mb-up':'ArrowUp','mb-down':'ArrowDown','mb-left':'ArrowLeft','mb-right':'ArrowRight',
               'mb-ul':'ArrowUp','mb-ur':'ArrowUp','mb-dl':'ArrowDown','mb-dr':'ArrowDown'};
    const map2={'mb-ul':'ArrowLeft','mb-ur':'ArrowRight','mb-dl':'ArrowLeft','mb-dr':'ArrowRight'};
    el.addEventListener('pointerdown',function(e){
      keys[map[id]]=true; if(map2[id]) keys[map2[id]]=true; e.preventDefault();
    },{passive:false});
    el.addEventListener('pointerup',function(){
      keys[map[id]]=false; if(map2[id]) keys[map2[id]]=false;
    });
    el.addEventListener('pointerleave',function(){
      keys[map[id]]=false; if(map2[id]) keys[map2[id]]=false;
    });
  });

  btnPausa.addEventListener('click',togglePausa);
  btnMudo.addEventListener('click',function(){ mudo=!mudo; btnMudo.textContent=mudo?'🔇':'🔊'; if(window.AudioEngine) window.AudioEngine.setMudo(mudo); });
  document.getElementById('btn-retomar').addEventListener('click',togglePausa);
  document.getElementById('btn-sair-pausa').addEventListener('click',function(){ window.location.href='mapa.html'; });
  document.getElementById('btn-fechar-placa').addEventListener('click',fecharPlacaPopup);

  /* Clique na placa via canvas */
  canvas.addEventListener('click',function(e){
    const rect=canvas.getBoundingClientRect();
    const mx=(e.clientX-rect.left)*(W/rect.width)+G.camX;
    const my=(e.clientY-rect.top)*(H/rect.height)+G.camY;
    if(Math.hypot(mx-750,my-480)<50){ if(!G.placaScore){G.placaScore=true;G.score+=50;atualizarHUD();} abrirPlacaPopup(); }
  });

  /* ── INIT ── */
  document.addEventListener('DOMContentLoaded',function(){
    ctx.fillStyle='#0A2A3A'; ctx.fillRect(0,0,W,H);
    window.CardEducativo.mostrarCard(3,function(){
      window.CardEducativo.pararSpeech();
      window.CardEducativo.mostrarTutorial(3,function(){ iniciarJogo(); });
    });
  });

  window.TopdownGame={ iniciarJogo, togglePausa, fecharPlacaPopup };
})();
