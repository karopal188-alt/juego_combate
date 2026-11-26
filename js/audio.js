// Retro Arcade Sound & Music Synthesizer (Web Audio API - Zero external dependencies)
window.RetroAudio = (() => {
  let ctx = null;
  let enabled = true;
  let bgmTimer = null;
  let bgmStep = 0;

  function ensureContext() {
    if (!enabled) return null;
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playTone(freq, duration, type = 'square', gainVal = 0.12, slideTo = null, delay = 0) {
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function playNoise(duration, gainVal = 0.14, filterFreq = 900, delay = 0) {
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime + delay;
    const bufferSize = Math.max(1, Math.floor(c.sampleRate * duration));
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource();
    src.buffer = buffer;

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, now);

    const gain = c.createGain();
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  const sfx = {
    uiMove() {
      playTone(520, 0.05, 'square', 0.06, 620);
    },
    uiSelect() {
      playTone(440, 0.07, 'square', 0.08, 660);
      playTone(660, 0.1, 'square', 0.08, 880, 0.05);
    },
    jump() {
      playTone(210, 0.14, 'square', 0.08, 490);
    },
    land() {
      playNoise(0.06, 0.08, 350);
    },
    swing() {
      playNoise(0.09, 0.1, 1600);
      playTone(300, 0.08, 'triangle', 0.05, 130);
    },
    hitLight() {
      playNoise(0.11, 0.18, 1200);
      playTone(180, 0.1, 'sawtooth', 0.14, 70);
    },
    hitHeavy() {
      playNoise(0.18, 0.24, 900);
      playTone(140, 0.18, 'sawtooth', 0.18, 42);
      playTone(90, 0.2, 'square', 0.14, 38, 0.02);
    },
    block() {
      playTone(680, 0.08, 'triangle', 0.12, 420);
      playNoise(0.05, 0.08, 2200);
    },
    fire() {
      playNoise(0.22, 0.14, 1400);
      playTone(340, 0.2, 'sawtooth', 0.11, 120);
    },
    ice() {
      playTone(1200, 0.14, 'triangle', 0.1, 1850);
      playTone(920, 0.18, 'sine', 0.09, 520, 0.04);
    },
    nether() {
      playTone(240, 0.25, 'sawtooth', 0.11, 95);
      playTone(480, 0.22, 'square', 0.08, 180, 0.03);
    },
    cyber() {
      playTone(760, 0.12, 'square', 0.11, 190);
      playNoise(0.14, 0.14, 1600, 0.03);
    },
    rune() {
      playTone(523, 0.08, 'triangle', 0.1);
      playTone(659, 0.08, 'triangle', 0.1, null, 0.06);
      playTone(784, 0.14, 'triangle', 0.11, null, 0.12);
    },
    portal() {
      playTone(280, 0.18, 'sine', 0.12, 820);
      playTone(560, 0.18, 'triangle', 0.09, 220, 0.05);
    },
    lava() {
      playNoise(0.28, 0.2, 650);
      playTone(110, 0.26, 'sawtooth', 0.14, 48);
    },
    roundGong() {
      playTone(165, 0.55, 'sawtooth', 0.15, 110);
      playTone(247, 0.5, 'triangle', 0.12, 160, 0.03);
      playNoise(0.35, 0.12, 700);
    },
    finishHim() {
      playTone(130, 0.45, 'sawtooth', 0.18, 65);
      playTone(195, 0.45, 'square', 0.14, 98, 0.06);
      playTone(98, 0.65, 'sawtooth', 0.2, 55, 0.18);
    },
    fatality() {
      playNoise(0.5, 0.26, 1100);
      playTone(110, 0.55, 'sawtooth', 0.2, 36);
      playTone(220, 0.4, 'square', 0.14, 55, 0.1);
      playTone(88, 0.7, 'sawtooth', 0.18, 32, 0.25);
    },
    ultimate() {
      playTone(220, 0.2, 'sawtooth', 0.14, 520);
      playTone(440, 0.3, 'square', 0.13, 880, 0.1);
      playNoise(0.35, 0.18, 1800, 0.12);
    }
  };

  // Dark 90s Mortal-Kombat-style chiptune bassline & arpeggio loop
  const bassNotes = [110, 110, 130.8, 110, 146.8, 130.8, 98, 110];
  const leadNotes = [440, 523.25, 493.88, 440, 587.33, 523.25, 392, 440];

  function startMusic() {
    if (bgmTimer || !enabled) return;
    bgmStep = 0;
    bgmTimer = setInterval(() => {
      if (!enabled) return;
      const b = bassNotes[bgmStep % bassNotes.length];
      playTone(b, 0.16, 'sawtooth', 0.035);
      if (bgmStep % 2 === 0) {
        const l = leadNotes[(bgmStep / 2) % leadNotes.length];
        playTone(l, 0.14, 'square', 0.022);
      }
      if (bgmStep % 4 === 0) {
        playNoise(0.04, 0.03, 500);
      }
      bgmStep++;
    }, 210);
  }

  function stopMusic() {
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  }

  function toggle() {
    enabled = !enabled;
    if (!enabled) {
      stopMusic();
    } else {
      ensureContext();
    }
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  return { sfx, startMusic, stopMusic, toggle, isEnabled, ensureContext };
})();
