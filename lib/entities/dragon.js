;(function(G) {
  'use strict';

  var Entity = G.MarioGame.Entity;

  function Dragon(xPos, yPos, width, height) {
    // Chamada à classe base
    Entity.call(this, { xPos: xPos, yPos: yPos, width: width, height: height, type: 'dragon' });

    var self = this;
    
    // Áudio
    this.jumpSound = { play: function() { if(window.AudioEngine) window.AudioEngine.sfx('pulo'); } };
    this.deathSound = { play: function() { if(window.AudioEngine) window.AudioEngine.sfx('gameover'); } };
    this.bumpSound = { play: function() { if(window.AudioEngine) window.AudioEngine.sfx('dano'); } };
    this.powerupSound = { play: function() { if(window.AudioEngine) window.AudioEngine.sfx('coletar'); } };
    this.powerdownSound = { play: function() { if(window.AudioEngine) window.AudioEngine.sfx('dano'); } };

    // Ao invés de usar o Sprite.js (que recorta um spritesheet), 
    // a gente apenas guarda strings que o render.js vai interpretar para desenhar no canvas.
    this.spriteAnimations = {
      walkRight: { frames: ['walkRight1', 'walkRight2', 'walkRight3'], currentFrame: 0 },
      walkLeft:  { frames: ['walkLeft1', 'walkLeft2', 'walkLeft3'], currentFrame: 0 },
      bigWalkRight: { frames: ['bigWalkRight1', 'bigWalkRight2', 'bigWalkRight3'], currentFrame: 0 },
      bigWalkLeft:  { frames: ['bigWalkLeft1', 'bigWalkLeft2', 'bigWalkLeft3'], currentFrame: 0 },
      resizeRight:  { frames: ['resizeR', 'resizeR', 'resizeR', 'resizeR'], currentFrame: 0 },
      resizeLeft:   { frames: ['resizeL', 'resizeL', 'resizeL', 'resizeL'], currentFrame: 0 },
      standRight: 'standRight',
      standLeft: 'standLeft',
      jumpRight: 'jumpRight',
      jumpLeft: 'jumpLeft',
      bigStandRight: 'bigStandRight',
      bigStandLeft: 'bigStandLeft',
      bigJumpRight: 'bigJumpRight',
      bigJumpLeft: 'bigJumpLeft',
      dead: 'dead'
    };

    // Máquina de estados EXATAMENTE como no mario.js
    this.states = {
      jumping: {
        movement: function(data) {
          if (self.onGround) {
            self.jumpSound.play();
            self.velY -= 14;
            self.onGround = false;
          }
        },
        animation: function(data) {
          if (self.direction === 'right') {
            self.currentAnimName = self.spriteAnimations.jumpRight;
          } else {
            self.currentAnimName = self.spriteAnimations.jumpLeft;
          }
        }
      },

      bigJumping: {
        movement: function(data) {
          if (self.onGround) {
            self.jumpSound.play();
            self.velY -= 14;
            self.onGround = false;
          }
        },
        animation: function(data) {
          if (self.direction === 'right') {
            self.currentAnimName = self.spriteAnimations.bigJumpRight;
          } else {
            self.currentAnimName = self.spriteAnimations.bigJumpLeft;
          }
        }
      },

      standing: {
        movement: function(data) { },
        animation: function(data) {
          if (self.direction === 'right') {
            self.currentAnimName = self.spriteAnimations.standRight;
          } else {
            self.currentAnimName = self.spriteAnimations.standLeft;
          }
        }
      },

      bigStanding: {
        movement: function(data) { },
        animation: function(data) {
          if (self.direction === 'right') {
            self.currentAnimName = self.spriteAnimations.bigStandRight;
          } else {
            self.currentAnimName = self.spriteAnimations.bigStandLeft;
          }
        }
      },

      ducking: {
        movement: function(data) {
          self.xPos += 0; // Para de andar
        },
        animation: function(data) {
          self.currentAnimName = self.direction === 'right' ? 'duckRight' : 'duckLeft';
        }
      },

      bigDucking: {
        movement: function(data) {
          self.xPos += 0;
        },
        animation: function(data) {
          self.currentAnimName = self.direction === 'right' ? 'bigDuckRight' : 'bigDuckLeft';
        }
      },

      walking: {
        movement: function(data) {
          if (self.direction === 'right') {
            self.xPos += self.velX;
          } else {
            self.xPos -= self.velX;
          }
        },
        animation: function(data) {
          if (self.direction === 'right') {
            if (data.animationFrame % 5 === 0) {
              self.currentAnimName = self.spriteAnimations.walkRight.frames[self.spriteAnimations.walkRight.currentFrame];
              self.spriteAnimations.walkRight.currentFrame += 1;
              if (self.spriteAnimations.walkRight.currentFrame > 2) {
                self.spriteAnimations.walkRight.currentFrame = 0;
              }
            }
          } else {
            if (data.animationFrame % 5 === 0) {
              self.currentAnimName = self.spriteAnimations.walkLeft.frames[self.spriteAnimations.walkLeft.currentFrame];
              self.spriteAnimations.walkLeft.currentFrame += 1;
              if (self.spriteAnimations.walkLeft.currentFrame > 2) {
                self.spriteAnimations.walkLeft.currentFrame = 0;
              }
            }
          }
        }
      },

      bigWalking: {
        movement: function(data) {
          if (self.direction === 'right') {
            self.xPos += self.velX;
          } else {
            self.xPos -= self.velX;
          }
        },
        animation: function(data) {
          if (self.direction === 'right') {
            if (data.animationFrame % 5 === 0) {
              self.currentAnimName = self.spriteAnimations.bigWalkRight.frames[self.spriteAnimations.bigWalkRight.currentFrame];
              self.spriteAnimations.bigWalkRight.currentFrame += 1;
              if (self.spriteAnimations.bigWalkRight.currentFrame > 2) {
                self.spriteAnimations.bigWalkRight.currentFrame = 0;
              }
            }
          } else {
            if (data.animationFrame % 5 === 0) {
              self.currentAnimName = self.spriteAnimations.bigWalkLeft.frames[self.spriteAnimations.bigWalkLeft.currentFrame];
              self.spriteAnimations.bigWalkLeft.currentFrame += 1;
              if (self.spriteAnimations.bigWalkLeft.currentFrame > 2) {
                self.spriteAnimations.bigWalkLeft.currentFrame = 0;
              }
            }
          }
        }
      },

      resizing: {
        movement: function(data) { },
        animation: function(data) {
          if (self.direction === 'right') {
            if (data.animationFrame % 5 === 0) {
              self.currentAnimName = self.spriteAnimations.resizeRight.frames[self.spriteAnimations.resizeRight.currentFrame];
              self.spriteAnimations.resizeRight.currentFrame += 1;
              if (self.spriteAnimations.resizeRight.currentFrame > 3) {
                self.spriteAnimations.resizeRight.currentFrame = 0;
              }
            }
          } else {
            if (data.animationFrame % 5 === 0) {
              self.currentAnimName = self.spriteAnimations.resizeLeft.frames[self.spriteAnimations.resizeLeft.currentFrame];
              self.spriteAnimations.resizeLeft.currentFrame += 1;
              if (self.spriteAnimations.resizeLeft.currentFrame > 3) {
                self.spriteAnimations.resizeLeft.currentFrame = 0;
              }
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

    this.currentState = this.states.standing;
    this.direction = 'right';
    this.bigDragon = false;
    this.velY = 0;
    this.velX = 3.8;
    this.xPos = xPos;
    this.yPos = yPos;
    this.width = width;
    this.height = height;
    this.onGround = false;
  }

  Dragon.prototype = Object.create(Entity.prototype);
  Dragon.prototype.constructor = Dragon;
  Dragon.prototype.type = 'dragon';

  G.MarioGame = G.MarioGame || {};
  G.MarioGame.Dragon = Dragon;
})(window);
