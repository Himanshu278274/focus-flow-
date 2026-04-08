/* ═══════════════════════════════════════════
   FOCUSFLOW — script.js  (cinematic edition)
═══════════════════════════════════════════ */

/* ── BADGES ── */
const BADGES = [
  { id:'first',    icon:'🌱', name:'First Step',      req:'Complete 1 session'     },
  { id:'three',    icon:'🔥', name:'On a Roll!',       req:'3 sessions done'        },
  { id:'five',     icon:'👑', name:'Study King',       req:'5 sessions done'        },
  { id:'ten',      icon:'💎', name:'Diamond Focus',    req:'10 sessions done'       },
  { id:'hour',     icon:'⏰', name:'One Hour Hero',    req:'60 min studied'         },
  { id:'twohour',  icon:'🚀', name:'Focus Machine',    req:'2 hours studied'        },
  { id:'twenty',   icon:'🦁', name:'Study Legend',     req:'20 sessions total'      },
  { id:'goal3',    icon:'🎯', name:'Goal Crusher',     req:'Hit daily goal 3x'      },
  { id:'allbadge', icon:'🌟', name:'All Star',         req:'Unlock all badges'      },
];

/* ── STATE ── */
let activeTab     = 'stopwatch';
let customTimes   = { focus:25, short:5, long:15 };
let totalSessions = 4;
let currentMode   = 'focus';
let timeLeft      = 25 * 60;
let isRunning     = false;
let interval      = null;

let swElapsed   = 0;
let swInterval  = null;
let swStartTime = null;
let swIsRunning = false;

let sessionsDone  = +localStorage.getItem('ff2_sessions') || 0;
let totalMinutes  = +localStorage.getItem('ff2_minutes')  || 0;
let streak        = +localStorage.getItem('ff2_streak')   || 0;
let goalsComplete = +localStorage.getItem('ff2_goals')    || 0;
let unlockedBadges = JSON.parse(localStorage.getItem('ff2_badges') || '[]');

let currentTrack = -1;
let audioCtx = null, gainNode = null, noiseNode = null;

// Digit state — track prev values to trigger bounce only on change
let prevDigits = ['0','0','0','0'];

function save() {
  localStorage.setItem('ff2_sessions', sessionsDone);
  localStorage.setItem('ff2_minutes',  totalMinutes);
  localStorage.setItem('ff2_streak',   streak);
  localStorage.setItem('ff2_goals',    goalsComplete);
  localStorage.setItem('ff2_badges',   JSON.stringify(unlockedBadges));
}

/* ══════════════════════════════════════
   PARTICLE SYSTEM
══════════════════════════════════════ */
const canvas = document.getElementById('particleCanvas');
const ctx2d  = canvas.getContext('2d');
let particles = [];
let particleRAF = null;
let particlesActive = false;

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function getParticleColor() {
  const style = getComputedStyle(document.documentElement);
  const raw = style.getPropertyValue('--particle-color').trim();
  return raw || '255,255,255';
}

function spawnParticle() {
  return {
    x: Math.random() * canvas.width,
    y: canvas.height + 10,
    vx: (Math.random() - 0.5) * 0.6,
    vy: -(Math.random() * 1.2 + 0.4),
    size: Math.random() * 2.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.1,
    life: 0,
    maxLife: Math.random() * 220 + 120,
  };
}

function tickParticles() {
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  const col = getParticleColor();

  // Spawn new particles
  if (particlesActive && particles.length < 55) {
    for (let i = 0; i < 2; i++) particles.push(spawnParticle());
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x  += p.vx;
    p.y  += p.vy;
    p.life++;
    const fade = 1 - p.life / p.maxLife;

    ctx2d.beginPath();
    ctx2d.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx2d.fillStyle = `rgba(${col},${p.alpha * fade})`;
    ctx2d.fill();

    if (p.life >= p.maxLife || p.y < -10) particles.splice(i, 1);
  }

  particleRAF = requestAnimationFrame(tickParticles);
}

function startParticles() {
  if (particlesActive) return;
  particlesActive = true;
  canvas.classList.add('active');
  if (!particleRAF) tickParticles();
}

function stopParticles() {
  particlesActive = false;
  canvas.classList.remove('active');
  // Let remaining particles die out naturally
}

// Always run the loop (even idle), just no spawning when inactive
tickParticles();

/* ══════════════════════════════════════
   DIGIT DISPLAY — individual bounce
══════════════════════════════════════ */
function setDigits(mm, ss) {
  const chars = [mm[0], mm[1], ss[0], ss[1]];
  const ids   = ['d0','d1','d2','d3'];
  chars.forEach((c, i) => {
    const el = document.getElementById(ids[i]);
    if (c !== prevDigits[i]) {
      el.classList.remove('flip');
      void el.offsetWidth; // reflow
      el.classList.add('flip');
      el.addEventListener('animationend', () => el.classList.remove('flip'), { once:true });
    }
    el.textContent = c;
    prevDigits[i] = c;
  });
}

function pad2(n) { return String(n).padStart(2,'0'); }

/* ══════════════════════════════════════
   PAGE NAVIGATION
══════════════════════════════════════ */
function goToPage2() {
  document.getElementById('page1').classList.add('slide-out');
  document.getElementById('page2').classList.add('slide-in');
}
function goToPage1() {
  document.getElementById('page1').classList.remove('slide-out');
  document.getElementById('page2').classList.remove('slide-in');
}

/* ══════════════════════════════════════
   TAB SWITCH
══════════════════════════════════════ */
function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tabSW').classList.toggle('active', tab === 'stopwatch');
  document.getElementById('tabPM').classList.toggle('active', tab === 'pomodoro');

  document.querySelectorAll('.pomo-only').forEach(el => {
    el.style.display = tab === 'pomodoro' ? 'flex' : 'none';
  });

  if (tab === 'stopwatch') {
    stopPomodoro();
    swElapsed = 0; swIsRunning = false; clearInterval(swInterval);
    updateSwDisplay();
    setIdle();
  } else {
    stopStopwatch();
    updatePomoDisplay(timeLeft);
    setIdle();
  }
  document.getElementById('aiBox').classList.remove('show');
  stopParticles();
}

function setIdle() {
  document.getElementById('startBtn').textContent = 'Start';
  document.getElementById('delayBtn').textContent = 'Delay';
  document.getElementById('bigDisplay').classList.remove('running');
}

/* ══════════════════════════════════════
   BOTTOM BAR BUTTONS
══════════════════════════════════════ */
function handleStart(e) {
  createRipple(e, document.getElementById('startBtn'));
  if (activeTab === 'stopwatch') toggleStopwatch();
  else togglePomodoro();
}
function handleDelay(e) {
  createRipple(e, document.getElementById('delayBtn'));
  if (activeTab === 'stopwatch') {
    resetStopwatch();
  } else {
    if (!isRunning) { timeLeft += 5 * 60; updatePomoDisplay(timeLeft); }
  }
}
function onDisplayTap() {
  if (activeTab === 'pomodoro' && !isRunning) openTimeModal();
}

/* RIPPLE */
function createRipple(e, btn) {
  const rect   = btn.getBoundingClientRect();
  const size   = Math.max(rect.width, rect.height);
  const x      = (e.clientX - rect.left) - size / 2;
  const y      = (e.clientY - rect.top)  - size / 2;
  const ripple = document.createElement('span');
  ripple.className = 'ripple-ring';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

/* ══════════════════════════════════════
   STOPWATCH
══════════════════════════════════════ */
function toggleStopwatch() {
  swIsRunning ? pauseStopwatch() : startStopwatch();
}
function startStopwatch() {
  swIsRunning  = true;
  swStartTime  = performance.now() - swElapsed;
  document.getElementById('startBtn').textContent = 'Stop';
  document.getElementById('delayBtn').textContent = 'Reset';
  document.getElementById('bigDisplay').classList.add('running');
  startParticles();
  swInterval = setInterval(() => {
    swElapsed = performance.now() - swStartTime;
    updateSwDisplay();
  }, 50);
}
function pauseStopwatch() {
  swIsRunning = false;
  clearInterval(swInterval);
  swElapsed = performance.now() - swStartTime;
  document.getElementById('startBtn').textContent = 'Resume';
  document.getElementById('bigDisplay').classList.remove('running');
  stopParticles();
}
function stopStopwatch() {
  swIsRunning = false; clearInterval(swInterval);
}
function resetStopwatch() {
  stopStopwatch(); swElapsed = 0; updateSwDisplay(); setIdle(); stopParticles();
}
function updateSwDisplay() {
  const totalSec = Math.floor(swElapsed / 1000);
  const ms       = Math.floor((swElapsed % 1000) / 100);
  const m  = Math.floor(totalSec / 60);
  const s  = totalSec % 60;
  const mm = pad2(m), ss = pad2(s);
  setDigits(mm, ss);
  document.getElementById('bigMs').textContent  = '.' + ms;
  document.getElementById('bbMsNum').textContent = ms;
}

/* ══════════════════════════════════════
   POMODORO
══════════════════════════════════════ */
function togglePomodoro() {
  isRunning ? pausePomodoro() : startPomodoro();
}
function startPomodoro() {
  isRunning = true;
  document.getElementById('startBtn').textContent = 'Pause';
  document.getElementById('bigDisplay').classList.add('running');
  startParticles();
  interval = setInterval(() => {
    timeLeft--;
    updatePomoDisplay(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(interval); isRunning = false;
      document.getElementById('bigDisplay').classList.remove('running');
      stopParticles();
      onSessionEnd();
    }
  }, 1000);
}
function pausePomodoro() {
  clearInterval(interval); isRunning = false;
  document.getElementById('startBtn').textContent = 'Resume';
  document.getElementById('bigDisplay').classList.remove('running');
  stopParticles();
}
function stopPomodoro() {
  clearInterval(interval); isRunning = false;
  timeLeft = customTimes[currentMode] * 60;
}
function setMode(mode, btn) {
  currentMode = mode;
  document.querySelectorAll('.pomo-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  clearInterval(interval); isRunning = false;
  timeLeft = customTimes[mode] * 60;
  updatePomoDisplay(timeLeft); setIdle(); stopParticles();
  document.getElementById('aiBox').classList.remove('show');
}
function updatePomoDisplay(s) {
  const m  = Math.floor(s / 60), sc = s % 60;
  setDigits(pad2(m), pad2(sc));
  document.getElementById('bigMs').textContent   = '';
  document.getElementById('bbMsNum').textContent = '0';
  document.title = pad2(m) + ':' + pad2(sc) + ' — FocusFlow';
}
async function onSessionEnd() {
  playBell();
  if (currentMode === 'focus') {
    sessionsDone++; totalMinutes += customTimes.focus; streak++;
    if (sessionsDone % totalSessions === 0) goalsComplete++;
    save(); addHistory('focus'); updateStats(); renderDots(); checkBadges();
    await showAI(`The user just completed a ${customTimes.focus}-minute focus session! Total sessions today: ${sessionsDone}. Give them genuine, energetic encouragement!`);
    setTimeout(() => {
      const bm = sessionsDone % 4 === 0 ? 'long' : 'short';
      setMode(bm, document.getElementById(bm === 'long' ? 'ptLong' : 'ptShort'));
    }, 2500);
  } else {
    addHistory(currentMode);
    setTimeout(() => setMode('focus', document.getElementById('ptFocus')), 1500);
  }
}

/* ══════════════════════════════════════
   THEME
══════════════════════════════════════ */
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.title === t));
  localStorage.setItem('ff2_theme', t);
}
(function(){
  const t = localStorage.getItem('ff2_theme') || 'night';
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.title === t));
})();

/* ══════════════════════════════════════
   TIME MODAL
══════════════════════════════════════ */
function openTimeModal() {
  syncModalVals();
  document.getElementById('timeModal').classList.add('open');
}
function closeTimeModal(e) {
  if (e && e.target !== document.getElementById('timeModal')) return;
  document.getElementById('timeModal').classList.remove('open');
}
function syncModalVals() {
  document.getElementById('modalFocusVal').textContent = customTimes.focus + ' min';
  document.getElementById('modalShortVal').textContent = customTimes.short + ' min';
  document.getElementById('modalLongVal').textContent  = customTimes.long  + ' min';
  document.getElementById('focusSlider').value = customTimes.focus;
  document.getElementById('focusVal').textContent = customTimes.focus + ' min';
  document.getElementById('shortSlider').value = customTimes.short;
  document.getElementById('shortVal').textContent = customTimes.short + ' min';
  document.getElementById('longSlider').value = customTimes.long;
  document.getElementById('longVal').textContent = customTimes.long + ' min';
}
function adjustTime(type, delta) {
  const limits = { focus:[5,90], short:[1,15], long:[5,60] };
  const [mn,mx] = limits[type];
  customTimes[type] = Math.min(mx, Math.max(mn, customTimes[type] + delta));
  const cap = type.charAt(0).toUpperCase() + type.slice(1);
  document.getElementById('modal' + cap + 'Val').textContent = customTimes[type] + ' min';
  document.getElementById(type + 'Slider').value = customTimes[type];
  document.getElementById(type + 'Val').textContent = customTimes[type] + ' min';
  if (type === currentMode && !isRunning) { timeLeft = customTimes[type] * 60; updatePomoDisplay(timeLeft); }
}

/* MENU MODAL */
function openMenuModal() { document.getElementById('menuModal').classList.add('open'); }
function closeMenuModal(e) {
  if (e && e.target !== document.getElementById('menuModal')) return;
  document.getElementById('menuModal').classList.remove('open');
}

/* ══════════════════════════════════════
   DOTS & STATS
══════════════════════════════════════ */
function renderDots() {
  const c = document.getElementById('sessionDots'); c.innerHTML = '';
  const done = sessionsDone % totalSessions;
  for (let i = 0; i < totalSessions; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i < done ? ' done' : '') + (i === done ? ' active' : '');
    c.appendChild(d);
  }
}
function updateStats() {
  document.getElementById('statSessions').textContent = sessionsDone;
  document.getElementById('statMins').textContent     = totalMinutes;
  document.getElementById('statStreak').textContent   = streak;
  document.getElementById('statGoal').textContent     = totalSessions;
}
function updateSlider(type, val) {
  val = parseInt(val);
  if (type === 'sess') { totalSessions = val; document.getElementById('sessVal').textContent = val + ' sessions'; updateStats(); renderDots(); return; }
  customTimes[type] = val;
  document.getElementById(type + 'Val').textContent = val + ' min';
  if (type === currentMode && !isRunning && activeTab === 'pomodoro') { timeLeft = val * 60; updatePomoDisplay(timeLeft); }
}

/* ══════════════════════════════════════
   BADGES
══════════════════════════════════════ */
function renderBadges() {
  document.getElementById('badgesGrid').innerHTML = BADGES.map(b => {
    const u = unlockedBadges.includes(b.id);
    return `<div class="badge ${u?'unlocked':''}" title="${b.req}"><div class="badge-icon">${b.icon}</div><div class="badge-name">${b.name}</div><div class="badge-req">${b.req}</div></div>`;
  }).join('');
}
function checkBadges() {
  const checks = { first:sessionsDone>=1, three:sessionsDone>=3, five:sessionsDone>=5, ten:sessionsDone>=10, hour:totalMinutes>=60, twohour:totalMinutes>=120, twenty:sessionsDone>=20, goal3:goalsComplete>=3, allbadge:BADGES.slice(0,8).every(b=>unlockedBadges.includes(b.id)) };
  let nb = null;
  BADGES.forEach(b => { if (!unlockedBadges.includes(b.id) && checks[b.id]) { unlockedBadges.push(b.id); nb = b; } });
  if (nb) { save(); showBadgeToast(nb); }
  renderBadges();
}
let toastTimer = null;
function showBadgeToast(b) {
  const t = document.getElementById('badgeToast');
  document.getElementById('toastIcon').textContent = b.icon;
  document.getElementById('toastMsg').textContent  = `Badge unlocked: ${b.name}! 🎉`;
  t.classList.add('show'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 4000);
}

/* ══════════════════════════════════════
   HISTORY
══════════════════════════════════════ */
function addHistory(type) {
  const list  = document.getElementById('historyList');
  const empty = list.querySelector('.history-empty');
  if (empty) empty.remove();
  const time   = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  const labels = {focus:'🎯 Focus',short:'☕ Break',long:'🛋️ Long Break'};
  const dur    = {focus:customTimes.focus,short:customTimes.short,long:customTimes.long};
  const item   = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `<span class="h-label">${labels[type]} · ${dur[type]}m</span><span class="h-time">${time}</span><span class="h-badge ${type==='focus'?'focus':'brk'}">${type==='focus'?'Done ✅':'Break'}</span>`;
  list.insertBefore(item, list.firstChild);
}

/* ══════════════════════════════════════
   NOTES
══════════════════════════════════════ */
const notesArea = document.getElementById('notesArea');
notesArea.value = localStorage.getItem('ff2_notes') || '';
notesArea.addEventListener('input', () => localStorage.setItem('ff2_notes', notesArea.value));

/* ══════════════════════════════════════
   AUDIO
══════════════════════════════════════ */
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function createSound(type) {
  const ctx = getCtx();
  gainNode = ctx.createGain();
  gainNode.gain.value = document.getElementById('volSlider').value / 180;
  gainNode.connect(ctx.destination);
  if (type === 0) {
    const buf=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*0.9;
    const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;
    const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=1200;f.Q.value=0.5;
    src.connect(f);f.connect(gainNode);src.start();return src;
  } else if (type===1) {
    const buf=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),d=buf.getChannelData(0);let last=0;
    for(let i=0;i<d.length;i++){const w=Math.random()*2-1;d[i]=(last+0.02*w)/1.02;last=d[i];d[i]*=3.5;}
    const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;src.connect(gainNode);src.start();return src;
  } else if (type===2) {
    const bpm=72,beat=60/bpm,barDur=beat*4;
    const chords=[[261.6,329.6,392,493.9],[220,261.6,329.6,415.3],[174.6,220,277.2,349.2],[196,261.6,329.6,392]];
    let schedTime=ctx.currentTime,barIdx=0,loopI;
    function chord(freqs,t,dur){freqs.forEach(f=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.05,t+0.08);g.gain.linearRampToValueAtTime(0,t+dur);o.connect(g);g.connect(gainNode);o.start(t);o.stop(t+dur);});}
    function kick(t){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(40,t+0.15);g.gain.setValueAtTime(0.4,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.3);o.connect(g);g.connect(gainNode);o.start(t);o.stop(t+0.3);}
    function snare(t){const buf=ctx.createBuffer(1,Math.floor(ctx.sampleRate*0.15),ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*0.04));const src=ctx.createBufferSource(),g=ctx.createGain();g.gain.value=0.1;src.buffer=buf;src.connect(g);g.connect(gainNode);src.start(t);}
    function schedBar(t){chord(chords[barIdx%4],t,barDur);kick(t);kick(t+beat*2);snare(t+beat);snare(t+beat*3);barIdx++;schedTime+=barDur;}
    for(let i=0;i<8;i++)schedBar(schedTime);
    loopI=setInterval(()=>{if(currentTrack!==2){clearInterval(loopI);return;}schedBar(schedTime);},barDur*900);
    return{stop:()=>clearInterval(loopI)};
  } else if (type===3) {
    const scale=[146.8,164.8,185,220,246.9,293.7,329.6,370,440,493.9];
    const melody=[[4,1.2,0.1],[5,0.8,0.05],[6,1.4,0.2],[5,0.7,0.05],[4,0.9,0.1],[3,1.6,0.3],[4,0.8,0.05],[5,1.0,0.1],[7,1.8,0.4],[6,0.9,0.1],[5,0.7,0.05],[4,1.2,0.2],[3,0.8,0.05],[2,1.0,0.1],[1,1.6,0.5],[2,0.7,0.05],[3,0.9,0.1],[4,1.2,0.2],[5,1.8,0.1],[4,0.8,0.05],[3,1.0,0.3],[4,0.7,0.05],[5,0.9,0.1],[6,2.0,0.6],[7,1.0,0.1],[6,0.8,0.05],[5,1.4,0.3],[4,2.4,0.8]];
    const revBuf=ctx.createBuffer(2,ctx.sampleRate*3,ctx.sampleRate);
    for(let c=0;c<2;c++){const d=revBuf.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.8)*0.7;}
    const reverb=ctx.createConvolver();reverb.buffer=revBuf;const revG=ctx.createGain();revG.gain.value=0.45;reverb.connect(revG);revG.connect(gainNode);
    function playBansuri(freq,startT,dur){const o1=ctx.createOscillator(),g1=ctx.createGain();o1.type='sine';o1.frequency.value=freq;g1.gain.setValueAtTime(0,startT);g1.gain.linearRampToValueAtTime(0.18,startT+0.18);g1.gain.setValueAtTime(0.15,startT+dur*0.5);g1.gain.linearRampToValueAtTime(0,startT+dur);o1.connect(g1);g1.connect(gainNode);g1.connect(reverb);o1.start(startT);o1.stop(startT+dur+0.1);const o2=ctx.createOscillator(),g2=ctx.createGain();o2.type='triangle';o2.frequency.value=freq*2;g2.gain.setValueAtTime(0,startT);g2.gain.linearRampToValueAtTime(0.04,startT+0.2);g2.gain.linearRampToValueAtTime(0,startT+dur);o2.connect(g2);g2.connect(gainNode);g2.connect(reverb);o2.start(startT);o2.stop(startT+dur+0.1);const lfo=ctx.createOscillator(),lfoG=ctx.createGain();lfo.frequency.value=4.5;lfoG.gain.value=2.5;lfo.connect(lfoG);lfoG.connect(o1.frequency);lfoG.connect(o2.frequency);lfo.start(startT+0.3);lfo.stop(startT+dur+0.1);}
    let loopI;function scheduleMelody(startT){let t=startT;melody.forEach(([ni,dur,pause])=>{playBansuri(scale[ni],t,dur);t+=dur+pause;});return t+2.0;}
    let nextLoop=scheduleMelody(ctx.currentTime+0.5);
    loopI=setInterval(()=>{if(currentTrack!==3){clearInterval(loopI);return;}if(nextLoop-ctx.currentTime<6)nextLoop=scheduleMelody(nextLoop);},2000);
    return{stop:()=>clearInterval(loopI)};
  } else {
    const buf=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.sin(i*0.0015)*0.5+(Math.random()*2-1)*0.25;
    const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;
    const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=350;
    src.connect(f);f.connect(gainNode);src.start();return src;
  }
}
function toggleTrack(idx) {
  const tracks = document.querySelectorAll('.track');
  if (currentTrack===idx){stopCurrent();tracks[idx].classList.remove('playing');tracks[idx].querySelector('.track-play').textContent='▶';currentTrack=-1;return;}
  stopCurrent();tracks.forEach(t=>{t.classList.remove('playing');t.querySelector('.track-play').textContent='▶';});
  currentTrack=idx;tracks[idx].classList.add('playing');tracks[idx].querySelector('.track-play').textContent='⏸';noiseNode=createSound(idx);
}
function stopCurrent(){if(!noiseNode)return;if(typeof noiseNode.stop==='function'){try{noiseNode.stop();}catch(e){}}noiseNode=null;}
function setVolume(v){if(gainNode)gainNode.gain.value=v/180;}
function playBell(){
  try{const ctx=getCtx();[[880,0],[1100,0.2],[1320,0.4]].forEach(([f,d])=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;const t=ctx.currentTime+d;g.gain.setValueAtTime(0.3,t);g.gain.exponentialRampToValueAtTime(0.001,t+1.8);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+1.8);});}catch(e){}
}

/* ══════════════════════════════════════
   AI HYPE MAN
══════════════════════════════════════ */
const FALLBACKS = [
  'Session complete! One more like that and you\'re unstoppable! 🔥',
  'Focus session done! This consistency is what sets you apart! 💪',
  'Amazing work! You studied hard — you deserve that break! 🎉'
];
async function showAI(context) {
  const box=document.getElementById('aiBox'),msg=document.getElementById('aiMsg');
  box.classList.add('show');
  msg.innerHTML='<div class="loading-dots"><span></span><span></span><span></span> AI is hyping you up...</div>';
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:180,messages:[{role:'user',content:`You are an enthusiastic hype-man friend. ${context}. Reply in 2-3 lines — casual, funny, genuine, and encouraging English. Use emojis. Just the message.`}]})});
    const data=await res.json();
    if(data.content?.[0]?.text){msg.textContent=data.content[0].text.trim();return;}
  }catch(e){}
  msg.textContent=FALLBACKS[Math.floor(Math.random()*FALLBACKS.length)];
}

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
updateSwDisplay();
updateStats();
renderDots();
renderBadges();