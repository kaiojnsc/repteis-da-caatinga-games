/**
 * js/platformer.js – Fase 2: Dragão Barbudo
 * Répteis da Caatinga – O Museu Vivo
 */
;(function () {
  'use strict';

  /* ══ CONSTANTES ══ */
  const GRAV = 0.55, PULO = -13, W = 800, H = 428, HUD_H = 52;
  const CANVAS_H = H - HUD_H; // 376... na verdade canvas já é 428 sem HUD
  const TIMER_MAX = 300;
  const WORLD_W = 5000;

  /* ══ PLATAFORMAS ══ */
  const PLATFORMS = [
    {x:0,    y:404, w:5000, h:24},   // chão
    {x:180,  y:320, w:160, h:20},{x:420, y:260,w:140,h:20},{x:660, y:310,w:160,h:20},
    {x:900,  y:240, w:120, h:20},{x:1080,y:180,w:100,h:20},{x:1300,y:240,w:140,h:20},
    {x:1500, y:300, w:120, h:20},{x:1700,y:220,w:100,h:20},{x:1900,y:280,w:160,h:20},
    {x:2100, y:200, w:120, h:20},{x:2300,y:260,w:140,h:20},{x:2500,y:180,w:100,h:20},
    {x:2680, y:240, w:140, h:20},{x:2880,y:300,w:120,h:20},{x:3060,y:220,w:100,h:20},
    {x:3240, y:180, w:140, h:20},{x:3440,y:260,w:160,h:20},{x:3640,y:200,w:120,h:20},
    {x:3820, y:280, w:140, h:20},{x:4000,y:220,w:100,h:20},{x:4180,y:160,w:140,h:20},
    {x:4360, y:240, w:120, h:20},{x:4560,y:300,w:160,h:20},{x:4760,y:220,w:200,h:20},
  ];

  /* Escorpiões: patrulham entre minX e maxX */
  function makeScorpions() {
    return [
      {x:350, y:384,dir:1,minX:200,maxX:500,alive:true},
      {x:700, y:384,dir:-1,minX:600,maxX:850,alive:true},
      {x:600, y:290,dir:1,minX:420,maxX:780,alive:true},
      {x:1050,y:384,dir:-1,minX:900,maxX:1200,alive:true},
      {x:1400,y:384,dir:1,minX:1300,maxX:1600,alive:true},
      {x:1680,y:200,dir:-1,minX:1500,maxX:1800,alive:true},
      {x:2000,y:384,dir:1,minX:1900,maxX:2200,alive:true},
      {x:2350,y:384,dir:-1,minX:2200,maxX:2550,alive:true},
      {x:2700,y:220,dir:1,minX:2680,maxX:2820,alive:true},
      {x:3100,y:384,dir:-1,minX:2900,maxX:3300,alive:true},
      {x:3500,y:384,dir:1,minX:3400,maxX:3700,alive:true},
      {x:3820,y:260,dir:-1,minX:3820,maxX:3960,alive:true},
      {x:4100,y:384,dir:1,minX:4000,maxX:4300,alive:true},
      {x:4500,y:384,dir:-1,minX:4400,maxX:4700,alive:true},
    ];
  }

  /* Insetos coletáveis */
  function makeInsects() {
    const pts = [
      {x:300,y:370},{x:550,y:370},{x:800,y:370},{x:420,y:240},
      {x:660,y:290},{x:1080,y:160},{x:1300,y:220},{x:1500,y:280},
      {x:1700,y:200},{x:1900,y:260},{x:2100,y:180},{x:2300,y:240},
      {x:2500,y:160},{x:2680,y:220},{x:2880,y:280},{x:3060,y:200},
      {x:3440,y:240},{x:3640,y:180},{x:3820,y:260},{x:4000,y:200},
      {x:4180,y:140},{x:4360,y:220},{x:4560,y:280},{x:4760,y:200},
    ];
    return pts.map(p => ({...p, alive: true}));
  }

  /* ══ DOM ══ */
  const canvas   = document.getElementById('gameCanvas');
  const ctx      = canvas.getContext('2d');
  const elPts    = document.getElementById('hud-pontos');
  const elTimer  = document.getElementById('hud-timer');
  const elVidas  = document.getElementById('hud-vidas');
  const btnPausa = document.getElementById('btn-pausa');
  const btnMudo  = document.getElementById('btn-mudo');

  /* ══ ASSETS ══ */
  const imgDragao = new Image(); imgDragao.src = 'assets/dragao.png';

  /* ══ ESTADO ══ */
  let G, keys, lastTime, rafId, speedTimer, progressTimer;
  let mudo = false;

  function criarEstado() {
    return {
      player: {x:50,y:340,w:32,h:44,vx:0,vy:0,onGround:false,
               crouching:false,invTime:0,doubleJump:false,djUsed:false,facingRight:true},
      vidas:3, score:0, timeLeft:TIMER_MAX, tempoJogado:0,
      playerSpeed:140, scorpionSpeed:55,
      scorpions: makeScorpions(), insects: makeInsects(),
      insectsGot:0, cameraX:0,
      alive:true, paused:false, gameStarted:false,
      msgText:'', msgTimer:0,
      parallax:{x1:0,x2:0,x3:0},
    };
  }

  function iniciarJogo() {
    G = criarEstado();
    G.gameStarted = true;
    keys = {};
    lastTime = performance.now();
    clearInterval(speedTimer);
    clearInterval(progressTimer);
    if (window.AudioEngine) window.AudioEngine.tocarTrack('gameplay');
    /* Timer principal */
    progressTimer = setInterval(function () {
      if (!G.alive || G.paused) return;
      G.timeLeft = Math.max(0, G.timeLeft - 1);
      G.tempoJogado++;
      atualizarHUD();
      if (G.timeLeft <= 0) finalizarFase();
    }, 1000);
    /* Progressão de dificuldade */
    speedTimer = setInterval(function () {
      if (!G.alive || G.paused) return;
      if (G.tempoJogado % 30 === 0 && G.tempoJogado > 0)
        G.playerSpeed = Math.min(240, G.playerSpeed + 12);
      if (G.tempoJogado % 45 === 0 && G.tempoJogado > 0)
        G.scorpionSpeed = Math.min(120, G.scorpionSpeed + 8);
    }, 1000);
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
    document.getElementById('overlay-gameover').classList.remove('ativo');
    document.getElementById('overlay-pausa').classList.remove('ativo');
    atualizarHUD();
  }

  /* ══ LOOP ══ */
  function loop(now) {
    if (!G.alive) return;
    rafId = requestAnimationFrame(loop);
    let dt = (now - lastTime) / 1000;
    lastTime = now;
    dt = Math.min(dt, 0.05);
    if (!G.paused) {
      update(dt);
      desenhar();
    }
  }

  /* ══ UPDATE ══ */
  function update(dt) {
    const p = G.player;

    /* Agachar */
    p.crouching = !!(keys['ArrowDown'] || keys['s'] || keys['S']);
    p.h = p.crouching ? 22 : 44;

    /* Movimento horizontal */
    const spd = G.playerSpeed * dt;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) { p.x -= spd; p.facingRight = false; }
    if (keys['ArrowRight']|| keys['d'] || keys['D']) { p.x += spd; p.facingRight = true;  }

    /* Gravidade */
    p.vy += GRAV;

    /* Pulo */
    if ((keys['ArrowUp'] || keys[' '] || keys['w'] || keys['W']) && !keys['_jumpConsumed']) {
      if (p.onGround) { p.vy = PULO; p.djUsed = false; keys['_jumpConsumed'] = true; }
      else if (p.doubleJump && !p.djUsed) { p.vy = PULO * 0.85; p.djUsed = true; keys['_jumpConsumed'] = true; }
    }

    /* Aplicar velocidade vertical */
    p.y += p.vy;
    p.onGround = false;

    /* Colisão plataformas */
    PLATFORMS.forEach(function (pl) {
      if (aabb(p, pl)) {
        const overlapBottom = (p.y + p.h) - pl.y;
        const overlapTop    = (pl.y + pl.h) - p.y;
        const overlapLeft   = (p.x + p.w) - pl.x;
        const overlapRight  = (pl.x + pl.w) - p.x;
        const minV = Math.min(overlapBottom, overlapTop);
        const minH = Math.min(overlapLeft, overlapRight);
        if (minV <= minH) {
          if (overlapBottom < overlapTop) { p.y = pl.y - p.h; p.vy = 0; p.onGround = true; }
          else                            { p.y = pl.y + pl.h; p.vy = 0; }
        } else {
          if (overlapLeft < overlapRight) p.x = pl.x - p.w;
          else                            p.x = pl.x + pl.w;
        }
      }
    });

    /* Limites mundo */
    p.x = Math.max(0, Math.min(WORLD_W - p.w, p.x));
    if (p.y > canvas.height + 100) { p.y = 350; p.vy = 0; tomarDano(); } // caiu no vazio

    /* Invencibilidade */
    if (p.invTime > 0) p.invTime -= dt;

    /* Câmera */
    G.cameraX = Math.max(0, Math.min(WORLD_W - W, p.x - 300));

    /* Parallax */
    G.parallax.x1 = G.cameraX * 0.1;
    G.parallax.x2 = G.cameraX * 0.3;
    G.parallax.x3 = G.cameraX * 0.6;

    /* Escorpiões */
    G.scorpions.forEach(function (sc) {
      if (!sc.alive) return;
      sc.x += sc.dir * G.scorpionSpeed * dt;
      if (sc.x <= sc.minX) { sc.x = sc.minX; sc.dir = 1; }
      if (sc.x >= sc.maxX) { sc.x = sc.maxX; sc.dir = -1; }
      /* Colisão com player */
      if (aabb(p, {x:sc.x,y:sc.y,w:28,h:20})) {
        if (p.vy > 0 && p.y + p.h < sc.y + 10) {
          sc.alive = false; G.score += 20; p.vy = -8; atualizarHUD();
        } else if (p.invTime <= 0) {
          tomarDano();
        }
      }
    });

    /* Insetos */
    G.insects.forEach(function (ins) {
      if (!ins.alive) return;
      if (aabb(p, {x:ins.x-10,y:ins.y-10,w:20,h:20})) {
        ins.alive = false; G.score += 15; G.insectsGot++;
        if (window.AudioEngine) window.AudioEngine.sfx('coletar');
        if (G.insectsGot % 3 === 0) {
          p.doubleJump = true;
          mostrarMsg('⚡ DUPLO SALTO!', 2);
        }
        atualizarHUD();
      }
    });

    /* Bandeira de chegada */
    if (p.x >= 4800) finalizarFase();

    /* Mensagem temporária */
    if (G.msgTimer > 0) G.msgTimer -= dt;
  }

  /* ══ COLISÃO AABB ══ */
  function aabb(a, b) {
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }

  /* ══ DANO ══ */
  function tomarDano() {
    G.vidas--;
    G.player.invTime = 2;
    atualizarHUD();
    if (G.vidas <= 0) triggerGameOver();
  }

  /* ══ DESENHO ══ */
  function desenhar() {
    const p = G.player;

    /* ─ PARALLAX BG (sem translate, usa offset) ─ */
    // Céu
    const gr = ctx.createLinearGradient(0,0,0,canvas.height);
    gr.addColorStop(0,'#1A2A10'); gr.addColorStop(1,'#3A5A20');
    ctx.fillStyle = gr; ctx.fillRect(0,0,W,canvas.height);

    // Morros (layer 2)
    ctx.fillStyle = '#1A3A0A';
    for (let i = 0; i < 8; i++) {
      const mx = ((i * 180) - (G.parallax.x2 % 180)) - 60;
      ctx.beginPath();
      ctx.arc(mx + 90, canvas.height - 60 + Math.sin(i)*30, 100, 0, Math.PI);
      ctx.fill();
    }

    // Pedras/vegetação (layer 3)
    ctx.fillStyle = '#2A4A15';
    for (let i = 0; i < 20; i++) {
      const px = ((i * 110) - (G.parallax.x3 % 110)) - 20;
      const py = canvas.height - 20 - (i % 3) * 15;
      ctx.beginPath(); ctx.ellipse(px+25,py,22,14,0,0,Math.PI*2); ctx.fill();
    }

    /* ─ MUNDO COM CÂMERA ─ */
    ctx.save();
    ctx.translate(-G.cameraX, 0);

    /* Plataformas */
    PLATFORMS.forEach(function (pl) {
      /* Gradiente terra */
      const gp = ctx.createLinearGradient(pl.x,pl.y,pl.x,pl.y+pl.h);
      gp.addColorStop(0,'#5A8A30'); gp.addColorStop(0.3,'#4A7A28'); gp.addColorStop(1,'#3A5A18');
      ctx.fillStyle = gp; ctx.fillRect(pl.x,pl.y,pl.w,pl.h);
      /* Borda superior */
      ctx.fillStyle = '#7AAA48'; ctx.fillRect(pl.x,pl.y,pl.w,4);
      /* Sombra */
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(pl.x,pl.y+pl.h-4,pl.w,4);
    });

    /* Bandeira */
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(4800, 240, 6, 130);
    ctx.fillStyle = '#D4A843';
    ctx.beginPath(); ctx.moveTo(4806,240); ctx.lineTo(4846,256); ctx.lineTo(4806,272); ctx.fill();
    ctx.fillStyle = '#F5E6C8'; ctx.font = '10px Teko'; ctx.textAlign='left';
    ctx.fillText('META', 4808, 258);

    /* Insetos */
    G.insects.forEach(function (ins) {
      if (!ins.alive) return;
      ctx.fillStyle = '#228B22';
      ctx.beginPath(); ctx.arc(ins.x,ins.y,10,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#90EE90';
      ctx.beginPath(); ctx.arc(ins.x-2,ins.y-2,4,0,Math.PI*2); ctx.fill();
    });

    /* Escorpiões */
    G.scorpions.forEach(function (sc) {
      if (!sc.alive) return;
      ctx.save();
      if (sc.dir < 0) { ctx.scale(-1,1); ctx.translate(-sc.x*2-28,0); }
      /* Corpo */
      ctx.fillStyle = '#8B4513';
      ctx.beginPath(); ctx.roundRect(sc.x,sc.y,28,16,4); ctx.fill();
      /* Cauda */
      ctx.strokeStyle = '#6B3010'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(sc.x+28,sc.y+8); ctx.quadraticCurveTo(sc.x+40,sc.y-4,sc.x+36,sc.y+16); ctx.stroke();
      /* Pinças */
      ctx.fillStyle = '#A0522D';
      ctx.beginPath(); ctx.ellipse(sc.x+2,sc.y+14,5,4,0.4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sc.x+8,sc.y+16,5,4,0,0,Math.PI*2); ctx.fill();
      /* Olhos */
      ctx.fillStyle='#FF4444'; ctx.beginPath(); ctx.arc(sc.x+6,sc.y+5,2,0,Math.PI*2); ctx.fill();
      ctx.restore();
    });

    /* Player */
    const blink = p.invTime > 0 && Math.floor(Date.now()/120)%2 === 0;
    if (!blink) {
      ctx.save();
      if (!p.facingRight) { ctx.scale(-1,1); ctx.translate(-(p.x*2+p.w),0); }
      if (imgDragao.complete && imgDragao.naturalWidth) {
        ctx.drawImage(imgDragao, p.x, p.y, p.w, p.h);
      } else {
        /* Fallback dragão */
        ctx.fillStyle = p.crouching ? '#A07020' : '#C89030';
        ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, 4); ctx.fill();
        /* Barba */
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath(); ctx.ellipse(p.x+p.w/2,p.y+p.h-4,8,5,0,0,Math.PI); ctx.fill();
        /* Olho */
        ctx.fillStyle='#FFD700'; ctx.beginPath(); ctx.arc(p.x+p.w-6,p.y+8,4,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(p.x+p.w-5,p.y+8,2,0,Math.PI*2); ctx.fill();
        /* Crista */
        for (let i=0;i<4;i++){
          ctx.fillStyle='#8B4513';
          ctx.beginPath(); ctx.moveTo(p.x+4+i*6,p.y); ctx.lineTo(p.x+7+i*6,p.y-8); ctx.lineTo(p.x+10+i*6,p.y); ctx.fill();
        }
      }
      ctx.restore();
    }

    ctx.restore(); /* fim câmera */

    /* ─ UI overlay (sem câmera) ─ */
    /* Mensagem temporária */
    if (G.msgTimer > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, G.msgTimer);
      ctx.fillStyle = '#FFD700';
      ctx.font = '900 16px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(G.msgText, W/2, 60);
      ctx.restore();
    }

    /* Mini mapa de progresso */
    const barW = 180, barH = 6, barX = W/2 - barW/2, barY = canvas.height - 14;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(barX,barY,barW,barH);
    ctx.fillStyle = '#D4A843';
    ctx.fillRect(barX,barY, barW * Math.min(1, G.player.x / 4800), barH);
    ctx.strokeStyle='rgba(212,168,67,0.4)'; ctx.lineWidth=1;
    ctx.strokeRect(barX,barY,barW,barH);
  }

  /* ══ HUD ══ */
  function atualizarHUD() {
    elPts.textContent = String(G.score).padStart(5,'0');
    const m = Math.floor(G.timeLeft/60), s = G.timeLeft%60;
    elTimer.textContent = String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
    elTimer.style.color = G.timeLeft<=30?'#FF4444':'#F5E6C8';
    elVidas.textContent = '❤️'.repeat(G.vidas)+'🖤'.repeat(Math.max(0,3-G.vidas));
  }

  /* ══ ESTRELAS ══ */
  function calcEstrelas() {
    if (G.tempoJogado>=240) return 5;
    if (G.tempoJogado>=180) return 4;
    if (G.score>=220)       return 3;
    if (G.score>=120)       return 2;
    return 1;
  }

  /* ══ GAME OVER ══ */
  function triggerGameOver() {
    G.alive = false;
    clearInterval(progressTimer); clearInterval(speedTimer);
    if (window.AudioEngine) { window.AudioEngine.sfx('gameover'); window.AudioEngine.pararTudo(); }
    const e = calcEstrelas();
    window.Progresso.salvarFase(2, G.score, e, G.tempoJogado);
    document.getElementById('go-score').textContent   = G.score;
    document.getElementById('go-estrelas').textContent = '★'.repeat(e)+'☆'.repeat(5-e);
    document.getElementById('overlay-gameover').classList.add('ativo');
  }

  /* ══ FINALIZAR FASE ══ */
  function finalizarFase() {
    G.alive = false;
    clearInterval(progressTimer); clearInterval(speedTimer);
    if (window.AudioEngine) { window.AudioEngine.sfx('vitoria'); window.AudioEngine.pararTudo(); }
    const e = calcEstrelas();
    window.Progresso.salvarFase(2, G.score, e, G.tempoJogado);
    setTimeout(function(){ window.location.href='resultado.html?fase=2'; }, 800);
  }

  /* ══ PAUSA ══ */
  function togglePausa() {
    if (!G.gameStarted) return;
    G.paused = !G.paused;
    btnPausa.textContent = G.paused ? '▶' : '⏸';
    document.getElementById('overlay-pausa').classList.toggle('ativo', G.paused);
    if (!G.paused) { lastTime = performance.now(); rafId = requestAnimationFrame(loop); }
  }

  /* ══ MENSAGEM TEMPORÁRIA ══ */
  function mostrarMsg(txt, dur) { G.msgText=txt; G.msgTimer=dur; }

  /* ══ CONTROLES ══ */
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape'||e.key==='p'||e.key==='P'){togglePausa();return;}
    keys[e.key]=true;
    if(['ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
    if((e.key==='ArrowUp'||e.key===' '||e.key==='w'||e.key==='W') && keys['_jumpConsumed']===true)
      keys['_jumpConsumed']=false; /* reset on release handled below */
  });
  document.addEventListener('keyup', function(e){
    keys[e.key]=false;
    if(e.key==='ArrowUp'||e.key===' '||e.key==='w'||e.key==='W') keys['_jumpConsumed']=false;
  });

  /* Botões mobile */
  function bindMobileBtn(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('pointerdown', function(e){ keys[key]=true; e.preventDefault(); });
    el.addEventListener('pointerup',   function(){ keys[key]=false; if(key==='ArrowUp') keys['_jumpConsumed']=false; });
    el.addEventListener('pointerleave',function(){ keys[key]=false; });
  }
  bindMobileBtn('mb-left','ArrowLeft');
  bindMobileBtn('mb-right','ArrowRight');
  bindMobileBtn('mb-up','ArrowUp');
  bindMobileBtn('mb-down','ArrowDown');

  /* HUD buttons */
  btnPausa.addEventListener('click', togglePausa);
  btnMudo.addEventListener('click', function(){ mudo=!mudo; btnMudo.textContent=mudo?'🔇':'🔊'; if(window.AudioEngine) window.AudioEngine.setMudo(mudo); });
  document.getElementById('btn-go-retry').addEventListener('click',function(){
    document.getElementById('overlay-gameover').classList.remove('ativo');
    iniciarJogo();
  });
  document.getElementById('btn-go-mapa').addEventListener('click',function(){ window.location.href='mapa.html'; });
  document.getElementById('btn-retomar').addEventListener('click', togglePausa);
  document.getElementById('btn-sair-pausa').addEventListener('click',function(){ window.location.href='mapa.html'; });

  /* ══ INIT ══ */
  document.addEventListener('DOMContentLoaded', function(){
    ctx.fillStyle='#1A3A0A'; ctx.fillRect(0,0,W,canvas.height);
    window.CardEducativo.mostrarCard(2, function(){
      window.CardEducativo.pararSpeech();
      window.CardEducativo.mostrarTutorial(2, function(){ iniciarJogo(); });
    });
  });

  window.PlatformerGame = { iniciarJogo, togglePausa };
})();
