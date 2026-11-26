// 2D Platformer-Fighter Engine (MK-inspired Combat, Physics, AI, VFX & Rounds)
window.CombatEngine = (() => {
  const GRAVITY = 0.62;
  const WIDTH = 960;
  const FLOOR_Y = window.ArenaManager.FLOOR_Y;

  class Fighter {
    constructor(id, isPlayer, spawnX, facing, awakened = false) {
      const def = window.GAME_DATA.fighters[id];
      this.id = id;
      this.def = def;
      this.isPlayer = isPlayer;
      this.awakened = awakened;
      this.w = 40;
      this.h = 82;
      this.spawnX = spawnX;
      this.startFacing = facing;
      this.maxHp = awakened ? 125 : 100;
      this.roundsWon = 0;
      this.resetForRound();
    }

    resetForRound() {
      this.x = this.spawnX;
      this.y = FLOOR_Y - this.h;
      this.vx = 0;
      this.vy = 0;
      this.facing = this.startFacing;
      this.hp = this.maxHp;
      this.chi = this.awakened ? 150 : 60; // Start with partial Chi
      this.onGround = true;
      this.jumpsLeft = 2;
      this.dropThrough = 0;
      this.state = 'idle'; // idle, walk, jump, crouch, block, attack1..3, sweep, airAttack, special, dash, hit, dizzy, ko, victory
      this.stateTimer = 0;
      this.comboStep = 0;
      this.comboWindow = 0;
      this.hitLandedThisSwing = false;
      this.hitFlash = 0;
      this.invuln = 0;
      this.slowTimer = 0;
      this.portalCooldown = 0;
      this.ultAura = 0;
      this.comboCounter = 0;
      this.comboDecay = 0;
    }

    takeEnvironmentDamage(dmg, knockX, knockY, color, particles) {
      this.hp = Math.max(1, this.hp - dmg);
      this.vx = knockX;
      this.vy = knockY;
      this.onGround = false;
      this.state = 'hit';
      this.stateTimer = 18;
      this.hitFlash = 10;
      this.invuln = 28;
      window.RetroAudio.sfx.hitLight();
      for (let i = 0; i < 10; i++) {
        particles.push({
          x: this.x + this.w / 2,
          y: this.y + this.h / 2,
          vx: (Math.random() - 0.5) * 7,
          vy: (Math.random() - 0.5) * 7,
          life: 20,
          color,
          size: 4
        });
      }
    }
  }

  let canvas = null;
  let ctx = null;
  let rafId = null;
  let running = false;
  let time = 0;
  let hitstop = 0;
  let shake = 0;

  let p1 = null;
  let p2 = null;
  let arena = null;
  let projectiles = [];
  let hazards = []; // active pillars / shockwaves
  let particles = [];
  let floatTexts = [];

  let roundNum = 1;
  let timerSec = 99;
  let timerTicks = 0;
  let phase = 'intro'; // intro, fight, finishHim, roundOver, matchOver
  let phaseTimer = 0;
  let matchConfig = null;
  let onMatchEnd = null;
  let fatalityTriggered = false;

  // Input State
  const keys = {};
  const justPressed = {};
  const mouse = {
    leftClickQueued: false,
    rightClickQueued: false
  };

  // AI State
  const aiMem = {
    thinkTick: 0,
    desiredAction: 'approach',
    attackCooldown: 0,
    jumpCooldown: 0
  };

  function init(canvasEl, onEndCallback) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    onMatchEnd = onEndCallback;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        if (running) e.preventDefault();
      }
      if (!keys[e.code]) {
        justPressed[e.code] = true;
      }
      keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      keys[e.code] = false;
    });

    canvas.addEventListener('mousedown', (e) => {
      if (!running) return;
      window.RetroAudio.ensureContext();
      if (e.button === 0) {
        mouse.leftClickQueued = true;
      } else if (e.button === 2) {
        mouse.rightClickQueued = true;
      }
    });

    canvas.addEventListener('contextmenu', (e) => {
      if (running) e.preventDefault();
    });
  }

  function startMatch(cfg) {
    matchConfig = cfg;
    arena = window.ArenaManager.createArenaState(cfg.arena);
    p1 = new Fighter(cfg.player, true, 190, 1, Boolean(cfg.awakened));
    p2 = new Fighter(cfg.enemy, false, 730, -1, false);

    roundNum = 1;
    projectiles = [];
    hazards = [];
    particles = [];
    floatTexts = [];
    fatalityTriggered = false;

    startRound();
    running = true;
    window.RetroAudio.startMusic();
    if (!rafId) loop();
  }

  function stopMatch() {
    running = false;
    window.RetroAudio.stopMusic();
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function startRound() {
    p1.resetForRound();
    p2.resetForRound();
    projectiles = [];
    hazards = [];
    particles = [];
    floatTexts = [];
    timerSec = 99;
    timerTicks = 0;
    phase = 'intro';
    phaseTimer = 85;
    fatalityTriggered = false;
    window.RetroAudio.sfx.roundGong();
    window.GameUI.showBanner(`RONDA ${roundNum}`, window.GAME_DATA.arenas[arena.id].name.toUpperCase());
    window.GameUI.updateHUD(p1, p2, roundNum, timerSec, arena);
  }

  function loop() {
    rafId = requestAnimationFrame(loop);
    if (!running) return;

    time++;
    if (hitstop > 0) {
      hitstop--;
      render();
      clearFrameInputs();
      return;
    }

    update();
    render();
    clearFrameInputs();
  }

  function clearFrameInputs() {
    mouse.leftClickQueued = false;
    mouse.rightClickQueued = false;
    for (const k in justPressed) {
      justPressed[k] = false;
    }
  }

  function update() {
    if (shake > 0) shake *= 0.84;

    if (phase === 'intro') {
      phaseTimer--;
      if (phaseTimer === 28) {
        window.GameUI.showBanner('¡LUCHEN!', 'EL DESTINO DE LOS REINOS ESTÁ EN JUEGO');
      }
      if (phaseTimer <= 0) {
        phase = 'fight';
        window.GameUI.hideBanner();
      }
      updateParticles();
      return;
    }

    if (phase === 'finishHim') {
      phaseTimer--;
      handlePlayerInput();
      updateFighterPhysics(p1);
      updateFighterPhysics(p2);
      checkFinishHimExecution();
      updateParticles();
      if (phaseTimer <= 0 && !fatalityTriggered) {
        p2.state = 'ko';
        concludeRound(p1);
      }
      window.GameUI.updateHUD(p1, p2, roundNum, timerSec, arena);
      return;
    }

    if (phase === 'roundOver') {
      phaseTimer--;
      updateFighterPhysics(p1);
      updateFighterPhysics(p2);
      updateParticles();
      if (phaseTimer <= 0) {
        if (p1.roundsWon >= 2 || p2.roundsWon >= 2) {
          phase = 'matchOver';
          running = false;
          window.RetroAudio.stopMusic();
          window.GameUI.hideBanner();
          if (onMatchEnd) {
            onMatchEnd({
              winner: p1.roundsWon >= 2 ? 'player' : 'enemy',
              p1Rounds: p1.roundsWon,
              p2Rounds: p2.roundsWon,
              fatality: fatalityTriggered
            });
          }
        } else {
          roundNum++;
          startRound();
        }
      }
      return;
    }

    // Active Fight Phase
    timerTicks++;
    if (timerTicks >= 60) {
      timerTicks = 0;
      timerSec = Math.max(0, timerSec - 1);
      if (timerSec === 0) {
        // Time over: higher HP % wins
        const winner = p1.hp / p1.maxHp >= p2.hp / p2.maxHp ? p1 : p2;
        concludeRound(winner, 'TIEMPO AGOTADO');
        return;
      }
    }

    handlePlayerInput();
    handleAIInput();

    updateFighterPhysics(p1);
    updateFighterPhysics(p2);
    resolveFighterPushbox();

    window.ArenaManager.updateArena(arena, [p1, p2], particles, time);
    updateProjectiles();
    updateHazards();
    updateParticles();

    // Check KO / Finish Him
    if (p2.hp <= 0) {
      if (p1.roundsWon === 1) {
        // Final deciding round -> Enter FINISH HIM window!
        p2.hp = 0;
        p2.state = 'dizzy';
        p2.vx = 0;
        phase = 'finishHim';
        phaseTimer = 260;
        window.RetroAudio.sfx.finishHim();
        window.GameUI.showBanner('¡ACABA CON ÉL!', 'ACÉRCATE Y PULSA CLIC IZQ. PARA FATALITY');
      } else {
        p2.hp = 0;
        p2.state = 'ko';
        concludeRound(p1);
      }
    } else if (p1.hp <= 0) {
      p1.hp = 0;
      p1.state = 'ko';
      concludeRound(p2);
    }

    window.GameUI.updateHUD(p1, p2, roundNum, timerSec, arena);
  }

  function concludeRound(winner, customTitle = null) {
    winner.roundsWon++;
    winner.state = 'victory';
    phase = 'roundOver';
    phaseTimer = 115;
    window.RetroAudio.sfx.roundGong();
    const title = customTitle || (winner === p1 ? `${p1.def.name} GANA LA RONDA` : `${p2.def.name} GANA LA RONDA`);
    window.GameUI.showBanner(title, fatalityTriggered ? `FATALITY: ${p1.def.moves.fatality}` : '');
    window.GameUI.updateHUD(p1, p2, roundNum, timerSec, arena);
  }

  function checkFinishHimExecution() {
    if (fatalityTriggered) return;
    const dist = Math.abs(p1.x + p1.w / 2 - (p2.x + p2.w / 2));
    const vert = Math.abs(p1.y - p2.y);
    if ((mouse.leftClickQueued || justPressed['KeyJ'] || justPressed['KeyZ']) && dist < 110 && vert < 70) {
      fatalityTriggered = true;
      hitstop = 14;
      shake = 22;
      p2.state = 'ko';
      window.RetroAudio.sfx.fatality();
      const col = p1.def.palette.accent;
      for (let i = 0; i < 65; i++) {
        particles.push({
          x: p2.x + p2.w / 2,
          y: p2.y + 36,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 0.8) * 14,
          life: 48,
          color: i % 2 === 0 ? '#d91e36' : col,
          size: 6
        });
      }
      floatTexts.push({
        x: p2.x + p2.w / 2,
        y: p2.y - 16,
        text: p1.def.moves.fatality,
        color: '#ffd147',
        life: 65
      });
      concludeRound(p1, '¡FATALITY!');
    }
  }

  function handlePlayerInput() {
    const f = p1;
    const opp = p2;
    if (f.state === 'hit' || f.state === 'ko' || f.state === 'dizzy') return;

    const lockedAttack = ['attack1', 'attack2', 'attack3', 'sweep', 'special', 'dash'].includes(f.state);
    const blocking = (keys['ShiftLeft'] || keys['ShiftRight']) && f.onGround && !lockedAttack;

    if (blocking) {
      f.state = 'block';
      f.vx *= 0.6;
      f.facing = opp.x >= f.x ? 1 : -1;
      return;
    }

    // Horizontal movement via Arrow Keys
    const moveLeft = keys['ArrowLeft'];
    const moveRight = keys['ArrowRight'];
    const speedMult = f.slowTimer > 0 ? 0.6 : 1;
    const moveSpeed = f.def.stats.speed * speedMult;

    if (!lockedAttack) {
      if (moveLeft && !moveRight) {
        f.vx = -moveSpeed;
        f.facing = -1;
        if (f.onGround) f.state = 'walk';
      } else if (moveRight && !moveLeft) {
        f.vx = moveSpeed;
        f.facing = 1;
        if (f.onGround) f.state = 'walk';
      } else {
        f.vx *= 0.72;
        if (f.onGround) {
          f.facing = opp.x >= f.x ? 1 : -1;
          f.state = keys['ArrowDown'] ? 'crouch' : 'idle';
        }
      }
    }

    // Jump & Double Jump (ArrowUp)
    if (justPressed['ArrowUp'] && f.jumpsLeft > 0 && !lockedAttack) {
      f.vy = -f.def.stats.jump;
      f.onGround = false;
      f.jumpsLeft--;
      f.state = 'jump';
      window.RetroAudio.sfx.jump();
      spawnDust(f.x + f.w / 2, f.y + f.h);
    }

    // Drop down through one-way platforms (ArrowDown)
    if (justPressed['ArrowDown'] && f.onGround && f.y + f.h < FLOOR_Y - 2) {
      f.dropThrough = 14;
      f.onGround = false;
      f.y += 4;
    }

    if (phase === 'finishHim') return;

    // Primary Melee Attack: Left Mouse Click (or J/Z fallback)
    if (mouse.leftClickQueued || justPressed['KeyJ'] || justPressed['KeyZ']) {
      triggerMeleeAttack(f, opp, Boolean(keys['ArrowDown']));
    }

    // Special Powers (1 Chi: Right Click or E, 2 Chi: Q, 3 Chi: Space)
    if (mouse.rightClickQueued || justPressed['KeyE']) {
      triggerPower(f, opp, 'special');
    } else if (justPressed['KeyQ']) {
      triggerPower(f, opp, 'element');
    } else if (justPressed['Space']) {
      triggerPower(f, opp, 'ultimate');
    }
  }

  function handleAIInput() {
    const f = p2;
    const opp = p1;
    if (f.state === 'hit' || f.state === 'ko' || f.state === 'dizzy' || phase !== 'fight') return;

    const lockedAttack = ['attack1', 'attack2', 'attack3', 'sweep', 'special', 'dash'].includes(f.state);
    const diff = matchConfig.difficulty || 'normal';
    const reactionRate = diff === 'hard' ? 10 : diff === 'normal' ? 18 : 30;
    const aggro = diff === 'hard' ? 0.78 : diff === 'normal' ? 0.56 : 0.34;

    if (aiMem.attackCooldown > 0) aiMem.attackCooldown--;
    if (aiMem.jumpCooldown > 0) aiMem.jumpCooldown--;
    aiMem.thinkTick++;

    const dx = opp.x - f.x;
    const dy = opp.y - f.y;
    const absDx = Math.abs(dx);

    // Dodge lava geysers if warning
    for (const g of arena.geysers) {
      if (g.phase === 'warning' && Math.abs(f.x + f.w / 2 - g.x) < 42 && f.onGround) {
        f.vy = -f.def.stats.jump;
        f.onGround = false;
        f.vx = f.x + f.w / 2 < g.x ? -f.def.stats.speed : f.def.stats.speed;
      }
    }

    if (aiMem.thinkTick % reactionRate === 0) {
      if (opp.state.startsWith('attack') && absDx < 85 && Math.random() < (diff === 'hard' ? 0.55 : 0.25)) {
        aiMem.desiredAction = 'block';
      } else if (absDx > 165 && f.chi >= 100 && Math.random() < aggro * 0.65) {
        aiMem.desiredAction = 'special';
      } else if (absDx < 74) {
        aiMem.desiredAction = 'melee';
      } else {
        aiMem.desiredAction = 'approach';
      }
    }

    if (lockedAttack) return;

    f.facing = dx >= 0 ? 1 : -1;
    const spd = f.def.stats.speed * (f.slowTimer > 0 ? 0.6 : 0.92);

    if (aiMem.desiredAction === 'block') {
      f.state = 'block';
      f.vx = 0;
      return;
    }

    if (aiMem.desiredAction === 'approach') {
      f.vx = f.facing * spd;
      if (f.onGround) f.state = 'walk';
      if (dy < -65 && f.onGround && aiMem.jumpCooldown <= 0) {
        f.vy = -f.def.stats.jump;
        f.onGround = false;
        aiMem.jumpCooldown = 55;
      }
    } else if (aiMem.desiredAction === 'melee') {
      f.vx *= 0.6;
      if (aiMem.attackCooldown <= 0) {
        triggerMeleeAttack(f, opp, Math.random() < 0.22);
        aiMem.attackCooldown = diff === 'hard' ? 16 : diff === 'normal' ? 24 : 36;
      } else if (f.onGround) {
        f.state = 'idle';
      }
    } else if (aiMem.desiredAction === 'special') {
      if (f.chi >= 300 && Math.random() < 0.5) {
        triggerPower(f, opp, 'ultimate');
      } else if (f.chi >= 200 && Math.random() < 0.55) {
        triggerPower(f, opp, 'element');
      } else if (f.chi >= 100) {
        triggerPower(f, opp, 'special');
      }
      aiMem.desiredAction = 'approach';
    }
  }

  function triggerMeleeAttack(f, opp, isDownHeld) {
    if (!f.onGround) {
      if (f.state !== 'airAttack') {
        f.state = 'airAttack';
        f.stateTimer = 18;
        f.hitLandedThisSwing = false;
        window.RetroAudio.sfx.swing();
      }
      return;
    }

    if (['attack1', 'attack2', 'attack3', 'sweep', 'special', 'dash'].includes(f.state)) {
      return;
    }

    f.facing = opp.x >= f.x ? 1 : -1;
    f.hitLandedThisSwing = false;
    window.RetroAudio.sfx.swing();

    if (isDownHeld) {
      f.state = 'sweep';
      f.stateTimer = 18;
      f.vx = f.facing * 3.5;
      return;
    }

    if (f.comboWindow > 0) {
      f.comboStep = (f.comboStep % 3) + 1;
    } else {
      f.comboStep = 1;
    }

    f.state = `attack${f.comboStep}`;
    f.stateTimer = f.comboStep === 3 ? 20 : 14;
    f.comboWindow = 32;
    f.vx = f.facing * (f.comboStep === 3 ? 4.5 : 2.5);
  }

  function triggerPower(f, opp, slot) {
    const move = f.def.moves[slot];
    const cost = move.cost * 100;
    if (f.chi < cost) return;
    if (['hit', 'ko', 'dizzy', 'dash'].includes(f.state)) return;

    f.chi -= cost;
    f.facing = opp.x >= f.x ? 1 : -1;
    f.state = 'special';
    f.stateTimer = 20;
    f.hitLandedThisSwing = false;

    if (slot === 'ultimate') {
      f.ultAura = 45;
      hitstop = 8;
      shake = 14;
      window.RetroAudio.sfx.ultimate();
      floatTexts.push({
        x: f.x + f.w / 2,
        y: f.y - 16,
        text: move.name.toUpperCase(),
        color: move.color,
        life: 48
      });
    } else {
      playElementSound(f.id);
    }

    if (move.type === 'projectile' || move.type === 'harpoon') {
      projectiles.push({
        owner: f,
        x: f.x + f.w / 2 + f.facing * 24,
        y: f.y + 34,
        vx: f.facing * move.speed,
        vy: 0,
        r: move.type === 'harpoon' ? 9 : 11,
        dmg: move.dmg * f.def.stats.power,
        color: move.color,
        type: move.type,
        slow: move.slow || 0,
        drain: move.drain || 0,
        life: 95
      });
    } else if (move.type === 'dash') {
      f.state = 'dash';
      f.stateTimer = 18;
      f.vx = f.facing * move.speed;
      f.vy = -2.2;
      f.onGround = false;
      f.dashMove = move;
    } else if (move.type === 'teleport_strike') {
      // Teleport behind opponent!
      spawnBurst(f.x + f.w / 2, f.y + 40, move.color, 14);
      f.x = Math.max(20, Math.min(WIDTH - f.w - 20, opp.x - f.facing * 58));
      f.y = opp.y - 6;
      f.facing = opp.x >= f.x ? 1 : -1;
      spawnBurst(f.x + f.w / 2, f.y + 40, move.color, 14);
      hazards.push({
        owner: f,
        x: f.x + f.w / 2 + f.facing * 28,
        y: f.y + 10,
        w: 62,
        h: 72,
        dmg: move.dmg * f.def.stats.power,
        color: move.color,
        life: 10,
        hitDone: false,
        knockY: -6
      });
    } else if (move.type === 'shockwave') {
      f.vy = 6;
      shake = 10;
      [-1, 1].forEach((dir) => {
        projectiles.push({
          owner: f,
          x: f.x + f.w / 2 + dir * 20,
          y: f.y + f.h - 14,
          vx: dir * 7.5,
          vy: 0,
          r: 14,
          dmg: move.dmg * f.def.stats.power,
          color: move.color,
          type: 'shockwave',
          life: 55
        });
      });
    } else if (move.type === 'pillar') {
      const targetX = opp.x + opp.w / 2;
      const count = slot === 'ultimate' ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const offset = count === 1 ? 0 : (i - 1) * 90;
        hazards.push({
          owner: f,
          x: Math.max(40, Math.min(WIDTH - 40, targetX + offset)) - 26,
          y: FLOOR_Y - 210,
          w: 52,
          h: 210,
          dmg: (move.dmg / count) * f.def.stats.power,
          color: move.color,
          life: 24,
          hitDone: false,
          knockY: -10
        });
      }
    } else if (move.type === 'nova') {
      hazards.push({
        owner: f,
        x: f.x + f.w / 2 - 120,
        y: f.y - 40,
        w: 240,
        h: 150,
        dmg: move.dmg * f.def.stats.power,
        color: move.color,
        slow: move.slow || 0,
        drain: move.drain || 0,
        life: 20,
        hitDone: false,
        knockY: -9
      });
    }
  }

  function playElementSound(id) {
    if (id === 'kaelen') window.RetroAudio.sfx.fire();
    else if (id === 'vespera') window.RetroAudio.sfx.ice();
    else if (id === 'espectro' || id === 'malakor') window.RetroAudio.sfx.nether();
    else window.RetroAudio.sfx.cyber();
  }

  function updateFighterPhysics(f) {
    const opp = f === p1 ? p2 : p1;
    if (f.hitFlash > 0) f.hitFlash--;
    if (f.invuln > 0) f.invuln--;
    if (f.slowTimer > 0) f.slowTimer--;
    if (f.portalCooldown > 0) f.portalCooldown--;
    if (f.ultAura > 0) f.ultAura--;
    if (f.comboWindow > 0) f.comboWindow--;
    if (f.dropThrough > 0) f.dropThrough--;
    if (f.comboDecay > 0) {
      f.comboDecay--;
      if (f.comboDecay === 0) f.comboCounter = 0;
    }

    if (f.stateTimer > 0) {
      f.stateTimer--;
      if (['attack1', 'attack2', 'attack3', 'sweep', 'airAttack', 'dash'].includes(f.state) && !f.hitLandedThisSwing) {
        checkMeleeHit(f, opp);
      }
      if (f.stateTimer === 0 && f.state !== 'ko' && f.state !== 'dizzy' && f.state !== 'victory') {
        f.state = f.onGround ? 'idle' : 'jump';
      }
    }

    // Apply Gravity
    const prevBottom = f.y + f.h;
    f.vy = Math.min(16, f.vy + GRAVITY);
    f.x += f.vx;
    f.y += f.vy;

    // Arena Bounds
    if (f.x < 16) f.x = 16;
    if (f.x + f.w > WIDTH - 16) f.x = WIDTH - 16 - f.w;

    // Platform Collision (One-way from above)
    f.onGround = false;
    if (f.vy >= 0 && f.dropThrough === 0) {
      for (const pl of arena.platforms) {
        if (!pl.active) continue;
        const withinX = f.x + f.w > pl.x + 6 && f.x < pl.x + pl.w - 6;
        if (withinX && prevBottom <= pl.y + 8 && f.y + f.h >= pl.y) {
          f.y = pl.y - f.h;
          f.vy = 0;
          f.onGround = true;
          f.jumpsLeft = 2;
          break;
        }
      }
    }

    // Main Floor Collision
    if (f.y + f.h >= FLOOR_Y) {
      if (!f.onGround && f.vy > 4) {
        window.RetroAudio.sfx.land();
        spawnDust(f.x + f.w / 2, FLOOR_Y);
      }
      f.y = FLOOR_Y - f.h;
      f.vy = 0;
      f.onGround = true;
      f.jumpsLeft = 2;
    }

    if (f.state === 'hit' && f.onGround) {
      f.vx *= 0.8;
    }
  }

  function resolveFighterPushbox() {
    if (p1.state === 'ko' || p2.state === 'ko') return;
    const dx = p1.x + p1.w / 2 - (p2.x + p2.w / 2);
    const dy = Math.abs(p1.y - p2.y);
    if (Math.abs(dx) < 34 && dy < 60) {
      const push = (34 - Math.abs(dx)) * 0.5;
      if (dx < 0) {
        p1.x -= push;
        p2.x += push;
      } else {
        p1.x += push;
        p2.x -= push;
      }
    }
  }

  function checkMeleeHit(attacker, defender) {
    if (defender.hp <= 0 || defender.invuln > 0) return;
    const reach = attacker.state === 'dash' ? 56 : attacker.state === 'sweep' ? 62 : 54;
    const boxX = attacker.facing === 1 ? attacker.x + attacker.w * 0.4 : attacker.x - reach + attacker.w * 0.6;
    const boxY = attacker.state === 'sweep' ? attacker.y + 45 : attacker.y + 12;
    const boxH = attacker.state === 'sweep' ? 38 : 56;

    const hit =
      boxX < defender.x + defender.w &&
      boxX + reach > defender.x &&
      boxY < defender.y + defender.h &&
      boxY + boxH > defender.y;

    if (!hit) return;
    attacker.hitLandedThisSwing = true;

    let baseDmg = 7;
    let knockX = attacker.facing * 4.5;
    let knockY = -2;
    let heavy = false;

    if (attacker.state === 'attack2') {
      baseDmg = 10;
      knockX = attacker.facing * 5.5;
    } else if (attacker.state === 'attack3') {
      baseDmg = 14;
      knockX = attacker.facing * 6;
      knockY = -9.5;
      heavy = true;
    } else if (attacker.state === 'sweep') {
      baseDmg = 11;
      knockX = attacker.facing * 4;
      knockY = -5.5;
    } else if (attacker.state === 'airAttack') {
      baseDmg = 12;
      knockX = attacker.facing * 6;
      knockY = -4;
    } else if (attacker.state === 'dash') {
      baseDmg = attacker.dashMove ? attacker.dashMove.dmg : 18;
      knockX = attacker.facing * 8;
      knockY = -6.5;
      heavy = true;
    }

    const totalDmg = baseDmg * attacker.def.stats.power * (attacker.awakened ? 1.15 : 1);
    applyHit(attacker, defender, totalDmg, knockX, knockY, heavy, attacker.def.palette.accent);
  }

  function applyHit(attacker, defender, dmg, knockX, knockY, heavy, color) {
    const blocked = defender.state === 'block' && attacker.state !== 'sweep';
    const finalDmg = Math.max(1, Math.round((dmg / defender.def.stats.defense) * (blocked ? 0.2 : 1)));

    defender.hp = Math.max(0, defender.hp - finalDmg);
    attacker.chi = Math.min(300, attacker.chi + (blocked ? 10 : 22));
    defender.chi = Math.min(300, defender.chi + 14);

    if (blocked) {
      defender.vx = knockX * 0.4;
      window.RetroAudio.sfx.block();
      spawnBurst(defender.x + defender.w / 2, defender.y + 34, '#ffffff', 6);
      floatTexts.push({ x: defender.x + 20, y: defender.y, text: 'BLOQUEO', color: '#9ee8ff', life: 24 });
    } else {
      defender.vx = knockX / defender.def.stats.weight;
      defender.vy = knockY / defender.def.stats.weight;
      if (knockY < -3) defender.onGround = false;
      defender.state = 'hit';
      defender.stateTimer = heavy ? 22 : 14;
      defender.hitFlash = 10;

      attacker.comboCounter++;
      attacker.comboDecay = 95;
      hitstop = heavy ? 5 : 2;
      shake = heavy ? 11 : 4;

      if (heavy) window.RetroAudio.sfx.hitHeavy();
      else window.RetroAudio.sfx.hitLight();

      spawnBurst(defender.x + defender.w / 2, defender.y + 32, color, heavy ? 16 : 9);
      floatTexts.push({
        x: defender.x + 20,
        y: defender.y - 6,
        text: `-${finalDmg}`,
        color: heavy ? '#ffd147' : '#ff4d5a',
        life: 30
      });
    }
  }

  function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const pr = projectiles[i];
      pr.x += pr.vx;
      pr.y += pr.vy;
      pr.life--;

      particles.push({
        x: pr.x,
        y: pr.y,
        vx: -pr.vx * 0.15,
        vy: (Math.random() - 0.5) * 1.4,
        life: 10,
        color: pr.color,
        size: 4
      });

      const target = pr.owner === p1 ? p2 : p1;
      const hurtTop = target.state === 'crouch' || target.state === 'sweep' ? target.y + 32 : target.y;
      const hitTarget =
        target.hp > 0 &&
        pr.x + pr.r > target.x &&
        pr.x - pr.r < target.x + target.w &&
        pr.y + pr.r > hurtTop &&
        pr.y - pr.r < target.y + target.h;

      if (hitTarget) {
        if (pr.type === 'harpoon') {
          // Scorpion-style pull!
          target.x = pr.owner.x + pr.owner.facing * 52;
          target.y = pr.owner.y;
          target.vx = 0;
          target.state = 'hit';
          target.stateTimer = 24;
          floatTexts.push({
            x: pr.owner.x + 20,
            y: pr.owner.y - 14,
            text: '¡VEN AQUÍ!',
            color: '#f5b700',
            life: 40
          });
        }
        applyHit(pr.owner, target, pr.dmg, Math.sign(pr.vx) * 5, -3.5, true, pr.color);
        if (pr.slow) target.slowTimer = pr.slow;
        if (pr.drain) pr.owner.hp = Math.min(pr.owner.maxHp, pr.owner.hp + pr.drain);
        projectiles.splice(i, 1);
        continue;
      }

      if (pr.life <= 0 || pr.x < 0 || pr.x > WIDTH) {
        projectiles.splice(i, 1);
      }
    }
  }

  function updateHazards() {
    for (let i = hazards.length - 1; i >= 0; i--) {
      const h = hazards[i];
      h.life--;
      const target = h.owner === p1 ? p2 : p1;
      if (!h.hitDone && target.hp > 0) {
        const hit =
          h.x < target.x + target.w &&
          h.x + h.w > target.x &&
          h.y < target.y + target.h &&
          h.y + h.h > target.y;
        if (hit) {
          h.hitDone = true;
          const dir = target.x >= h.owner.x ? 1 : -1;
          applyHit(h.owner, target, h.dmg, dir * 6, h.knockY || -7, true, h.color);
          if (h.slow) target.slowTimer = h.slow;
          if (h.drain) h.owner.hp = Math.min(h.owner.maxHp, h.owner.hp + h.drain);
        }
      }
      if (h.life <= 0) hazards.splice(i, 1);
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.14;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const ft = floatTexts[i];
      ft.y -= 0.9;
      ft.life--;
      if (ft.life <= 0) floatTexts.splice(i, 1);
    }
  }

  function spawnBurst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 9,
        vy: (Math.random() - 0.7) * 8,
        life: 16 + Math.floor(Math.random() * 14),
        color,
        size: 3 + Math.floor(Math.random() * 4)
      });
    }
  }

  function spawnDust(x, y) {
    for (let i = 0; i < 6; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y - 4,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2,
        life: 14,
        color: '#a89bb5',
        size: 4
      });
    }
  }

  function render() {
    ctx.save();
    if (shake > 0.5) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    const avgX = (p1.x + p2.x) / 2 - WIDTH / 2;
    window.ArenaManager.drawArena(ctx, arena, time, avgX);

    // Finish Him crimson eclipse dimming
    if (phase === 'finishHim') {
      ctx.fillStyle = 'rgba(85, 0, 16, 0.36)';
      ctx.fillRect(0, 0, WIDTH, 540);
    }

    // Hazards (Pillars / Novas)
    for (const h of hazards) {
      ctx.fillStyle = h.color;
      ctx.globalAlpha = 0.65;
      ctx.fillRect(h.x, h.y, h.w, h.h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(h.x + h.w * 0.25, h.y, h.w * 0.5, h.h);
      ctx.globalAlpha = 1;
    }

    // Fighters
    window.PixelSprites.drawFighter(ctx, p1, time);
    window.PixelSprites.drawFighter(ctx, p2, time);

    // Projectiles & Harpoon Chain
    for (const pr of projectiles) {
      if (pr.type === 'harpoon') {
        ctx.strokeStyle = '#f5b700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pr.owner.x + pr.owner.w / 2, pr.owner.y + 34);
        ctx.lineTo(pr.x, pr.y);
        ctx.stroke();
      }
      ctx.fillStyle = pr.color;
      ctx.fillRect(Math.round(pr.x - pr.r), Math.round(pr.y - pr.r), pr.r * 2, pr.r * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(pr.x - pr.r * 0.5), Math.round(pr.y - pr.r * 0.5), pr.r, pr.r);
    }

    // Particles
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }

    // Floating Damage / Callouts
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'center';
    for (const ft of floatTexts) {
      ctx.fillStyle = '#000';
      ctx.fillText(ft.text, Math.round(ft.x) + 2, Math.round(ft.y) + 2);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
    }

    ctx.restore();
  }

  return { init, startMatch, stopMatch };
})();
