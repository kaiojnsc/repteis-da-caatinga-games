# 🦎 Répteis da Caatinga – O Museu Vivo

**Répteis da Caatinga** é um PWA (Progressive Web App) educacional de aventura e fliperama, focado na conscientização ambiental e na preservação da fauna da Caatinga brasileira. Inspirado pelo acervo de animais resgatados pelo IBAMA no Museu Vivo de Puxinanã-PB.

O projeto é desenvolvido puramente em **Vanilla JavaScript, HTML5 e Canvas 2D API**, oferecendo alto desempenho e funcionamento offline sem a necessidade de frameworks pesados.

---

## 🎮 As Fases do Jogo

O jogo é dividido em minigames que misturam gêneros clássicos arcade com educação ambiental:

### 🐍 Fase 1: A Píton Albina (Snake Game)
Controle a **Juquinha** (Píton Albina) pelas areias da Caatinga!
- **Mecânica:** Cresça resgatando rações e evite bater em si mesma ou nos espinhos dos Mandacarus.
- **Diferencial:** A cobra é desenhada usando texturas recortadas e rotacionadas dinamicamente da foto real da Juquinha para máxima imersão. Possui botão de aceleração ("Turbo").

### 🐉 Fase 2: O Dragão Barbudo (Plataforma 2D)
A Juquinha entra no habitat do **Dragão Barbudo** (*Pogona vitticeps*) num estilo side-scroller (Mario Bros).
- **Mecânica:** Plataforma, pulo e exploração de cenários horizontais.
- **Diferencial:** Mecânica de gravidade realista (Engine Física Customizada), caça aos insetos para liberar Pulo Duplo e combate (pulo na cabeça) contra os perigosos escorpiões do deserto.

### 🐊 Fase 3: O Jacaré do Papo Amarelo (Top-Down Maze)
Fuga e ação estratégica vista de cima num mapa fechado.
- **Mecânica:** Colete todos os ovos perdidos pelo labirinto antes que o tempo acabe.
- **Diferencial:** Inimigos com IA de perseguição (como a temida Cuca) e camuflagens em vitórias-régias. *(Progressão da Fase).*

---

## 📚 Educação Ambiental
Antes de jogar, e às vezes durante pausas, o jogo ativa os **Cards Educativos**.
A API de Síntese de Voz Nativa (`window.speechSynthesis`) narra curiosidades reais sobre a fauna (ex: como as Pogonas inflam a barba quando ameaçadas, ou o fato da Juquinha não possuir melanina).

---

## 🛠️ Tecnologias e Arquitetura

- **Frontend Core:** HTML5, CSS3, JavaScript (ES6+).
- **Renderização:** Canvas API (Totalmente sem dependências externas como Phaser ou Three.js).
- **Engine Personalizada:**
  - `physics.js`: AABB Collision e Gravidade estrita para a plataforma.
  - `snake.js`: Algoritmo de grid procedural com recorte de matriz visual.
- **Offline & PWA:** Possui `manifest.json` e `sw.js` (Service Worker) otimizados para Cache-First agressivo. O jogo pode ser instalado no celular e jogado sem internet!
- **AudioEngine:** Wrapper dedicado (`audio.js`) para cross-fade e controle dinâmico de trilhas sonoras e efeitos sonoros via Web Audio.

---

## 🚀 Como Executar o Projeto Localmente

Por se tratar de um PWA, alguns navegadores bloqueiam o Service Worker caso seja aberto diretamente via protocolo `file://`. A recomendação é abrir o projeto através de um servidor local.

**1. Clone o repositório:**
```bash
git clone https://github.com/SeuUsuario/repteis-da-caatinga.git
```

**2. Use o Live Server (VS Code):**
Abra a pasta do projeto no VS Code e clique em "Go Live" na barra inferior. 

**Alternativa (Python Server):**
```bash
python -m http.server 5500
```
**3. Acesse no navegador:**
`http://localhost:5500`

> ⚠️ **Atenção (Modo Dev):** Como o jogo possui Service Worker, ao testar modificações no código, é aconselhado deixar a aba de desenvolvedor (F12) aberta com a opção **"Disable Cache"** marcada, ou simplesmente forçar a atualização (Ctrl + F5).

---

## 🗂️ Estrutura de Diretórios

```
📁 repteis_game/
├── 📄 index.html          # Tela Inicial
├── 📄 mapa.html           # HUB de Seleção das 3 Fases
├── 📄 fase1.html          # Instância do Snake Game
├── 📄 fase2.html          # Instância da Plataforma 2D
├── 📄 sw.js               # Service Worker (Coração do PWA)
├── 📄 manifest.json       # Definições do App Mobile Instalável
│
├── 📁 css/                # Estilos visuais e do HUD
│
├── 📁 js/                 # Motores Lógicos
│   ├── snake.js           # Lógica da Fase 1
│   ├── game-fase2.js      # Lógica e Física da Fase 2 (Novo e Refatorado)
│   ├── progresso.js       # LocalStorage Save System
│   ├── audio.js           # Gerenciador de SFX / BGM
│   └── card.js            # Sistema de Narração de Curiosidades
│
└── 📁 assets/             # Imagens (Juquinha), Sons e Fontes
```

---

## 📄 Licença
Feito para uso educacional e recreativo. All rights reserved para os criadores do Répteis da Caatinga.
