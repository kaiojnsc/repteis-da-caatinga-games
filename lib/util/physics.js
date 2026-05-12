;(function(G) {
  'use strict';
  
  var physics = {
    update: function(data) {
      this.collisionDetection(data);
      this.sceneryCollisionDetection(data);
      this.dragonFallingCheck(data);

      this.gravity(data.entities.dragon);

      if (data.entities.insects) {
        data.entities.insects.forEach(function(ins) {
          physics.gravity(ins);
        });
      }

      if (data.entities.scorpions) {
        data.entities.scorpions.forEach(function(sco) {
          physics.gravity(sco);
        });
      }
    },

    collisionDetection: function(data) {
      var collidables = [
        data.entities.insects || [],
        data.entities.scorpions || []
      ];

      var dragon = data.entities.dragon;

      var entityCollisionCheck = function(entity) {
        if (dragon.xPos < entity.xPos + entity.width &&
            dragon.xPos + dragon.width > entity.xPos &&
            dragon.yPos < entity.yPos + entity.height &&
            dragon.height + dragon.yPos > entity.yPos) {
          physics.handleCollision(data, entity);
        }
      };

      collidables.forEach(function(entities) {
        entities.forEach(function(entity) {
          entityCollisionCheck(entity);
        });
      });
    },

    handleCollision: function(data, entity) {
      var dragon = data.entities.dragon;

      if (entity.type === 'scorpion' && dragon.type !== 'invincible') {
        // dragon's right
        if (dragon.xPos < entity.xPos && dragon.velY <= entity.velY) {
          dragon.xPos = entity.xPos - dragon.width;
          if (dragon.bigDragon) {
            this.dragonShrink(dragon, data);
          } else {
            dragon.currentState = dragon.states.dead;
            this.dragonDeath(data);
          }
        }
        // dragon's left
        else if (dragon.xPos > entity.xPos && dragon.velY <= entity.velY) {
          dragon.xPos = entity.xPos + dragon.width;
          if (dragon.bigDragon) {
            this.dragonShrink(dragon, data);
          } else {
            dragon.currentState = dragon.states.dead;
            this.dragonDeath(data);
          }
        }
        // dragon bot (Stomp)
        else if (dragon.yPos < entity.yPos &&
                 (dragon.xPos + dragon.width) > entity.xPos &&
                 dragon.xPos < (entity.xPos + entity.width) &&
                 dragon.velY >= entity.velY) {
          
          dragon.currentState = dragon.states.standing;
          dragon.yPos = entity.yPos - dragon.height;
          dragon.velY = 0;

          this.enemyDeath(entity, data);

          // Verifica glitch de ser arrastado
          if (dragon.yPos > entity.yPos &&
              (dragon.xPos + dragon.width) >= entity.xPos &&
              dragon.xPos < (entity.xPos + entity.width)) {
            dragon.velY = 1.2;
            dragon.xPos = entity.xPos;
            if (dragon.bigDragon) {
              this.dragonShrink(dragon, data);
            } else {
              dragon.currentState = dragon.states.dead;
              this.dragonDeath(data);
            }
          }
        }
      }

      if (entity.type === 'insect') {
        // Collect insect
        data.entities.score.value += 15;
        data.entities.insectsGot += 1;
        if (entity.special) {
          dragon.bigDragon = true;
          dragon.height = 60;
          dragon.powerupSound.play();
        } else {
          dragon.powerupSound.play(); // usa coletar
        }

        var index = data.entities.insects.indexOf(entity);
        if (index > -1) data.entities.insects.splice(index, 1);
      }
    },

    dragonFallingCheck: function(data) {
      if (data.entities.dragon.yPos >= 600) { // chão é ~400, 600 é buraco
        data.entities.dragon.deathSound.play();
        data.userControl = false;
        setTimeout(function() {
          data.reset();
        }, 3000);
      }
    },

    dragonDeath: function(data) {
      data.userControl = false;
      if (data.sounds && data.sounds.backgroundMusic) {
        data.sounds.backgroundMusic.pause();
      }
      data.entities.dragon.deathSound.play();

      setTimeout(function() {
        data.entities.dragon.height = 16;
        data.entities.dragon.type = 'dead';
        data.entities.dragon.velY -= 13;
      }, 500);

      setTimeout(function() {
        data.reset();
      }, 3000);
    },

    dragonShrink: function(dragon, data) {
      dragon.bigDragon = false;
      dragon.powerdownSound.play();
      dragon.type = 'invincible';
      dragon.currentState = dragon.states.resizing;

      setTimeout(function() {
        dragon.currentState = dragon.states.standing;
        dragon.height = 48; // tamanho normal do dragao
      }, 1000);

      setTimeout(function() {
        dragon.type = 'dragon';
      }, 1500);
    },

    enemyDeath: function(entity, data) {
      data.entities.score.value += 100;
      entity.currentState = entity.states.dead;
      entity.type = 'dying';
      entity.squishSound.play();

      setTimeout(function() {
        var index = data.entities.scorpions.indexOf(entity);
        if (index > -1) data.entities.scorpions.splice(index, 1);
      }, 800);
    },

    levelFinish: function(data) {
      data.entities.dragon.velX = 0;
      data.entities.dragon.velY = 0;
      data.entities.dragon.xPos += 3;

      if (data.sounds && data.sounds.backgroundMusic) {
        data.sounds.backgroundMusic.pause();
      }
      if (data.sounds && data.sounds.levelFinish) {
        data.sounds.levelFinish.play();
      }

      setTimeout(function() {
        data.finish(); // custom callback instead of data.reset()
      }, 3000);
    },

    sceneryCollisionDetection: function(data) {
      if (data.entities.dragon) data.entities.dragon.onGround = false;
      this.sceneryCollisionCheck(data, [data.entities.dragon], data.mapBuilder.platforms);
      this.sceneryCollisionCheck(data, data.entities.insects || [], data.mapBuilder.platforms);
      this.sceneryCollisionCheck(data, data.entities.scorpions || [], data.mapBuilder.platforms);
    },

    sceneryCollisionCheck: function(data, entities, scenery) {
      entities.forEach(function(entity) {
        scenery.forEach(function(scene) {
          if (entity.xPos < scene.xPos + scene.width &&
              entity.xPos + entity.width > scene.xPos &&
              entity.yPos < scene.yPos + scene.height &&
              entity.height + entity.yPos > scene.yPos) {
            
            if (scene.type === 'flag') {
              if (entity.type === 'dragon' || entity.type === 'invincible') {
                physics.levelFinish(data);
              }
            } else {
              physics.sceneryCollision(data, entity, scene);
            }
          }
        });
      });
    },

    sceneryCollision: function(data, entity, scene) {
      // Left side
      if (entity.xPos < scene.xPos && entity.yPos >= scene.yPos) {
        entity.xPos = scene.xPos - entity.width;
        if (entity.type === 'scorpion' || entity.type === 'insect') {
          entity.direction = entity.direction === 'left' ? 'right' : 'left';
        }
      }
      // Right side
      if (entity.xPos > scene.xPos && entity.yPos >= scene.yPos) {
        entity.xPos = scene.xPos + scene.width;
        if (entity.type === 'scorpion' || entity.type === 'insect') {
          entity.direction = entity.direction === 'left' ? 'right' : 'left';
        }
      }
      // Top
      if (entity.yPos < scene.yPos &&
          (entity.xPos + entity.width) > scene.xPos &&
          entity.xPos < (scene.xPos + scene.width) && entity.velY >= 0) {

        if (entity.type !== 'dead') {
          if (entity.type === 'dragon') {
            if (entity.bigDragon) {
              entity.currentState = entity.states.bigStanding;
            } else {
              entity.currentState = entity.states.standing;
            }
            entity.onGround = true; // flag aux
          }
          entity.yPos = scene.yPos - entity.height - 1;
          entity.velY = 0;
        }
      }
      // Bot (batendo a cabeça numa plataforma)
      if (entity.yPos >= scene.yPos &&
          (entity.xPos + entity.width) >= scene.xPos &&
          entity.xPos < (scene.xPos + scene.width) && entity.velY < 0) {
        entity.yPos = entity.yPos + entity.height;
        entity.xPos = scene.xPos;
        entity.velY = 1.2;
      }
    },

    gravity: function(entity) {
      entity.velY += 1.2;
      entity.yPos += entity.velY;
    }
  };

  G.MarioGame = G.MarioGame || {};
  G.MarioGame.physics = physics;
})(window);
