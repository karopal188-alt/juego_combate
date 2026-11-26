// UI Controller: Screens, Story Campaign, Cutscenes, Roster & HUD
window.GameUI = (() => {
  const screens = {};
  let selectedPlayer = 'kaelen';
  let selectedEnemy = 'vespera';
  let selectedArena = 'umbral';

  let storyProgress = { clearedActs: [] };
  let activeStoryState = null; // { actIndex, fightIndex, slideIndex }
  let activeMode = 'versus'; // 'story' | 'versus'
  let cutsceneRaf = null;
  let cutsceneTime = 0;

  function init() {
    screens.title = document.getElementById('screen-title');
    screens.story = document.getElementById('screen-story');
    screens.select = document.getElementById('screen-select');
    screens.codex = document.getElementById('screen-codex');
    screens.cutscene = document.getElementById('screen-cutscene');
    screens.postmatch = document.getElementById('screen-postmatch');
    screens.help = document.getElementById('screen-help');

    const canvas = document.getElementById('gameCanvas');
    window.CombatEngine.init(canvas, handleMatchEnd);

    bindEvents();
    renderRosterAndArenas();
    renderActs();
    renderCodex();
    drawTitleIdleCanvas();
  }

  function bindEvents() {
    document.getElementById('btn-story-mode').addEventListener('click', () => {
      window.RetroAudio.sfx.uiSelect();
      renderActs();
      showScreen('story');
    });

    document.getElementById('btn-versus-mode').addEventListener('click', () => {
      window.RetroAudio.sfx.uiSelect();
      showScreen('select');
    });

    document.getElementById('btn-codex').addEventListener('click', () => {
      window.RetroAudio.sfx.uiSelect();
      showScreen('codex');
    });

    document.querySelectorAll('.back-to-title').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.RetroAudio.sfx.uiMove();
        returnToTitle();
      });
    });

    document.getElementById('btn-start-versus').addEventListener('click', () => {
      window.RetroAudio.sfx.uiSelect();
      activeMode = 'versus';
      activeStoryState = null;
      const diff = document.getElementById('cpu-difficulty').value;
      launchFight({
        player: selectedPlayer,
        enemy: selectedEnemy,
        arena: selectedArena,
        difficulty: diff,
        awakened: false
      });
    });

    document.getElementById('btn-cutscene-next').addEventListener('click', () => {
      window.RetroAudio.sfx.uiSelect();
      advanceCutscene();
    });

    document.getElementById('btn-cutscene-skip').addEventListener('click', () => {
      window.RetroAudio.sfx.uiSelect();
      stopCutsceneLoop();
      startCurrentStoryFight();
    });

    document.getElementById('btn-post-next').addEventListener('click', () => {
      window.RetroAudio.sfx.uiSelect();
      handlePostNext();
    });

    document.getElementById('btn-post-retry').addEventListener('click', () => {
      window.RetroAudio.sfx.uiSelect();
      if (activeMode === 'story' && activeStoryState) {
        startCurrentStoryFight();
      } else {
        document.getElementById('btn-start-versus').click();
      }
    });

    document.getElementById('btn-post-menu').addEventListener('click', () => {
      window.RetroAudio.sfx.uiMove();
      returnToTitle();
    });

    document.getElementById('btn-crt').addEventListener('click', (e) => {
      const crt = document.getElementById('crt-overlay');
      const active = crt.classList.toggle('crt-active');
      e.target.textContent = `CRT: ${active ? 'ON' : 'OFF'}`;
    });

    document.getElementById('btn-audio').addEventListener('click', (e) => {
      const on = window.RetroAudio.toggle();
      e.target.textContent = `SONIDO: ${on ? 'ON' : 'OFF'}`;
    });

    document.getElementById('btn-help').addEventListener('click', () => {
      window.RetroAudio.sfx.uiSelect();
      screens.help.classList.add('active');
    });

    document.getElementById('btn-close-help').addEventListener('click', () => {
      window.RetroAudio.sfx.uiMove();
      screens.help.classList.remove('active');
    });

    document.getElementById('btn-menu').addEventListener('click', () => {
      window.RetroAudio.sfx.uiMove();
      returnToTitle();
    });
  }

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove('active'));
    if (name && screens[name]) {
      screens[name].classList.add('active');
    }
    const inGame = !name;
    document.getElementById('combat-hud').classList.toggle('hidden', !inGame);
    document.getElementById('btn-menu').classList.toggle('hidden', !inGame);
  }

  function returnToTitle() {
    window.CombatEngine.stopMatch();
    stopCutsceneLoop();
    hideBanner();
    showScreen('title');
  }

  function drawTitleIdleCanvas() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const arena = window.ArenaManager.createArenaState('eclipse');
    window.ArenaManager.drawArena(ctx, arena, 0, 0);
  }

  function renderRosterAndArenas() {
    const fighterList = Object.values(window.GAME_DATA.fighters);
    const pGrid = document.getElementById('roster-player');
    const eGrid = document.getElementById('roster-enemy');
    pGrid.innerHTML = '';
    eGrid.innerHTML = '';

    fighterList.forEach((f) => {
      const slotP = createRosterSlot(f, f.id === selectedPlayer, () => {
        selectedPlayer = f.id;
        window.RetroAudio.sfx.uiMove();
        renderRosterAndArenas();
      });
      const slotE = createRosterSlot(f, f.id === selectedEnemy, () => {
        selectedEnemy = f.id;
        window.RetroAudio.sfx.uiMove();
        renderRosterAndArenas();
      });
      pGrid.appendChild(slotP);
      eGrid.appendChild(slotE);
    });

    renderFighterCard('player-preview-card', window.GAME_DATA.fighters[selectedPlayer]);
    renderFighterCard('enemy-preview-card', window.GAME_DATA.fighters[selectedEnemy]);

    const arenaEl = document.getElementById('arena-selector');
    arenaEl.innerHTML = '';
    Object.values(window.GAME_DATA.arenas).forEach((a) => {
      const btn = document.createElement('button');
      btn.className = `arena-pill ${a.id === selectedArena ? 'selected' : ''}`;
      btn.textContent = `${a.name} (${a.realm})`;
      btn.title = a.desc;
      btn.addEventListener('click', () => {
        selectedArena = a.id;
        window.RetroAudio.sfx.uiMove();
        renderRosterAndArenas();
      });
      arenaEl.appendChild(btn);
    });
  }

  function createRosterSlot(f, isSelected, onClick) {
    const div = document.createElement('div');
    div.className = `roster-slot ${isSelected ? 'selected' : ''}`;
    div.innerHTML = `
      <div class="roster-swatch" style="background: linear-gradient(135deg, ${f.palette.primary} 50%, ${f.palette.accent} 50%);"></div>
      <span>${f.name}</span>
    `;
    div.addEventListener('click', onClick);
    return div;
  }

  function renderFighterCard(containerId, f) {
    const el = document.getElementById(containerId);
    el.innerHTML = `
      <div class="fighter-card-top">
        <span class="fighter-card-name">${f.name} — ${f.title}</span>
        <span class="fighter-card-realm" style="color:${f.realmColor}">${f.realm}</span>
      </div>
      <p class="fighter-card-desc">${f.bio}</p>
      <div class="fighter-card-moves">
        <strong>Poderes:</strong> ${f.moves.special.name} · ${f.moves.element.name} · ${f.moves.ultimate.name}
      </div>
    `;
  }

  function renderActs() {
    const grid = document.getElementById('acts-grid');
    grid.innerHTML = '';
    window.GAME_DATA.acts.forEach((act, idx) => {
      const cleared = storyProgress.clearedActs.includes(act.id);
      const card = document.createElement('div');
      card.className = `act-card ${cleared ? 'cleared' : ''}`;
      const matchSummary = act.fights
        .map((ft) => `${window.GAME_DATA.fighters[ft.player].name} vs ${window.GAME_DATA.fighters[ft.enemy].name}`)
        .join(' → ');

      card.innerHTML = `
        <div>
          <div class="act-tag">${act.badge}${cleared ? ' · ✓ COMPLETADO' : ''}</div>
          <h3>${act.title}</h3>
          <p>${act.summary}</p>
        </div>
        <div>
          <div class="act-fights">${matchSummary}</div>
          <button class="retro-btn primary small" style="width:100%;margin-top:8px;">JUGAR ${act.badge.split(':')[0]}</button>
        </div>
      `;
      card.querySelector('button').addEventListener('click', () => {
        window.RetroAudio.sfx.uiSelect();
        startAct(idx);
      });
      grid.appendChild(card);
    });
  }

  function renderCodex() {
    const el = document.getElementById('codex-content');
    const realmCards = window.GAME_DATA.realms
      .map(
        (r) => `
      <div class="codex-card">
        <h3 style="color:${r.color}">${r.name}</h3>
        <p>${r.summary}</p>
      </div>`
      )
      .join('');

    const fighterCards = Object.values(window.GAME_DATA.fighters)
      .map(
        (f) => `
      <div class="codex-card">
        <h3>${f.name} — ${f.title} (${f.realm})</h3>
        <p>${f.bio}<br><em style="color:#ffd147">"${f.quote}"</em></p>
      </div>`
      )
      .join('');

    el.innerHTML = realmCards + fighterCards;
  }

  function startAct(actIndex) {
    activeMode = 'story';
    activeStoryState = { actIndex, fightIndex: 0, slideIndex: 0 };
    showCutscene();
  }

  function showCutscene() {
    const act = window.GAME_DATA.acts[activeStoryState.actIndex];
    const fight = act.fights[activeStoryState.fightIndex];
    const slide = fight.preDialogue[activeStoryState.slideIndex];

    document.getElementById('cutscene-act-badge').textContent = act.badge;
    document.getElementById('dialogue-speaker').textContent = slide.speaker;
    document.getElementById('dialogue-realm').textContent = slide.realm;
    document.getElementById('dialogue-text').textContent = slide.text;

    showScreen('cutscene');
    startCutsceneLoop(slide);
  }

  function startCutsceneLoop(slide) {
    stopCutsceneLoop();
    const c = document.getElementById('cutsceneCanvas');
    const cctx = c.getContext('2d');
    const tick = () => {
      cutsceneTime++;
      window.PixelSprites.drawCutsceneStage(cctx, slide, cutsceneTime);
      cutsceneRaf = requestAnimationFrame(tick);
    };
    tick();
  }

  function stopCutsceneLoop() {
    if (cutsceneRaf) {
      cancelAnimationFrame(cutsceneRaf);
      cutsceneRaf = null;
    }
  }

  function advanceCutscene() {
    const act = window.GAME_DATA.acts[activeStoryState.actIndex];
    const fight = act.fights[activeStoryState.fightIndex];
    activeStoryState.slideIndex++;
    if (activeStoryState.slideIndex < fight.preDialogue.length) {
      showCutscene();
    } else {
      stopCutsceneLoop();
      startCurrentStoryFight();
    }
  }

  function startCurrentStoryFight() {
    const act = window.GAME_DATA.acts[activeStoryState.actIndex];
    const fight = act.fights[activeStoryState.fightIndex];
    launchFight(fight);
  }

  function launchFight(cfg) {
    showScreen(null);
    const fDef = window.GAME_DATA.fighters[cfg.player];
    document.getElementById('hud-special-name').textContent = fDef.moves.special.name;
    document.getElementById('hud-element-name').textContent = fDef.moves.element.name;
    document.getElementById('hud-ult-name').textContent = fDef.moves.ultimate.name;
    window.CombatEngine.startMatch(cfg);
  }

  function handleMatchEnd(result) {
    const titleEl = document.getElementById('postmatch-title');
    const descEl = document.getElementById('postmatch-desc');
    const statsEl = document.getElementById('postmatch-stats');
    const nextBtn = document.getElementById('btn-post-next');

    if (result.winner === 'player') {
      titleEl.textContent = result.fatality ? '¡VICTORIA BRUTAL — FATALITY!' : '¡VICTORIA EN EL UMBRAL!';
      if (activeMode === 'story' && activeStoryState) {
        const act = window.GAME_DATA.acts[activeStoryState.actIndex];
        const isLastFight = activeStoryState.fightIndex >= act.fights.length - 1;
        const isLastAct = activeStoryState.actIndex >= window.GAME_DATA.acts.length - 1;

        if (isLastFight && !storyProgress.clearedActs.includes(act.id)) {
          storyProgress.clearedActs.push(act.id);
        }

        if (isLastFight && isLastAct) {
          titleEl.textContent = '¡TERRA HA SIDO SALVADA!';
          descEl.textContent =
            'Has derrotado al Emperador Lord Malakor en la cima del Eclipse Rojo. El sacrificio del Maestro Orin y el despertar de Kaelen sellaron El Umbral por otros mil años.';
          nextBtn.textContent = 'VOLVER AL INICIO';
        } else {
          descEl.textContent = isLastFight
            ? `Completaste ${act.badge}. ¡Avanza al siguiente acto de la campaña!`
            : 'Has superado este combate. Prepárate para el próximo enfrentamiento del acto.';
          nextBtn.textContent = 'SIGUIENTE COMBATE ▶';
        }
        nextBtn.classList.remove('hidden');
      } else {
        descEl.textContent = '¡Has demostrado tu supremacía en la arena del torneo!';
        nextBtn.classList.add('hidden');
      }
    } else {
      titleEl.textContent = 'HAS CAÍDO EN COMBATE';
      descEl.textContent = 'Valthor celebra tu derrota... pero los Antiguos aún te conceden otra oportunidad.';
      nextBtn.classList.add('hidden');
    }

    statsEl.innerHTML = `Rondas: <strong>${result.p1Rounds} - ${result.p2Rounds}</strong>${
      result.fatality ? ' · <span style="color:#ff4757">Ejecución Fatality completada</span>' : ''
    }`;
    showScreen('postmatch');
  }

  function handlePostNext() {
    if (!activeStoryState) return;
    const act = window.GAME_DATA.acts[activeStoryState.actIndex];
    if (activeStoryState.fightIndex < act.fights.length - 1) {
      activeStoryState.fightIndex++;
      activeStoryState.slideIndex = 0;
      showCutscene();
    } else if (activeStoryState.actIndex < window.GAME_DATA.acts.length - 1) {
      activeStoryState.actIndex++;
      activeStoryState.fightIndex = 0;
      activeStoryState.slideIndex = 0;
      showCutscene();
    } else {
      returnToTitle();
    }
  }

  function updateHUD(p1, p2, roundNum, timerSec, arena) {
    document.getElementById('p1-name').textContent = p1.awakened ? `${p1.def.name} ★` : p1.def.name;
    document.getElementById('p2-name').textContent = p2.def.name;
    document.getElementById('hud-stage-tag').textContent = arena.cfg.name.toUpperCase();
    document.getElementById('hud-timer').textContent = String(timerSec).padStart(2, '0');
    document.getElementById('hud-round-label').textContent = `RONDA ${roundNum}`;

    const p1Pct = Math.max(0, (p1.hp / p1.maxHp) * 100);
    const p2Pct = Math.max(0, (p2.hp / p2.maxHp) * 100);
    document.getElementById('p1-hp-fill').style.width = `${p1Pct}%`;
    document.getElementById('p1-hp-trail').style.width = `${p1Pct}%`;
    document.getElementById('p1-hp-text').textContent = Math.ceil(p1.hp);

    document.getElementById('p2-hp-fill').style.width = `${p2Pct}%`;
    document.getElementById('p2-hp-trail').style.width = `${p2Pct}%`;
    document.getElementById('p2-hp-text').textContent = Math.ceil(p2.hp);

    const p1Chi = Math.floor(p1.chi / 100);
    const p2Chi = Math.floor(p2.chi / 100);
    document.getElementById('p1-chi-fill').style.width = `${(p1.chi / 300) * 100}%`;
    document.getElementById('p1-chi-label').textContent = `CHI ${p1Chi}/3`;
    document.getElementById('p2-chi-fill').style.width = `${(p2.chi / 300) * 100}%`;
    document.getElementById('p2-chi-label').textContent = `CHI ${p2Chi}/3`;

    renderRoundGems('p1-rounds', p1.roundsWon);
    renderRoundGems('p2-rounds', p2.roundsWon);

    const c1 = document.getElementById('p1-combo');
    c1.classList.toggle('hidden', p1.comboCounter < 2);
    c1.textContent = `${p1.comboCounter} GOLPES!`;

    const c2 = document.getElementById('p2-combo');
    c2.classList.toggle('hidden', p2.comboCounter < 2);
    c2.textContent = `${p2.comboCounter} GOLPES!`;
  }

  function renderRoundGems(elId, wonCount) {
    const el = document.getElementById(elId);
    el.innerHTML = '';
    for (let i = 0; i < 2; i++) {
      const span = document.createElement('span');
      span.className = `round-gem ${i < wonCount ? 'won' : ''}`;
      el.appendChild(span);
    }
  }

  function showBanner(main, sub = '') {
    const banner = document.getElementById('announcer-banner');
    document.getElementById('announcer-main').textContent = main;
    document.getElementById('announcer-sub').textContent = sub;
    banner.classList.remove('hidden');
  }

  function hideBanner() {
    document.getElementById('announcer-banner').classList.add('hidden');
  }

  window.addEventListener('DOMContentLoaded', init);

  return { updateHUD, showBanner, hideBanner };
})();
