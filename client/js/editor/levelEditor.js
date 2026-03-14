/**
 * Level Editor
 *
 * Renders onto a canvas that fills its container.
 * Palette, toolbar, and canvas all wired together here.
 */

import { Renderer } from '../ui/renderer.js';
import { GameEngine } from '../engine/gameEngine.js';

// ── Palette definition ────────────────────────────────────────────────────────
const PALETTE = [
  // Objects
  { id:'BABA',  isText:false, label:'Baba',   color:'#e8dfd0' },
  { id:'ROCK',  isText:false, label:'Rock',   color:'#7a6e5e' },
  { id:'WALL',  isText:false, label:'Wall',   color:'#3d4b5c' },
  { id:'FLAG',  isText:false, label:'Flag',   color:'#8b5cf6' },
  { id:'LAVA',  isText:false, label:'Lava',   color:'#cc3300' },
  { id:'WATER', isText:false, label:'Water',  color:'#1a6eb5' },
  { id:'KEKE',  isText:false, label:'Keke',   color:'#d45c00' },
  { id:'SKULL', isText:false, label:'Skull',  color:'#d8e4ec' },
  { id:'LOVE',  isText:false, label:'Love',   color:'#cc2255' },
  // Nouns
  { id:'TEXT_BABA',  isText:true, textType:'noun', textValue:'BABA',  label:'BABA' },
  { id:'TEXT_ROCK',  isText:true, textType:'noun', textValue:'ROCK',  label:'ROCK' },
  { id:'TEXT_WALL',  isText:true, textType:'noun', textValue:'WALL',  label:'WALL' },
  { id:'TEXT_FLAG',  isText:true, textType:'noun', textValue:'FLAG',  label:'FLAG' },
  { id:'TEXT_LAVA',  isText:true, textType:'noun', textValue:'LAVA',  label:'LAVA' },
  { id:'TEXT_WATER', isText:true, textType:'noun', textValue:'WATER', label:'WATER' },
  { id:'TEXT_KEKE',  isText:true, textType:'noun', textValue:'KEKE',  label:'KEKE' },
  { id:'TEXT_SKULL', isText:true, textType:'noun', textValue:'SKULL', label:'SKULL' },
  { id:'TEXT_LOVE',  isText:true, textType:'noun', textValue:'LOVE',  label:'LOVE' },
  // Verb
  { id:'TEXT_IS', isText:true, textType:'verb', textValue:'IS', label:'IS' },
  // Properties
  { id:'TEXT_YOU',    isText:true, textType:'property', textValue:'YOU',    label:'YOU' },
  { id:'TEXT_WIN',    isText:true, textType:'property', textValue:'WIN',    label:'WIN' },
  { id:'TEXT_STOP',   isText:true, textType:'property', textValue:'STOP',   label:'STOP' },
  { id:'TEXT_PUSH',   isText:true, textType:'property', textValue:'PUSH',   label:'PUSH' },
  { id:'TEXT_HOT',    isText:true, textType:'property', textValue:'HOT',    label:'HOT' },
  { id:'TEXT_MELT',   isText:true, textType:'property', textValue:'MELT',   label:'MELT' },
  { id:'TEXT_DEFEAT', isText:true, textType:'property', textValue:'DEFEAT', label:'DEFEAT' },
  { id:'TEXT_SINK',   isText:true, textType:'property', textValue:'SINK',   label:'SINK' },
];

export class LevelEditor {
  constructor(canvas, paletteEl) {
    this.canvas    = canvas;
    this.paletteEl = paletteEl;
    this.renderer  = new Renderer(canvas);

    this.gridW    = 12;
    this.gridH    = 9;
    this.tiles    = [];
    this.selected = PALETTE[0];
    this.tool     = 'place';
    this.dragging = false;
    this.title    = 'My Level';

    this._sizeCanvas();
    this._buildPalette();
    this._bindCanvas();
    this._loop();
  }

  // ── Canvas sizing ───────────────────────────────────────────────────────────
  _sizeCanvas() {
    const container = this.canvas.parentElement;
    const avW = container.clientWidth  - 2;
    const avH = container.clientHeight - 2;
    const tile = Math.max(24, Math.min(
      Math.floor(avW / this.gridW),
      Math.floor(avH / this.gridH),
      72
    ));
    this.canvas.width  = tile * this.gridW;
    this.canvas.height = tile * this.gridH;
    this.renderer.tileSize    = tile;
    this.renderer.levelWidth  = this.gridW;
    this.renderer.levelHeight = this.gridH;
    this.renderer.offsetX     = 0;
    this.renderer.offsetY     = 0;
  }

  handleResize() { this._sizeCanvas(); }

  // ── Palette ─────────────────────────────────────────────────────────────────
  _buildPalette() {
    this.paletteEl.innerHTML = '';

    const sections = [
      { label:'Objects',    items: PALETTE.filter(p => !p.isText) },
      { label:'Nouns',      items: PALETTE.filter(p => p.isText && p.textType==='noun') },
      { label:'Verbs',      items: PALETTE.filter(p => p.isText && p.textType==='verb') },
      { label:'Properties', items: PALETTE.filter(p => p.isText && p.textType==='property') },
    ];

    for (const sec of sections) {
      const hdr = document.createElement('div');
      hdr.className   = 'pal-heading';
      hdr.textContent = sec.label;
      this.paletteEl.appendChild(hdr);

      for (const item of sec.items) {
        const btn = document.createElement('button');
        btn.className = 'pal-item';
        if (item.isText) btn.dataset.textType = item.textType;
        if (item === this.selected) btn.classList.add('selected');

        // Color dot
        const dot = document.createElement('span');
        dot.className = 'pal-dot';
        const dotColor = item.isText
          ? (item.textType === 'noun' ? '#3b82f6' : item.textType === 'verb' ? '#f59e0b' : '#22c55e')
          : (item.color || '#888');
        dot.style.background = dotColor;

        const lbl = document.createElement('span');
        lbl.textContent = item.label;

        btn.appendChild(dot);
        btn.appendChild(lbl);

        btn.addEventListener('click', () => {
          this.selected = item;
          this.tool = 'place';
          document.querySelectorAll('.pal-item').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          // Sync toolbar tool buttons
          document.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
          document.getElementById('tool-place')?.classList.add('active');
        });

        this.paletteEl.appendChild(btn);
      }
    }
  }

  // ── Canvas events ────────────────────────────────────────────────────────────
  _bindCanvas() {
    const c = this.canvas;

    c.addEventListener('mousedown', e => {
      this.dragging = true;
      if (e.button === 2) {
        e.preventDefault();
        this._erase(this._pos(e));
      } else {
        this._act(this._pos(e));
      }
    });

    c.addEventListener('mousemove', e => {
      if (!this.dragging) return;
      if (e.buttons === 2) this._erase(this._pos(e));
      else this._act(this._pos(e));
    });

    c.addEventListener('mouseup',    () => { this.dragging = false; });
    c.addEventListener('mouseleave', () => { this.dragging = false; });
    c.addEventListener('contextmenu', e => e.preventDefault());

    // Touch
    c.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0], r = c.getBoundingClientRect();
      this._act({ x: Math.floor((t.clientX - r.left) / this.renderer.tileSize),
                  y: Math.floor((t.clientY - r.top)  / this.renderer.tileSize) });
    }, { passive: false });
  }

  _pos(e) {
    const r = this.canvas.getBoundingClientRect();
    const T = this.renderer.tileSize;
    return {
      x: Math.floor((e.clientX - r.left) / T),
      y: Math.floor((e.clientY - r.top)  / T),
    };
  }

  _act({ x, y }) {
    if (this.tool === 'erase') this._erase({ x, y });
    else this._place({ x, y });
  }

  _place({ x, y }) {
    if (x < 0 || x >= this.gridW || y < 0 || y >= this.gridH) return;
    const item = this.selected;
    if (!item) return;
    // Remove duplicates of same type at same cell
    this.tiles = this.tiles.filter(t => !(t.x === x && t.y === y && t.type === item.id));
    this.tiles.push({
      type: item.id, x, y,
      isText:    item.isText    || false,
      textType:  item.textType  || null,
      textValue: item.textValue || null,
    });
  }

  _erase({ x, y }) {
    if (x < 0 || x >= this.gridW || y < 0 || y >= this.gridH) return;
    // Remove topmost tile
    for (let i = this.tiles.length - 1; i >= 0; i--) {
      if (this.tiles[i].x === x && this.tiles[i].y === y) {
        this.tiles.splice(i, 1);
        break;
      }
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────
  setTool(t) { this.tool = t; }

  resize(w, h) {
    this.gridW = Math.max(5, Math.min(20, w));
    this.gridH = Math.max(5, Math.min(20, h));
    this.tiles = this.tiles.filter(t => t.x < this.gridW && t.y < this.gridH);
    this._sizeCanvas();
  }

  clear() { this.tiles = []; }

  exportLevel() {
    return { title: this.title, width: this.gridW, height: this.gridH, tiles: [...this.tiles] };
  }

  importLevel(data) {
    this.gridW  = data.width  || 12;
    this.gridH  = data.height || 9;
    this.title  = data.title  || 'Imported';
    this.tiles  = (data.tiles || []).map(t => ({ ...t }));
    this._sizeCanvas();
  }

  testLevel() {
    sessionStorage.removeItem('testLevelWon');
    const level = this.exportLevel();
    sessionStorage.setItem('testLevel', JSON.stringify(level));
    // Save editor state so it survives the navigation away and back
    sessionStorage.setItem('editorSavedLevel', JSON.stringify(level));
    window.location.href = '/?test=1';
  }

  // ── Render loop ──────────────────────────────────────────────────────────────
  _loop() {
    let frame = 0;
    const eng = new GameEngine();

    const tick = () => {
      // Reload engine each frame with current tiles (cheap for editor)
      eng.loadLevel({ width: this.gridW, height: this.gridH, tiles: this.tiles });
      this.renderer.render(eng.getObjects(), [], 'playing', frame++);
      // Draw hover/selected tile indicator
      this._drawOverlay();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  _drawOverlay() {
    // Nothing for now — could add hover highlight here
  }
}
