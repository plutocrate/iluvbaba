/**
 * Renderer
 *
 * - tileSize, levelWidth, levelHeight, offsetX, offsetY set externally by main.js
 * - Text blocks: text auto-sized to fill the block, never overflow
 * - Game objects: clean, simple, readable shapes
 * - Rules HUD: top-left, crisp text
 */

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    // These are set directly by main.js after sizeCanvas()
    this.tileSize    = 48;
    this.levelWidth  = 13;
    this.levelHeight = 9;
    this.offsetX     = 0;
    this.offsetY     = 0;
  }

  render(objects, rules, state, frame) {
    const ctx = this.ctx;
    const { tileSize: T, levelWidth: W, levelHeight: H } = this;

    // Clear
    ctx.fillStyle = '#111114';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Grid background
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#14141a' : '#121218';
        ctx.fillRect(x * T, y * T, T, T);
      }
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x++) {
      ctx.beginPath(); ctx.moveTo(x * T, 0); ctx.lineTo(x * T, H * T); ctx.stroke();
    }
    for (let y = 0; y <= H; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * T); ctx.lineTo(W * T, y * T); ctx.stroke();
    }

    // Objects: non-text first, then text on top
    const sorted = [...objects].sort((a,b) => (a.isText?1:0)-(b.isText?1:0));
    for (const obj of sorted) this._drawObj(obj, frame, T);

    // Overlays
    if (state === 'won')  this._banner('YOU WIN!', '#f5a623', T, W, H);
    if (state === 'dead') this._banner('DEFEATED', '#e74c3c', T, W, H);

    // Rules HUD
  }

  _drawObj(obj, frame, T) {
    const ctx = this.ctx;
    // Center of this tile
    const cx = obj.x * T + T / 2;
    const cy = obj.y * T + T / 2;

    ctx.save();
    ctx.translate(cx, cy);

    if (obj.isText) {
      this._textBlock(obj, T);
    } else {
      // Subtle bob — max 2px
      const bob = Math.sin(frame * 0.035 + obj.id * 1.5) * Math.min(2, T * 0.04);
      ctx.translate(0, bob);
      this._gameObj(obj.type, T, frame, obj.id);
    }

    ctx.restore();
  }

  // ── Text block ────────────────────────────────────────────────────────────
  _textBlock(obj, T) {
    const ctx = this.ctx;
    const txt = obj.textValue || '?';
    const tt  = obj.textType;

    // Colors
    const BG   = tt === 'noun' ? '#0a1a36' : tt === 'verb' ? '#2a1800' : '#0a2210';
    const BD   = tt === 'noun' ? '#4c9fef' : tt === 'verb' ? '#f5a623' : '#2ecc71';
    const FG   = '#ffffff';

    // Block dimensions: leave 4px margin each side
    const m  = Math.max(2, T * 0.07);
    const bw = T - m * 2;
    const bh = T * 0.7 - m;

    // Background
    ctx.fillStyle = BG;
    ctx.fillRect(-bw/2, -bh/2, bw, bh);

    // Border (3px minimum, scales with tile)
    const bord = Math.max(2, T * 0.055);
    ctx.strokeStyle = BD;
    ctx.lineWidth = bord;
    ctx.strokeRect(-bw/2, -bh/2, bw, bh);

    // Text — find font size that fits inside block with padding
    const innerW = bw - bord * 2 - 4;
    const innerH = bh - bord * 2 - 2;

    // Binary-search best font size
    let fontSize = Math.floor(innerH * 0.85);
    fontSize = Math.max(8, Math.min(fontSize, T * 0.5));

    ctx.font = `700 ${fontSize}px 'Space Mono', monospace`;
    // Scale down if text overflows width
    let tw = ctx.measureText(txt).width;
    while (tw > innerW && fontSize > 7) {
      fontSize -= 1;
      ctx.font = `700 ${fontSize}px 'Space Mono', monospace`;
      tw = ctx.measureText(txt).width;
    }

    ctx.fillStyle = FG;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, 0, 0);
  }

  // ── Game objects ─────────────────────────────────────────────────────────
  _gameObj(type, T, frame, id) {
    const ctx = this.ctx;
    // Inner radius — 38% of tile for a clear margin
    const r = T * 0.38;

    switch(type) {

      case 'BABA': {
        // Cream circle body
        ctx.fillStyle = '#e8dfd0';
        ctx.strokeStyle = '#a89070';
        ctx.lineWidth = Math.max(1.5, T*0.035);
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        // Ears
        const er = r * 0.22;
        const ex = r * 0.55, ey = r * 0.72;
        ctx.fillStyle = '#e8dfd0';
        ctx.beginPath(); ctx.arc(-ex, -ey, er, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc( ex, -ey, er, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        // Eyes
        ctx.fillStyle = '#1a1010'; ctx.strokeStyle = 'none';
        ctx.beginPath(); ctx.arc(-r*0.28, -r*0.1, r*0.13, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc( r*0.28, -r*0.1, r*0.13, 0, Math.PI*2); ctx.fill();
        // Eye shine
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-r*0.22, -r*0.17, r*0.05, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc( r*0.34, -r*0.17, r*0.05, 0, Math.PI*2); ctx.fill();
        // Nose
        ctx.fillStyle = '#cc8080';
        ctx.beginPath(); ctx.arc(0, r*0.1, r*0.08, 0, Math.PI*2); ctx.fill();
        break;
      }

      case 'ROCK': {
        ctx.fillStyle = '#7a6e5e';
        ctx.strokeStyle = '#4e4030';
        ctx.lineWidth = Math.max(1.5, T*0.035);
        // Irregular polygon
        ctx.beginPath();
        const rp = [[-r*.65,-r*.88],[r*.05,-r*.92],[r*.88,-r*.5],[r*.96,.18],[r*.5,r*.82],[-r*.28,r*.92],[-r*.88,r*.38],[-r*.95,-.28]];
        ctx.moveTo(rp[0][0], rp[0][1]);
        for(let i=1;i<rp.length;i++) ctx.lineTo(rp[i][0],rp[i][1]);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(-r*.2,-r*.5); ctx.lineTo(r*.3,-r*.1); ctx.stroke();
        break;
      }

      case 'WALL': {
        const ww = T*0.78, wh = T*0.52;
        ctx.fillStyle = '#3d4b5c';
        ctx.strokeStyle = '#2a3545';
        ctx.lineWidth = Math.max(1.5, T*0.035);
        ctx.fillRect(-ww/2,-wh/2,ww,wh); ctx.strokeRect(-ww/2,-wh/2,ww,wh);
        // Brick mortar
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(-ww/2,0); ctx.lineTo(ww/2,0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-ww/4,-wh/2); ctx.lineTo(-ww/4,0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ww/4,0); ctx.lineTo(ww/4,wh/2); ctx.stroke();
        break;
      }

      case 'FLAG': {
        // Pole
        ctx.strokeStyle = 'rgba(200,200,200,0.5)';
        ctx.lineWidth = Math.max(2, T*0.04);
        ctx.beginPath(); ctx.moveTo(-r*.1,-r); ctx.lineTo(-r*.1,r); ctx.stroke();
        // Flag triangle (slight wave)
        const wave = Math.sin(frame*0.08+id)*r*0.08;
        ctx.fillStyle = '#f5a623';
        ctx.strokeStyle = '#cc7700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-r*.1, -r);
        ctx.lineTo(r*.88, -r*.35+wave);
        ctx.lineTo(-r*.1, r*.2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      }

      case 'LAVA': {
        ctx.fillStyle = '#cc3300';
        ctx.strokeStyle = '#991100';
        ctx.lineWidth = Math.max(1.5, T*0.035);
        const lv=[[-r,.25],[-r*.5,-r*.6],[-.1,0],[0,-r],[r*.35,-.2],[r*.78,-.68],[r,.1],[r*.4,r*.88],[-r*.5,r*.88]];
        ctx.beginPath(); ctx.moveTo(lv[0][0],lv[0][1]);
        for(let i=1;i<lv.length;i++) ctx.lineTo(lv[i][0],lv[i][1]);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // Inner hot spot
        ctx.fillStyle = 'rgba(255,100,0,0.35)';
        ctx.beginPath(); ctx.arc(0,-r*.2,r*.4,0,Math.PI*2); ctx.fill();
        break;
      }

      case 'WATER': {
        ctx.fillStyle = '#1a6eb5';
        ctx.strokeStyle = '#1050a0';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(0,r*.2,r,r*.55,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle='rgba(180,220,255,0.4)'; ctx.lineWidth=1.5;
        const wv=Math.sin(frame*.06+id)*2;
        ctx.beginPath(); ctx.moveTo(-r*.65,r*.1+wv); ctx.bezierCurveTo(-r*.3,r*.1-3+wv,r*.3,r*.1+3-wv,r*.65,r*.1-wv); ctx.stroke();
        break;
      }

      case 'KEKE': {
        ctx.fillStyle = '#d45c00'; ctx.strokeStyle = '#a04400';
        ctx.lineWidth = Math.max(1.5, T*0.035);
        ctx.beginPath();
        for(let i=0;i<8;i++){
          const a=(i/8)*Math.PI*2;
          const sr=i%2===0?r*1.1:r*0.65;
          if(i===0)ctx.moveTo(Math.cos(a)*sr,Math.sin(a)*sr);
          else ctx.lineTo(Math.cos(a)*sr,Math.sin(a)*sr);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#111';
        ctx.beginPath(); ctx.arc(-r*.25,-.15*r,r*.11,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc( r*.25,-.15*r,r*.11,0,Math.PI*2); ctx.fill();
        break;
      }

      case 'SKULL': {
        ctx.fillStyle='#d8e4ec'; ctx.strokeStyle='#aabcc8'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(0,-r*.15,r*.72,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillRect(-r*.4,-r*.1,r*.8,r*.6);
        ctx.fillStyle='#1a1a1a';
        ctx.beginPath(); ctx.arc(-r*.25,-r*.25,r*.16,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc( r*.25,-r*.25,r*.16,0,Math.PI*2); ctx.fill();
        [-r*.28,0,r*.28].forEach(tx=>{ ctx.fillRect(tx-r*.09,r*.2,r*.17,r*.2); });
        break;
      }

      case 'LOVE': {
        ctx.fillStyle='#cc2255'; ctx.strokeStyle='#991144'; ctx.lineWidth=1.5;
        ctx.beginPath();
        ctx.moveTo(0,r*.35);
        ctx.bezierCurveTo(-r*.1,r*.62,-r,r*.62,-r,0);
        ctx.bezierCurveTo(-r,-r*.44,-r*.5,-r*.82,0,-r*.4);
        ctx.bezierCurveTo(r*.5,-r*.82,r,-r*.44,r,0);
        ctx.bezierCurveTo(r,r*.62,r*.1,r*.62,0,r*.35);
        ctx.fill(); ctx.stroke();
        break;
      }

      default: {
        ctx.fillStyle = '#667788'; ctx.strokeStyle = '#445566'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = `700 ${Math.floor(r*0.9)}px monospace`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(type[0], 0, 1);
      }
    }
  }

  // ── Rules HUD ─────────────────────────────────────────────────────────────
  _rulesHUD(rules, T) {
    if (!rules?.length) return;
    const ctx = this.ctx;

    const lines  = Math.min(rules.length, 8);
    const lh     = Math.max(14, T * 0.28);
    const fs     = Math.max(9, Math.floor(lh * 0.65));
    const padX   = 12, padY = 8;
    const colW   = fs * 5;
    const pw     = padX * 2 + colW * 3 + 4;
    const ph     = padY * 2 + 14 + lines * lh + (rules.length > 8 ? lh : 0);

    // Panel
    ctx.fillStyle = 'rgba(17,17,20,0.92)';
    ctx.fillRect(8, 8, pw, ph);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, pw, ph);
    // Amber accent top
    ctx.fillStyle = '#f5a623';
    ctx.fillRect(8, 8, pw, 3);

    // Header
    ctx.font = `700 ${Math.max(9,fs-1)}px 'Space Mono', monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'left';
    ctx.fillText('ACTIVE RULES', 8 + padX, 8 + padY + 10);

    // Rules
    ctx.font = `700 ${fs}px 'Space Mono', monospace`;
    for (let i = 0; i < lines; i++) {
      const rule = rules[i];
      const y = 8 + padY + 14 + 4 + (i + 1) * lh;
      ctx.fillStyle = '#4c9fef'; ctx.fillText(rule.subject,            8 + padX,            y);
      ctx.fillStyle = '#f5a623'; ctx.fillText(rule.verb,               8 + padX + colW,     y);
      ctx.fillStyle = rule.type === 'property' ? '#2ecc71' : '#4c9fef';
                                 ctx.fillText(rule.object,             8 + padX + colW * 2, y);
    }
    if (rules.length > 8) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText(`+${rules.length-8} more`, 8+padX, 8+padY+14+4+(lines+1)*lh);
    }
  }

  // ── Win/dead banner ────────────────────────────────────────────────────────
  _banner(text, color, T, W, H) {
    const ctx = this.ctx;
    const cx = (W * T) / 2, cy = (H * T) / 2;
    const bh = Math.max(60, T * 1.2);
    const fs = Math.max(24, bh * 0.45);

    ctx.fillStyle = 'rgba(17,17,20,0.9)';
    ctx.fillRect(cx - 180, cy - bh/2, 360, bh);
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.strokeRect(cx - 180, cy - bh/2, 360, bh);
    ctx.fillStyle = color; ctx.fillRect(cx - 180, cy - bh/2, 360, 4);

    ctx.fillStyle = color;
    ctx.font = `900 ${fs}px 'Outfit', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy + 2);
  }

  // ── Editor support ─────────────────────────────────────────────────────────
  screenToGrid(sx, sy) {
    return {
      x: Math.floor(sx / this.tileSize),
      y: Math.floor(sy / this.tileSize),
    };
  }
}
