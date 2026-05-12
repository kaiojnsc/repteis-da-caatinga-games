/**
 * js/snake.js – Fase 1: Jogo da Cobra (Juquinha)
 * Répteis da Caatinga – O Museu Vivo
 */
;(function () {
  'use strict';

  /* ══ CONSTANTES ══ */
  const CELL      = 32;
  const COLS      = 25;
  const ROWS      = 13;
  const TIMER_MAX = 300;
  const DELAY_BASE= 155;
  const DELAY_TURB= 78;

  const MANDACARUS = [
    {c:3,r:2},{c:8,r:10},{c:13,r:5},
    {c:18,r:2},{c:21,r:9},{c:6,r:6}
  ];

  /* Conjunto para lookup rápido */
  const MANDU_SET = new Set(MANDACARUS.map(m => m.c + ',' + m.r));

  /* ══ ELEMENTOS DOM ══ */
  const canvas  = document.getElementById('gameCanvas');
  const ctx     = canvas.getContext('2d');
  const elPts   = document.getElementById('hud-pontos');
  const elTimer = document.getElementById('hud-timer');
  const elTamanho = document.getElementById('hud-tamanho');
  const btnPausa  = document.getElementById('btn-pausa');
  const btnMudo   = document.getElementById('btn-mudo');

  /* ══ IMAGEM DA JUQUINHA ══ */
  const juquinhaImg = new Image();
  juquinhaImg.src = 'assets/juquinha.png';
  let imgCarregada = false;
  juquinhaImg.onload = function () { imgCarregada = true; };

  /* ══ ESTADO ══ */
  let S = criarEstado();
  let loopId   = null;
  let timerId  = null;
  let mudo     = false;
  let pulsoT   = 0;   // para animação do power-up

  function criarEstado() {
    return {
      snake:       [{c:12, r:6},{c:11,r:6},{c:10,r:6}],
      direction:   {dc:1, dr:0},
      nextDir:     {dc:1, dr:0},
      score:       0,
      tamanho:     3,
      food:        null,
      powerup:     null,
      racoesCom:   0,
      timeLeft:    TIMER_MAX,
      tempoJogado: 0,
      turbo:       false,
      turboTimer:  0,
      alive:       true,
      paused:      false,
      gameStarted: false,
    };
  }

  /* ══ INÍCIO ══ */
  function iniciarJogo() {
    S = criarEstado();
    S.gameStarted = true;
    S.food = gerarComida();
    atualizarHUD();
    pararTimers();
    if (window.AudioEngine) window.AudioEngine.tocarTrack('gameplay');
    agendarPasso();
    timerId = setInterval(tickTimer, 1000);
  }

  function agendarPasso() {
    const delay = S.turbo ? DELAY_TURB : DELAY_BASE;
    loopId = setTimeout(passo, delay);
  }

  function pararTimers() {
    clearTimeout(loopId);
    clearInterval(timerId);
    loopId = null;
    timerId = null;
  }

  /* ══ TIMER ══ */
  function tickTimer() {
    if (!S.alive || S.paused) return;
    S.timeLeft    = Math.max(0, S.timeLeft - 1);
    S.tempoJogado++;
    if (S.turbo) {
      S.turboTimer--;
      if (S.turboTimer <= 0) { S.turbo = false; }
    }
    atualizarHUD();
    if (S.timeLeft <= 0) finalizarFase();
  }

  /* ══ PASSO DO JOGO ══ */
  function passo() {
    if (!S.alive || S.paused) return;

    S.direction = S.nextDir;
    const head = S.snake[0];
    const novo = { c: head.c + S.direction.dc, r: head.r + S.direction.dr };

    /* Colisão parede */
    if (novo.c < 0 || novo.c >= COLS || novo.r < 0 || novo.r >= ROWS) {
      return triggerGameOver('Bateu na parede!');
    }
    /* Colisão mandacaru */
    if (MANDU_SET.has(novo.c + ',' + novo.r)) {
      return triggerGameOver('Espetou no mandacaru!');
    }
    /* Colisão corpo (exceto cauda que vai sair) */
    for (let i = 0; i < S.snake.length - 1; i++) {
      if (S.snake[i].c === novo.c && S.snake[i].r === novo.r) {
        return triggerGameOver('Mordeu o próprio rabo!');
      }
    }

    S.snake.unshift(novo);

    /* Comer ração */
    if (S.food && novo.c === S.food.c && novo.r === S.food.r) {
      S.score    += 10;
      S.tamanho++;
      S.racoesCom++;
      S.food = gerarComida();
      if (window.AudioEngine) window.AudioEngine.sfx('coletar');
      /* Gerar power-up a cada 5 rações */
      if (S.racoesCom % 5 === 0) S.powerup = gerarComida();
    } else if (S.powerup && novo.c === S.powerup.c && novo.r === S.powerup.r) {
      /* Comer power-up */
      S.score    += 20;
      S.turbo     = true;
      S.turboTimer= 3;
      S.powerup   = null;
    } else {
      S.snake.pop();
    }

    atualizarHUD();
    desenhar();
    agendarPasso();
  }

  /* ══ POSIÇÃO ALEATÓRIA LIVRE ══ */
  function gerarComida() {
    let pos;
    do {
      pos = { c: Math.floor(Math.random() * COLS), r: Math.floor(Math.random() * ROWS) };
    } while (
      MANDU_SET.has(pos.c + ',' + pos.r) ||
      S.snake.some(s => s.c === pos.c && s.r === pos.r) ||
      (S.food   && S.food.c   === pos.c && S.food.r   === pos.r) ||
      (S.powerup && S.powerup.c === pos.c && S.powerup.r === pos.r)
    );
    return pos;
  }

  /* ══ HUD ══ */
  function atualizarHUD() {
    elPts.textContent     = String(S.score).padStart(5, '0');
    elTamanho.textContent = S.tamanho;
    const m = Math.floor(S.timeLeft / 60);
    const s = S.timeLeft % 60;
    elTimer.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    elTimer.style.color = S.timeLeft <= 30 ? '#FF4444' : '#F5E6C8';
  }

  /* ══ DESENHO ══ */
  function desenhar() {
    pulsoT += 0.08;

    /* Fundo — areia */
    ctx.fillStyle = '#A87020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* Grid sutil */
    ctx.strokeStyle = 'rgba(122,80,0,0.15)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, ROWS * CELL); ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(COLS * CELL, r * CELL); ctx.stroke();
    }

    /* Mandacarus */
    MANDACARUS.forEach(m => desenharMandacaru(m.c, m.r));

    /* Ração */
    if (S.food) desenharRacao(S.food.c, S.food.r);

    /* Power-up */
    if (S.powerup) desenharPowerup(S.powerup.c, S.powerup.r);

    /* Cobra */
    desenharCobra();
  }

  function celX(c) { return c * CELL; }
  function celY(r) { return r * CELL; }

  function desenharMandacaru(c, r) {
    const x = celX(c), y = celY(r);
    /* Tronco */
    ctx.fillStyle = '#2A6B15';
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 2, 12, CELL - 2, 3);
    ctx.fill();
    /* Ramo esquerdo */
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 10, 8, 6, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 4, 6, 12, 2);
    ctx.fill();
    /* Ramo direito */
    ctx.beginPath();
    ctx.roundRect(x + 22, y + 12, 8, 6, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + 24, y + 6, 6, 14, 2);
    ctx.fill();
    /* Sombra */
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(x + 16, y + CELL - 1, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function desenharRacao(c, r) {
    const x = celX(c) + CELL/2, y = celY(r) + CELL/2;
    /* Sombra */
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(x+2, y+3, 7, 4, 0, 0, Math.PI*2); ctx.fill();
    /* Corpo */
    ctx.fillStyle = '#6A3210';
    ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI*2); ctx.fill();
    /* Brilho */
    ctx.fillStyle = '#C87040';
    ctx.beginPath(); ctx.arc(x-2, y-2, 3, 0, Math.PI*2); ctx.fill();
  }

  function desenharPowerup(c, r) {
    const x = celX(c) + CELL/2, y = celY(r) + CELL/2;
    const pulso = 1 + Math.sin(pulsoT) * 0.2;
    /* Glow */
    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur  = 12 * pulso;
    ctx.fillStyle   = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y, 9 * pulso, 0, Math.PI*2);
    ctx.fill();
    /* Estrela */
    ctx.fillStyle = '#FFF8DC';
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', x, y);
    ctx.restore();
  }

  function desenharCobra() {
    S.snake.forEach(function (seg, i) {
      const sx = celX(seg.c) + 2;
      const sy = celY(seg.r) + 2;
      const w  = CELL - 4;
      const h  = CELL - 4;

      if (i === 0) {
        /* ── CABEÇA: imagem da Juquinha com rotação ── */
        if (imgCarregada) {
          const cx = seg.c * CELL + CELL / 2;
          const cy = seg.r * CELL + CELL / 2;
          const imgW = CELL * 2.2;
          const imgH = CELL * 1.2;

          ctx.save();
          ctx.translate(cx, cy);

          /* Rotacionar conforme direção do movimento */
          if      (S.direction.dc ===  1) ctx.rotate(0);              // direita (padrão)
          else if (S.direction.dc === -1) ctx.rotate(Math.PI);        // esquerda
          else if (S.direction.dr === -1) ctx.rotate(-Math.PI / 2);   // cima
          else if (S.direction.dr ===  1) ctx.rotate(Math.PI / 2);    // baixo

          /* Modo turbo: leve brilho dourado sobre a imagem */
          if (S.turbo) {
            ctx.shadowColor = '#80FF80';
            ctx.shadowBlur  = 10;
          }

          ctx.drawImage(juquinhaImg, -imgW / 2, -imgH / 2, imgW, imgH);
          ctx.restore();

        } else {
          /* Fallback: retângulo creme até a imagem carregar */
          ctx.fillStyle = S.turbo ? '#80FF80' : '#F5EED0';
          ctx.beginPath();
          ctx.roundRect(sx, sy, w, h, 6);
          ctx.fill();
        }

      } else {
        /* ── CORPO: textura recortada da imagem da Juquinha ── */
        if (imgCarregada) {
          const cx = seg.c * CELL + CELL / 2;
          const cy = seg.r * CELL + CELL / 2;
          const imgW = CELL * 1.5; // tamanho de encaixe do corpo
          const imgH = CELL * 1.0;
          
          ctx.save();
          ctx.translate(cx, cy);

          // Descobrir a direção orientada pelo segmento da frente
          let angulo = 0;
          let prev = S.snake[i - 1];
          if (prev.c > seg.c && prev.c - seg.c === 1) angulo = 0; // Indo pra direita
          else if (prev.c < seg.c && seg.c - prev.c === 1) angulo = Math.PI; // Esquerda
          else if (prev.r > seg.r && prev.r - seg.r === 1) angulo = Math.PI / 2; // Baixo
          else if (prev.r < seg.r && seg.r - prev.r === 1) angulo = -Math.PI / 2; // Cima
          else {
            // Em caso de teleporte pela borda da tela, usa a direção da cabeça
            if      (S.direction.dc ===  1) angulo = 0;
            else if (S.direction.dc === -1) angulo = Math.PI;
            else if (S.direction.dr === -1) angulo = -Math.PI / 2;
            else if (S.direction.dr ===  1) angulo = Math.PI / 2;
          }
          
          ctx.rotate(angulo);

          if (S.turbo) {
            ctx.shadowColor = '#80FF80';
            ctx.shadowBlur  = 10;
          }

          // Recortar um pedaço central da juquinha.png (escamas do meio)
          const nw = juquinhaImg.naturalWidth;
          const nh = juquinhaImg.naturalHeight;
          const sw = nw * 0.35;
          const sh = nh * 0.7;
          
          if (i === S.snake.length - 1) {
            // Rabo (terço final esquerdo da imagem)
            ctx.drawImage(juquinhaImg, 0, (nh-sh)/2, sw, sh, -imgW/2, -imgH/2, imgW, imgH);
          } else {
            // Meio do corpo (terço central)
            ctx.drawImage(juquinhaImg, nw*0.33, (nh-sh)/2, sw, sh, -imgW/2, -imgH/2, imgW, imgH);
          }
          
          ctx.restore();
        } else {
          /* Fallback: Quadrados ── */
          ctx.fillStyle = i % 2 === 0 ? '#F5EED0' : '#E8D878';
          ctx.beginPath();
          ctx.roundRect(sx, sy, w, h, 5);
          ctx.fill();

          /* Brilho suave no segmento */
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.fillRect(sx + 3, sy + 3, w / 2, h / 3);

          /* Escama decorativa */
          ctx.fillStyle = 'rgba(0,0,0,0.05)';
          ctx.beginPath();
          ctx.ellipse(sx + w / 2, sy + h / 2, w / 3, h / 4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  }

  /* ══ CALC ESTRELAS ══ */
  function calcEstrelas() {
    if (S.tempoJogado >= 240) return 5;
    if (S.tempoJogado >= 180) return 4;
    if (S.score >= 220) return 3;
    if (S.score >= 120) return 2;
    return 1;
  }

  /* ══ GAME OVER ══ */
  function triggerGameOver(motivo) {
    S.alive = false;
    pararTimers();
    if (window.AudioEngine) { window.AudioEngine.sfx('gameover'); window.AudioEngine.pararTudo(); }
    const estrelas = calcEstrelas();
    window.Progresso.salvarFase(1, S.score, estrelas, S.tempoJogado);
    mostrarOverlayGameOver(motivo, estrelas);
  }

  function mostrarOverlayGameOver(motivo, estrelas) {
    const el = document.getElementById('overlay-gameover');
    document.getElementById('go-motivo').textContent  = motivo;
    document.getElementById('go-score').textContent   = S.score;
    document.getElementById('go-estrelas').textContent = '★'.repeat(estrelas) + '☆'.repeat(5 - estrelas);
    el.style.display = 'flex';
  }

  /* ══ FINALIZAR FASE (tempo esgotado) ══ */
  function finalizarFase() {
    S.alive = false;
    pararTimers();
    if (window.AudioEngine) { window.AudioEngine.sfx('vitoria'); window.AudioEngine.pararTudo(); }
    const estrelas = calcEstrelas();
    window.Progresso.salvarFase(1, S.score, estrelas, S.tempoJogado);
    setTimeout(function () { window.location.href = 'resultado.html?fase=1'; }, 800);
  }

  /* ══ PAUSA ══ */
  function togglePausa() {
    if (!S.alive || !S.gameStarted) return;
    S.paused = !S.paused;
    btnPausa.textContent = S.paused ? '▶' : '⏸';
    document.getElementById('overlay-pausa').style.display = S.paused ? 'flex' : 'none';
    if (!S.paused) {
      agendarPasso();
      timerId = setInterval(tickTimer, 1000);
    } else {
      pararTimers();
    }
  }

  /* ══ CONTROLES TECLADO ══ */
  const DIRS = {
    ArrowUp:    {dc:0,dr:-1}, w:{dc:0,dr:-1}, W:{dc:0,dr:-1},
    ArrowDown:  {dc:0,dr:1},  s:{dc:0,dr:1},  S:{dc:0,dr:1},
    ArrowLeft:  {dc:-1,dr:0}, a:{dc:-1,dr:0}, A:{dc:-1,dr:0},
    ArrowRight: {dc:1,dr:0},  d:{dc:1,dr:0},  D:{dc:1,dr:0},
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      togglePausa(); return;
    }
    const d = DIRS[e.key];
    if (!d) return;
    e.preventDefault();
    /* Impede inversão de 180° */
    if (d.dc !== -S.direction.dc || d.dr !== -S.direction.dr) {
      S.nextDir = d;
    }
  });

  /* ══ SWIPE TOUCH ══ */
  let touchX = 0, touchY = 0;
  canvas.addEventListener('touchstart', function (e) {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
    e.preventDefault();
  }, {passive: false});
  canvas.addEventListener('touchend', function (e) {
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    let d;
    if (Math.abs(dx) > Math.abs(dy)) {
      d = dx > 0 ? DIRS.ArrowRight : DIRS.ArrowLeft;
    } else {
      d = dy > 0 ? DIRS.ArrowDown : DIRS.ArrowUp;
    }
    if (d.dc !== -S.direction.dc || d.dr !== -S.direction.dr) S.nextDir = d;
    e.preventDefault();
  }, {passive: false});

  /* ══ BOTÕES HUD ══ */
  btnPausa.addEventListener('click', togglePausa);
  btnMudo.addEventListener('click', function () {
    mudo = !mudo;
    btnMudo.textContent = mudo ? '🔇' : '🔊';
    if (window.AudioEngine) window.AudioEngine.setMudo(mudo);
  });

  document.getElementById('btn-go-retry').addEventListener('click', function () {
    document.getElementById('overlay-gameover').style.display = 'none';
    iniciarJogo();
  });
  document.getElementById('btn-go-mapa').addEventListener('click', function () {
    window.location.href = 'mapa.html';
  });
  document.getElementById('btn-retomar').addEventListener('click', togglePausa);
  document.getElementById('btn-sair-pausa').addEventListener('click', function () {
    window.location.href = 'mapa.html';
  });

  /* ══ LOOP DE ANIMAÇÃO (só para o canvas — o passo usa setTimeout) ══ */
  function renderLoop() {
    if (S.gameStarted && S.alive && !S.paused) desenhar();
    requestAnimationFrame(renderLoop);
  }
  requestAnimationFrame(renderLoop);

  /* ══ FLUXO INICIAL ══ */
  document.addEventListener('DOMContentLoaded', function () {
    /* Desenha tela inicial no canvas enquanto aguarda card */
    ctx.fillStyle = '#A87020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(13,5,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    window.CardEducativo.mostrarCard(1, function () {
      window.CardEducativo.pararSpeech();
      window.CardEducativo.mostrarTutorial(1, function () {
        iniciarJogo();
      });
    });
  });

  /* Expõe para os botões inline, se necessário */
  window.SnakeGame = { iniciarJogo, togglePausa };

})();
