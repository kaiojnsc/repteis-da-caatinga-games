/**
 * js/card.js
 * Répteis da Caatinga – O Museu Vivo
 *
 * Módulo reutilizável de fichas educativas + Web Speech API + Tutorial + Contagem.
 * Expõe: window.AnimaisData  e  window.CardEducativo
 */
;(function (global) {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     DADOS DOS ANIMAIS
  ══════════════════════════════════════════════════════════════ */
  const AnimaisData = {
    1: {
      key: 'juquinha',
      nome: 'Juquinha (Píton Albina)',
      especie: 'Python bivittatus (forma albina)',
      emoji: '🐍',
      tamanho: 'Pode ultrapassar 4 metros',
      alimentacao: 'Carnívora — roedores e aves',
      habitat: 'Originária do sudeste asiático; hoje vive no museu',
      status: 'Vulnerável (IUCN) — manejo legal pelo IBAMA',
      curiosidade: 'É albina: não produz melanina, por isso é branca com manchas amarelas.',
      historia: 'Juquinha chegou ao Museu Vivo via IBAMA e se tornou a estrela mais querida de Puxinanã.',
      cordel: [
        'Juquinha é uma cobra',
        'Que não faz mal a ninguém',
        'Branca que nem lua cheia',
        'E bonita também!'
      ],
      cor: '#F5EED0'
    },
    2: {
      key: 'dragao',
      nome: 'Dragão Barbudo',
      especie: 'Pogona vitticeps',
      emoji: '🦎',
      tamanho: '40 a 60 centímetros',
      alimentacao: 'Insetos, vegetais e frutas',
      habitat: 'Regiões áridas da Austrália; vive no museu',
      status: 'Espécie exótica em cativeiro — regulamentado pelo IBAMA',
      curiosidade: 'Quando ameaçado, infla as escamas do pescoço formando uma "barba" preta intimidadora!',
      historia: 'Chegou ao museu como espécie exótica e encanta visitantes pelo comportamento dócil.',
      cordel: [
        'O Dragão tem uma barba',
        'Que não é de verdade não',
        'São escamas espinhudas',
        'Que dão impressão!'
      ],
      cor: '#C89030'
    },
    3: {
      key: 'jacara',
      nome: 'Jacaré-de-papo-amarelo',
      especie: 'Caiman latirostris',
      emoji: '🐊',
      tamanho: 'Até 2,5 metros e 60 kg',
      alimentacao: 'Peixes, caranguejos e pequenos mamíferos',
      habitat: 'Rios e açudes — foi encontrado no Açude Velho de Campina Grande',
      status: 'Vulnerável — protegido pelo IBAMA',
      curiosidade: 'Um casal foi encontrado no Açude Velho de Campina Grande e resgatado por Silvaney!',
      historia: 'Por anos jacarés viveram no Açude Velho urbano de CG. Silvaney os resgatou e hoje vivem protegidos.',
      cordel: [
        'No Açude Velho morava',
        'Um jacaré faceiro',
        'Que o Silvaney acolheu',
        'Com muito amor verdadeiro'
      ],
      cor: '#2A5A18'
    }
  };

  /* ══════════════════════════════════════════════════════════════
     TEXTOS DE TUTORIAL POR FASE
  ══════════════════════════════════════════════════════════════ */
  const TutorialData = {
    1: {
      titulo: '🐍 Como Jogar — Fase da Cobra',
      instrucoes: [
        { icone: '🕹️', texto: 'WASD ou Setas para mover Juquinha pelo terrário' },
        { icone: '🥩', texto: 'Colete a ração espalhada pelo cenário' },
        { icone: '🌵', texto: 'Desvie dos mandacarus e das próprias escamas' },
        { icone: '⏱️', texto: 'Tempo: 5 minutos — sobreviva e pontue!' }
      ]
    },
    2: {
      titulo: '🦎 Como Jogar — Fase do Dragão',
      instrucoes: [
        { icone: '🕹️', texto: '← → para mover | Espaço ou ↑ para pular' },
        { icone: '⬇️', texto: '↓ para agachar e esquivar de ataques aéreos' },
        { icone: '🦂', texto: 'Pise nos escorpiões para eliminá-los e ganhar pontos' },
        { icone: '❤️', texto: '3 vidas — não deixe os escorpiões te alcançar!' }
      ]
    },
    3: {
      titulo: '🐊 Como Jogar — Fase do Jacaré',
      instrucoes: [
        { icone: '🕹️', texto: 'WASD ou Setas para nadar pelo açude' },
        { icone: '🐟', texto: 'Colete peixes para acumular pontos' },
        { icone: '🚤', texto: 'Fuja dos barcos e dos pescadores' },
        { icone: '⏱️', texto: 'Tempo: 5 minutos — quanto mais peixe, mais estrelas!' }
      ]
    }
  };

  /* ══════════════════════════════════════════════════════════════
     WEB SPEECH API
  ══════════════════════════════════════════════════════════════ */
  let synthAtivo = false;

  function ouvirCard(n) {
    if (!global.speechSynthesis) return;
    global.speechSynthesis.cancel();

    const a = AnimaisData[n];
    const texto =
      a.cordel.join('. ') + '. ' +
      'Espécie: ' + a.especie + '. ' +
      'Tamanho: ' + a.tamanho + '. ' +
      'Alimentação: ' + a.alimentacao + '. ' +
      'Curiosidade: ' + a.curiosidade;

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang  = 'pt-BR';
    utterance.rate  = 0.9;
    utterance.pitch = 1.1;

    /* Tenta usar voz em pt-BR; carrega vozes se ainda não disponíveis */
    function _falar() {
      const vozes = global.speechSynthesis.getVoices();
      const voz = vozes.find(function (v) { return v.lang === 'pt-BR'; }) || vozes[0];
      if (voz) utterance.voice = voz;
      global.speechSynthesis.speak(utterance);
      synthAtivo = true;
    }

    if (global.speechSynthesis.getVoices().length) {
      _falar();
    } else {
      global.speechSynthesis.onvoiceschanged = function () {
        global.speechSynthesis.onvoiceschanged = null;
        _falar();
      };
    }

    utterance.onend = function () { synthAtivo = false; };
  }

  function pararSpeech() {
    if (synthAtivo || global.speechSynthesis) {
      global.speechSynthesis && global.speechSynthesis.cancel();
      synthAtivo = false;
    }
  }

  /* ══════════════════════════════════════════════════════════════
     HELPERS DE DOM
  ══════════════════════════════════════════════════════════════ */

  /** Cria e insere o bloco de estilos inline uma única vez. */
  function _injetarEstilos() {
    if (document.getElementById('card-estilos')) return;
    const s = document.createElement('style');
    s.id = 'card-estilos';
    s.textContent = `
      /* ── Overlay do Card ── */
      .card-overlay-edu {
        position: fixed; inset: 0; z-index: 200;
        background: rgba(13,5,0,.92);
        display: flex; align-items: center; justify-content: center;
        padding: 8px;
        animation: fadeInOverlay .25s ease both;
      }
      @keyframes fadeInOverlay { from{opacity:0} to{opacity:1} }

      /* ── Ficha compacta ── */
      .ficha-edu {
        width: 100%; max-width: 680px;
        max-height: calc(100dvh - 16px);
        overflow-y: auto;
        background: var(--creme);
        background-image: repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(42,20,0,.05) 20px,rgba(42,20,0,.05) 21px);
        border: 3px solid #2A1400; border-radius: 6px;
        padding: 12px 16px 10px;
        font-family: 'Teko', sans-serif; color: #2A1400;
        position: relative;
        box-shadow: 4px 4px 0 #2A1400;
        animation: slideUpCard .3s cubic-bezier(.22,.61,.36,1) both;
      }
      @keyframes slideUpCard {
        from{transform:translateY(20px);opacity:0}
        to  {transform:translateY(0);opacity:1}
      }
      .ficha-edu::before {
        content:''; position:absolute; inset:5px;
        border:1px solid rgba(42,20,0,.15); pointer-events:none;
      }

      /* ── Layout interno: 2 colunas em landscape ── */
      .ficha-body {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px 14px;
        align-items: start;
      }
      .ficha-col-esq { display:flex; flex-direction:column; gap:6px; }
      .ficha-col-dir { display:flex; flex-direction:column; gap:6px; }

      /* ── Topo ── */
      .ficha-topo {
        display: flex; align-items: center; gap: 10px;
        margin-bottom: 8px;
      }
      .ficha-emoji { font-size: clamp(28px,5vw,42px); line-height:1; flex-shrink:0; }
      .ficha-info  { flex:1; min-width:0; }
      .ficha-nome  {
        font-family:'Press Start 2P',monospace;
        font-size: clamp(7px,1.1vw,10px); color:#2A1400;
        line-height:1.55; margin-bottom:2px;
        word-break: break-word;
      }
      .ficha-especie { font-style:italic; font-size:clamp(13px,2vw,16px); color:#5A3A00; }

      /* ── Separador ── */
      .ficha-sep {
        width:100%; height:1px; margin:6px 0;
        background:linear-gradient(90deg,transparent,#2A1400 20%,#2A1400 80%,transparent);
        opacity:.3;
      }

      /* ── Cordel ── */
      .ficha-cordel { padding:4px 0; }
      .ficha-cordel-verso {
        font-style:italic; font-size:clamp(13px,2vw,16px); line-height:1.35;
        color:#3A2000; opacity:0; transform:translateY(6px);
        transition:opacity .4s ease,transform .4s ease; display:block;
      }
      .ficha-cordel-verso.visivel { opacity:1; transform:translateY(0); }

      /* ── Grid de dados ── */
      .ficha-grid {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 6px 10px;
      }
      .ficha-item { display:flex; flex-direction:column; gap:1px; }
      .ficha-label {
        font-family:'Press Start 2P',monospace;
        font-size:clamp(5px,.9vw,7px); color:#5A3A00;
        text-transform:uppercase; letter-spacing:.03em;
      }
      .ficha-valor { font-size:clamp(12px,1.9vw,15px); line-height:1.3; color:#2A1400; }

      /* ── Curiosidade ── */
      .ficha-curiosidade {
        background:rgba(42,20,0,.07);
        border-left:3px solid #2A1400;
        border-radius:0 3px 3px 0;
        padding:7px 10px; font-size:clamp(12px,1.9vw,15px); line-height:1.35;
      }
      .ficha-curiosidade strong {
        font-family:'Press Start 2P',monospace;
        font-size:clamp(5px,.9vw,7px); display:block;
        margin-bottom:4px;
      }

      /* ── Botões ── */
      .ficha-acoes {
        display:flex; gap:8px; margin-top:8px;
        flex-wrap:wrap; align-items:center;
        grid-column: 1 / -1;
      }
      .ficha-btn-ouvir {
        background:#2A1400; color:#F5E6C8;
        font-family:'Press Start 2P',monospace; font-size:.42rem;
        padding:8px 12px; border:none; border-radius:4px;
        cursor:pointer; white-space:nowrap;
        transition:background .2s;
      }
      .ficha-btn-ouvir:hover { background:#3A2400; }
      .ficha-btn-jogar {
        background:#D4A843; color:#0D0500;
        font-family:'Press Start 2P',monospace; font-size:.46rem;
        padding:10px 18px; border:none; border-radius:4px;
        cursor:pointer; flex:1; min-width:120px; text-align:center;
        transition:filter .2s, transform .15s;
      }
      .ficha-btn-jogar:hover { filter:brightness(1.12); transform:translateY(-1px); }
      .ficha-btn-fechar {
        background:transparent; border:2px solid #2A1400; color:#2A1400;
        font-family:'Press Start 2P',monospace; font-size:.4rem;
        padding:8px 10px; border-radius:4px; cursor:pointer;
        white-space:nowrap; transition:background .2s;
      }
      .ficha-btn-fechar:hover { background:rgba(42,20,0,.1); }

      /* ── Tutorial ── */
      .tutorial-overlay {
        position:fixed; inset:0; z-index:200;
        background:rgba(13,5,0,.93);
        display:flex; align-items:center; justify-content:center;
        padding:8px;
        animation:fadeInOverlay .25s ease both;
      }
      .tutorial-card {
        max-width:500px; width:100%;
        background:var(--escuro);
        border:2px solid var(--ouro); border-radius:6px;
        padding:20px 24px 18px;
        box-shadow:0 0 30px rgba(212,168,67,.2);
        animation:slideUpCard .3s cubic-bezier(.22,.61,.36,1) both;
      }
      .tutorial-titulo {
        font-family:'Press Start 2P',monospace;
        font-size:clamp(8px,1.1vw,11px); color:var(--ouro);
        text-align:center; margin-bottom:14px; line-height:1.6;
      }
      .tutorial-lista {
        list-style:none; display:flex; flex-direction:column; gap:9px;
        margin-bottom:18px;
      }
      .tutorial-lista li {
        display:flex; align-items:flex-start; gap:10px;
        font-family:'Teko',sans-serif; font-size:clamp(15px,2.2vw,19px);
        color:var(--creme); line-height:1.3;
      }
      .tutorial-lista .t-icone { font-size:18px; flex-shrink:0; margin-top:1px; }
      .tutorial-lista .t-texto { flex:1; }
      .tutorial-acoes { display:flex; justify-content:center; }
      .tutorial-btn-comecar {
        background:var(--ouro); color:var(--marrom);
        font-family:'Press Start 2P',monospace; font-size:.56rem;
        padding:12px 30px; border:none; border-radius:4px;
        cursor:pointer; transition:filter .2s,transform .15s;
        animation:pulsoOuroTut 2.5s ease infinite;
      }
      .tutorial-btn-comecar:hover { filter:brightness(1.12); transform:translateY(-2px); }
      @keyframes pulsoOuroTut {
        0%,100%{box-shadow:0 0 0 0 rgba(212,168,67,.5)}
        50%    {box-shadow:0 0 0 8px rgba(212,168,67,0)}
      }

      /* ── Contagem ── */
      .contagem-overlay {
        position:fixed; inset:0; z-index:300;
        background:rgba(13,5,0,.96);
        display:flex; align-items:center; justify-content:center;
      }
      .contagem-numero {
        font-family:'Press Start 2P',monospace;
        font-size:clamp(48px,12vw,80px); color:var(--ouro);
        text-shadow:0 0 40px rgba(212,168,67,.7);
        animation:popIn .4s cubic-bezier(.22,.61,.36,1) both;
      }
      .contagem-numero.ja {
        color:#4CAF50; font-size:clamp(36px,9vw,60px);
        text-shadow:0 0 40px rgba(76,175,80,.7);
      }
      @keyframes popIn {
        0%  {transform:scale(0.4) rotate(-8deg);opacity:0}
        70% {transform:scale(1.15) rotate(2deg)}
        100%{transform:scale(1) rotate(0deg);opacity:1}
      }

    `;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════════════════════════
     mostrarCard(n, onJogar)
     Exibe a ficha educativa do animal N.
     onJogar: callback chamado ao clicar em "JOGAR AGORA"
  ══════════════════════════════════════════════════════════════ */
  function mostrarCard(n, onJogar) {
    _injetarEstilos();
    pararSpeech();

    const a = AnimaisData[n];
    if (!a) { console.error('[CardEducativo] Animal', n, 'não encontrado.'); return; }

    /* ── Overlay ── */
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay-edu';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Ficha educativa – ' + a.nome);

    /* ── Ficha ── */
    const ficha = document.createElement('div');
    ficha.className = 'ficha-edu';

    /* ── Topo (linha inteira) ── */
    const topo = document.createElement('div');
    topo.className = 'ficha-topo';
    topo.innerHTML = `
      <div class="ficha-emoji">${a.emoji}</div>
      <div class="ficha-info">
        <div class="ficha-nome">${a.nome}</div>
        <div class="ficha-especie">${a.especie}</div>
      </div>
    `;
    ficha.appendChild(topo);
    ficha.appendChild(_sep());

    /* ── Corpo em 2 colunas ── */
    const body = document.createElement('div');
    body.className = 'ficha-body';

    /* Coluna esquerda: cordel + curiosidade */
    const colEsq = document.createElement('div');
    colEsq.className = 'ficha-col-esq';

    const cordelWrap = document.createElement('div');
    cordelWrap.className = 'ficha-cordel';
    a.cordel.forEach(function (linha, i) {
      const v = document.createElement('span');
      v.className = 'ficha-cordel-verso';
      v.textContent = linha;
      cordelWrap.appendChild(v);
      setTimeout(function () { v.classList.add('visivel'); }, 150 + i * 300);
    });
    colEsq.appendChild(cordelWrap);

    const cur = document.createElement('div');
    cur.className = 'ficha-curiosidade';
    cur.innerHTML = `<strong>💡 CURIOSIDADE</strong>${a.curiosidade}`;
    colEsq.appendChild(cur);

    /* Coluna direita: grid de dados */
    const colDir = document.createElement('div');
    colDir.className = 'ficha-col-dir';

    const grid = document.createElement('div');
    grid.className = 'ficha-grid';
    grid.innerHTML =
      _item('TAMANHO',      a.tamanho) +
      _item('ALIMENTAÇÃO',  a.alimentacao) +
      _item('HABITAT',      a.habitat) +
      _item('STATUS IBAMA', a.status);
    colDir.appendChild(grid);

    body.appendChild(colEsq);
    body.appendChild(colDir);
    ficha.appendChild(body);
    ficha.appendChild(_sep());

    /* ── Botões (linha inteira) ── */
    const acoes = document.createElement('div');
    acoes.className = 'ficha-acoes';

    const btnOuvir = document.createElement('button');
    btnOuvir.className = 'ficha-btn-ouvir';
    btnOuvir.innerHTML = '🔊 Ouvir';
    btnOuvir.title = 'Ouvir a ficha em voz alta';
    btnOuvir.addEventListener('click', function () { ouvirCard(n); });

    const btnJogar = document.createElement('button');
    btnJogar.className = 'ficha-btn-jogar';
    btnJogar.innerHTML = 'JOGAR AGORA →';
    btnJogar.addEventListener('click', function () {
      pararSpeech();
      _remover(overlay);
      if (typeof onJogar === 'function') onJogar();
    });

    const btnFechar = document.createElement('button');
    btnFechar.className = 'ficha-btn-fechar';
    btnFechar.innerHTML = '✕ Fechar';
    btnFechar.addEventListener('click', function () {
      pararSpeech();
      _remover(overlay);
    });

    acoes.appendChild(btnOuvir);
    acoes.appendChild(btnJogar);
    acoes.appendChild(btnFechar);
    ficha.appendChild(acoes);

    overlay.appendChild(ficha);

    /* Fecha ao clicar no fundo */
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { pararSpeech(); _remover(overlay); }
    });

    /* Fecha com Escape */
    function _onKey(e) {
      if (e.key === 'Escape') { pararSpeech(); _remover(overlay); document.removeEventListener('keydown', _onKey); }
    }
    document.addEventListener('keydown', _onKey);

    document.body.appendChild(overlay);
    btnJogar.focus();
  }

  /* ══════════════════════════════════════════════════════════════
     mostrarTutorial(n, onIniciar)
     Exibe as instruções de controle da fase N, depois dispara onIniciar.
  ══════════════════════════════════════════════════════════════ */
  function mostrarTutorial(n, onIniciar) {
    _injetarEstilos();

    const t = TutorialData[n];
    if (!t) { if (typeof onIniciar === 'function') onIniciar(); return; }

    /* Overlay */
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', t.titulo);

    const card = document.createElement('div');
    card.className = 'tutorial-card';

    /* Título */
    const titulo = document.createElement('div');
    titulo.className = 'tutorial-titulo';
    titulo.textContent = t.titulo;
    card.appendChild(titulo);

    /* Lista de instruções */
    const lista = document.createElement('ul');
    lista.className = 'tutorial-lista';
    t.instrucoes.forEach(function (inst) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="t-icone">${inst.icone}</span><span class="t-texto">${inst.texto}</span>`;
      lista.appendChild(li);
    });
    card.appendChild(lista);

    /* Botão COMEÇAR */
    const acoes = document.createElement('div');
    acoes.className = 'tutorial-acoes';
    const btnComecar = document.createElement('button');
    btnComecar.className = 'tutorial-btn-comecar';
    btnComecar.textContent = '▶ COMEÇAR';
    btnComecar.addEventListener('click', function () {
      _remover(overlay);
      contagem(onIniciar);
    });
    acoes.appendChild(btnComecar);
    card.appendChild(acoes);

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    btnComecar.focus();
  }

  /* ══════════════════════════════════════════════════════════════
     contagem(onFim)
     Exibe 3 → 2 → 1 → JÁ! e chama onFim ao terminar.
  ══════════════════════════════════════════════════════════════ */
  function contagem(onFim) {
    _injetarEstilos();

    const overlay = document.createElement('div');
    overlay.className = 'contagem-overlay';
    overlay.setAttribute('aria-live', 'assertive');
    document.body.appendChild(overlay);

    const passos = ['3', '2', '1', 'JÁ!'];
    let idx = 0;

    function _mostrar() {
      /* Remove número anterior */
      const antigo = overlay.querySelector('.contagem-numero');
      if (antigo) antigo.remove();

      if (idx >= passos.length) {
        _remover(overlay);
        if (typeof onFim === 'function') onFim();
        return;
      }

      const el = document.createElement('div');
      el.className = 'contagem-numero' + (passos[idx] === 'JÁ!' ? ' ja' : '');
      el.textContent = passos[idx];
      overlay.appendChild(el);
      idx++;

      setTimeout(_mostrar, 1000);
    }

    _mostrar();
  }

  /* ══════════════════════════════════════════════════════════════
     HELPERS INTERNOS
  ══════════════════════════════════════════════════════════════ */

  function _sep() {
    const d = document.createElement('div');
    d.className = 'ficha-sep';
    return d;
  }

  function _item(label, valor) {
    return `
      <div class="ficha-item">
        <span class="ficha-label">${label}</span>
        <span class="ficha-valor">${valor}</span>
      </div>
    `;
  }

  function _remover(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  /* ══════════════════════════════════════════════════════════════
     EXPORTAÇÃO
  ══════════════════════════════════════════════════════════════ */
  global.AnimaisData    = AnimaisData;
  global.CardEducativo  = {
    mostrarCard,
    mostrarTutorial,
    contagem,
    pararSpeech,
  };

})(window);
