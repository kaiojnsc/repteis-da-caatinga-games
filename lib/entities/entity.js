/**
 * lib/entities/entity.js
 * Répteis da Caatinga – Fase 2
 * Classe base para todas as entidades do jogo.
 */
;(function (G) {
  'use strict';

  function Entity(opts) {
    opts = opts || {};
    this.xPos      = opts.xPos      || 0;
    this.yPos      = opts.yPos      || 0;
    this.width     = opts.width     || 32;
    this.height    = opts.height    || 32;
    this.velX      = opts.velX      || 0;
    this.velY      = opts.velY      || 0;
    this.direction = opts.direction || 1;   // 1 = direita, -1 = esquerda
    this.type      = opts.type      || 'entity';
    this.alive     = (opts.alive !== undefined) ? opts.alive : true;
    this.state     = opts.state     || 'standing';
    this.onGround  = false;
  }

  Entity.prototype.update = function (/*dt*/) {
    // Override em subclasses
  };

  Entity.prototype.draw = function (/*ctx, camX*/) {
    // Override em subclasses
  };

  G.MarioGame        = G.MarioGame || {};
  G.MarioGame.Entity = Entity;

})(window);
