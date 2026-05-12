const CW = 800, CH = 428;          // canvas width/height
const GRAVITY    = 0.55;            // aceleração por frame
const JUMP_FORCE = -13;             // impulso do pulo
const MAX_FALL   = 14;             // velocidade máxima de queda
const SPD_BASE   = 3.5;            // velocidade horizontal inicial
const SPD_MAX    = 7.0;            // velocidade máxima (após progressão)
const WORLD_W    = 8000;           // largura total do mundo em pixels
const TIMER_MAX  = 300;            // 5 minutos em segundos

// ESTADO GLOBAL
let state = {
  running: false,       // game loop ativo
  paused: false,
  gameOver: false,
  tempoJogado: 0,
  timeLeft: TIMER_MAX,
  score: 0,
  insectsGot: 0,
  lives: 3,
  playerSpeed: SPD_BASE,
  cameraX: 0,           // offset horizontal da câmera
};

let keys = {};          // estado atual do teclado
let lastTime = 0;       // timestamp do último frame
let timerInterval = null;
let speedInterval = null;

// PLAYER (Juquinha)
const player = {
  x: 80, y: 300,        // posição mundo
  w: 28, h: 18,         // hitbox menor e mais justa
  vx: 0, vy: 0,         // velocidade
  onGround: false,
  facingRight: true,
  invincible: false,
  invTimer: 0,
  crouching: false,
  doubleJump: false,     // desbloqueado após 3 insetos
  canDoubleJump: false,
  jumpCount: 0,
  spawnX: 80, spawnY: 300,  // ponto de respawn
};

// Imagem da Juquinha
const juquinhaImg = new Image();
juquinhaImg.src = 'assets/juquinha.png';

// PLATAFORMAS — array de { x, y, w, h }
const PLATFORMS = [
  // Chão principal (cobre todo o mundo)
  { x: 0,    y: 390, w: WORLD_W, h: 38 },

  // Seção 1 (x 0–1600)
  { x: 220,  y: 310, w: 160, h: 20 },
  { x: 450,  y: 260, w: 140, h: 20 },
  { x: 680,  y: 320, w: 120, h: 20 },
  { x: 900,  y: 240, w: 180, h: 20 },
  { x: 1150, y: 300, w: 140, h: 20 },
  { x: 1380, y: 200, w: 120, h: 20 },

  // Seção 2 (x 1600–3200)
  { x: 1650, y: 310, w: 160, h: 20 },
  { x: 1900, y: 240, w: 140, h: 20 },
  { x: 2100, y: 180, w: 100, h: 20 },
  { x: 2320, y: 280, w: 160, h: 20 },
  { x: 2580, y: 200, w: 120, h: 20 },
  { x: 2820, y: 310, w: 180, h: 20 },
  { x: 3050, y: 220, w: 140, h: 20 },

  // Seção 3 — mais difícil (x 3200–5000)
  { x: 3300, y: 290, w: 100, h: 20 },
  { x: 3500, y: 220, w: 100, h: 20 },
  { x: 3700, y: 160, w: 100, h: 20 },
  { x: 3900, y: 250, w: 120, h: 20 },
  { x: 4150, y: 300, w: 160, h: 20 },
  { x: 4400, y: 200, w: 120, h: 20 },
  { x: 4650, y: 280, w: 140, h: 20 },
  { x: 4880, y: 180, w: 100, h: 20 },

  // Seção final (x 5000–8000)
  { x: 5100, y: 310, w: 180, h: 20 },
  { x: 5400, y: 240, w: 160, h: 20 },
  { x: 5700, y: 300, w: 140, h: 20 },
  { x: 6000, y: 200, w: 120, h: 20 },
  { x: 6300, y: 310, w: 160, h: 20 },
  { x: 6600, y: 240, w: 180, h: 20 },
  { x: 6900, y: 180, w: 140, h: 20 },
  { x: 7200, y: 300, w: 120, h: 20 },
  { x: 7500, y: 220, w: 160, h: 20 },
  // Bandeira final
  { x: 7780, y: 300, w: 180, h: 20 },
];

// Bandeira de chegada
const FLAG = { x: 7900, y: 210, w: 20, h: 180 };

// INSETOS (coletáveis) — array de { x, y, w:16, h:16, alive:true }
const INSECTS = PLATFORMS.slice(1).flatMap((p, i) => {
  if (i % 2 !== 0) return [];
  return [
    { x: p.x + p.w/2 - 8, y: p.y - 28, w: 16, h: 16, alive: true },
  ];
});
// Adicionar alguns no chão também
[200,500,800,1200,1800,2400,3000,3600,4200,4800,5500,6200,6900].forEach(x => {
  INSECTS.push({ x, y: 362, w: 16, h: 16, alive: true });
});

// ESCORPIÕES — array de { x, y, w:24, h:20, vx, dir, minX, maxX, alive:true }
const SCORPIONS = [
  { x:350,  y:370, w:24, h:20, vx:0.55, dir:1, minX:280,  maxX:480,  alive:true },
  { x:750,  y:370, w:24, h:20, vx:0.55, dir:-1,minX:650,  maxX:900,  alive:true },
  { x:1200, y:370, w:24, h:20, vx:0.65, dir:1, minX:1100, maxX:1400, alive:true },
  { x:460,  y:240, w:24, h:20, vx:0.55, dir:1, minX:450,  maxX:590,  alive:true },
  { x:1900, y:370, w:24, h:20, vx:0.65, dir:1, minX:1700, maxX:2100, alive:true },
  { x:2100, y:160, w:24, h:20, vx:0.55, dir:-1,minX:2100, maxX:2240, alive:true },
  { x:2900, y:370, w:24, h:20, vx:0.75, dir:1, minX:2700, maxX:3100, alive:true },
  { x:3500, y:200, w:24, h:20, vx:0.65, dir:1, minX:3500, maxX:3640, alive:true },
  { x:4200, y:370, w:24, h:20, vx:0.80, dir:-1,minX:4000, maxX:4400, alive:true },
  { x:5000, y:370, w:24, h:20, vx:0.85, dir:1, minX:4800, maxX:5200, alive:true },
  { x:5700, y:280, w:24, h:20, vx:0.75, dir:1, minX:5700, maxX:5840, alive:true },
  { x:6500, y:370, w:24, h:20, vx:0.90, dir:-1,minX:6300, maxX:6700, alive:true },
];

// FÍSICA

// AABB: checa se dois retângulos se sobrepõem
function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// Aplica gravidade e resolve colisão com plataformas
function updatePhysics(dt) {
  // Gravidade
  player.vy += GRAVITY;
  if (player.vy > MAX_FALL) player.vy = MAX_FALL;

  // Mover verticalmente primeiro
  const prevY = player.y;
  player.y += player.vy;
  player.onGround = false;

  PLATFORMS.forEach(p => {
    if (!overlaps(player, p)) return;

    if (player.vy > 0 && prevY + player.h <= p.y + 4) {
      // Caindo — pousar no topo da plataforma
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
      player.jumpCount = 0;
    } else if (player.vy < 0 && prevY >= p.y + p.h - 4) {
      // Subindo — bater na parte de baixo
      player.y = p.y + p.h;
      player.vy = 0;
    }
  });

  // Mover horizontalmente
  const prevX = player.x;
  player.x += player.vx;

  PLATFORMS.forEach(p => {
    if (!overlaps(player, p)) return;
    // Colisão lateral
    if (prevX + player.w <= p.x) {
      player.x = p.x - player.w;  // parede à direita
    } else if (prevX >= p.x + p.w) {
      player.x = p.x + p.w;       // parede à esquerda
    }
    player.vx = 0;
  });

  // Limitar dentro do mundo
  if (player.x < 0) { player.x = 0; player.vx = 0; }
  if (player.y > CH + 100) respawnPlayer();  // caiu no buraco

  // Câmera segue o jogador (com margem de 300px)
  const targetCam = player.x - CW / 2 + player.w / 2;
  state.cameraX = Math.max(0, Math.min(targetCam, WORLD_W - CW));

  // Invencibilidade timer
  if (player.invincible) {
    player.invTimer -= dt;
    if (player.invTimer <= 0) player.invincible = false;
  }
}

// INPUT — teclas e pulo
document.addEventListener('keydown', e => {
  keys[e.code] = true;

  // Pulo (aceita W, ArrowUp, Space)
  if (['ArrowUp','KeyW','Space'].includes(e.code)) {
    if (player.onGround) {
      player.vy = JUMP_FORCE;
      player.jumpCount = 1;
      if (window.AudioEngine) window.AudioEngine.sfx('coletar');
    } else if (player.doubleJump && player.jumpCount < 2) {
      player.vy = JUMP_FORCE * 0.8;
      player.jumpCount = 2;
    }
    e.preventDefault();
  }

  // Agachar
  if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    player.crouching = true;
  }

  // Pausa
  if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
});

document.addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') player.crouching = false;
});

// Suporte para Controles Mobile (Botões Virtuais na Tela)
function setupMobileControls() {
  const bindBtn = (id, keyCode) => {
    const el = document.getElementById(id);
    if (!el) return;
    const trigger = (val) => (e) => {
      e.preventDefault();
      keys[keyCode] = val;
      
      // Simula o keydown de pulo no touchstart
      if (val && keyCode === 'ArrowUp') {
        if (player.onGround) {
          player.vy = JUMP_FORCE;
          player.jumpCount = 1;
          if (window.AudioEngine) window.AudioEngine.sfx('coletar');
        } else if (player.doubleJump && player.jumpCount < 2) {
          player.vy = JUMP_FORCE * 0.8;
          player.jumpCount = 2;
        }
      }
      // Simula o agachar
      if (keyCode === 'ArrowDown') {
        player.crouching = val;
      }
    };
    el.addEventListener('touchstart', trigger(true), {passive:false});
    el.addEventListener('touchend', trigger(false), {passive:false});
    el.addEventListener('mousedown', trigger(true));
    el.addEventListener('mouseup', trigger(false));
    el.addEventListener('mouseleave', trigger(false));
  };

  bindBtn('btn-left', 'ArrowLeft');
  bindBtn('btn-right', 'ArrowRight');
  bindBtn('btn-jump', 'ArrowUp');
  bindBtn('btn-duck', 'ArrowDown');
}

function updateInput() {
  // Movimento horizontal
  const moving = keys['ArrowLeft'] || keys['KeyA'] ||
                 keys['ArrowRight'] || keys['KeyD'];

  if (keys['ArrowRight'] || keys['KeyD']) {
    player.vx = Math.min(player.vx + 0.5, state.playerSpeed);
    player.facingRight = true;
  } else if (keys['ArrowLeft'] || keys['KeyA']) {
    player.vx = Math.max(player.vx - 0.5, -state.playerSpeed);
    player.facingRight = false;
  } else {
    // Desaceleração (inércia)
    player.vx *= 0.75;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
  }
}

// COLISÕES DE JOGO (inimigos, itens, bandeira)
function checkGameCollisions() {
  // Insetos
  INSECTS.forEach(ins => {
    if (!ins.alive) return;
    if (overlaps(player, ins)) {
      ins.alive = false;
      state.score += 15;
      state.insectsGot++;
      showFloatingText('+15 🦗', ins.x - state.cameraX, ins.y);
      if (window.AudioEngine) window.AudioEngine.sfx('coletar');
      if (state.insectsGot === 3) {
        player.doubleJump = true;
        showMessage('↑↑ Double Jump desbloqueado!', '#88EEFF');
      }
      updateHUD();
    }
  });

  // Escorpiões
  SCORPIONS.forEach(sc => {
    if (!sc.alive || player.invincible) return;
    if (!overlaps(player, sc)) return;

    const stomping = player.vy > 0 && player.y + player.h <= sc.y + 8;

    if (stomping) {
      // Pisou em cima: mata escorpião
      sc.alive = false;
      state.score += 20;
      player.vy = JUMP_FORCE * 0.5;  // bounce
      showFloatingText('+20 🦂', sc.x - state.cameraX, sc.y);
      if (window.AudioEngine) window.AudioEngine.sfx('coletar');
    } else {
      // Toque lateral: perde vida
      playerTakeDamage();
    }
  });

  // Bandeira de chegada
  if (overlaps(player, FLAG)) {
    concludeFase('flag');
  }
}

// Move escorpiões (patrulha)
function updateScorpions() {
  SCORPIONS.forEach(sc => {
    if (!sc.alive) return;
    sc.x += sc.vx * sc.dir;
    if (sc.x <= sc.minX) sc.dir = 1;
    if (sc.x >= sc.maxX) sc.dir = -1;
  });
}

// DANO E VIDAS
function playerTakeDamage() {
  if (player.invincible) return;
  state.lives--;
  updateHUD();
  if (window.AudioEngine) window.AudioEngine.sfx('gameover');

  if (state.lives <= 0) {
    concludeFase('gameover');
    return;
  }
  // Invencibilidade 2s + reposicionar
  player.invincible = true;
  player.invTimer = 2000;
  player.x = Math.max(state.cameraX - 100, player.spawnX);
  player.y = 300;
  player.vx = 0; player.vy = 0;
}

function respawnPlayer() {
  playerTakeDamage();
}

// DESENHO (render)
function draw() {
  const canvas = document.getElementById('canvas-fase2');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, CW, CH);

  // FUNDO: céu da caatinga (gradiente)
  const grad = ctx.createLinearGradient(0, 0, 0, CH);
  grad.addColorStop(0, '#060A14');
  grad.addColorStop(1, '#3A1800');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  // PARALLAX — montanhas e cactos ao fundo (scrollFactor 0.3)
  drawBackground(ctx, state.cameraX);

  ctx.save();
  ctx.translate(-state.cameraX, 0);  // aplica câmera

  // PLATAFORMAS
  PLATFORMS.forEach(p => {
    // Só desenha se visível
    if (p.x + p.w < state.cameraX - 10 || p.x > state.cameraX + CW + 10) return;
    // Topo iluminado
    ctx.fillStyle = '#9A7C48'; ctx.fillRect(p.x, p.y, p.w, 6);
    // Corpo rochoso
    ctx.fillStyle = '#7A5C28'; ctx.fillRect(p.x, p.y + 6, p.w, p.h - 6);
    // Sombra base
    ctx.fillStyle = '#5A3C08'; ctx.fillRect(p.x, p.y + p.h - 4, p.w, 4);
    // Musgo verde no topo
    ctx.fillStyle = 'rgba(58,107,32,0.5)'; ctx.fillRect(p.x, p.y, p.w, 3);
  });

  // BANDEIRA
  ctx.fillStyle = '#6B4010'; ctx.fillRect(FLAG.x, FLAG.y, 8, FLAG.h);
  ctx.fillStyle = '#FF4500'; ctx.fillRect(FLAG.x + 8, FLAG.y + 4, 40, 22);
  ctx.fillStyle = '#FFD700'; ctx.fillRect(FLAG.x + 8, FLAG.y + 4, 14, 8);

  // INSETOS
  INSECTS.forEach(ins => {
    if (!ins.alive) return;
    if (ins.x + ins.w < state.cameraX || ins.x > state.cameraX + CW) return;
    // Círculo verde com pulsação
    const pulse = 0.85 + Math.sin(Date.now() / 300) * 0.15;
    ctx.fillStyle = `rgba(34,139,34,${pulse})`;
    ctx.beginPath(); ctx.arc(ins.x + 8, ins.y + 8, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#88FF88'; ctx.fillRect(ins.x + 3, ins.y + 3, 5, 5);
  });

  // ESCORPIÕES
  SCORPIONS.forEach(sc => {
    if (!sc.alive) return;
    if (sc.x + sc.w < state.cameraX || sc.x > state.cameraX + CW) return;
    drawScorpion(ctx, sc);
  });

  // JUQUINHA (player)
  drawPlayer(ctx);

  ctx.restore();  // remove câmera
}

function drawPlayer(ctx) {
  const drawW = 98, drawH = 36;
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  
  ctx.save();
  
  if (player.invincible) {
    ctx.globalAlpha = Math.floor(Date.now() / 120) % 2 === 0 ? 0.3 : 1;
  }
  
  if (state.lives <= 0) {
    ctx.globalAlpha = 0.5;
  }

  if (juquinhaImg.complete && juquinhaImg.naturalWidth > 0) {
    ctx.translate(cx, cy);

    // Morte = rotacionar 90 graus
    if (state.lives <= 0) {
      ctx.rotate(Math.PI / 2);
    } else {
      // Pulando = empinar 15 graus para cima
      if (!player.onGround && !player.crouching) {
        ctx.rotate(player.facingRight ? -0.26 : 0.26);
      }
      // Agachando = inclinar levemente
      if (player.crouching) {
        ctx.rotate(player.facingRight ? 0.15 : -0.15);
      }
    }

    if (!player.facingRight) {
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(juquinhaImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  } else {
    // Fallback: retângulo amarelo
    ctx.fillStyle = '#E8D878';
    ctx.beginPath(); ctx.roundRect(player.x, player.y, player.w, player.h, 6); ctx.fill();
    ctx.restore();
  }
}

function drawScorpion(ctx, sc) {
  ctx.fillStyle = '#B8860B';
  ctx.beginPath(); ctx.ellipse(sc.x+12, sc.y+10, 10, 7, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#9A7008';
  ctx.fillRect(sc.x, sc.y+6, 6, 10);   // garra esq
  ctx.fillRect(sc.x+18, sc.y+6, 6, 10); // garra dir
  ctx.fillRect(sc.x+10, sc.y+16, 4, 6); // cauda
  ctx.fillStyle = '#FF4500'; ctx.fillRect(sc.x+12, sc.y+20, 4, 4); // ferrão
  ctx.fillStyle = '#FF8800'; ctx.fillRect(sc.x+8, sc.y+6, 3, 3); ctx.fillRect(sc.x+13, sc.y+6, 3, 3);
}

function drawBackground(ctx, camX) {
  // Mandacarus silhueta (parallax 0.3)
  const offX = camX * 0.3;
  ctx.fillStyle = '#0A0500';
  [100,350,600,850,1100,1350,1600].forEach(bx => {
    const rx = (bx - offX % 1800 + 1800) % 1800;
    ctx.fillRect(rx + 10, 280, 10, 120);
    ctx.fillRect(rx - 10, 320, 14, 8); ctx.fillRect(rx - 10, 310, 6, 12);
    ctx.fillRect(rx + 22, 330, 14, 8); ctx.fillRect(rx + 26, 320, 6, 12);
  });
}

// GAME LOOP principal
function gameLoop(timestamp) {
  if (!state.running) return;
  if (state.paused) { requestAnimationFrame(gameLoop); return; }

  const dt = Math.min(timestamp - lastTime, 50);  // limita delta a 50ms
  lastTime = timestamp;

  updateInput();
  updatePhysics(dt);
  updateScorpions();
  checkGameCollisions();
  draw();
  updateHUD();

  requestAnimationFrame(gameLoop);
}

// INÍCIO, CONCLUSÃO E INTEGRAÇÃO
function iniciarJogo() {
  state.running = true;
  if (window.AudioEngine) window.AudioEngine.tocarTrack('gameplay');

  // Timer de 5 minutos
  timerInterval = setInterval(() => {
    if (state.paused || !state.running) return;
    state.timeLeft--;
    state.tempoJogado++;
    if (state.timeLeft <= 0) concludeFase('timeout');
  }, 1000);

  // Progressão de velocidade (a cada 30s)
  speedInterval = setInterval(() => {
    state.playerSpeed = Math.min(state.playerSpeed + 0.2, SPD_MAX);
    SCORPIONS.forEach(sc => { sc.vx = Math.min(sc.vx + 0.06, 1.4); });
  }, 30000);

  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function concludeFase(motivo) {
  if (!state.running) return;
  state.running = false;
  clearInterval(timerInterval); clearInterval(speedInterval);
  if (window.AudioEngine) {
    window.AudioEngine.sfx(motivo === 'gameover' ? 'gameover' : 'vitoria');
    window.AudioEngine.tocarTrack('menu');
  }
  const stars = calcEstrelas();
  window.Progresso.salvarFase(2, state.score, stars, state.tempoJogado);
  setTimeout(() => { window.location.href = 'resultado.html?fase=2'; }, 2000);
}

function calcEstrelas() {
  const t = state.tempoJogado;
  if (t >= 240) return 5;
  if (t >= 180) return 4;
  if (state.score >= 300) return 3;
  if (state.score >= 150) return 2;
  return 1;
}

// Textos flutuantes de pontuação
function showFloatingText(txt, x, y) {
  const el = document.createElement('div');
  el.textContent = txt;
  el.style.cssText = `position:fixed;left:${x}px;top:${y+52}px;
    font-family:'Press Start 2P';font-size:10px;color:#FFD700;
    pointer-events:none;z-index:100;transition:all 0.8s ease`;
  document.body.appendChild(el);
  setTimeout(() => { el.style.transform='translateY(-40px)'; el.style.opacity='0'; }, 50);
  setTimeout(() => el.remove(), 900);
}

function showMessage(txt, color) {
  showFloatingText(txt, CW/2 - 100, CH/2);
}

// HUD
function updateHUD() {
  const m = Math.floor(state.timeLeft / 60);
  const s = String(state.timeLeft % 60).padStart(2, '0');
  
  const scoreEl = document.getElementById('h2-score');
  if(scoreEl) scoreEl.textContent = `PONTOS: ${state.score}`;
  
  const timerEl = document.getElementById('h2-timer');
  if(timerEl) {
    timerEl.textContent = `${m}:${s}`;
    timerEl.style.color = state.timeLeft <= 30 ? '#FF4444' : '#F5E6C8';
  }
  
  const insetosEl = document.getElementById('h2-insetos');
  if(insetosEl) insetosEl.textContent = `🦗 ${state.insectsGot}`;
  
  const vidasEl = document.getElementById('h2-vidas');
  if(vidasEl) {
    const corações = ['❤️','❤️','❤️'].map((h,i) => i < state.lives ? '❤️' : '🖤').join(' ');
    vidasEl.textContent = corações;
  }
}

// Mudo
const mudoBtn = document.getElementById('h2-mudo');
if (mudoBtn) {
  mudoBtn.addEventListener('click', () => {
    if (window.AudioEngine) {
      const mudo = window.AudioEngine.toggleMudo();
      mudoBtn.textContent = mudo ? '🔇' : '🔊';
    }
  });
}

// Pausa
function togglePause() {
  state.paused = !state.paused;
  const ov = document.getElementById('overlay-fase2');
  if (!ov) return;
  
  ov.style.display = state.paused ? 'flex' : 'none';
  if (state.paused) {
    ov.innerHTML = `
      <p style="font-family:'Press Start 2P';color:#FFD700;font-size:14px">⏸ PAUSA</p>
      <p style="font-family:Teko;font-size:18px;color:#F5E6C8;text-align:center;">
        Dragão Barbudo · Pogona vitticeps<br>
        Quando ameaçado, infla a barba preta!
      </p>
      <button id="btn-continue-pause" style="font-family:'Press Start 2P';font-size:10px;
        padding:12px 24px;background:#D4A843;border:none;cursor:pointer">CONTINUAR</button>
      <button id="btn-mapa-pause" style="font-family:'Press Start 2P';
        font-size:9px;padding:10px 20px;background:transparent;border:2px solid #D4A843;
        color:#D4A843;cursor:pointer">◀ MAPA</button>`;
        
    document.getElementById('btn-continue-pause').addEventListener('click', togglePause);
    document.getElementById('btn-mapa-pause').addEventListener('click', () => window.location.href='mapa.html');
  }
}

// Entrada via card educativo → tutorial → contagem → jogo
document.addEventListener('DOMContentLoaded', () => {
  setupMobileControls(); // Ativa botões mobile
  
  if (window.CardEducativo) {
    window.CardEducativo.mostrarCard(2, () => {
      window.CardEducativo.pararSpeech();
      window.CardEducativo.mostrarTutorial(2, () => {
        // Contagem 3,2,1,JÁ!
        const steps = ['3','2','1','JÁ!'];
        let i = 0;
        const ov = document.getElementById('overlay-fase2');
        if(!ov) return iniciarJogo();
        
        ov.style.display = 'flex';
        ov.innerHTML = '<span id="cnt" style="font-family:\'Press Start 2P\';font-size:80px;color:#FFD700">3</span>';
        const iv = setInterval(() => {
          i++;
          if (i < steps.length) {
            document.getElementById('cnt').textContent = steps[i];
          } else {
            clearInterval(iv);
            ov.style.display = 'none';
            iniciarJogo();
          }
        }, 1000);
      });
    });
  } else {
    iniciarJogo();
  }
});
