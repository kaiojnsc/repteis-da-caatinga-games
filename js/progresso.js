/**
 * js/progresso.js
 * Répteis da Caatinga – O Museu Vivo
 *
 * Sistema de progresso do jogador.
 * Exposto em window.Progresso para uso em todos os HTMLs.
 */

;(function (global) {
  'use strict';

  /* ── Constantes ── */
  const CHAVE = 'repteis_caatinga_v1';

  const ESTRUTURA_PADRAO = {
    fase1: { done: false, score: 0, estrelas: 0, tempo: 0 },
    fase2: { done: false, score: 0, estrelas: 0, tempo: 0 },
    fase3: { done: false, score: 0, estrelas: 0, tempo: 0 },
  };

  /* ── Helpers internos ── */

  /** Retorna uma cópia profunda do padrão (sem referência compartilhada). */
  function _padrao() {
    return JSON.parse(JSON.stringify(ESTRUTURA_PADRAO));
  }

  /** Salva o objeto de progresso no localStorage. */
  function _persistir(obj) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(obj));
    } catch (e) {
      console.warn('[Progresso] Falha ao salvar no localStorage:', e);
    }
  }

  /* ── API pública ── */

  /**
   * getProgresso()
   * Retorna o objeto de progresso salvo. Se não houver dados ou se
   * estiver corrompido, retorna e persiste a estrutura padrão.
   */
  function getProgresso() {
    try {
      const raw = localStorage.getItem(CHAVE);
      if (!raw) throw new Error('vazio');
      const dados = JSON.parse(raw);

      // Garante que todas as fases existam (compatibilidade futura)
      const padrao = _padrao();
      let atualizado = false;
      for (const fase of ['fase1', 'fase2', 'fase3']) {
        if (!dados[fase]) {
          dados[fase] = padrao[fase];
          atualizado = true;
        }
      }
      if (atualizado) _persistir(dados);
      return dados;
    } catch (_) {
      const padrao = _padrao();
      _persistir(padrao);
      return padrao;
    }
  }

  /**
   * salvarFase(n, score, estrelas, tempo)
   * Atualiza os dados de uma fase SOMENTE se o novo resultado for melhor:
   *   • score   → maior é melhor
   *   • estrelas→ maior é melhor
   *   • tempo   → registra sempre (melhor sobrevivência / menor tempo)
   *
   * @param {1|2|3} n         – número da fase
   * @param {number} score    – pontuação obtida
   * @param {number} estrelas – 0–5
   * @param {number} tempo    – tempo em segundos
   */
  function salvarFase(n, score, estrelas, tempo) {
    const chave = 'fase' + n;
    const dados = getProgresso();
    const atual = dados[chave];

    const melhorou =
      score    > atual.score    ||
      estrelas > atual.estrelas ||
      !atual.done;

    dados[chave] = {
      done:     true,
      score:    Math.max(score,    atual.score),
      estrelas: Math.max(estrelas, atual.estrelas),
      tempo:    melhorou ? tempo : atual.tempo,
    };

    _persistir(dados);
    return dados[chave];
  }

  /**
   * isDesbloqueada(n)
   * Fase 1 → sempre desbloqueada.
   * Fase 2 → somente se fase1.done === true.
   * Fase 3 → somente se fase2.done === true.
   *
   * @param {1|2|3} n
   * @returns {boolean}
   */
  function isDesbloqueada(n) {
    if (n === 1) return true;
    const dados = getProgresso();
    if (n === 2) return dados.fase1.done === true;
    if (n === 3) return dados.fase2.done === true;
    return false;
  }

  /**
   * todasConcluidas()
   * Retorna true somente se as 3 fases estiverem concluídas.
   * @returns {boolean}
   */
  function todasConcluidas() {
    const d = getProgresso();
    return d.fase1.done && d.fase2.done && d.fase3.done;
  }

  /**
   * getScoreTotal()
   * Soma dos melhores scores das 3 fases.
   * @returns {number}
   */
  function getScoreTotal() {
    const d = getProgresso();
    return d.fase1.score + d.fase2.score + d.fase3.score;
  }

  /**
   * resetar()
   * Remove a entrada do localStorage e retorna à estrutura padrão.
   */
  function resetar() {
    localStorage.removeItem(CHAVE);
    console.info('[Progresso] Dados resetados.');
  }

  /* ── Exportação ── */
  global.Progresso = {
    CHAVE,
    getProgresso,
    salvarFase,
    isDesbloqueada,
    todasConcluidas,
    getScoreTotal,
    resetar,
  };

})(window);

/* ══════════════════════════════════════════════════════════════
   Escala responsiva — aplica transform:scale proporcional a
   TODAS as páginas do jogo. Carregado via js/progresso.js.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var GAME_W = 800, GAME_H = 480;

  function _ajustarEscala() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    /* ── Páginas de jogo fixas (.tela) ── */
    var tela = document.querySelector('.tela');
    if (tela) {
      var scale = Math.min(vw / GAME_W, vh / GAME_H);

      if (scale >= 0.999) {
        /* Tela grande o suficiente: layout normal centralizado por flexbox */
        tela.classList.remove('tela-fixed');
        tela.style.transform = '';
        document.body.style.overflow = 'hidden';
      } else {
        /* Tela pequena: escalar e centralizar com position:fixed */
        tela.classList.add('tela-fixed');
        tela.style.transform =
          'translate(-50%, -50%) scale(' + scale.toFixed(5) + ')';
        document.body.style.overflow = 'hidden';
      }
      return; /* não processar outras wrappers */
    }

    /* ── Páginas com conteúdo rolável (resultado.html, final.html) ── */
    var scrollable = document.querySelector('.res-wrap, .final-wrap');
    if (scrollable) {
      /* Escalar apenas pela largura, permitir scroll vertical */
      var scaleW = Math.min(vw / GAME_W, 1);
      scrollable.style.transformOrigin = 'top center';
      scrollable.style.transform = 'scale(' + scaleW.toFixed(5) + ')';
      /* Ajustar altura do body para acomodar o conteúdo escalado */
      var naturalH = scrollable.scrollHeight;
      document.body.style.height = (naturalH * scaleW) + 'px';
      document.body.style.overflow = 'auto';
      document.body.style.overflowX = 'hidden';
    }
  }

  /* Rodar no DOMContentLoaded e ao redimensionar */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _ajustarEscala);
  } else {
    _ajustarEscala();
  }
  window.addEventListener('resize', _ajustarEscala);

  /* Expor para chamada manual */
  window._ajustarEscala = _ajustarEscala;
})();
