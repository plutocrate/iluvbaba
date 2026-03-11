/**
 * communityMain.js - Community maps page
 * Clicking a map navigates to /?map=ID (full play page)
 */

import { api } from './ui/apiClient.js';

const mapsGrid    = document.getElementById('maps-grid');
const authNav     = document.getElementById('auth-nav');
const loadMoreBtn = document.getElementById('load-more-btn');

let currentSort = 'top';
let currentPage = 1;
let hasMore     = true;

// ── Load maps ─────────────────────────────────────────────────────────────────
async function loadMaps(reset = false) {
  if (reset) { currentPage = 1; mapsGrid.innerHTML = ''; hasMore = true; }
  try {
    const data = await api.getMaps(currentSort, currentPage);
    const maps = data.maps || [];
    if (reset && maps.length === 0) {
      mapsGrid.innerHTML = `<div class="no-maps">No maps yet. <a href="/editor">Create one!</a></div>`;
      loadMoreBtn.style.display = 'none';
      return;
    }
    for (const map of maps) mapsGrid.appendChild(createMapCard(map));
    hasMore = maps.length >= 20;
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    if (hasMore) currentPage++;
  } catch (e) {
    mapsGrid.innerHTML = `<div class="no-maps">Could not load maps — is the server running?</div>`;
    loadMoreBtn.style.display = 'none';
  }
}

function createMapCard(map) {
  const card = document.createElement('div');
  card.className = 'map-card';
  const localVote = api.getLocalVote(map.id);

  card.innerHTML = `
    <div class="map-card-title">${esc(map.title)}</div>
    <div class="map-card-author">by ${esc(map.author || 'Anonymous')}</div>
    <div class="map-card-date">${fmtDate(map.created_at)}</div>
    <div class="map-card-votes">
      <button class="vote-btn upvote-btn ${localVote==='up'?'voted-up':''}" data-id="${map.id}">
        ▲ <span class="upvote-count">${map.upvotes||0}</span>
      </button>
      <button class="vote-btn downvote-btn ${localVote==='down'?'voted-down':''}" data-id="${map.id}">
        ▼ <span class="downvote-count">${map.downvotes||0}</span>
      </button>
    </div>
    <a href="/?map=${map.id}" class="btn btn-sm btn-primary map-card-play">▶ Play</a>
  `;

  card.querySelector('.upvote-btn').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); handleVote(map.id, 'up', card); });
  card.querySelector('.downvote-btn').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); handleVote(map.id, 'down', card); });
  card.addEventListener('click', () => { window.location.href = `/?map=${map.id}`; });

  return card;
}

async function handleVote(mapId, voteType, card) {
  try {
    const result = await api.vote(mapId, voteType);
    if (result.upvotes !== undefined) {
      card.querySelector('.upvote-count').textContent  = result.upvotes;
      card.querySelector('.downvote-count').textContent = result.downvotes;
    }
    const lv = api.getLocalVote(mapId);
    card.querySelector('.upvote-btn').className  = `vote-btn upvote-btn ${lv==='up'?'voted-up':''}`;
    card.querySelector('.downvote-btn').className = `vote-btn downvote-btn ${lv==='down'?'voted-down':''}`;
  } catch(e) { console.error('Vote failed', e); }
}

// ── Sort / Search ─────────────────────────────────────────────────────────────
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSort = btn.dataset.sort;
    loadMaps(true);
  });
});

document.getElementById('search-btn').addEventListener('click', async () => {
  const q = document.getElementById('search-input').value.trim();
  if (!q) { loadMaps(true); return; }
  try {
    const data = await api.request('GET', `/maps?search=${encodeURIComponent(q)}`);
    mapsGrid.innerHTML = '';
    const maps = data.maps || [];
    if (maps.length === 0) mapsGrid.innerHTML = `<div class="no-maps">No results for "${esc(q)}"</div>`;
    for (const map of maps) mapsGrid.appendChild(createMapCard(map));
    loadMoreBtn.style.display = 'none';
  } catch(e) { console.error('Search failed', e); }
});

document.getElementById('search-input').addEventListener('keypress', e => {
  if (e.key === 'Enter') document.getElementById('search-btn').click();
});

loadMoreBtn.addEventListener('click', () => loadMaps(false));

// ── Auth nav ──────────────────────────────────────────────────────────────────
function updateAuthNav() {
  if (api.isLoggedIn()) {
    authNav.innerHTML = `
      <a href="/profile" class="btn btn-sm btn-ghost">👤 ${esc(api.getUsername())}</a>
      <button class="btn btn-sm btn-ghost" id="logout-btn">Log out</button>`;
    document.getElementById('logout-btn').addEventListener('click', () => { api.logout(); updateAuthNav(); });
  } else {
    authNav.innerHTML = `
      <a href="/login"    class="btn btn-sm btn-ghost">Log in</a>
      <a href="/register" class="btn btn-sm btn-primary">Sign up</a>`;
  }
}

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : ''; }

updateAuthNav();
loadMaps(true);
