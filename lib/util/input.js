;(function(G) {
  'use strict';
  var input = {
    down: {},
    pressed: {},

    init: function() {
      // Teclado
      window.addEventListener('keydown', function(event) {
        input.down[event.keyCode] = true;
      });
      window.addEventListener('keyup', function(event) {
        delete input.down[event.keyCode];
        delete input.pressed[event.keyCode];
      });

      // Mobile Touch API simulando teclado
      var bindTouch = function(id, code) {
        var el = document.getElementById(id);
        if (!el) return;
        var set = function(val) {
          return function(e) {
            e.preventDefault();
            if (val) input.down[code] = true;
            else {
              delete input.down[code];
              delete input.pressed[code];
            }
          };
        };
        el.addEventListener('touchstart', set(true), {passive: false});
        el.addEventListener('touchend', set(false), {passive: false});
        el.addEventListener('mousedown', set(true));
        el.addEventListener('mouseup', set(false));
        el.addEventListener('mouseleave', set(false));
      };

      // Executar imediatamente (o DOM já está pronto)
      bindTouch('btn-left',  37); // ArrowLeft
      bindTouch('btn-right', 39); // ArrowRight
      bindTouch('btn-jump',  38); // ArrowUp
      bindTouch('btn-duck',  40); // ArrowDown
    },

    update: function(data) {
      var dragon = data.entities.dragon;
      if (!dragon) return;

      if (data.userControl) {
        // Move Left (ArrowLeft ou A)
        if (this.isDown(37) || this.isDown(65)) {
          if (Math.abs(dragon.velY) <= 1.2 || dragon.onGround) {
            if (dragon.bigDragon) {
              dragon.currentState = dragon.states.bigWalking;
            } else {
              dragon.currentState = dragon.states.walking;
            }
          } else {
            dragon.xPos -= dragon.velX;
          }
          dragon.direction = 'left';
        }
        // Move Right (ArrowRight ou D)
        if (this.isDown(39) || this.isDown(68)) {
          if (Math.abs(dragon.velY) <= 1.2 || dragon.onGround) {
            if (dragon.bigDragon) {
              dragon.currentState = dragon.states.bigWalking;
            } else {
              dragon.currentState = dragon.states.walking;
            }
          } else {
            dragon.xPos += dragon.velX;
          }
          dragon.direction = 'right';
        }

        // Jump (ArrowUp, W, Space)
        if (this.isPressed(38) || this.isPressed(32) || this.isPressed(87)) {
          if (dragon.onGround) {
            if (dragon.bigDragon) {
              dragon.currentState = dragon.states.bigJumping;
            } else {
              dragon.currentState = dragon.states.jumping;
            }
          }
        }
        // Duck (ArrowDown, S)
        if (this.isDown(40) || this.isDown(83)) {
          if (Math.abs(dragon.velY) <= 1.2 || dragon.onGround) {
            if (dragon.bigDragon) {
              dragon.currentState = dragon.states.bigDucking;
            } else {
              dragon.currentState = dragon.states.ducking;
            }
          }
        }
      } else {
        dragon.currentState = dragon.states.dead;
      }
    },

    isDown: function(code) {
      return this.down[code];
    },

    isPressed: function(code) {
      if (this.pressed[code]) {
        return false;
      } else if (this.down[code]) {
        this.pressed[code] = true;
        return this.pressed[code];
      }
      return false;
    }
  };

  G.MarioGame = G.MarioGame || {};
  G.MarioGame.input = input;
})(window);
