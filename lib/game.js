;(function(G) {
  'use strict';

  var MG = G.MarioGame;

  function calcEstrelas(score, tempo) {
    if (tempo >= 240) return 5;
    if (tempo >= 180) return 4;
    if (score >= 300) return 3;
    if (score >= 150) return 2;
    return 1;
  }

  class DragonGame {
    init() {
      if(this.initialized) return;
      this.initialized = true;

      if (window.CardEducativo) {
        window.CardEducativo.mostrarCard(2, () => {
          window.CardEducativo.mostrarTutorial(2, () => this.startCountdown());
        });
      } else {
        this.startCountdown();
      }
    }

    startCountdown() {
      var self = this;
      var overlay = document.getElementById('countdown-overlay');
      var numEl = overlay.querySelector('.count');
      var steps = ['3', '2', '1', 'JÁ!'];
      var i = 0;
      overlay.style.display = 'flex';
      var iv = setInterval(function () {
        numEl.textContent = steps[i++];
        if (i >= steps.length) {
          clearInterval(iv);
          setTimeout(function () {
            overlay.style.display = 'none';
            self.setupGame();
          }, 900);
        }
      }, 1000);
    }

    setupGame() {
      var canvasEl = document.getElementById('gameCanvas');
      var ctx = canvasEl.getContext('2d');

      var canvas = {
        canvas: canvasEl,
        ctx: ctx,
      };

      var viewport = {
        width: 800,
        height: 428,
        vX: 0,
        vY: 0,
      };

      var data = {
        canvas: canvas,
        viewport: viewport,
        animationFrame: 0,
        mapBuilder: MG.MapBuilder,
        entities: {},
        sounds: {
          backgroundMusic: { pause: function() {} }, // Handle via audio.js
          levelFinish: { play: function() { if(window.AudioEngine) window.AudioEngine.sfx('vitoria'); } }
        },
        userControl: true,
        reset: this.reset.bind(this),
        finish: this.finish.bind(this)
      };

      var Level = MG.CaatingaLevel;

      var dragon = new MG.Dragon(Level.dragonSpawn.x, Level.dragonSpawn.y, 40, 48);
      
      data.entities.dragon = dragon;
      data.entities.score = { value: 0 };
      data.entities.insectsGot = 0;
      data.entities.insects = Level.insects.map(function(ins) {
        return { 
          xPos: ins.xPos, yPos: ins.yPos, width: ins.width, height: ins.height, 
          type: 'insect', special: ins.special, alive: true,
          currentState: { movement: function(){}, animation: function(){} }
        };
      });
      
      data.entities.scorpions = Level.scorpions.map(function(d) {
        return new MG.Scorpion(d.xPos, d.yPos, d.w, d.h);
      });

      MG.MapBuilder.create(data);
      MG.input.init(data);

      this.data = data;
      this.gameStarted = true;
      this._timerInicio = Date.now();
      
      if (window.AudioEngine) window.AudioEngine.tocarTrack('gameplay');

      // Loop nativo mario.js
      this.run(data);

      // Timer 5 minutos
      this._timerInt = setInterval(() => {
        if (!this.gameStarted) return;
        this.tempoJogado = Math.floor((Date.now() - this._timerInicio) / 1000);
        this.atualizarHUD();
        if (this.tempoJogado >= 300) this.finish();
      }, 1000);
    }

    run(data) {
      const loop = () => {
        if (!this.gameStarted) return;
        
        MG.input.update(data);
        MG.animation.update(data);
        MG.movement.update(data);
        MG.physics.update(data);

        this.updateView(data);
        
        // Custom Render Update
        data.canvas.ctx.clearRect(0, 0, 800, 428);
        data.mapBuilder.renderMap(data);
        
        data.entities.insects.forEach((ins) => {
          MG.Render.drawInsect(data.canvas.ctx, { xPos: ins.xPos - data.viewport.vX, yPos: ins.yPos, width: ins.width, height: ins.height, alive: true });
        });
        
        data.entities.scorpions.forEach((sco) => {
          MG.Render.drawScorpion(data.canvas.ctx, { xPos: sco.xPos - data.viewport.vX, yPos: sco.yPos, width: sco.width, height: sco.height, state: sco.currentState === sco.states.dead ? 'dead' : 'walking', alive: true });
        });

        var dr = data.entities.dragon;
        var st = dr.type === 'dead' ? 'dead' : 'walking';
        if (dr.currentState === dr.states.ducking || dr.currentState === dr.states.bigDucking) st = 'ducking';
        
        MG.Render.drawDragon(data.canvas.ctx, {
          xPos: dr.xPos - data.viewport.vX, yPos: dr.yPos, width: dr.width, height: dr.height,
          direction: dr.direction === 'right' ? 1 : -1, bigDragon: dr.bigDragon, state: st,
          invulnerable: dr.type === 'invincible'
        });

        data.animationFrame += 1;
        window.requestAnimationFrame(loop);
      };
      loop();
    }

    updateView(data) {
      const viewport = data.viewport;
      const margin = viewport.width / 6;
      const center = {
        x: data.entities.dragon.xPos + (data.entities.dragon.width * 0.5),
      };

      if (center.x < viewport.vX + (margin * 2)) {
        viewport.vX = Math.max(center.x - margin, 0);
      } else if (center.x > (viewport.vX + viewport.width) - (margin * 2)) {
        viewport.vX = Math.min((center.x + margin) - viewport.width, MG.CaatingaLevel.WORLD_W - viewport.width);
      }
    }

    atualizarHUD() {
      var m = Math.floor(this.tempoJogado / 60);
      var s = this.tempoJogado % 60;
      var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
      document.getElementById('hud-score').textContent  = 'PONTOS: ' + this.data.entities.score.value;
      document.getElementById('hud-timer').textContent  = m + ':' + pad(s);
      document.getElementById('hud-insetos').textContent = '🦗 ' + this.data.entities.insectsGot;
    }

    reset() {
      this.gameStarted = false;
      clearInterval(this._timerInt);
      var estrelas = calcEstrelas(this.data.entities.score.value, this.tempoJogado);
      window.Progresso.salvarFase(2, this.data.entities.score.value, estrelas, this.tempoJogado);
      window.location.href = 'resultado.html?fase=2';
    }

    finish() {
      this.gameStarted = false;
      clearInterval(this._timerInt);
      var estrelas = calcEstrelas(this.data.entities.score.value, this.tempoJogado);
      window.Progresso.salvarFase(2, this.data.entities.score.value, estrelas, this.tempoJogado);
      window.location.href = 'resultado.html?fase=2';
    }

    togglePausa() {
      // Simples stop
      this.gameStarted = !this.gameStarted;
      document.getElementById('pause-overlay').style.display = this.gameStarted ? 'none' : 'flex';
      if (this.gameStarted) this.run(this.data);
    }
    toggleMudo() {
      if(window.AudioEngine) window.AudioEngine.toggleMudo();
    }
    reiniciar() {
      window.location.reload();
    }
  }

  MG.DragonGame = DragonGame;
  G.DragonGameInstance = new DragonGame();
})(window);
