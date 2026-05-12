;(function(G) {
  'use strict';
  
  var MapBuilder = {
    platforms: [],
    
    create: function(data) {
      // Build collidable platforms array from CaatingaLevel
      var level = G.MarioGame.CaatingaLevel;
      this.platforms = [];
      
      // Chão global
      this.platforms.push({
        xPos: 0,
        yPos: G.MarioGame.Physics ? G.MarioGame.Physics.GROUND_Y : 404,
        width: level.WORLD_W,
        height: 200,
        type: 'ground'
      });

      // Plataformas flutuantes
      level.platforms.forEach(function(p) {
        MapBuilder.platforms.push({
          xPos: p.x,
          yPos: p.y,
          width: p.w,
          height: p.h,
          type: 'brick'
        });
      });

      // Flag
      this.platforms.push({
        xPos: level.flag.x,
        yPos: level.flag.y,
        width: 10,
        height: level.flag.h,
        type: 'flag'
      });
    },

    renderMap: function(data) {
      var R = G.MarioGame.Render;
      var camX = data.viewport.vX;
      var level = G.MarioGame.CaatingaLevel;

      R.drawBackground(data.canvas.ctx, camX);
      
      level.platforms.forEach(function(p) {
        var sx = p.x - camX;
        if (sx + p.w < -32 || sx > 832) return;
        R.drawPlatform(data.canvas.ctx, { x: sx, y: p.y, w: p.w, h: p.h });
      });

      var groundY = G.MarioGame.Physics ? G.MarioGame.Physics.GROUND_Y : 404;
      R.drawGround(data.canvas.ctx, groundY, level.WORLD_W, camX);

      if (level.flag) {
        R.drawFlag(data.canvas.ctx, level.flag, camX);
      }
    }
  };

  G.MarioGame = G.MarioGame || {};
  G.MarioGame.MapBuilder = MapBuilder;
})(window);
