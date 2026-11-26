// Procedural 16-bit Pixel Art Fighter & Cutscene Renderer
window.PixelSprites = (() => {
  const P = 3; // Base pixel scale unit for crisp retro silhouette

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawFighter(ctx, f, time) {
    const def = window.GAME_DATA.fighters[f.id];
    const pal = def.palette;
    const isAwakened = Boolean(f.awakened);
    const state = f.state;

    ctx.save();
    // Anchor at bottom-center of fighter hitbox
    const cx = Math.round(f.x + f.w / 2);
    const by = Math.round(f.y + f.h);
    ctx.translate(cx, by);
    ctx.scale(f.facing, 1);

    // Hit flash / Slow / Invulnerability tint
    if (f.hitFlash > 0 && Math.floor(f.hitFlash * 2) % 2 === 0) {
      ctx.filter = 'brightness(2.2) contrast(1.4)';
    } else if (f.slowTimer > 0) {
      ctx.filter = 'hue-rotate(150deg) saturate(1.4)';
    }

    // Shadow on nearest ground/platform
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(-20, -3, 40, 6);

    // Awakened golden aura (Act 3 Kaelen)
    if (isAwakened || f.ultAura > 0) {
      const pulse = Math.sin(time * 0.25) * 4;
      ctx.fillStyle = isAwakened ? 'rgba(255, 209, 71, 0.26)' : 'rgba(255, 70, 90, 0.24)';
      ctx.fillRect(-24 - pulse / 2, -88 - pulse, 48 + pulse, 88 + pulse);
    }

    // KO state (lying flat)
    if (state === 'ko') {
      px(ctx, -38, -14, 72, 12, pal.primary);
      px(ctx, -46, -16, 16, 14, pal.skin);
      px(ctx, 26, -12, 16, 10, pal.dark);
      ctx.restore();
      return;
    }

    // Animation offsets
    const bob = state === 'idle' ? Math.round(Math.sin(time * 0.14) * 2) : 0;
    const walkSwing = state === 'walk' ? Math.sin(time * 0.38) : 0;
    const crouchY = state === 'crouch' || state === 'sweep' ? 20 : 0;
    const dizzyX = state === 'dizzy' ? Math.round(Math.sin(time * 0.45) * 5) : 0;
    const hitLean = state === 'hit' ? -7 : 0;

    ctx.translate(dizzyX + hitLean, crouchY + bob);

    // Legs
    const legSpread = state === 'walk' ? Math.round(walkSwing * 8) : state === 'sweep' ? 14 : 6;
    const backLegX = -10 - legSpread * 0.5;
    const frontLegX = 2 + legSpread * 0.5;

    if (state === 'jump' || state === 'airAttack') {
      // Tucked / flying kick legs
      px(ctx, -12, -28, 10, 18, pal.dark);
      if (state === 'airAttack') {
        px(ctx, 4, -30, 28, 10, pal.dark);
        px(ctx, 28, -32, 10, 12, pal.accent);
      } else {
        px(ctx, 2, -26, 10, 16, pal.dark);
      }
    } else if (state === 'sweep') {
      px(ctx, -14, -14, 12, 14, pal.dark);
      px(ctx, 2, -10, 34, 9, pal.dark);
      px(ctx, 30, -11, 10, 10, pal.secondary);
    } else if (state === 'attack2') {
      // High kick
      px(ctx, -11, -30, 10, 30, pal.dark);
      px(ctx, 2, -42, 32, 10, pal.dark);
      px(ctx, 28, -44, 10, 11, pal.secondary);
    } else {
      // Standing / walking legs
      px(ctx, backLegX, -30, 10, 30 - crouchY * 0.4, pal.dark);
      px(ctx, backLegX - 2, -6 - crouchY * 0.4, 12, 6, '#08050a');
      px(ctx, frontLegX, -30, 10, 30 - crouchY * 0.4, pal.dark);
      px(ctx, frontLegX, -6 - crouchY * 0.4, 13, 6, '#08050a');
    }

    // Malakor's flowing cape behind torso
    if (f.id === 'malakor') {
      const flutter = Math.round(Math.sin(time * 0.22) * 4);
      px(ctx, -24 - flutter, -62, 16, 56 - crouchY * 0.5, '#7a0918');
      px(ctx, -20 - flutter, -60, 10, 46 - crouchY * 0.5, '#a81227');
    }

    // Torso
    const torsoH = crouchY > 0 ? 24 : 32;
    const torsoY = -62 + crouchY * 0.25;
    px(ctx, -13, torsoY, 26, torsoH, pal.primary);
    // Belt / chest sash
    px(ctx, -14, torsoY + torsoH - 8, 28, 6, pal.secondary);

    // Character-specific torso details
    if (f.id === 'kaelen') {
      // Exposed martial artist chest + V-neck
      px(ctx, -5, torsoY + 2, 10, 14, pal.skin);
      px(ctx, -12, torsoY + 2, 5, 16, isAwakened ? '#ffd147' : pal.secondary);
      px(ctx, 7, torsoY + 2, 5, 16, isAwakened ? '#ffd147' : pal.secondary);
    } else if (f.id === 'vespera') {
      // Kunoichi vest & flowing scarf tail
      px(ctx, -7, torsoY + 4, 14, 14, pal.secondary);
      const scarfWave = Math.round(Math.sin(time * 0.26) * 4);
      px(ctx, -26, torsoY + 2 + scarfWave, 14, 6, pal.accent);
    } else if (f.id === 'espectro') {
      // Golden/obsidian ninja armor V-plate
      px(ctx, -10, torsoY + 2, 20, 16, pal.secondary);
      px(ctx, -6, torsoY + 5, 12, 12, pal.dark);
    } else if (f.id === 'jaxen') {
      // Tactical armor vest
      px(ctx, -11, torsoY + 3, 22, 18, '#28362a');
      px(ctx, -3, torsoY + 7, 6, 6, pal.accent);
    } else if (f.id === 'malakor') {
      // Spiked shoulder pauldrons & chest rune
      px(ctx, -20, torsoY - 3, 12, 11, pal.secondary);
      px(ctx, 8, torsoY - 3, 12, 11, pal.secondary);
      px(ctx, -4, torsoY + 8, 8, 10, pal.accent);
    }

    // Head
    const headY = torsoY - 21;
    px(ctx, -9, headY, 18, 20, pal.skin);

    if (f.id === 'kaelen') {
      // Spiky dark hair & trailing red/gold headband
      px(ctx, -10, headY - 4, 20, 8, isAwakened ? '#ffd147' : '#1b1116');
      px(ctx, -11, headY + 2, 22, 5, isAwakened ? '#fff08a' : '#e62236');
      const tail = Math.round(Math.sin(time * 0.28) * 3);
      px(ctx, -22, headY + 2 + tail, 11, 4, isAwakened ? '#ffd147' : '#e62236');
      px(ctx, 3, headY + 8, 5, 3, isAwakened ? '#fff8b8' : '#111');
    } else if (f.id === 'vespera') {
      // Ninja hood & ice mask
      px(ctx, -10, headY - 2, 20, 10, pal.primary);
      px(ctx, -9, headY + 11, 18, 9, pal.accent);
      px(ctx, 2, headY + 7, 5, 3, '#e8ffff');
    } else if (f.id === 'espectro') {
      // Cursed ninja hood + skull mask + glowing green spectral eyes
      px(ctx, -10, headY - 2, 20, 10, pal.dark);
      px(ctx, -9, headY + 10, 18, 10, '#d8d0e3');
      px(ctx, -6, headY + 14, 12, 3, '#22172e');
      px(ctx, 2, headY + 7, 6, 3, '#39ff88');
    } else if (f.id === 'jaxen') {
      // Flat-top hair & glowing cybernetic visor
      px(ctx, -10, headY - 3, 20, 7, '#1a1512');
      px(ctx, 0, headY + 6, 11, 5, '#3ec7ff');
    } else if (f.id === 'malakor') {
      // Horned warlock helmet
      px(ctx, -10, headY - 3, 20, 11, pal.dark);
      px(ctx, -12, headY - 11, 5, 10, pal.secondary);
      px(ctx, 7, headY - 11, 5, 10, pal.secondary);
      px(ctx, 1, headY + 7, 6, 3, '#ff2a4b');
    }

    // Arms & Attack Poses
    const armColor = f.id === 'jaxen' ? '#9bb3c9' : pal.skin;
    const fistColor = f.id === 'jaxen' ? pal.accent : pal.accent;

    if (state === 'block') {
      // Guarding arms raised in front
      px(ctx, 6, torsoY - 4, 10, 22, armColor);
      px(ctx, 12, torsoY - 8, 6, 28, pal.accent);
    } else if (state === 'attack1') {
      // Straight punch
      px(ctx, -16, torsoY + 4, 10, 10, armColor);
      px(ctx, 6, torsoY + 3, 28, 9, armColor);
      px(ctx, 30, torsoY + 1, 10, 12, fistColor);
    } else if (state === 'attack3') {
      // Rising uppercut!
      px(ctx, 4, torsoY - 22, 10, 26, armColor);
      px(ctx, 3, torsoY - 28, 12, 10, fistColor);
    } else if (state === 'special' || state === 'dash') {
      // Both hands thrust forward with elemental glow
      px(ctx, 4, torsoY + 4, 24, 11, armColor);
      px(ctx, 24, torsoY + 1, 12, 16, pal.glow);
    } else {
      // Idle / walk arms
      const armSwing = Math.round(walkSwing * 6);
      px(ctx, -17, torsoY + 3 - armSwing, 8, 18, armColor);
      px(ctx, 9, torsoY + 3 + armSwing, 8, 18, armColor);
      if (f.id === 'jaxen') {
        px(ctx, -17, torsoY + 14 - armSwing, 8, 7, pal.accent);
        px(ctx, 9, torsoY + 14 + armSwing, 8, 7, pal.accent);
      }
    }

    // Dizzy stars overhead
    if (state === 'dizzy') {
      for (let i = 0; i < 3; i++) {
        const ang = time * 0.18 + i * 2.1;
        px(ctx, Math.cos(ang) * 16 - 2, headY - 12 + Math.sin(ang) * 4, 5, 5, '#ffd147');
      }
    }

    ctx.restore();
  }

  function drawOrin(ctx, x, y, scale = 1, time = 0) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(scale, scale);
    const bob = Math.round(Math.sin(time * 0.1) * 3);
    ctx.translate(0, bob);

    // Spiritual jade/gold robes
    px(ctx, -16, -54, 32, 50, '#1f4f46');
    px(ctx, -12, -52, 24, 46, '#2b6e61');
    px(ctx, -6, -50, 12, 42, '#f4b942');
    // Head & long white beard
    px(ctx, -9, -76, 18, 20, '#d9ab84');
    px(ctx, -10, -80, 20, 7, '#eef2f5');
    px(ctx, -7, -60, 14, 18, '#eef2f5');
    // Third eye spirit mark
    px(ctx, -2, -70, 4, 4, '#5ce1e6');
    // Staff
    px(ctx, 18, -82, 4, 78, '#7a5230');
    px(ctx, 15, -88, 10, 10, '#5ce1e6');
    ctx.restore();
  }

  function drawCutsceneStage(ctx, slide, time) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#140512');
    g.addColorStop(1, '#3b0c1c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Three Suns Red Eclipse in cutscene sky
    ctx.fillStyle = '#ff6b2b';
    ctx.beginPath();
    ctx.arc(w / 2 - 80, 72, 22, 0, Math.PI * 2);
    ctx.arc(w / 2 + 80, 72, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff2640';
    ctx.beginPath();
    ctx.arc(w / 2, 66, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#09030b';
    ctx.beginPath();
    ctx.arc(w / 2, 66, 32, 0, Math.PI * 2);
    ctx.fill();

    // Temple floor
    px(ctx, 0, h - 38, w, 38, '#23162b');
    px(ctx, 0, h - 42, w, 4, '#8b63a8');

    const drawParticipant = (id, x, facing) => {
      if (!id) return;
      if (id === 'orin') {
        drawOrin(ctx, x, h - 42, 1.35, time);
      } else {
        drawFighter(
          ctx,
          {
            id,
            x: x - 20,
            y: h - 42 - 82,
            w: 40,
            h: 82,
            facing,
            state: 'idle',
            hitFlash: 0,
            slowTimer: 0,
            awakened: id === 'kaelen' && slide.speaker.includes('DESPERTAR'),
            ultAura: 0
          },
          time
        );
      }
    };

    drawParticipant(slide.left, 200, 1);
    drawParticipant(slide.right, w - 200, -1);
  }

  return { drawFighter, drawOrin, drawCutsceneStage };
})();
