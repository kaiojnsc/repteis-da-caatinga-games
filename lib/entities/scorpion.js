;(function(G) {
  'use strict';

  var Entity = G.MarioGame.Entity;

  function Scorpion(xPos, yPos, width, height) {
    Entity.call(this, { xPos: xPos, yPos: yPos, width: width, height: height, type: 'scorpion' });

    var self = this;
    this.squishSound = { play: function() { if(window.AudioEngine) window.AudioEngine.sfx('coletar'); } };

    this.spriteAnimations = {
      walking: { frames: ['scorpionWalk1', 'scorpionWalk2'], currentFrame: 0 },
      dead: 'scorpionDead'
    };

    this.states = {
      walking: {
        movement: function(data) {
          if (self.direction === 'left') {
            self.xPos -= self.velX;
          } else {
            self.xPos += self.velX;
          }
        },
        animation: function(data) {
          if (data.animationFrame % 10 === 0) {
            self.currentAnimName = self.spriteAnimations.walking.frames[self.spriteAnimations.walking.currentFrame];
            self.spriteAnimations.walking.currentFrame += 1;
            if (self.spriteAnimations.walking.currentFrame > 1) {
              self.spriteAnimations.walking.currentFrame = 0;
            }
          }
        }
      },
      dead: {
        movement: function(data) {
          self.velX = 0;
        },
        animation: function(data) {
          self.currentAnimName = self.spriteAnimations.dead;
        }
      }
    };

    this.currentState = this.states.walking;
    this.direction = 'left';
    this.velY = 0;
    this.velX = 0.55; // mais lento que o original 0.7, conforme prompt
    this.xPos = xPos;
    this.yPos = yPos;
    this.width = width;
    this.height = height;
  }

  Scorpion.prototype = Object.create(Entity.prototype);
  Scorpion.prototype.constructor = Scorpion;
  Scorpion.prototype.type = 'scorpion';

  G.MarioGame = G.MarioGame || {};
  G.MarioGame.Scorpion = Scorpion;
})(window);
