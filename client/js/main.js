/**
 * main.js — Game entry point
 */

import { GameEngine }      from './engine/gameEngine.js';
import { Renderer }        from './ui/renderer.js';
import { VoiceController } from './voice/voiceController.js';
import { LEVELS }          from './levels/levels.js';
import { api }             from './ui/apiClient.js';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const canvas       = document.getElementById('game-canvas');
const wrapper      = document.getElementById('canvas-wrapper');
const levelList    = document.getElementById('level-list');
const levelTitle   = document.getElementById('level-title');
const levelDesc    = document.getElementById('level-desc');
const moveCountEl  = document.getElementById('move-count');
const winOverlay   = document.getElementById('win-overlay');
const deadOverlay  = document.getElementById('dead-overlay');
const winMoves     = document.getElementById('win-moves');
const winLevelName = document.getElementById('win-level-name');
const voiceBtn     = document.getElementById('voice-btn');
const voicePill    = document.getElementById('voice-pill');
const voiceText    = document.getElementById('voice-status-text');
const authNav      = document.getElementById('auth-nav');

// ── Core objects ──────────────────────────────────────────────────────────────
const engine   = new GameEngine();
const renderer = new Renderer(canvas);

let currentLevelIndex = 0;
let frameCount = 0;
let completedLevels = JSON.parse(localStorage.getItem('rif_completed') || '[]');

const urlParams      = new URLSearchParams(window.location.search);
const testLevelRaw   = urlParams.get('test') ? sessionStorage.getItem('testLevel') : null;
const communityMapId = urlParams.get('map');

// ── Voice (pass both pill and text elements) ──────────────────────────────────
const voice = new VoiceController(handleInput);
voice.init(voicePill, voiceText);
voiceBtn?.addEventListener('click', () => voice.toggle());

// ── Canvas sizing ─────────────────────────────────────────────────────────────
// The canvas fills the wrapper. Tile size = largest integer that fits.
// offsetX/offsetY are ALWAYS 0 — canvas exactly equals grid size.
function sizeCanvas() {
  const gW  = engine.width  || 13;
  const gH  = engine.height || 9;
  const pad = 32;
  const avW = Math.max(100, wrapper.clientWidth  - pad);
  const avH = Math.max(100, wrapper.clientHeight - pad);

  const tile = Math.max(24, Math.min(
    Math.floor(avW / gW),
    Math.floor(avH / gH),
    80
  ));

  canvas.width  = tile * gW;
  canvas.height = tile * gH;

  // Tell renderer: tile size, no offsets (canvas == grid)
  renderer.tileSize   = tile;
  renderer.levelWidth  = gW;
  renderer.levelHeight = gH;
  renderer.offsetX    = 0;
  renderer.offsetY    = 0;
}

window.addEventListener('resize', () => { sizeCanvas(); });

// ── Level management ──────────────────────────────────────────────────────────
function loadLevel(idx) {
  if (idx < 0 || idx >= LEVELS.length) return;
  currentLevelIndex = idx;
  const level = LEVELS[idx];

  engine.loadLevel(level);
  sizeCanvas();

  levelTitle.textContent  = `${level.id}. ${level.title}`;
  levelDesc.textContent   = level.description;
  moveCountEl.textContent = 'Moves: 0';

  winOverlay.classList.add('hidden');
  deadOverlay.classList.add('hidden');
  updateLevelList();
}

function buildLevelList() {
  levelList.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    if (completedLevels.includes(lv.id)) btn.classList.add('completed');
    if (i === currentLevelIndex)         btn.classList.add('active');
    btn.innerHTML = `<span class="level-num">${lv.id}</span><span class="level-name">${lv.title}</span>`;
    btn.addEventListener('click', () => loadLevel(i));
    levelList.appendChild(btn);
  });
}

function updateLevelList() {
  document.querySelectorAll('.level-btn').forEach((btn, i) => {
    btn.classList.toggle('active',    i === currentLevelIndex);
    btn.classList.toggle('completed', completedLevels.includes(LEVELS[i].id));
  });
}

// ── Input ─────────────────────────────────────────────────────────────────────
function handleInput(cmd) {
  const dirs = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };

  if (dirs[cmd]) {
    if (engine.state !== 'playing') return;
    engine.move(...dirs[cmd]);
    moveCountEl.textContent = `Moves: ${engine.moveCount}`;
    if (engine.state === 'won')  handleWin();
    if (engine.state === 'dead') deadOverlay.classList.remove('hidden');
  } else if (cmd === 'undo') {
    engine.undo();
    winOverlay.classList.add('hidden');
    deadOverlay.classList.add('hidden');
    moveCountEl.textContent = `Moves: ${engine.moveCount}`;
  } else if (cmd === 'restart') {
    engine.restart();
    winOverlay.classList.add('hidden');
    deadOverlay.classList.add('hidden');
    moveCountEl.textContent = 'Moves: 0';
  }
}

function handleWin() {
  if (testLevelRaw) {
    // Test mode: mark level as beaten so the editor can unlock Publish
    sessionStorage.setItem('testLevelWon', '1');
    winLevelName.textContent = 'Your level is solvable! 🎉';
    winMoves.textContent     = `Solved in ${engine.moveCount} move${engine.moveCount !== 1 ? 's' : ''} — go back to the editor to publish.`;
    // Swap the "Next Level" button to a "Back to Editor" button
    const nextBtn = document.getElementById('next-level-btn');
    if (nextBtn) {
      nextBtn.textContent = '← Back to Editor';
      nextBtn.onclick = () => { history.back(); };
    }
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) retryBtn.style.display = 'none';
    winOverlay.classList.remove('hidden');
    return;
  }

  const lv = LEVELS[currentLevelIndex];
  if (!completedLevels.includes(lv.id)) {
    completedLevels.push(lv.id);
    localStorage.setItem('rif_completed', JSON.stringify(completedLevels));
    updateLevelList();
  }
  winLevelName.textContent = lv.title;
  winMoves.textContent     = `Solved in ${engine.moveCount} move${engine.moveCount !== 1 ? 's' : ''}`;
  winOverlay.classList.remove('hidden');
}

// ── Keyboard ──────────────────────────────────────────────────────────────────
const KEY_MAP = {
  ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right',
  KeyW:'up', KeyS:'down', KeyA:'left', KeyD:'right',
  KeyZ:'undo', KeyR:'restart',
};
document.addEventListener('keydown', e => {
  const cmd = KEY_MAP[e.code];
  if (cmd) { e.preventDefault(); handleInput(cmd); }
});

// ── Overlay buttons ───────────────────────────────────────────────────────────
document.getElementById('next-level-btn').addEventListener('click', () => {
  winOverlay.classList.add('hidden');
  if (currentLevelIndex + 1 < LEVELS.length) loadLevel(currentLevelIndex + 1);
});
document.getElementById('retry-btn').addEventListener('click', () => {
  winOverlay.classList.add('hidden'); handleInput('restart');
});
document.getElementById('dead-retry-btn').addEventListener('click', () => {
  deadOverlay.classList.add('hidden'); handleInput('restart');
});
document.getElementById('dead-undo-btn').addEventListener('click', () => {
  deadOverlay.classList.add('hidden'); handleInput('undo');
});
document.getElementById('restart-btn-touch')?.addEventListener('click', () => handleInput('restart'));
document.querySelectorAll('.dpad-btn').forEach(b =>
  b.addEventListener('click', () => handleInput(b.dataset.dir))
);

// ── Auth nav ──────────────────────────────────────────────────────────────────
function updateAuthNav() {
  if (api.isLoggedIn()) {
    const uname = api.getUsername();
    authNav.innerHTML = `
      <a href="/profile" class="btn btn-sm btn-ghost">👤 ${uname || 'Profile'}</a>
      <button class="btn btn-sm btn-ghost" id="logout-btn">Log out</button>`;
    document.getElementById('logout-btn').addEventListener('click', () => { api.logout(); updateAuthNav(); });
  } else {
    authNav.innerHTML = `
      <a href="/login"    class="btn btn-sm btn-ghost">Log in</a>
      <a href="/register" class="btn btn-sm btn-primary">Sign up</a>`;
  }
}

// ── Render loop ───────────────────────────────────────────────────────────────
function loop() {
  renderer.render(engine.getObjects(), engine.getActiveRules(), engine.state, frameCount++);
  requestAnimationFrame(loop);
}

// ── Community map loader ──────────────────────────────────────────────────────
async function loadCommunityMap(id) {
  try {
    const data    = await api.getMap(id);
    const mapData = typeof data.map_json === 'string' ? JSON.parse(data.map_json) : data.map_json;
    if (!mapData || !mapData.tiles) throw new Error('Empty map data');
    engine.loadLevel(mapData); sizeCanvas();
    levelTitle.textContent = data.title;
    levelDesc.textContent  = 'by ' + (data.author || 'Anonymous');
  } catch(e) { console.error('Failed to load community map:', e); }
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  buildLevelList();
  updateAuthNav();

  if (testLevelRaw) {
    const parsed = JSON.parse(testLevelRaw);
    engine.loadLevel(parsed); sizeCanvas();
    levelTitle.textContent = 'Test: ' + (parsed.title || 'Untitled');
    levelDesc.textContent  = 'Test mode — win to unlock Publish';
    // Inject a persistent back-to-editor banner
    const banner = document.createElement('div');
    banner.id = 'test-mode-banner';
    banner.innerHTML = `<span>🧪 Test Mode</span><a href="javascript:history.back()" id="back-to-editor-link">← Back to Editor</a>`;
    document.getElementById('app')?.prepend(banner);
  } else if (communityMapId) {
    await loadCommunityMap(communityMapId);
  } else {
    loadLevel(0);
  }

  loop();
}

init();
