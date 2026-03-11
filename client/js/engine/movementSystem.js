/**
 * Movement System - Handles movement, pushing, collisions
 *
 * KEY RULES:
 * - Rules are re-parsed FRESH before every check
 * - Transformations apply AFTER win/defeat checks (so BABA IS FLAG + FLAG IS WIN works)
 * - No invisible walls — bounds = grid edges only, player can move to edge tiles freely
 * - YOU objects occupy positions; "at edge" means the grid boundary stops them
 */

export class MovementSystem {
  constructor(objectSystem, ruleEngine) {
    this.objects = objectSystem;
    this.rules = ruleEngine;
    this.width = 0;
    this.height = 0;
  }

  setDimensions(width, height) {
    this.width = width;
    this.height = height;
  }

  /**
   * Attempt to move an object in a direction.
   * Objects can move all the way to the grid edge (x=0, x=width-1, etc.)
   * Returns true if movement succeeded, false if blocked.
   */
  tryMove(obj, dx, dy) {
    const newX = obj.x + dx;
    const newY = obj.y + dy;

    // Bounds: object would leave grid entirely — block
    if (newX < 0 || newX >= this.width || newY < 0 || newY >= this.height) {
      return false;
    }

    const occupants = this.objects.getAt(newX, newY).slice(); // copy to avoid mutation issues

    // Collect what needs to be pushed
    const pushable = [];
    for (const occ of occupants) {
      if (occ === obj) continue;
      const isStop = this._hasProp(occ, 'STOP');
      const isPush = this._hasProp(occ, 'PUSH') || occ.isText;

      if (isStop && !isPush) {
        // Hard blocker — cannot enter this cell
        return false;
      }
      if (isPush) {
        pushable.push(occ);
      }
    }

    // Try to push all pushable objects first (order matters for chains)
    for (const p of pushable) {
      if (!this.tryMove(p, dx, dy)) {
        return false; // Push chain blocked
      }
    }

    // Move this object
    this.objects.move(obj, newX, newY);
    return true;
  }

  /**
   * Execute one full turn: move all YOU objects, then evaluate rules.
   * Order: move → re-parse → check HOT/MELT/SINK → check WIN → check DEFEAT → transform
   */
  executeMove(dx, dy) {
    // Parse rules at start of turn (before movement)
    this.rules.markDirty();
    const grid = this.objects.buildGrid(this.width, this.height);
    this.rules.parseRules(grid, this.width, this.height);

    const youTypes = this.rules.getTypesWithProperty('YOU');
    const youObjects = [];
    for (const type of youTypes) {
      youObjects.push(...this.objects.getByType(type));
    }

    if (youObjects.length === 0) return { moved: false, won: false, dead: false };

    // Move all YOU objects
    let anyMoved = false;
    for (const obj of youObjects) {
      if (this.tryMove(obj, dx, dy)) {
        anyMoved = true;
        if (dx === 1) obj.facing = 0;
        else if (dy === 1) obj.facing = 1;
        else if (dx === -1) obj.facing = 2;
        else if (dy === -1) obj.facing = 3;
      }
    }

    // Re-parse rules after movement (text blocks may have moved)
    this.rules.markDirty();
    const grid2 = this.objects.buildGrid(this.width, this.height);
    this.rules.parseRules(grid2, this.width, this.height);

    const result = this._checkConditions();
    result.moved = anyMoved;
    return result;
  }

  _checkConditions() {
    // Rules are already fresh from executeMove re-parse
    let won = false;
    let dead = false;

    const youTypes = this.rules.getTypesWithProperty('YOU');
    const winTypes = this.rules.getTypesWithProperty('WIN');
    const defeatTypes = this.rules.getTypesWithProperty('DEFEAT');
    const hotTypes = this.rules.getTypesWithProperty('HOT');
    const meltTypes = this.rules.getTypesWithProperty('MELT');
    const sinkTypes = this.rules.getTypesWithProperty('SINK');

    const toDestroy = new Set();

    // === HOT destroys MELT (before win/defeat checks) ===
    for (const hotType of hotTypes) {
      for (const hotObj of this.objects.getByType(hotType)) {
        for (const other of this.objects.getAt(hotObj.x, hotObj.y)) {
          if (other.id !== hotObj.id && meltTypes.includes(other.type)) {
            toDestroy.add(other.id);
          }
        }
      }
    }

    // === SINK destroys both itself and whatever shares the cell ===
    for (const sinkType of sinkTypes) {
      for (const sinkObj of this.objects.getByType(sinkType)) {
        const cell = this.objects.getAt(sinkObj.x, sinkObj.y);
        if (cell.length > 1) {
          for (const obj of cell) toDestroy.add(obj.id);
        }
      }
    }

    // === WIN check: any YOU occupies same cell as any WIN ===
    // Important: check BEFORE applying transformations
    for (const youType of youTypes) {
      for (const youObj of this.objects.getByType(youType)) {
        if (toDestroy.has(youObj.id)) continue; // already dead
        for (const other of this.objects.getAt(youObj.x, youObj.y)) {
          if (other.id !== youObj.id && winTypes.includes(other.type)) {
            won = true;
          }
        }
      }
    }

    // Also check: if YOU is WIN (BABA IS WIN), winning by existing
    for (const youType of youTypes) {
      if (winTypes.includes(youType)) {
        if (this.objects.getByType(youType).length > 0) {
          won = true;
        }
      }
    }

    // === DEFEAT: YOU touches DEFEAT ===
    for (const youType of youTypes) {
      for (const youObj of this.objects.getByType(youType)) {
        if (toDestroy.has(youObj.id)) continue;
        for (const other of this.objects.getAt(youObj.x, youObj.y)) {
          if (other.id !== youObj.id && defeatTypes.includes(other.type)) {
            toDestroy.add(youObj.id);
          }
        }
      }
    }

    // === Execute destructions ===
    const allObjs = this.objects.getAll();
    for (const obj of allObjs) {
      if (toDestroy.has(obj.id)) {
        if (youTypes.includes(obj.type)) dead = true;
        this.objects.remove(obj);
      }
    }

    // === Check if any YOU types still exist ===
    let hasYou = false;
    for (const youType of youTypes) {
      if (this.objects.getByType(youType).length > 0) {
        hasYou = true;
        break;
      }
    }
    if (youTypes.length > 0 && !hasYou) dead = true;

    // === Apply transformations LAST ===
    // e.g. BABA IS FLAG means all BABAs become FLAGs
    // This happens after win/defeat so "BABA IS FLAG + FLAG IS WIN" works:
    // move into FLAG → win check (BABA touches FLAG=WIN) → then transform
    this._applyTransformations();

    return { won, dead };
  }

  _applyTransformations() {
    const allObjects = this.objects.getAll().filter(o => !o.isText);
    let changed = false;
    for (const obj of allObjects) {
      const target = this.rules.getTransformation(obj.type);
      if (target && target !== obj.type) {
        obj.type = target;
        changed = true;
      }
    }
    if (changed) this.rules.markDirty();
  }

  _hasProp(obj, property) {
    if (obj.isText) return false;
    return this.rules.hasProperty(obj.type, property);
  }
}
