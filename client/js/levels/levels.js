/**
 * 10 Handcrafted Levels
 *
 * Design rules:
 * - BABA IS YOU rule is always placed top-left, away from other text chains
 * - Text blocks are separated enough that accidental alignment is impossible
 * - Each level introduces one new mechanic
 */

export const LEVELS = [

  // ──────────────────────────────────────────────
  // Level 1: Walk to the flag
  // Teaches: movement, win condition
  // ──────────────────────────────────────────────
  {
    id: 1,
    title: "First Steps",
    description: "Move to the flag to win.",
    width: 13,
    height: 9,
    tiles: [
      // BABA IS YOU (top-left, horizontal)
      { type:'TEXT_BABA', x:1,  y:1, isText:true, textType:'noun',     textValue:'BABA' },
      { type:'TEXT_IS',   x:2,  y:1, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_YOU',  x:3,  y:1, isText:true, textType:'property', textValue:'YOU'  },
      // FLAG IS WIN (bottom-right, horizontal, far from BABA IS YOU)
      { type:'TEXT_FLAG', x:9,  y:7, isText:true, textType:'noun',     textValue:'FLAG' },
      { type:'TEXT_IS',   x:10, y:7, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_WIN',  x:11, y:7, isText:true, textType:'property', textValue:'WIN'  },
      // Objects
      { type:'BABA', x:2, y:5, isText:false },
      { type:'FLAG', x:11, y:4, isText:false },
    ]
  },

  // ──────────────────────────────────────────────
  // Level 2: Push rocks
  // Teaches: PUSH, obstacle clearing
  // ──────────────────────────────────────────────
  {
    id: 2,
    title: "Rock Pusher",
    description: "Push the rocks out of the way.",
    width: 13,
    height: 9,
    tiles: [
      { type:'TEXT_BABA', x:1,  y:1, isText:true, textType:'noun',     textValue:'BABA' },
      { type:'TEXT_IS',   x:2,  y:1, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_YOU',  x:3,  y:1, isText:true, textType:'property', textValue:'YOU'  },
      { type:'TEXT_FLAG', x:1,  y:7, isText:true, textType:'noun',     textValue:'FLAG' },
      { type:'TEXT_IS',   x:2,  y:7, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_WIN',  x:3,  y:7, isText:true, textType:'property', textValue:'WIN'  },
      { type:'TEXT_ROCK', x:9,  y:1, isText:true, textType:'noun',     textValue:'ROCK' },
      { type:'TEXT_IS',   x:10, y:1, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_PUSH', x:11, y:1, isText:true, textType:'property', textValue:'PUSH' },
      { type:'BABA', x:1, y:4, isText:false },
      { type:'ROCK', x:5, y:4, isText:false },
      { type:'ROCK', x:6, y:4, isText:false },
      { type:'ROCK', x:7, y:4, isText:false },
      { type:'FLAG', x:11, y:4, isText:false },
    ]
  },

  // ──────────────────────────────────────────────
  // Level 3: Wall is STOP
  // Teaches: STOP property, navigation around obstacles
  // ──────────────────────────────────────────────
  {
    id: 3,
    title: "The Wall",
    description: "Find a way around.",
    width: 13,
    height: 9,
    tiles: [
      { type:'TEXT_BABA', x:1,  y:1, isText:true, textType:'noun',     textValue:'BABA' },
      { type:'TEXT_IS',   x:2,  y:1, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_YOU',  x:3,  y:1, isText:true, textType:'property', textValue:'YOU'  },
      { type:'TEXT_FLAG', x:9,  y:7, isText:true, textType:'noun',     textValue:'FLAG' },
      { type:'TEXT_IS',   x:10, y:7, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_WIN',  x:11, y:7, isText:true, textType:'property', textValue:'WIN'  },
      { type:'TEXT_WALL', x:1,  y:7, isText:true, textType:'noun',     textValue:'WALL' },
      { type:'TEXT_IS',   x:2,  y:7, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_STOP', x:3,  y:7, isText:true, textType:'property', textValue:'STOP' },
      { type:'BABA', x:2, y:4, isText:false },
      // Wall column down the middle — go around top or bottom
      { type:'WALL', x:6, y:2, isText:false },
      { type:'WALL', x:6, y:3, isText:false },
      { type:'WALL', x:6, y:4, isText:false },
      { type:'WALL', x:6, y:5, isText:false },
      { type:'WALL', x:6, y:6, isText:false },
      { type:'FLAG', x:11, y:4, isText:false },
    ]
  },

  // ──────────────────────────────────────────────
  // Level 4: Lava is HOT, Baba is MELT
  // Teaches: HOT/MELT destruction — avoid lava
  // ──────────────────────────────────────────────
  {
    id: 4,
    title: "Hot Stuff",
    description: "Don't touch the lava — you'll melt.",
    width: 13,
    height: 9,
    tiles: [
      { type:'TEXT_BABA', x:1,  y:1, isText:true, textType:'noun',     textValue:'BABA' },
      { type:'TEXT_IS',   x:2,  y:1, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_YOU',  x:3,  y:1, isText:true, textType:'property', textValue:'YOU'  },
      // BABA IS MELT (separate row, vertical to avoid merging with IS YOU)
      { type:'TEXT_BABA', x:1,  y:3, isText:true, textType:'noun',     textValue:'BABA' },
      { type:'TEXT_IS',   x:1,  y:4, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_MELT', x:1,  y:5, isText:true, textType:'property', textValue:'MELT' },
      // LAVA IS HOT
      { type:'TEXT_LAVA', x:9,  y:1, isText:true, textType:'noun',     textValue:'LAVA' },
      { type:'TEXT_IS',   x:10, y:1, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_HOT',  x:11, y:1, isText:true, textType:'property', textValue:'HOT'  },
      // FLAG IS WIN
      { type:'TEXT_FLAG', x:9,  y:7, isText:true, textType:'noun',     textValue:'FLAG' },
      { type:'TEXT_IS',   x:10, y:7, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_WIN',  x:11, y:7, isText:true, textType:'property', textValue:'WIN'  },
      { type:'BABA', x:3, y:5, isText:false },
      // Lava barrier with a gap (top row only, bottom is open)
      { type:'LAVA', x:6, y:2, isText:false },
      { type:'LAVA', x:6, y:3, isText:false },
      { type:'LAVA', x:6, y:4, isText:false },
      // gap at y:5 and y:6
      { type:'FLAG', x:11, y:4, isText:false },
    ]
  },

  // ──────────────────────────────────────────────
  // Level 5: Assemble FLAG IS WIN by pushing text
  // Teaches: rule construction
  // ──────────────────────────────────────────────
  {
    id: 5,
    title: "Make the Rule",
    description: "Push FLAG next to IS WIN to create the winning rule.",
    width: 13,
    height: 9,
    tiles: [
      { type:'TEXT_BABA', x:1,  y:1, isText:true, textType:'noun',     textValue:'BABA' },
      { type:'TEXT_IS',   x:2,  y:1, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_YOU',  x:3,  y:1, isText:true, textType:'property', textValue:'YOU'  },
      // IS WIN already placed — player must push FLAG text to x=3,y=4
      { type:'TEXT_IS',   x:4,  y:4, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_WIN',  x:5,  y:4, isText:true, textType:'property', textValue:'WIN'  },
      // FLAG text is far left — needs pushing right
      { type:'TEXT_FLAG', x:1,  y:4, isText:true, textType:'noun',     textValue:'FLAG' },
      // ROCK IS PUSH (so rocks are useful obstacles)
      { type:'TEXT_ROCK', x:9,  y:1, isText:true, textType:'noun',     textValue:'ROCK' },
      { type:'TEXT_IS',   x:10, y:1, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_PUSH', x:11, y:1, isText:true, textType:'property', textValue:'PUSH' },
      { type:'BABA', x:1, y:6, isText:false },
      { type:'FLAG', x:10, y:5, isText:false },
      // Rocks as scenery
      { type:'ROCK', x:7, y:3, isText:false },
      { type:'ROCK', x:7, y:5, isText:false },
    ]
  },

  // ──────────────────────────────────────────────
  // Level 6: ROCK IS BABA transformation
  // Teaches: NOUN IS NOUN transformation
  // ──────────────────────────────────────────────
  {
    id: 6,
    title: "Identity Crisis",
    description: "Transform the rock into Baba to reach the flag.",
    width: 13,
    height: 9,
    tiles: [
      { type:'TEXT_BABA', x:1,  y:1, isText:true, textType:'noun',     textValue:'BABA' },
      { type:'TEXT_IS',   x:2,  y:1, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_YOU',  x:3,  y:1, isText:true, textType:'property', textValue:'YOU'  },
      { type:'TEXT_FLAG', x:9,  y:1, isText:true, textType:'noun',     textValue:'FLAG' },
      { type:'TEXT_IS',   x:10, y:1, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_WIN',  x:11, y:1, isText:true, textType:'property', textValue:'WIN'  },
      // ROCK IS BABA rule — player pushes BABA text down to complete it
      { type:'TEXT_ROCK', x:5,  y:4, isText:true, textType:'noun',     textValue:'ROCK' },
      { type:'TEXT_IS',   x:6,  y:4, isText:true, textType:'verb',     textValue:'IS'   },
      // BABA property text is separated below — needs pushing up to y:4
      { type:'TEXT_BABA', x:7,  y:6, isText:true, textType:'noun',     textValue:'BABA' },
      { type:'BABA', x:2, y:4, isText:false },
      // Rock is on the right side of the wall
      { type:'ROCK', x:10, y:4, isText:false },
      { type:'FLAG', x:11, y:6, isText:false },
      // Wall between BABA and FLAG
      { type:'WALL', x:8,  y:3, isText:false },
      { type:'WALL', x:8,  y:4, isText:false },
      { type:'WALL', x:8,  y:5, isText:false },
      { type:'WALL', x:8,  y:6, isText:false },
      { type:'TEXT_WALL', x:1, y:7, isText:true, textType:'noun', textValue:'WALL' },
      { type:'TEXT_IS',   x:2, y:7, isText:true, textType:'verb', textValue:'IS'   },
      { type:'TEXT_STOP', x:3, y:7, isText:true, textType:'property', textValue:'STOP'},
    ]
  },

  // ──────────────────────────────────────────────
  // Level 7: Chain pushing
  // Teaches: push chains, timing
  // ──────────────────────────────────────────────
  {
    id: 7,
    title: "Chain Gang",
    description: "Push the chain of rocks into position.",
    width: 14,
    height: 9,
    tiles: [
      { type:'TEXT_BABA', x:1,  y:1, isText:true, textType:'noun',     textValue:'BABA' },
      { type:'TEXT_IS',   x:2,  y:1, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_YOU',  x:3,  y:1, isText:true, textType:'property', textValue:'YOU'  },
      { type:'TEXT_FLAG', x:1,  y:7, isText:true, textType:'noun',     textValue:'FLAG' },
      { type:'TEXT_IS',   x:2,  y:7, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_WIN',  x:3,  y:7, isText:true, textType:'property', textValue:'WIN'  },
      { type:'TEXT_ROCK', x:10, y:1, isText:true, textType:'noun',     textValue:'ROCK' },
      { type:'TEXT_IS',   x:11, y:1, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_PUSH', x:12, y:1, isText:true, textType:'property', textValue:'PUSH' },
      { type:'BABA', x:1, y:4, isText:false },
      { type:'ROCK', x:4, y:4, isText:false },
      { type:'ROCK', x:5, y:4, isText:false },
      { type:'ROCK', x:6, y:4, isText:false },
      { type:'ROCK', x:7, y:4, isText:false },
      { type:'ROCK', x:8, y:4, isText:false },
      { type:'FLAG', x:12, y:4, isText:false },
    ]
  },

  // ──────────────────────────────────────────────
  // Level 8: Destroy WALL IS STOP by pushing text
  // Teaches: rule destruction
  // ──────────────────────────────────────────────
  {
    id: 8,
    title: "Rule Breaker",
    description: "Destroy the rule blocking your way.",
    width: 13,
    height: 9,
    tiles: [
      { type:'TEXT_BABA', x:1,  y:1, isText:true, textType:'noun',     textValue:'BABA' },
      { type:'TEXT_IS',   x:2,  y:1, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_YOU',  x:3,  y:1, isText:true, textType:'property', textValue:'YOU'  },
      { type:'TEXT_FLAG', x:9,  y:7, isText:true, textType:'noun',     textValue:'FLAG' },
      { type:'TEXT_IS',   x:10, y:7, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_WIN',  x:11, y:7, isText:true, textType:'property', textValue:'WIN'  },
      // WALL IS STOP — push the STOP text away to break the rule
      { type:'TEXT_WALL', x:6, y:3, isText:true, textType:'noun',     textValue:'WALL' },
      { type:'TEXT_IS',   x:7, y:3, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_STOP', x:8, y:3, isText:true, textType:'property', textValue:'STOP' },
      { type:'BABA', x:2, y:4, isText:false },
      // Wall column
      { type:'WALL', x:6, y:4, isText:false },
      { type:'WALL', x:6, y:5, isText:false },
      { type:'WALL', x:6, y:6, isText:false },
      { type:'FLAG', x:11, y:4, isText:false },
    ]
  },

  // ──────────────────────────────────────────────
  // Level 9: BABA IS WIN — self-win
  // Teaches: YOU IS WIN rule
  // ──────────────────────────────────────────────
  {
    id: 9,
    title: "I Am Win",
    description: "Connect BABA — IS — WIN to win instantly.",
    width: 13,
    height: 9,
    tiles: [
      { type:'TEXT_BABA', x:1,  y:1, isText:true, textType:'noun',     textValue:'BABA' },
      { type:'TEXT_IS',   x:2,  y:1, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_YOU',  x:3,  y:1, isText:true, textType:'property', textValue:'YOU'  },
      // IS and WIN are already positioned — player pushes BABA text to align
      // BABA text is separated at top, needs to align with IS WIN vertically
      { type:'TEXT_BABA', x:9,  y:2, isText:true, textType:'noun',     textValue:'BABA' },
      { type:'TEXT_IS',   x:9,  y:4, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_WIN',  x:9,  y:6, isText:true, textType:'property', textValue:'WIN'  },
      // Walls defining the challenge
      { type:'TEXT_WALL', x:1, y:7, isText:true, textType:'noun', textValue:'WALL' },
      { type:'TEXT_IS',   x:2, y:7, isText:true, textType:'verb', textValue:'IS'   },
      { type:'TEXT_STOP', x:3, y:7, isText:true, textType:'property', textValue:'STOP'},
      { type:'BABA', x:3, y:5, isText:false },
      // Walls making a corridor
      { type:'WALL', x:6, y:2, isText:false },
      { type:'WALL', x:6, y:3, isText:false },
      { type:'WALL', x:6, y:4, isText:false },
      { type:'WALL', x:6, y:5, isText:false },
      { type:'WALL', x:6, y:6, isText:false },
    ]
  },

  // ──────────────────────────────────────────────
  // Level 10: Grand Puzzle — multi-mechanic
  // Teaches: combining everything
  // ──────────────────────────────────────────────
  {
    id: 10,
    title: "The Grand Puzzle",
    description: "Use everything you know.",
    width: 14,
    height: 11,
    tiles: [
      { type:'TEXT_BABA', x:1,  y:1, isText:true, textType:'noun',     textValue:'BABA' },
      { type:'TEXT_IS',   x:2,  y:1, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_YOU',  x:3,  y:1, isText:true, textType:'property', textValue:'YOU'  },
      { type:'TEXT_FLAG', x:10, y:1, isText:true, textType:'noun',     textValue:'FLAG' },
      { type:'TEXT_IS',   x:11, y:1, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_WIN',  x:12, y:1, isText:true, textType:'property', textValue:'WIN'  },
      { type:'TEXT_WALL', x:1,  y:9, isText:true, textType:'noun',     textValue:'WALL' },
      { type:'TEXT_IS',   x:2,  y:9, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_STOP', x:3,  y:9, isText:true, textType:'property', textValue:'STOP' },
      { type:'TEXT_ROCK', x:10, y:9, isText:true, textType:'noun',     textValue:'ROCK' },
      { type:'TEXT_IS',   x:11, y:9, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_PUSH', x:12, y:9, isText:true, textType:'property', textValue:'PUSH' },
      { type:'TEXT_LAVA', x:5,  y:9, isText:true, textType:'noun',     textValue:'LAVA' },
      { type:'TEXT_IS',   x:6,  y:9, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_HOT',  x:7,  y:9, isText:true, textType:'property', textValue:'HOT'  },
      { type:'TEXT_BABA', x:5,  y:7, isText:true, textType:'noun',     textValue:'BABA' },
      { type:'TEXT_IS',   x:6,  y:7, isText:true, textType:'verb',     textValue:'IS'   },
      { type:'TEXT_MELT', x:7,  y:7, isText:true, textType:'property', textValue:'MELT' },
      { type:'BABA', x:2, y:5, isText:false },
      { type:'ROCK', x:5, y:5, isText:false },
      { type:'LAVA', x:9, y:5, isText:false },
      { type:'LAVA', x:9, y:6, isText:false },
      { type:'FLAG', x:12, y:6, isText:false },
      { type:'WALL', x:7, y:3, isText:false },
      { type:'WALL', x:7, y:4, isText:false },
      { type:'WALL', x:7, y:5, isText:false },
      { type:'WALL', x:7, y:6, isText:false },
    ]
  },
];

export function getLevel(id) {
  return LEVELS.find(l => l.id === id) || LEVELS[0];
}
