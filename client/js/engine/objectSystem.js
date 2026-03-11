/**
 * Object System - Manages all game objects and their types
 */

export const ObjectTypes = {
  // Regular objects
  BABA: 'BABA',
  ROCK: 'ROCK',
  WALL: 'WALL',
  FLAG: 'FLAG',
  LAVA: 'LAVA',
  WATER: 'WATER',
  GRASS: 'GRASS',
  TREE: 'TREE',
  KEKE: 'KEKE',
  SKULL: 'SKULL',
  LOVE: 'LOVE',
  TILE: 'TILE',
  FENCE: 'FENCE',
};

export const TextTypes = {
  // Noun text blocks
  TEXT_BABA: { noun: 'BABA' },
  TEXT_ROCK: { noun: 'ROCK' },
  TEXT_WALL: { noun: 'WALL' },
  TEXT_FLAG: { noun: 'FLAG' },
  TEXT_LAVA: { noun: 'LAVA' },
  TEXT_WATER: { noun: 'WATER' },
  TEXT_KEKE: { noun: 'KEKE' },
  TEXT_SKULL: { noun: 'SKULL' },
  TEXT_LOVE: { noun: 'LOVE' },
  // Verb text blocks
  TEXT_IS: { verb: 'IS' },
  // Property text blocks
  TEXT_YOU: { property: 'YOU' },
  TEXT_WIN: { property: 'WIN' },
  TEXT_STOP: { property: 'STOP' },
  TEXT_PUSH: { property: 'PUSH' },
  TEXT_HOT: { property: 'HOT' },
  TEXT_MELT: { property: 'MELT' },
  TEXT_SINK: { property: 'SINK' },
  TEXT_DEFEAT: { property: 'DEFEAT' },
  TEXT_FLOAT: { property: 'FLOAT' },
  TEXT_OPEN: { property: 'OPEN' },
  TEXT_SHUT: { property: 'SHUT' },
  TEXT_MOVE: { property: 'MOVE' },
  TEXT_TELE: { property: 'TELE' },
};

let _nextId = 1;

export class GameObject {
  constructor(type, x, y, isText = false, textData = null) {
    this.id = _nextId++;
    this.type = type;          // Object type (BABA, ROCK, etc.)
    this.x = x;
    this.y = y;
    this.isText = isText;      // Is this a text block?
    this.textType = null;      // 'noun', 'verb', or 'property'
    this.textValue = null;     // The text value
    this.facing = 0;           // Direction: 0=right, 1=down, 2=left, 3=up

    if (isText && textData) {
      if (textData.noun) { this.textType = 'noun'; this.textValue = textData.noun; }
      else if (textData.verb) { this.textType = 'verb'; this.textValue = textData.verb; }
      else if (textData.property) { this.textType = 'property'; this.textValue = textData.property; }
    }
  }

  clone() {
    const obj = new GameObject(this.type, this.x, this.y, this.isText);
    obj.id = this.id;
    obj.textType = this.textType;
    obj.textValue = this.textValue;
    obj.facing = this.facing;
    return obj;
  }
}

export class ObjectSystem {
  constructor() {
    this.objects = new Map(); // id -> GameObject
    this.grid = new Map();    // "x,y" -> [objects]
  }

  add(obj) {
    this.objects.set(obj.id, obj);
    const key = `${obj.x},${obj.y}`;
    if (!this.grid.has(key)) this.grid.set(key, []);
    this.grid.get(key).push(obj);
    return obj;
  }

  remove(obj) {
    this.objects.delete(obj.id);
    const key = `${obj.x},${obj.y}`;
    const cell = this.grid.get(key);
    if (cell) {
      const idx = cell.indexOf(obj);
      if (idx !== -1) cell.splice(idx, 1);
      if (cell.length === 0) this.grid.delete(key);
    }
  }

  getAt(x, y) {
    return this.grid.get(`${x},${y}`) || [];
  }

  getAll() {
    return Array.from(this.objects.values());
  }

  getByType(type) {
    return this.getAll().filter(o => o.type === type);
  }

  move(obj, newX, newY) {
    this.remove(obj);
    obj.x = newX;
    obj.y = newY;
    this.add(obj);
  }

  /**
   * Build flat grid array for rule scanning
   */
  buildGrid(width, height) {
    const grid = new Array(width * height).fill(null).map(() => []);
    for (const obj of this.getAll()) {
      if (obj.x >= 0 && obj.x < width && obj.y >= 0 && obj.y < height) {
        grid[obj.y * width + obj.x].push(obj);
      }
    }
    return grid;
  }

  /**
   * Deep clone current state for undo
   */
  snapshot() {
    const objs = this.getAll().map(o => o.clone());
    return objs;
  }

  /**
   * Restore from snapshot
   */
  restore(snapshot) {
    this.objects.clear();
    this.grid.clear();
    for (const obj of snapshot) {
      this.add(obj);
    }
  }

  clear() {
    this.objects.clear();
    this.grid.clear();
  }
}
