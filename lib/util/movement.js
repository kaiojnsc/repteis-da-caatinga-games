;(function(G) {
  'use strict';
  var movement = {
    update: function(data) {
      if (data.entities.dragon && data.entities.dragon.currentState && data.entities.dragon.currentState.movement) {
        data.entities.dragon.currentState.movement(data);
      }
      if (data.entities.scorpions) {
        data.entities.scorpions.forEach(function(s) {
          if (s.currentState && s.currentState.movement) s.currentState.movement(data);
        });
      }
      if (data.entities.insects) {
        data.entities.insects.forEach(function(i) {
          if (i.currentState && i.currentState.movement) i.currentState.movement(data);
        });
      }
    }
  };
  G.MarioGame = G.MarioGame || {};
  G.MarioGame.movement = movement;
})(window);
