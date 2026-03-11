/**
 * Game Engine - Main orchestrator
 */

import { RuleEngine } from './ruleEngine.js';
import { ObjectSystem, GameObject } from './objectSystem.js';
import { MovementSystem } from './movementSystem.js';

export class GameEngine {
  constructor() {
    this.ruleEngine = new RuleEngine();
    this.objectSystem = new ObjectSystem();
    this.movementSystem = new MovementSystem(this.objectSystem, this.ruleEngine);

    this.width = 12;
    this.height = 12;
    this.undoStack = [];
    this.maxUndo = 100;

    this.state = 'playing'; // 'playing', 'won', 'dead'
    this.onStateChange = null;
    this.moveCount = 0;
  }

  loadLevel(levelData) {
    this.objectSystem.clear();
    this.ruleEngine.markDirty();
    this.undoStack = [];
    this.state = 'playing';
    this.moveCount = 0;

    this.width = levelData.width || 12;
    this.height = levelData.height || 12;
    this.movementSystem.setDimensions(this.width, this.height);
    this.currentLevel = levelData;

    // Place objects from level data
    for (const tile of levelData.tiles) {
      const obj = createObjectFromTile(tile);
      if (obj) this.objectSystem.add(obj);
    }

    // Initial rule parse
    const grid = this.objectSystem.buildGrid(this.width, this.height);
    this.ruleEngine.parseRules(grid, this.width, this.height);

    return true;
  }

  move(dx, dy) {
    if (this.state !== 'playing') return;

    // Save undo state
    this._pushUndo();

    this.ruleEngine.markDirty();
    const result = this.movementSystem.executeMove(dx, dy);
    this.moveCount++;

    if (result.won) {
      this.state = 'won';
      if (this.onStateChange) this.onStateChange('won');
    } else if (result.dead) {
      this.state = 'dead';
      if (this.onStateChange) this.onStateChange('dead');
    }

    // Re-parse rules after move
    const grid = this.objectSystem.buildGrid(this.width, this.height);
    this.ruleEngine.parseRules(grid, this.width, this.height);

    return result;
  }

  undo() {
    if (this.undoStack.length === 0) return false;
    const snapshot = this.undoStack.pop();
    this.objectSystem.restore(snapshot);
    this.state = 'playing';
    this.ruleEngine.markDirty();
    const grid = this.objectSystem.buildGrid(this.width, this.height);
    this.ruleEngine.parseRules(grid, this.width, this.height);
    this.moveCount = Math.max(0, this.moveCount - 1);
    return true;
  }

  restart() {
    if (this.currentLevel) {
      this.loadLevel(this.currentLevel);
    }
  }

  _pushUndo() {
    const snapshot = this.objectSystem.snapshot();
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxUndo) {
      this.undoStack.shift();
    }
  }

  getObjects() {
    return this.objectSystem.getAll();
  }

  getActiveRules() {
    return this.ruleEngine.getAllRules();
  }

  getRuleEngine() {
    return this.ruleEngine;
  }

  serialize() {
    const tiles = this.objectSystem.getAll().map(obj => ({
      type: obj.type,
      x: obj.x,
      y: obj.y,
      isText: obj.isText,
      textType: obj.textType,
      textValue: obj.textValue,
    }));
    return {
      width: this.width,
      height: this.height,
      tiles,
    };
  }
}

export function createObjectFromTile(tile) {
  const obj = new GameObject(
    tile.type,
    tile.x,
    tile.y,
    tile.isText || false,
    tile.isText ? { [tile.textType]: tile.textValue } : null
  );
  return obj;
}
