/* ═══════════════════════════════════════════
   FOCUSFLOW — script.js
   Padhai Ka Saathi 📚
═══════════════════════════════════════════ */

/* ── BADGES DATA ── */
const BADGES = [
  { id: 'first',    icon: '🌱', name: 'Pehla Qadam',   req: '1 session karo'       },
  { id: 'three',    icon: '🔥', name: 'Lag Gaya Bhai',  req: '3 sessions done'      },
  { id: 'five',     icon: '👑', name: 'Padhai Ka Raja',  req: '5 sessions done'      },
  { id: 'ten',      icon: '💎', name: 'Diamond Focus',   req: '10 sessions done'     },
  { id: 'hour',     icon: '⏰', name: 'Ek Ghanta Hero',  req: '60 min padhai'        },
  { id: 'twohour',  icon: '🚀', name: 'Focus Machine',   req: '2 ghante padhai'      },
  { id: 'twenty',   icon: '🦁', name: 'Padhai Legend',   req: '20 sessions total'    },
  { id: 'goal3',    icon: '🎯', name: 'Goal Crusher',    req: '3x daily goal pura'   },
  { id: 'allbadge', icon: '🌟', name: 'Sabka Boss',      req: 'Saare badges unlock'  },
];

/* ── STATE VARIABLES ── */
let customTimes   = { focus: 25, short: 5, long: 15 };
let totalSessions = 4;
let currentMode   = 'focus';
let timeLeft      = 25 * 60;
let isRunning     = false;
let interval      = null;

// localStorage se data load karo (pehle wali progress bachi rahegi)
let sessionsDone  = +localStorage.getItem('ff2_sessions') || 0;
let totalMinutes  = +localStorage.getItem('ff2_minutes')  || 0;
let streak        = +localStorage.getItem('ff2_streak')   || 0;
let goalsComplete = +localStorage.getItem('ff2_goals')    || 0;
let unlockedBadges = JSON.parse(localStorage.getItem('ff2_badges') || '[]');

// Audio variables
let currentTrack = -1;
let audioCtx     = null;
let gainNode     = null;
let noiseNode    = null;

// Flip clock helpers
let prevMin = -1;
let prevSec = -1;

/* ── SAVE TO LOCALSTORAGE ── */
function save() {
  localStorage.setItem('ff2_sessions', sessionsDone);
  localStorage.setItem('ff2_minutes',  totalMinutes);
  localStorage.setItem('ff2_streak',   streak);
  localStorage.setItem('ff2_goals',    goalsComplete);
  localStorage.setItem('ff2_badges',   JSON.stringify(unlockedBadges));
}

/* ══════════════════════════════
   THEME
══════════════════════════════ */
function setTheme(t, btn) {
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  localStorage.setItem('ff2_theme', t);
}

// Page load pe saved theme apply karo
const savedTheme = localStorage.getItem('ff2_theme') || 'dawn';
document.documentElement.setAttribute('data-theme', savedTheme);
document.querySelectorAll('.theme-btn').forEach(b => {
  if (b.title === savedTheme) b.classList.add('active');
  else b.classList.remove('active');
});

/* ══════════════════════════════
   FLIP CLOCK
══════════════════════════════ */
function updateDisplay(s) {
  const m  = Math.floor(s / 60);
  const sc = s % 60;
  const ms = String(m).padStart(2, '0');
  const ss = String(sc).padStart(2, '0');

  if (m  !== prevMin) { animateFlip('min', ms); prevMin = m;  }
  if (sc !== prevSec) { animateFlip('sec', ss); prevSec = sc; }

  document.title = `${ms}:${ss} — FocusFlow`;
}

function animateFlip(unit, val) {
  const card = document.getElementById(unit + 'Card');
  // Thoda tilt aata hai flip ke time
  card.style.transform = 'rotateX(-4deg) scale(0.97)';
  setTimeout(() => { card.style.transform = ''; }, 130);
  document.getElementById(unit + 'Top').textContent = val;
  document.getElementById(unit + 'Bot').textContent = val;
}

function initDisplay() {
  const m  = Math.floor(timeLeft / 60);
  const s  = timeLeft % 60;
  const ms = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  ['min', 'sec'].forEach(u => {
    document.getElementById(u + 'Top').textContent = u === 'min' ? ms : ss;
    document.getElementById(u + 'Bot').textContent = u === 'min' ? ms : ss;
  });
  prevMin = m;
  prevSec = s;
}

/* ══════════════════════════════
   TIMER LOGIC
══════════════════════════════ */
function toggleTimer() {
  isRunning ? pauseTimer() : startTimer();
}

function startTimer() {
  isRunning = true;
  const btn = document.getElementById('startBtn');
  btn.textContent = '⏸ Pause';
  btn.style.background = 'var(--text2)';
  setStatus(currentMode, 'running');

  interval = setInterval(() => {
    timeLeft--;
    updateDisplay(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(interval);
      isRunning = false;
      onSessionEnd();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(interval);
  isRunning = false;
  const btn = document.getElementById('startBtn');
  btn.textContent = '▶ Continue';
  btn.style.background = '';
  document.getElementById('statusText').innerHTML =
    'Ruka hua hai... <span class="hi">wapas lag ja! 💪</span>';
}

function resetTimer() {
  clearInterval(interval);
  isRunning = false;
  timeLeft = customTimes[currentMode] * 60;
  prevMin = -1; prevSec = -1;
  initDisplay();
  const btn = document.getElementById('startBtn');
  btn.textContent = '▶ Shuru Karo';
  btn.style.background = '';
  setStatus(currentMode, 'idle');
  document.getElementById('aiBox').classList.remove('show');
}

function skipSession() {
  clearInterval(interval);
  isRunning = false;
  onSessionEnd();
}

function setMode(mode, btn) {
  currentMode = mode;
  document.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  clearInterval(interval);
  isRunning = false;
  timeLeft = customTimes[mode] * 60;
  prevMin = -1; prevSec = -1;
  initDisplay();
  document.getElementById('startBtn').textContent = '▶ Shuru Karo';
  document.getElementById('startBtn').style.background = '';
  setStatus(mode, 'idle');
  document.getElementById('aiBox').classList.remove('show');
}

function setStatus(mode, state) {
  const msgs = {
    focus: {
      idle:    'Ek <span class="hi">focus session</span> shuru karo — padhai karte hain! 📚',
      running: 'Focus mode — <span class="hi">phone rakh, padhai kar! 📚</span>',
    },
    short: {
      idle:    '<span class="hi">Short break</span> time — thoda rest karo!',
      running: 'Break chal rahi hai — <span class="hi">paani pi, stretch kar! 🧘</span>',
    },
    long: {
      idle:    '<span class="hi">Long break</span> deserve kiya hai!',
      running: 'Long break — <span class="hi">kha le kuch, relax karo! 😌</span>',
    },
  };
  document.getElementById('statusText').innerHTML = msgs[mode][state] || msgs[mode].idle;
}

async function onSessionEnd() {
  playBell();

  if (currentMode === 'focus') {
    sessionsDone++;
    totalMinutes += customTimes.focus;
    streak++;

    // Daily goal check
    if (sessionsDone % totalSessions === 0) {
      goalsComplete++;
    }
    save();
    addHistory('focus');
    updateStats();
    updateDots();
    checkBadges();

    // AI hype karo
    await showAI(`User ne ${customTimes.focus} min ka focus session complete kiya! Total aaj ${sessionsDone} sessions. Ek dum dil se hype karo!`);

    // Auto break pe switch
    setTimeout(() => {
      const breakMode = sessionsDone % 4 === 0 ? 'long' : 'short';
      document.querySelector(`[onclick="setMode('${breakMode}',this)"]`).click();
    }, 2500);

  } else {
    addHistory(currentMode);
    document.getElementById('statusText').innerHTML =
      'Break khatam! <span class="hi">Wapas lag ja! 💪</span>';
    setTimeout(() => {
      document.querySelector(`[onclick="setMode('focus',this)"]`).click();
    }, 1500);
  }
}

/* ══════════════════════════════
   SESSION DOTS & STATS
══════════════════════════════ */
function renderDots() {
  const container = document.getElementById('sessionDots');
  container.innerHTML = '';
  const doneInCycle = sessionsDone % totalSessions;
  for (let i = 0; i < totalSessions; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot' +
      (i < doneInCycle  ? ' done'   : '') +
      (i === doneInCycle ? ' active' : '');
    container.appendChild(dot);
  }
}

function updateDots() { renderDots(); }

function updateStats() {
  document.getElementById('statSessions').textContent = sessionsDone;
  document.getElementById('statMins').textContent     = totalMinutes;
  document.getElementById('statStreak').textContent   = streak;
  document.getElementById('statGoal').textContent     = totalSessions;
}

/* ══════════════════════════════
   SLIDERS
══════════════════════════════ */
function updateSlider(type, val) {
  val = parseInt(val);

  if (type === 'focus') {
    customTimes.focus = val;
    document.getElementById('focusVal').textContent = val + ' min';
    if (currentMode === 'focus' && !isRunning) {
      timeLeft = val * 60; prevMin = -1; prevSec = -1; initDisplay();
    }
  } else if (type === 'short') {
    customTimes.short = val;
    document.getElementById('shortVal').textContent = val + ' min';
    if (currentMode === 'short' && !isRunning) {
      timeLeft = val * 60; prevMin = -1; prevSec = -1; initDisplay();
    }
  } else if (type === 'long') {
    customTimes.long = val;
    document.getElementById('longVal').textContent = val + ' min';
    if (currentMode === 'long' && !isRunning) {
      timeLeft = val * 60; prevMin = -1; prevSec = -1; initDisplay();
    }
  } else if (type === 'sess') {
    totalSessions = val;
    document.getElementById('sessVal').textContent = val + ' sessions';
    updateStats();
    renderDots();
  }
}

/* ══════════════════════════════
   BADGES 🏆
══════════════════════════════ */
function renderBadges() {
  document.getElementById('badgesGrid').innerHTML = BADGES.map(b => {
    const unlocked = unlockedBadges.includes(b.id);
    return `
      <div class="badge ${unlocked ? 'unlocked' : ''}" title="${b.req}">
        <div class="badge-icon">${b.icon}</div>
        <div class="badge-name">${b.name}</div>
        <div class="badge-req">${b.req}</div>
      </div>`;
  }).join('');
}

function checkBadges() {
  const checks = {
    first:    sessionsDone >= 1,
    three:    sessionsDone >= 3,
    five:     sessionsDone >= 5,
    ten:      sessionsDone >= 10,
    hour:     totalMinutes >= 60,
    twohour:  totalMinutes >= 120,
    twenty:   sessionsDone >= 20,
    goal3:    goalsComplete >= 3,
    allbadge: BADGES.slice(0, 8).every(b => unlockedBadges.includes(b.id)),
  };

  let newBadge = null;
  BADGES.forEach(b => {
    if (!unlockedBadges.includes(b.id) && checks[b.id]) {
      unlockedBadges.push(b.id);
      newBadge = b;
    }
  });

  if (newBadge) { save(); showBadgeToast(newBadge); }
  renderBadges();
}

let toastTimer = null;
function showBadgeToast(badge) {
  const toast = document.getElementById('badgeToast');
  document.getElementById('toastIcon').textContent = badge.icon;
  document.getElementById('toastMsg').textContent  = `Badge unlock: ${badge.name}! 🎉`;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ══════════════════════════════
   SESSION HISTORY
══════════════════════════════ */
function addHistory(type) {
  const list  = document.getElementById('historyList');
  const empty = list.querySelector('.history-empty');
  if (empty) empty.remove();

  const now  = new Date();
  const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const labels = { focus: '🎯 Focus', short: '☕ Break', long: '🛋️ Long Break' };
  const dur    = { focus: customTimes.focus, short: customTimes.short, long: customTimes.long };

  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `
    <span class="h-label">${labels[type]} · ${dur[type]}m</span>
    <span class="h-time">${time}</span>
    <span class="h-badge ${type === 'focus' ? 'focus' : 'brk'}">
      ${type === 'focus' ? 'Done ✅' : 'Break'}
    </span>`;
  list.insertBefore(item, list.firstChild);
}

/* ══════════════════════════════
   AUDIO — Web Audio API
══════════════════════════════ */
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function createSound(type) {
  const ctx  = getCtx();
  gainNode   = ctx.createGain();
  gainNode.gain.value = document.getElementById('volSlider').value / 180;
  gainNode.connect(ctx.destination);

  if (type === 0) {
    // 🌧️ Rain — filtered white noise
    const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.9;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const f   = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 0.5;
    src.connect(f); f.connect(gainNode); src.start();
    return src;

  } else if (type === 1) {
    // ☕ Cafe — brown noise
    const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const d   = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      d[i] = (last + 0.02 * w) / 1.02; last = d[i]; d[i] *= 3.5;
    }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    src.connect(gainNode); src.start();
    return src;

  } else if (type === 2) {
    // 🎵 Chill Lo-fi Beats — jazzy chords + kick + snare
    const bpm = 72, beat = 60 / bpm, barDur = beat * 4;
    const chords = [
      [261.6, 329.6, 392, 493.9],  // Cmaj7
      [220,   261.6, 329.6, 415.3], // Am7
      [174.6, 220,   277.2, 349.2], // Fmaj7
      [196,   261.6, 329.6, 392],   // G7
    ];
    let schedTime = ctx.currentTime, barIdx = 0, loopI;

    function chord(freqs, t, dur) {
      freqs.forEach(f => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.05, t + 0.08);
        g.gain.linearRampToValueAtTime(0, t + dur);
        o.connect(g); g.connect(gainNode); o.start(t); o.stop(t + dur);
      });
    }
    function kick(t) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g); g.connect(gainNode); o.start(t); o.stop(t + 0.3);
    }
    function snare(t) {
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.15), ctx.sampleRate);
      const d   = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
      const src = ctx.createBufferSource(), g = ctx.createGain();
      g.gain.value = 0.1; src.buffer = buf;
      src.connect(g); g.connect(gainNode); src.start(t);
    }
    function schedBar(t) {
      chord(chords[barIdx % 4], t, barDur);
      kick(t); kick(t + beat * 2);
      snare(t + beat); snare(t + beat * 3);
      barIdx++; schedTime += barDur;
    }

    for (let i = 0; i < 8; i++) schedBar(schedTime);
    loopI = setInterval(() => {
      if (currentTrack !== 2) { clearInterval(loopI); return; }
      schedBar(schedTime);
    }, barDur * 900);
    return { stop: () => clearInterval(loopI) };

  } else if (type === 3) {
    // 🪈 Krishna Flute — Mahabharata style, slow soulful, deep bansuri
    // D pentatonic scale — deeper, more devotional feel
    const scale = [146.8, 164.8, 185, 220, 246.9, 293.7, 329.6, 370, 440, 493.9];

    // Hand-crafted melody — slow, deliberate, like actual bansuri
    // Format: [noteIndex, duration, pause_after]
    const melody = [
      [4,1.2,0.1], [5,0.8,0.05], [6,1.4,0.2],
      [5,0.7,0.05],[4,0.9,0.1],  [3,1.6,0.3],
      [4,0.8,0.05],[5,1.0,0.1],  [7,1.8,0.4],
      [6,0.9,0.1], [5,0.7,0.05], [4,1.2,0.2],
      [3,0.8,0.05],[2,1.0,0.1],  [1,1.6,0.5],
      [2,0.7,0.05],[3,0.9,0.1],  [4,1.2,0.2],
      [5,1.8,0.1], [4,0.8,0.05], [3,1.0,0.3],
      [4,0.7,0.05],[5,0.9,0.1],  [6,2.0,0.6],
      [7,1.0,0.1], [6,0.8,0.05], [5,1.4,0.3],
      [4,2.4,0.8],
    ];

    // Big reverb — temple feel
    const revBuf = ctx.createBuffer(2, ctx.sampleRate * 3, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = revBuf.getChannelData(c);
      for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.8) * 0.7;
    }
    const reverb = ctx.createConvolver(); reverb.buffer = revBuf;
    const revG   = ctx.createGain();      revG.gain.value = 0.45;
    reverb.connect(revG); revG.connect(gainNode);

    function playBansuri(freq, startT, dur) {
      // Pure sine — bansuri ka dil
      const o1 = ctx.createOscillator(), g1 = ctx.createGain();
      o1.type = 'sine'; o1.frequency.value = freq;
      g1.gain.setValueAtTime(0, startT);
      g1.gain.linearRampToValueAtTime(0.18, startT + 0.18); // slow breath attack
      g1.gain.setValueAtTime(0.15, startT + dur * 0.5);
      g1.gain.linearRampToValueAtTime(0, startT + dur);
      o1.connect(g1); g1.connect(gainNode); g1.connect(reverb);
      o1.start(startT); o1.stop(startT + dur + 0.1);

      // Harmonic overtone — warmth
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = 'triangle'; o2.frequency.value = freq * 2;
      g2.gain.setValueAtTime(0, startT);
      g2.gain.linearRampToValueAtTime(0.04, startT + 0.2);
      g2.gain.linearRampToValueAtTime(0, startT + dur);
      o2.connect(g2); g2.connect(gainNode); g2.connect(reverb);
      o2.start(startT); o2.stop(startT + dur + 0.1);

      // Natural vibrato — starts after initial attack
      const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
      lfo.frequency.value = 4.5; lfoG.gain.value = 2.5;
      lfo.connect(lfoG); lfoG.connect(o1.frequency); lfoG.connect(o2.frequency);
      lfo.start(startT + 0.3); lfo.stop(startT + dur + 0.1);
    }

    let loopI;
    function scheduleMelody(startT) {
      let t = startT;
      melody.forEach(([ni, dur, pause]) => {
        playBansuri(scale[ni], t, dur);
        t += dur + pause;
      });
      return t + 2.0; // long pause before next loop
    }

    let nextLoop = scheduleMelody(ctx.currentTime + 0.5);
    loopI = setInterval(() => {
      if (currentTrack !== 3) { clearInterval(loopI); return; }
      if (nextLoop - ctx.currentTime < 6) nextLoop = scheduleMelody(nextLoop);
    }, 2000);
    return { stop: () => clearInterval(loopI) };

  } else {
    // 🌊 Ocean waves
    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++)
      d[i] = Math.sin(i * 0.0015) * 0.5 + (Math.random() * 2 - 1) * 0.25;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const f   = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 350;
    src.connect(f); f.connect(gainNode); src.start();
    return src;
  }
}

function toggleTrack(idx) {
  const tracks = document.querySelectorAll('.track');

  if (currentTrack === idx) {
    // Same track click = stop karo
    stopCurrent();
    tracks[idx].classList.remove('playing');
    tracks[idx].querySelector('.track-play').textContent = '▶';
    currentTrack = -1;
    return;
  }

  // Pehle wala band karo
  stopCurrent();
  tracks.forEach(t => {
    t.classList.remove('playing');
    t.querySelector('.track-play').textContent = '▶';
  });

  // Naya chalao
  currentTrack = idx;
  tracks[idx].classList.add('playing');
  tracks[idx].querySelector('.track-play').textContent = '⏸';
  noiseNode = createSound(idx);
}

function stopCurrent() {
  if (!noiseNode) return;
  if (typeof noiseNode.stop === 'function') {
    try { noiseNode.stop(); } catch (e) {}
  }
  noiseNode = null;
}

function setVolume(v) {
  if (gainNode) gainNode.gain.value = v / 180;
}

// Session end pe bell bajao
function playBell() {
  try {
    const ctx = getCtx();
    [[880, 0], [1100, 0.2], [1320, 0.4]].forEach(([f, d]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      const t = ctx.currentTime + d;
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + 1.8);
    });
  } catch (e) {}
}

/* ══════════════════════════════
   AI HYPE MAN 🎉
══════════════════════════════ */
const FALLBACKS = [
  'Bhai kar diya! Ek aur session aur tu topper ban jaayega! 🔥',
  'Focus session complete! Yeh consistency hi tujhe aage le jaayegi! 💪',
  'Wah yaar wah! Itna padh liya — deserve karta hai break! 🎉',
];

async function showAI(context) {
  const box = document.getElementById('aiBox');
  const msg = document.getElementById('aiMsg');
  box.classList.add('show');
  msg.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span> AI hype kar raha hai...</div>';

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 180,
        messages: [{
          role: 'user',
          content: `Tu ek hype man dost hai. ${context}. 2-3 lines casual Hinglish mein — funny, genuine, encouraging. Emojis. Sirf message.`
        }]
      })
    });
    const data = await res.json();
    if (data.content?.[0]?.text) {
      msg.textContent = data.content[0].text.trim();
      return;
    }
  } catch (e) {}

  // API fail ho toh fallback use karo
  msg.textContent = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

/* ══════════════════════════════
   NOTES (localStorage mein save)
══════════════════════════════ */
const notesArea = document.getElementById('notesArea');
notesArea.value = localStorage.getItem('ff2_notes') || '';
notesArea.addEventListener('input', () => {
  localStorage.setItem('ff2_notes', notesArea.value);
});

/* ══════════════════════════════
   INIT — Page load pe chalao
══════════════════════════════ */
initDisplay();
renderDots();
updateStats();
renderBadges();