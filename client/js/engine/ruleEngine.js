/**
 * Rule Engine - Core of Baba Is You mechanics
 * Parses text blocks on the grid and applies rules dynamically
 */

export class RuleEngine {
  constructor() {
    this.activeRules = [];
    this.ruleCache = new Map();
    this.dirty = true;
  }

  /**
   * Parse all rules from current grid state
   * Scans horizontally and vertically for NOUN VERB NOUN/PROPERTY patterns
   */
  parseRules(grid, width, height) {
    if (!this.dirty) return this.activeRules;

    this.activeRules = [];
    this.ruleCache.clear();

    // Scan horizontal rules
    for (let y = 0; y < height; y++) {
      for (let x = 0; x <= width - 3; x++) {
        const rule = this._tryParseRule(grid, x, y, 1, 0, width, height);
        if (rule) this.activeRules.push(rule);
      }
    }

    // Scan vertical rules
    for (let x = 0; x < width; x++) {
      for (let y = 0; y <= height - 3; y++) {
        const rule = this._tryParseRule(grid, x, y, 0, 1, width, height);
        if (rule) this.activeRules.push(rule);
      }
    }

    // Build cache for fast lookup
    for (const rule of this.activeRules) {
      const key = `${rule.subject}:${rule.verb}`;
      if (!this.ruleCache.has(key)) this.ruleCache.set(key, []);
      this.ruleCache.get(key).push(rule.object);
    }

    this.dirty = false;
    return this.activeRules;
  }

  _tryParseRule(grid, x, y, dx, dy, width, height) {
    const cell1 = this._getTextAt(grid, x, y, width);
    if (!cell1 || cell1.textType !== 'noun') return null;

    const x2 = x + dx, y2 = y + dy;
    if (x2 >= width || y2 >= height) return null;
    const cell2 = this._getTextAt(grid, x2, y2, width);
    if (!cell2 || cell2.textType !== 'verb') return null;

    const x3 = x + dx * 2, y3 = y + dy * 2;
    if (x3 >= width || y3 >= height) return null;
    const cell3 = this._getTextAt(grid, x3, y3, width);
    if (!cell3 || (cell3.textType !== 'noun' && cell3.textType !== 'property')) return null;

    return {
      subject: cell1.textValue,
      verb: cell2.textValue,
      object: cell3.textValue,
      type: cell3.textType,
      x, y, dx, dy
    };
  }

  _getTextAt(grid, x, y, width) {
    const idx = y * width + x;
    const cell = grid[idx];
    if (!cell) return null;
    // Look for text objects in this cell
    for (const obj of cell) {
      if (obj.isText) return obj;
    }
    return null;
  }

  /**
   * Check if a specific type has a property
   */
  hasProperty(objectType, property) {
    const key = `${objectType}:IS`;
    const props = this.ruleCache.get(key) || [];
    return props.includes(property);
  }

  /**
   * Get all types that have a specific property
   */
  getTypesWithProperty(property) {
    const types = [];
    for (const [key, values] of this.ruleCache) {
      if (key.endsWith(':IS') && values.includes(property)) {
        types.push(key.replace(':IS', ''));
      }
    }
    return types;
  }

  /**
   * Get transformation target for a type (IS NOUN)
   */
  getTransformation(objectType) {
    const key = `${objectType}:IS`;
    const targets = this.ruleCache.get(key) || [];
    // Return first noun transformation
    for (const target of targets) {
      if (this._isNoun(target)) return target;
    }
    return null;
  }

  _isNoun(value) {
    const nouns = ['BABA','ROCK','WALL','FLAG','LAVA','WATER','GRASS','TREE',
                   'KEKE','ME','SKULL','CRAB','FISH','LOVE','TILE','FENCE'];
    return nouns.includes(value);
  }

  markDirty() {
    this.dirty = true;
  }

  getAllRules() {
    return this.activeRules;
  }
}
