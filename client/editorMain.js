/**
 * editorMain.js — Level editor wiring
 */

import { LevelEditor } from './editor/levelEditor.js';
import { api } from './ui/apiClient.js';

const canvas    = document.getElementById('editor-canvas');
const paletteEl = document.getElementById('palette-items');
const authNav   = document.getElementById('auth-nav');

let editor;

function init() {
  editor = new LevelEditor(canvas, paletteEl);

  // Restore level if returning from a test play
  const saved = sessionStorage.getItem('editorSavedLevel');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      editor.importLevel(data);
      document.getElementById('level-title-input').value = data.title || 'My Level';
    } catch(e) { console.warn('Could not restore editor state', e); }
  }
}

window.addEventListener('resize', () => { editor?.handleResize(); });

// ── Toolbar ───────────────────────────────────────────────────────────────────
document.getElementById('resize-btn').addEventListener('click', () => {
  const w = parseInt(document.getElementById('width-input').value, 10);
  const h = parseInt(document.getElementById('height-input').value, 10);
  if (!isNaN(w) && !isNaN(h)) editor.resize(w, h);
});

document.querySelectorAll('[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => {
    editor.setTool(btn.dataset.tool);
    document.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

document.getElementById('clear-btn').addEventListener('click', () => {
  if (confirm('Clear the entire level?')) editor.clear();
});

document.getElementById('test-btn').addEventListener('click', () => editor.testLevel());

document.getElementById('export-btn').addEventListener('click', () => {
  const data = editor.exportLevel();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (data.title || 'level') + '.json';
  a.click();
});

document.getElementById('import-btn').addEventListener('click', () => {
  document.getElementById('import-modal').classList.remove('hidden');
});

document.getElementById('import-confirm').addEventListener('click', () => {
  try {
    const data = JSON.parse(document.getElementById('import-json').value);
    editor.importLevel(data);
    document.getElementById('level-title-input').value = data.title || '';
    document.getElementById('import-modal').classList.add('hidden');
  } catch(e) { alert('Invalid JSON: ' + e.message); }
});

document.getElementById('import-cancel').addEventListener('click', () => {
  document.getElementById('import-modal').classList.add('hidden');
});

// Publish always enabled
const publishBtn = document.getElementById('publish-btn');
publishBtn.disabled = false;
publishBtn.classList.remove('btn-disabled');

document.getElementById('publish-btn').addEventListener('click', () => {
  const modal = document.getElementById('publish-modal');
  modal.classList.remove('hidden');
  if (!api.isLoggedIn()) {
    document.getElementById('publish-auth-required').classList.remove('hidden');
    document.getElementById('publish-form').classList.add('hidden');
  } else {
    document.getElementById('publish-auth-required').classList.add('hidden');
    document.getElementById('publish-form').classList.remove('hidden');
    document.getElementById('publish-title').value = editor.title;
  }
});

document.getElementById('publish-confirm').addEventListener('click', async () => {
  const title = document.getElementById('publish-title').value.trim();
  if (!title) { alert('Please enter a title'); return; }
  try {
    const result = await api.publishMap(title, editor.exportLevel());
    alert(`Published! Share: /?map=${result.id}`);
    document.getElementById('publish-modal').classList.add('hidden');
  } catch(e) { alert('Failed to publish: ' + e.message); }
});

document.getElementById('publish-cancel').addEventListener('click', () => {
  document.getElementById('publish-modal').classList.add('hidden');
});

document.getElementById('level-title-input').addEventListener('input', e => {
  if (editor) editor.title = e.target.value;
});

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

init();
updateAuthNav();

// Autosave editor state to sessionStorage on any change so Test → Back never loses work
function autosave() {
  if (editor) sessionStorage.setItem('editorSavedLevel', JSON.stringify(editor.exportLevel()));
}
// Hook into canvas mouse/touch events via a MutationObserver-free approach:
// Run autosave after any toolbar action and periodically
setInterval(autosave, 2000);
canvas.addEventListener('mouseup',    autosave);
canvas.addEventListener('touchend',   autosave);
