// Interactive Arenas: Pixel-art Parallax Backgrounds, Platforms & Environmental Mechanics
window.ArenaManager = (() => {
  const FLOOR_Y = 468;
  const WIDTH = 960;
  const HEIGHT = 540;

  function createArenaState(arenaId) {
    const cfg = window.GAME_DATA.arenas[arenaId] || window.GAME_DATA.arenas.umbral;
    const platforms = cfg.platforms.map((p, idx) => ({
      ...p,
      idx,
      active: true,
      shakeTimer: 0,
      respawnTimer: 0
    }));

    const geysers = (cfg.geysers || []).map((x, i) => ({
      x,
      timer: 100 + i * 95,
      phase: 'idle', // idle | warning | erupting
      height: 0
    }));

    const portals = (cfg.portals || []).map((p) => ({
      ...p,
      cooldown: 0
    }));

    const runes = [];
    if (cfg.hazardType === 'runes' || cfg.hazardType === 'eclipse') {
      runes.push({ x: 480, y: 215, active: true, respawn: 0 });
    }

    return {
      id: cfg.id,
      cfg,
      platforms,
      geysers,
      portals,
      runes,
      meteors: [],
      meteorCooldown: 160,
      runeTimer: 0
    };
  }

  function updateArena(arena, fighters, particles, time) {
    // Power Runes (Umbral & Eclipse)
    for (const r of arena.runes) {
      if (!r.active) {
        r.respawn--;
        if (r.respawn <= 0) r.active = true;
        continue;
      }
      for (const f of fighters) {
        if (f.hp <= 0) continue;
        const fx = f.x + f.w / 2;
        const fy = f.y + f.h / 2;
        if (Math.hypot(fx - r.x, fy - r.y) < 36) {
          r.active = false;
          r.respawn = 420;
          f.chi = Math.min(300, f.chi + 65);
          f.hp = Math.min(f.maxHp, f.hp + 8);
          window.RetroAudio.sfx.rune();
          for (let i = 0; i < 12; i++) {
            particles.push({
              x: r.x,
              y: r.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 24,
              color: '#5ce1e6',
              size: 4
            });
          }
        }
      }
    }

    // Lava Geysers (Forja de Ceniza - Valthor)
    for (const g of arena.geysers) {
      g.timer--;
      if (g.phase === 'idle' && g.timer <= 0) {
        g.phase = 'warning';
        g.timer = 75;
      } else if (g.phase === 'warning' && g.timer <= 0) {
        g.phase = 'erupting';
        g.timer = 55;
        g.height = 175;
        window.RetroAudio.sfx.lava();
      } else if (g.phase === 'erupting') {
        for (const f of fighters) {
          if (f.hp <= 0 || f.invuln > 0) continue;
          const fx = f.x + f.w / 2;
          const fy = f.y + f.h;
          if (Math.abs(fx - g.x) < 26 && fy > FLOOR_Y - g.height) {
            f.takeEnvironmentDamage(9, (fx < g.x ? -1 : 1) * 4, -10.5, '#ff5722', particles);
          }
        }
        if (g.timer <= 0) {
          g.phase = 'idle';
          g.timer = 210 + Math.floor(Math.random() * 120);
          g.height = 0;
        }
      }
    }

    // Ethereal Portals (Santuario del Vacío)
    for (const p of arena.portals) {
      if (p.cooldown > 0) p.cooldown--;
      for (const f of fighters) {
        if (f.hp <= 0 || f.portalCooldown > 0) continue;
        const fx = f.x + f.w / 2;
        const fy = f.y + f.h / 2;
        if (Math.hypot(fx - p.x, fy - p.y) < 30) {
          f.x = p.targetX - f.w / 2;
          f.y = p.targetY - f.h / 2;
          f.portalCooldown = 90;
          window.RetroAudio.sfx.portal();
          for (let i = 0; i < 14; i++) {
            particles.push({
              x: p.targetX,
              y: p.targetY,
              vx: (Math.random() - 0.5) * 7,
              vy: (Math.random() - 0.5) * 7,
              life: 20,
              color: '#c77dff',
              size: 4
            });
          }
        }
      }
    }

    // Eclipse Collapse (Meteors + Unstable outer platforms)
    if (arena.cfg.hazardType === 'eclipse') {
      arena.meteorCooldown--;
      if (arena.meteorCooldown <= 0) {
        arena.meteorCooldown = 190 + Math.floor(Math.random() * 110);
        arena.meteors.push({
          x: 130 + Math.random() * 700,
          y: -30,
          warnTimer: 65,
          impacted: false
        });
      }

      for (let i = arena.meteors.length - 1; i >= 0; i--) {
        const m = arena.meteors[i];
        if (m.warnTimer > 0) {
          m.warnTimer--;
        } else {
          m.y += 18;
          if (m.y >= FLOOR_Y) {
            window.RetroAudio.sfx.hitHeavy();
            for (let k = 0; k < 14; k++) {
              particles.push({
                x: m.x,
                y: FLOOR_Y - 4,
                vx: (Math.random() - 0.5) * 9,
                vy: -Math.random() * 7,
                life: 24,
                color: k % 2 === 0 ? '#ff2640' : '#ffd147',
                size: 5
              });
            }
            for (const f of fighters) {
              if (f.hp <= 0 || f.invuln > 0) continue;
              const fx = f.x + f.w / 2;
              if (Math.abs(fx - m.x) < 42 && f.y + f.h > FLOOR_Y - 58) {
                f.takeEnvironmentDamage(10, fx < m.x ? -5 : 5, -8, '#ff2640', particles);
              }
            }
            arena.meteors.splice(i, 1);
          }
        }
      }

      // Unstable side platforms periodically shudder and drop out briefly
      for (const pl of arena.platforms) {
        if (!pl.unstable) continue;
        if (pl.active) {
          if (time % 540 === (pl.idx === 0 ? 320 : 480)) {
            pl.shakeTimer = 60;
          }
          if (pl.shakeTimer > 0) {
            pl.shakeTimer--;
            if (pl.shakeTimer === 0) {
              pl.active = false;
              pl.respawnTimer = 110;
            }
          }
        } else {
          pl.respawnTimer--;
          if (pl.respawnTimer <= 0) pl.active = true;
        }
      }
    }
  }

  function drawArena(ctx, arena, time, cameraBiasX) {
    const cfg = arena.cfg;

    // 1. Retro gradient sky
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, cfg.skyTop);
    sky.addColorStop(1, cfg.skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 2. Three Suns Red Eclipse (parallax layer)
    const sx = WIDTH / 2 - cameraBiasX * 0.06;
    ctx.fillStyle = 'rgba(255, 110, 48, 0.35)';
    ctx.beginPath();
    ctx.arc(sx - 105, 116, 26, 0, Math.PI * 2);
    ctx.arc(sx + 105, 116, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = cfg.sunColor;
    ctx.beginPath();
    ctx.arc(sx, 108, 56, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0b030c';
    ctx.beginPath();
    ctx.arc(sx, 108, 45, 0, Math.PI * 2);
    ctx.fill();

    // 3. Distant Pixel Mountains / Spires
    const pxOffset = -cameraBiasX * 0.14;
    ctx.fillStyle = 'rgba(12, 6, 20, 0.72)';
    for (let i = -1; i < 8; i++) {
      const mx = i * 160 + pxOffset;
      ctx.beginPath();
      ctx.moveTo(mx, FLOOR_Y);
      ctx.lineTo(mx + 80, 210 + (i % 2) * 45);
      ctx.lineTo(mx + 160, FLOOR_Y);
      ctx.closePath();
      ctx.fill();
    }

    // 4. Arena-specific architectural details
    if (cfg.id === 'valthor') {
      // Magma glow along bottom
      const wave = Math.sin(time * 0.1) * 4;
      ctx.fillStyle = '#ff4b1f';
      ctx.fillRect(0, FLOOR_Y + 26 + wave * 0.3, WIDTH, 48);
      ctx.fillStyle = '#ffb32c';
      for (let x = 20; x < WIDTH; x += 48) {
        ctx.fillRect(x, FLOOR_Y + 30 + Math.sin(time * 0.12 + x) * 3, 24, 6);
      }
    } else if (cfg.id === 'umbral' || cfg.id === 'eclipse') {
      // Ancient temple pillars in background
      ctx.fillStyle = 'rgba(26, 15, 36, 0.85)';
      [140, 320, 640, 820].forEach((pxPos) => {
        ctx.fillRect(pxPos - 14 - cameraBiasX * 0.08, 175, 28, FLOOR_Y - 175);
        ctx.fillStyle = cfg.sunColor;
        ctx.fillRect(pxPos - 4 - cameraBiasX * 0.08, 220 + Math.sin(time * 0.1) * 3, 8, 8);
        ctx.fillStyle = 'rgba(26, 15, 36, 0.85)';
      });
    }

    // 5. Main Solid Arena Floor
    ctx.fillStyle = cfg.groundColor;
    ctx.fillRect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);
    ctx.fillStyle = cfg.trimColor;
    ctx.fillRect(0, FLOOR_Y, WIDTH, 6);
    // Pixel brick pattern
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    for (let x = 0; x < WIDTH; x += 32) {
      ctx.fillRect(x, FLOOR_Y + 6, 2, 24);
      ctx.fillRect(x + 16, FLOOR_Y + 30, 2, 24);
    }

    // 6. Platforms
    for (const pl of arena.platforms) {
      if (!pl.active) continue;
      const shakeX = pl.shakeTimer > 0 ? (Math.random() - 0.5) * 6 : 0;
      ctx.fillStyle = pl.shakeTimer > 0 ? '#78202c' : cfg.groundColor;
      ctx.fillRect(pl.x + shakeX, pl.y, pl.w, pl.h);
      ctx.fillStyle = pl.shakeTimer > 0 ? '#ff4757' : cfg.trimColor;
      ctx.fillRect(pl.x + shakeX, pl.y, pl.w, 4);
    }

    // 7. Interactive Power Runes
    for (const r of arena.runes) {
      if (!r.active) continue;
      const ry = r.y + Math.sin(time * 0.12) * 5;
      ctx.fillStyle = 'rgba(92, 225, 230, 0.25)';
      ctx.beginPath();
      ctx.arc(r.x, ry, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5ce1e6';
      ctx.fillRect(r.x - 7, ry - 9, 14, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(r.x - 3, ry - 5, 6, 10);
    }

    // 8. Interactive Portals
    for (const p of arena.portals) {
      const pulse = 20 + Math.sin(time * 0.18) * 3;
      ctx.strokeStyle = '#c77dff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 14, pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(57, 255, 136, 0.28)';
      ctx.fill();
    }

    // 9. Lava Geysers
    for (const g of arena.geysers) {
      if (g.phase === 'warning') {
        ctx.fillStyle = time % 8 < 4 ? '#ff9800' : '#ff2a2a';
        ctx.fillRect(g.x - 20, FLOOR_Y - 8, 40, 8);
      } else if (g.phase === 'erupting') {
        ctx.fillStyle = '#ff3d00';
        ctx.fillRect(g.x - 18, FLOOR_Y - g.height, 36, g.height);
        ctx.fillStyle = '#ffea00';
        ctx.fillRect(g.x - 8, FLOOR_Y - g.height + 10, 16, g.height - 10);
      }
    }

    // 10. Eclipse Meteors
    for (const m of arena.meteors) {
      if (m.warnTimer > 0) {
        ctx.fillStyle = 'rgba(255, 31, 61, 0.25)';
        ctx.fillRect(m.x - 18, 0, 36, FLOOR_Y);
        ctx.fillStyle = '#ff1f3d';
        ctx.fillRect(m.x - 22, FLOOR_Y - 6, 44, 6);
      } else {
        ctx.fillStyle = '#ff5722';
        ctx.fillRect(m.x - 12, m.y - 24, 24, 24);
        ctx.fillStyle = '#ffd147';
        ctx.fillRect(m.x - 6, m.y - 18, 12, 12);
      }
    }
  }

  return { FLOOR_Y, WIDTH, HEIGHT, createArenaState, updateArena, drawArena };
})();
