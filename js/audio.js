/**
 * js/audio.js – Motor de Áudio Procedural
 * Répteis da Caatinga – O Museu Vivo
 * Expõe: window.AudioEngine
 */
;(function (global) {
  'use strict';

  const ctx = new (global.AudioContext || global.webkitAudioContext)();
  let gainMaster = null;
  let oscNodes   = [];
  let mudo       = false;
  let trackAtual = null;
  let scheduleTimeout = null;

  async function ensureResumed() {
    if (ctx.state === 'suspended') await ctx.resume();
  }

  /* ══ TRILHAS ══ */
  const TRACKS = {
    menu: {
      wave: 'triangle',
      notas: [220, 247, 262, 294, 330, 294, 262, 247],
      duracaoNota: 0.18,
      ganho: 0.10
    },
    gameplay: {
      wave: 'square',
      notas: [330, 392, 440, 494, 440, 392, 330, 262],
      duracaoNota: 0.10,
      ganho: 0.08
    }
  };

  function tocarTrack(nome) {
    if (mudo) { trackAtual = nome; return; }
    if (trackAtual === nome) return;   /* já tocando essa trilha */
    pararTudo();
    trackAtual = nome;

    ensureResumed().then(function () {
      const t = TRACKS[nome];
      if (!t) return;

      gainMaster = ctx.createGain();
      gainMaster.gain.value = t.ganho;
      gainMaster.connect(ctx.destination);

      let tempo = ctx.currentTime + 0.05;

      function agendar() {
        if (mudo || trackAtual !== nome) return;

        t.notas.forEach(function (freq) {
          const osc = ctx.createOscillator();
          const env = ctx.createGain();
          osc.type = t.wave;
          osc.frequency.value = freq;

          /* Envelope ADSR suave */
          env.gain.setValueAtTime(0, tempo);
          env.gain.linearRampToValueAtTime(1, tempo + 0.01);
          env.gain.linearRampToValueAtTime(0, tempo + t.duracaoNota * 0.85);

          osc.connect(env);
          env.connect(gainMaster);
          osc.start(tempo);
          osc.stop(tempo + t.duracaoNota);
          oscNodes.push(osc);
          tempo += t.duracaoNota;
        });

        const loopMs = t.notas.length * t.duracaoNota * 1000 - 80;
        scheduleTimeout = setTimeout(agendar, loopMs);
      }

      agendar();
    });
  }

  /* ══ SFX ══ */
  const SFX_DEF = {
    coletar:  [880,  1100, 0.10, 0.10, 'sine'],
    gameover: [440,  110,  0.18, 0.80, 'sawtooth'],
    pulo:     [330,  440,  0.08, 0.08, 'sine'],
    dano:     [200,  100,  0.15, 0.20, 'sawtooth'],
  };

  function sfx(nome) {
    if (mudo) return;
    ensureResumed().then(function () {
      if (nome === 'vitoria') {
        /* Arpejo ascendente */
        [523, 659, 784, 1047].forEach(function (freq, i) {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.value = freq;
          o.type = 'square';
          g.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
          g.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.12 + 0.12);
          o.connect(g); g.connect(ctx.destination);
          const t = ctx.currentTime + i * 0.12;
          o.start(t); o.stop(t + 0.14);
        });
        return;
      }

      const def = SFX_DEF[nome];
      if (!def) return;
      const [f1, f2, gv, dur, wave] = def;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = wave;
      o.frequency.setValueAtTime(f1, ctx.currentTime);
      o.frequency.linearRampToValueAtTime(f2, ctx.currentTime + dur);
      g.gain.setValueAtTime(gv, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur + 0.01);
    });
  }

  function pararTudo() {
    clearTimeout(scheduleTimeout);
    scheduleTimeout = null;
    oscNodes.forEach(function (o) { try { o.stop(0); } catch (e) {} });
    oscNodes = [];
    if (gainMaster) {
      try { gainMaster.disconnect(); } catch (e) {}
      gainMaster = null;
    }
    trackAtual = null;
  }

  function toggleMudo() {
    mudo = !mudo;
    if (mudo) {
      pararTudo();
    } else {
      /* Retomar trilha que estava tocando */
      const anterior = trackAtual || 'menu';
      trackAtual = null;          /* força re-início */
      tocarTrack(anterior);
    }
    return mudo;
  }

  function setMudo(valor) {
    if (valor !== mudo) toggleMudo();
  }

  /* Desbloquear contexto na primeira interação */
  document.addEventListener('click', function () { ensureResumed(); }, { once: true });
  document.addEventListener('keydown', function () { ensureResumed(); }, { once: true });
  document.addEventListener('touchstart', function () { ensureResumed(); }, { once: true });

  /* ══ Exportação ══ */
  global.AudioEngine = {
    tocarTrack,
    pararTudo,
    sfx,
    toggleMudo,
    setMudo,
    get mudo() { return mudo; },
  };

})(window);
