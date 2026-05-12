/**
 * lib/map/caatinga_level.js
 * Répteis da Caatinga – Fase 2
 * Dados do level: plataformas, escorpiões, insetos, bandeira.
 * Substitui level_1-1.js do mario_js-master.
 */
;(function (G) {
  'use strict';

  /* ── Constantes do level ── */
  var GROUND_Y  = 404;
  var WORLD_W   = 800 * 3;                       // 2400px (mesma escala ×3 do original)

  /* ── Helper: criar inseto ── */
  function ins(x, y) {
    return { xPos: x, yPos: y, width: 20, height: 20, alive: true, type: 'insect', special: false };
  }

  function insSpecial(x, y) {
    return { xPos: x, yPos: y, width: 24, height: 24, alive: true, type: 'insect', special: true };
  }

  /* ── Dados do level ── */
  var CaatingaLevel = {

    WORLD_W: WORLD_W,

    /* Spawn do dragão */
    dragonSpawn: { x: 64, y: GROUND_Y - 60 },

    /* Bandeira (conclusão) */
    flag: {
      x: WORLD_W - 80,
      y: GROUND_Y - 200,
      h: 200,
      reached: false,
    },

    /* Plataformas (pedras da caatinga) */
    platforms: [
      // Seção 1 (0 – 400px)
      { x: 180, y: 340, w: 100, h: 20 },
      { x: 310, y: 290, w: 120, h: 20 },
      { x: 420, y: 250, w: 80,  h: 20 },

      // Seção 2 (400 – 800px)
      { x: 560, y: 320, w: 110, h: 20 },
      { x: 680, y: 270, w: 90,  h: 20 },
      { x: 800, y: 230, w: 100, h: 20 },
      { x: 900, y: 290, w: 80,  h: 20 },

      // Seção 3 (800 – 1200px)
      { x: 1000, y: 310, w: 120, h: 20 },
      { x: 1140, y: 250, w: 100, h: 20 },
      { x: 1260, y: 210, w: 90,  h: 20 },
      { x: 1360, y: 270, w: 80,  h: 20 },

      // Seção 4 (1200 – 1600px)
      { x: 1480, y: 330, w: 100, h: 20 },
      { x: 1600, y: 280, w: 120, h: 20 },
      { x: 1720, y: 240, w: 100, h: 20 },
      { x: 1840, y: 300, w: 80,  h: 20 },

      // Seção 5 (1600 – 2000px)
      { x: 1960, y: 250, w: 120, h: 20 },
      { x: 2080, y: 200, w: 100, h: 20 },
      { x: 2200, y: 260, w: 90,  h: 20 },
      { x: 2300, y: 310, w: 80,  h: 20 },

      // Final (2000 – 2400px)
      { x: 2400, y: 280, w: 100, h: 20 },
      { x: 2520, y: 230, w: 120, h: 20 },
    ],

    /* Escorpiões (12) */
    scorpions: [
      { xPos: 350,  yPos: GROUND_Y - 30, w: 36, h: 30 },
      { xPos: 520,  yPos: GROUND_Y - 30, w: 36, h: 30 },
      { xPos: 700,  yPos: 270 - 30,      w: 36, h: 30 },
      { xPos: 850,  yPos: GROUND_Y - 30, w: 36, h: 30 },
      { xPos: 1050, yPos: 310 - 30,      w: 36, h: 30 },
      { xPos: 1200, yPos: GROUND_Y - 30, w: 36, h: 30 },
      { xPos: 1400, yPos: 270 - 30,      w: 36, h: 30 },
      { xPos: 1550, yPos: GROUND_Y - 30, w: 36, h: 30 },
      { xPos: 1750, yPos: 240 - 30,      w: 36, h: 30 },
      { xPos: 1900, yPos: GROUND_Y - 30, w: 36, h: 30 },
      { xPos: 2100, yPos: 200 - 30,      w: 36, h: 30 },
      { xPos: 2300, yPos: GROUND_Y - 30, w: 36, h: 30 },
    ],

    /* Insetos coletáveis (20) — distribuídos nas plataformas */
    insects: [
      ins(200, 320),   ins(340, 270),   ins(440, 230),
      ins(580, 300),   ins(700, 250),   ins(820, 210),
      ins(920, 270),   ins(1020, 290),  ins(1160, 230),
      ins(1280, 190),  ins(1500, 310),  ins(1620, 260),
      ins(1740, 220),  ins(1860, 280),  ins(1980, 230),
      ins(2100, 180),  ins(2220, 240),  ins(2320, 290),
      ins(2420, 260),  insSpecial(1300, 180), // especial → dragon.powerUp()
    ],
  };

  G.MarioGame              = G.MarioGame || {};
  G.MarioGame.CaatingaLevel = CaatingaLevel;

})(window);
