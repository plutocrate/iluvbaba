/**
 * profileMain.js — User profile page
 * Shows username, joined date, change password, and own published maps
 */

import { api } from './ui/apiClient.js';

// Redirect to login if not logged in
if (!api.isLoggedIn()) {
  window.location.href = '/login';
}

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : ''; }

// ── Load profile ──────────────────────────────────────────────────────────────
async function loadProfile() {
  try {
    const profile = await api.getProfile();
    document.getElementById('profile-username').textContent = profile.username;
    document.getElementById('avatar-letter').textContent    = profile.username[0].toUpperCase();
    document.getElementById('profile-joined').textContent   = `Joined ${fmtDate(profile.created_at)}`;
    document.title = `${profile.username} — i❤️baba`;
  } catch(e) {
    if (e.message === 'Invalid token' || e.message === 'Unauthorized') {
      api.logout();
      window.location.href = '/login';
    }
  }
}

// ── Load my maps ──────────────────────────────────────────────────────────────
async function loadMyMaps() {
  const list = document.getElementById('my-maps-list');
  try {
    const data = await api.getMyMaps();
    const maps = data.maps || [];
    if (maps.length === 0) {
      list.innerHTML = `<div style="color:var(--grey);font-size:13px">
        No maps yet. <a href="/editor" style="color:var(--amber)">Create one!</a>
      </div>`;
      return;
    }
    list.innerHTML = maps.map(m => `
      <div class="my-map-row" data-id="${m.id}">
        <div class="my-map-info">
          <div class="my-map-title">${esc(m.title)}</div>
          <div class="my-map-meta">${fmtDate(m.created_at)} &nbsp;·&nbsp; ▲${m.upvotes||0} ▼${m.downvotes||0}</div>
        </div>
        <div class="my-map-actions">
          <a href="/?map=${m.id}" class="btn btn-sm btn-ghost">▶ Play</a>
          <button class="btn btn-sm btn-danger delete-map-btn" data-id="${m.id}">Delete</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.delete-map-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this map? This cannot be undone.')) return;
        try {
          await api.deleteMap(btn.dataset.id);
          btn.closest('.my-map-row').remove();
          if (!list.querySelector('.my-map-row')) {
            list.innerHTML = `<div style="color:var(--grey);font-size:13px">No maps yet. <a href="/editor" style="color:var(--amber)">Create one!</a></div>`;
          }
        } catch(e) { alert('Failed to delete: ' + e.message); }
      });
    });
  } catch(e) {
    list.innerHTML = `<div style="color:var(--grey);font-size:13px">Could not load maps.</div>`;
  }
}

// ── Change password ───────────────────────────────────────────────────────────
document.getElementById('pw-save-btn').addEventListener('click', async () => {
  const current = document.getElementById('pw-current').value;
  const next    = document.getElementById('pw-new').value;
  const confirm = document.getElementById('pw-confirm').value;
  const msg     = document.getElementById('pw-msg');

  const show = (text, ok) => {
    msg.textContent = text;
    msg.style.display = 'block';
    msg.style.background = ok ? 'rgba(46,204,113,.15)' : 'rgba(220,50,50,.15)';
    msg.style.color = ok ? '#22c55e' : '#ef4444';
    msg.style.border = `1px solid ${ok ? '#22c55e' : '#ef4444'}`;
  };

  if (!current || !next || !confirm) return show('All fields are required', false);
  if (next.length < 6)              return show('New password must be at least 6 characters', false);
  if (next !== confirm)             return show('Passwords do not match', false);

  try {
    await api.changePassword(current, next);
    show('Password changed successfully!', true);
    document.getElementById('pw-current').value = '';
    document.getElementById('pw-new').value     = '';
    document.getElementById('pw-confirm').value = '';
  } catch(e) {
    show(e.message || 'Failed to change password', false);
  }
});

// ── Auth nav ──────────────────────────────────────────────────────────────────
const authNav = document.getElementById('auth-nav');
authNav.innerHTML = `
  <a href="/profile" class="btn btn-sm btn-ghost active">👤 ${esc(api.getUsername())}</a>
  <button class="btn btn-sm btn-ghost" id="logout-btn">Log out</button>`;
document.getElementById('logout-btn').addEventListener('click', () => { api.logout(); window.location.href = '/'; });
document.getElementById('logout-profile-btn').addEventListener('click', () => { api.logout(); window.location.href = '/'; });

loadProfile();
loadMyMaps();
