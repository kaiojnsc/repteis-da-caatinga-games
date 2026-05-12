;(function(G) {
  'use strict';
  var animation = {
    update: function(data) {
      if (data.entities.dragon && data.entities.dragon.currentState && data.entities.dragon.currentState.animation) {
        data.entities.dragon.currentState.animation(data);
      }
      if (data.entities.scorpions) {
        data.entities.scorpions.forEach(function(s) {
          if (s.currentState && s.currentState.animation) s.currentState.animation(data);
        });
      }
      if (data.entities.insects) {
        data.entities.insects.forEach(function(i) {
          if (i.currentState && i.currentState.animation) i.currentState.animation(data);
        });
      }
    }
  };
  G.MarioGame = G.MarioGame || {};
  G.MarioGame.animation = animation;
})(window);
