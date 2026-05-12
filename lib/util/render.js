/**
 * lib/util/render.js
 * Répteis da Caatinga – Fase 2
 * Funções de desenho canvas para dragão, escorpião, mapa e HUD.
 * Tenta usar imagens PNG se disponíveis; caso contrário, usa primitivas canvas.
 */
;(function (G) {
  'use strict';

  /* ── Cache de imagens ── */
  var _imgs = {};

  function _loadImg(src) {
    if (_imgs[src]) return _imgs[src];
    var img = new Image();
    img.src = src;
    _imgs[src] = img;
    return img;
  }

  /* ═══════════════════════════════════════════
     DRAGÃO BARBUDO
  ═══════════════════════════════════════════ */
  function drawDragon(ctx, dragon) {
    var img = _loadImg('assets/dragao.png');
    if (img.complete && img.naturalWidth) {
      // Espelhar se movendo para a esquerda
      if (dragon.direction < 0) {
        ctx.save();
        ctx.translate(dragon.xPos + dragon.width, dragon.yPos);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, dragon.width, dragon.height);
        ctx.restore();
      } else {
        ctx.drawImage(img, dragon.xPos, dragon.yPos, dragon.width, dragon.height);
      }
      return;
    }

    /* Fallback canvas */
    var x = dragon.xPos, y = dragon.yPos;
    var w = dragon.width, h = dragon.height;
    var isBig = dragon.bigDragon;
    var isDucking = dragon.state === 'ducking';

    if (isDucking) {
      y += h * 0.4;
      h *= 0.6;
    }

    ctx.save();
    // Corpo
    ctx.fillStyle = isBig ? '#D4A843' : '#C89030';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + h * 0.3, w - 4, h * 0.55, 4);
    ctx.fill();

    // Cabeça
    ctx.fillStyle = '#C89030';
    ctx.beginPath();
    ctx.roundRect(x + (dragon.direction >= 0 ? w * 0.55 : 0), y + h * 0.05, w * 0.45, h * 0.4, 5);
    ctx.fill();

    // Barba (escamas pretas)
    ctx.fillStyle = '#1A1A1A';
    var bx = dragon.direction >= 0 ? x + w * 0.6 : x + 2;
    ctx.beginPath();
    ctx.roundRect(bx, y + h * 0.35, w * 0.38, h * 0.18, 3);
    ctx.fill();

    // Olho
    ctx.fillStyle = '#FF6600';
    var ex = dragon.direction >= 0 ? x + w * 0.8 : x + w * 0.1;
    ctx.beginPath();
    ctx.arc(ex, y + h * 0.18, 3, 0, Math.PI * 2);
    ctx.fill();

    // Patas
    ctx.fillStyle = '#A07020';
    ctx.fillRect(x + 2,     y + h * 0.78, 10, h * 0.22);
    ctx.fillRect(x + w - 12, y + h * 0.78, 10, h * 0.22);

    // Piscar se invulnerável
    if (dragon.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  /* ═══════════════════════════════════════════
     ESCORPIÃO
  ═══════════════════════════════════════════ */
  function drawScorpion(ctx, sc) {
    if (!sc.alive && sc.state !== 'dead') return;

    var img = _loadImg('assets/escorpiao.png');
    if (img.complete && img.naturalWidth) {
      if (sc.state === 'dead') {
        ctx.save();
        ctx.translate(sc.xPos + sc.width / 2, sc.yPos + sc.height / 2);
        ctx.rotate(Math.PI);
        ctx.drawImage(img, -sc.width / 2, -sc.height / 2, sc.width, sc.height);
        ctx.restore();
      } else {
        ctx.drawImage(img, sc.xPos, sc.yPos, sc.width, sc.height);
      }
      return;
    }

    /* Fallback canvas */
    var x = sc.xPos, y = sc.yPos;
    var w = sc.width, h = sc.height;
    if (sc.state === 'dead') { y += h * 0.5; h *= 0.5; }

    ctx.save();
    // Corpo oval
    ctx.fillStyle = '#8B6914';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.55, w * 0.35, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Garras laterais
    ctx.fillStyle = '#6B4A10';
    ctx.fillRect(x,         y + h * 0.3, w * 0.22, h * 0.22); // esq
    ctx.fillRect(x + w * 0.78, y + h * 0.3, w * 0.22, h * 0.22); // dir

    // Cauda com ferrão
    if (sc.state !== 'dead') {
      ctx.strokeStyle = '#8B6914';
      ctx.lineWidth   = 3;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + h * 0.3);
      ctx.quadraticCurveTo(x + w * 0.8, y, x + w * 0.6, y + h * 0.1);
      ctx.stroke();
      // Ferrão vermelho
      ctx.fillStyle = '#FF4500';
      ctx.beginPath();
      ctx.moveTo(x + w * 0.6,  y + h * 0.05);
      ctx.lineTo(x + w * 0.7,  y - h * 0.05);
      ctx.lineTo(x + w * 0.68, y + h * 0.12);
      ctx.closePath();
      ctx.fill();
    }

    // Olhos
    ctx.fillStyle = '#FF0000';
    ctx.beginPath(); ctx.arc(x + w * 0.38, y + h * 0.42, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w * 0.62, y + h * 0.42, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  /* ═══════════════════════════════════════════
     INSETO COLETÁVEL
  ═══════════════════════════════════════════ */
  function drawInsect(ctx, ins) {
    if (!ins.alive) return;
    var pulse = 0.85 + 0.15 * Math.sin(Date.now() / 200 + ins.x);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#44FF44';
    ctx.beginPath();
    ctx.arc(ins.xPos + ins.width / 2, ins.yPos + ins.height / 2, ins.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00BB00';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🦗', ins.xPos + ins.width / 2, ins.yPos + ins.height / 2 + 4);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /* ═══════════════════════════════════════════
     PLATAFORMAS / MAPA
  ═══════════════════════════════════════════ */
  function drawPlatform(ctx, p) {
    // Corpo da plataforma (pedra)
    ctx.fillStyle = '#7A5C28';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    // Borda superior clara
    ctx.fillStyle = '#9A7C48';
    ctx.fillRect(p.x, p.y, p.w, 4);
    // Linhas de pedra
    ctx.strokeStyle = '#5A3C10';
    ctx.lineWidth = 1;
    for (var i = 0; i < p.w; i += 20) {
      ctx.beginPath();
      ctx.moveTo(p.x + i, p.y);
      ctx.lineTo(p.x + i, p.y + p.h);
      ctx.stroke();
    }
  }

  function drawGround(ctx, groundY, worldW, camX) {
    var sx = camX < 0 ? 0 : camX;
    var w  = 800 + 64;
    // Terra principal
    ctx.fillStyle = '#8B5A18';
    ctx.fillRect(sx, groundY, w, 428 - groundY + 10);
    // Faixa topo
    ctx.fillStyle = '#6B3A0A';
    ctx.fillRect(sx, groundY, w, 6);
    // Textura de pedras
    ctx.fillStyle = '#7A4A14';
    for (var i = 0; i < w; i += 32) {
      ctx.fillRect(sx + i, groundY + 8, 28, 10);
      ctx.fillRect(sx + i + 16, groundY + 22, 28, 10);
    }
  }

  function drawBackground(ctx, camX) {
    // Gradiente de céu da caatinga ao entardecer
    var grad = ctx.createLinearGradient(0, 0, 0, 380);
    grad.addColorStop(0,   '#0A0800');
    grad.addColorStop(0.4, '#1A0C00');
    grad.addColorStop(1,   '#3A1800');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 380);

    // Silhuetas de formações rochosas ao fundo
    var parallaxX = camX * 0.3;
    ctx.fillStyle = '#1A0E00';
    var rocks = [
      {x:50,  y:280, w:80,  h:100},
      {x:180, y:300, w:60,  h:80},
      {x:320, y:260, w:100, h:120},
      {x:500, y:290, w:70,  h:90},
      {x:650, y:270, w:90,  h:110},
    ];
    ctx.save();
    ctx.translate(-parallaxX % 800, 0);
    rocks.forEach(function (r) {
      ctx.beginPath();
      ctx.moveTo(r.x, r.y + r.h);
      ctx.lineTo(r.x + r.w / 2, r.y);
      ctx.lineTo(r.x + r.w, r.y + r.h);
      ctx.closePath();
      ctx.fill();
    });
    // Segunda camada
    ctx.translate(800, 0);
    rocks.forEach(function (r) {
      ctx.beginPath();
      ctx.moveTo(r.x, r.y + r.h);
      ctx.lineTo(r.x + r.w / 2, r.y);
      ctx.lineTo(r.x + r.w, r.y + r.h);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    // Mandacarus decorativos (fundo, não colidem)
    var mands = [120, 280, 450, 600, 750, 920, 1080, 1240];
    ctx.fillStyle = '#2A5A10';
    mands.forEach(function (mx) {
      var wx = mx - camX * 0.5;
      if (wx < -30 || wx > 830) return;
      // Tronco
      ctx.fillRect(wx - 5, 300, 10, 60);
      // Braço esq
      ctx.fillRect(wx - 20, 320, 15, 8);
      ctx.fillRect(wx - 20, 308, 8, 14);
      // Braço dir
      ctx.fillRect(wx + 5, 330, 15, 8);
      ctx.fillRect(wx + 12, 318, 8, 14);
    });
  }

  function drawFlag(ctx, flag, camX) {
    var fx = flag.x - camX;
    // Mastro
    ctx.fillStyle = '#8B8B8B';
    ctx.fillRect(fx, flag.y, 4, flag.h);
    // Bandeira
    if (!flag.reached) {
      ctx.fillStyle = '#D4A843';
      ctx.beginPath();
      ctx.moveTo(fx + 4, flag.y);
      ctx.lineTo(fx + 28, flag.y + 10);
      ctx.lineTo(fx + 4, flag.y + 20);
      ctx.closePath();
      ctx.fill();
    }
    // Escudo da caatinga
    ctx.fillStyle = '#3A6B20';
    ctx.fillRect(fx, flag.y + flag.h - 20, 20, 20);
    ctx.fillStyle = '#D4A843';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌵', fx + 10, flag.y + flag.h - 5);
  }

  /* ═══════════════════════════════════════════
     EXPORTAÇÃO
  ═══════════════════════════════════════════ */
  G.MarioGame        = G.MarioGame || {};
  G.MarioGame.Render = {
    drawDragon,
    drawScorpion,
    drawInsect,
    drawPlatform,
    drawGround,
    drawBackground,
    drawFlag,
  };

})(window);
