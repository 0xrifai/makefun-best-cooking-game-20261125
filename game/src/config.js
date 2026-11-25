// Sizzle & Serve — every number the game balances on lives here.
// Recipes, ingredients, station layout, colours and difficulty tuning.
// Nothing in this file touches the canvas or the game loop.

export const CANVAS_W = 1280;
export const CANVAS_H = 800;
export const HUD_H = 122;

// One ingredient id per kitchen state. A raw patty becomes patty_cooked on
// the grill; tomato and lettuce become their chopped form on the board.
export const INGREDIENTS = {
  bun:          { name: 'Bun',     ready: true,  colour: '#e8b25e' },
  patty:        { name: 'Patty',   grill: true,   colour: '#c26a4a' },
  patty_cooked: { name: 'Grilled Patty', ready: true, colour: '#7a4a28' },
  tomato:       { name: 'Tomato',  chop: true,    colour: '#e23b2e' },
  tomato_c:     { name: 'Chopped Tomato', ready: true, colour: '#ef5b4a' },
  lettuce:      { name: 'Lettuce', chop: true,    colour: '#4da34d' },
  lettuce_c:    { name: 'Chopped Lettuce', ready: true, colour: '#7cc46a' },
  cheese:       { name: 'Cheese',  ready: true,   colour: '#ffc93c' },
  burnt:        { name: 'Burnt!',  ready: false,  colour: '#2b2118' },
};

// A recipe is the exact multiset of ingredients a plate must hold.
// Short recipes pay fast; long ones pay more and need the whole kitchen.
export const RECIPES = [
  { id: 'classic', name: 'Classic Burger', items: ['bun', 'patty_cooked', 'lettuce_c'], base: 12 },
  { id: 'cheesy',  name: 'Cheesy Burger',  items: ['bun', 'patty_cooked', 'cheese'],    base: 14 },
  { id: 'garden',  name: 'Garden Salad',   items: ['tomato_c', 'lettuce_c'],            base: 10 },
  { id: 'melt',    name: 'Cheese Melt',    items: ['bun', 'cheese', 'tomato_c'],        base: 12 },
  { id: 'double',  name: 'Double Stack',   items: ['bun', 'patty_cooked', 'patty_cooked', 'cheese'], base: 18 },
  { id: 'deluxe',  name: 'Deluxe Stack',   items: ['bun', 'patty_cooked', 'lettuce_c', 'tomato_c', 'cheese'], base: 24 },
];

export const TUNING = {
  shiftSeconds: 150,     // one day / shift
  orderSeconds: 62,      // how long a ticket lives on day 1
  spawnEvery: 13,        // seconds between new tickets
  maxOrders: 4,
  chopSeconds: 2.4,
  grillSeconds: 6,
  overcookSeconds: 5,    // grace after done before the patty burns
  chefSpeed: 265,
  chefRadius: 20,
  interactRange: 105,
  tipMax: 8,             // biggest tip, for serving with the clock nearly full
  startOrders: 3,        // tickets already waiting when the shift opens
  dayOrderScale: 0.88,   // order timers shrink this much per day
  daySpawnScale: 0.9,
};

// Station rectangles (canvas space) and the spot the chef stands to use them.
// Crates line the left wall, grill and board sit along the top, the assembly
// counter is the middle of the room, the pass window and bin are on the right.
export const STATIONS = {
  crates: [
    { id: 'bun',     x: 44,  y: 150, w: 158, h: 92 },
    { id: 'patty',   x: 44,  y: 258, w: 158, h: 92 },
    { id: 'tomato',  x: 44,  y: 366, w: 158, h: 92 },
    { id: 'lettuce', x: 44,  y: 474, w: 158, h: 92 },
    { id: 'cheese',  x: 44,  y: 582, w: 158, h: 92 },
  ],
  board:    { x: 300, y: 140, w: 196, h: 74 },
  grill:    { x: 524, y: 140, w: 236, h: 74 },
  assembly: { x: 520, y: 400, w: 268, h: 96 },
  window:   { x: 1082, y: 196, w: 152, h: 224 },
  trash:    { x: 1096, y: 560, w: 124, h: 96 },
};

// Where the chef may walk: the open floor between the counters. It reaches
// up beside the top crate so every crate can be stood next to.
export const FLOOR = { x: 216, y: 140, w: 852, h: 600 };

export const COLOURS = {
  floorA: '#b98a56',
  floorB: '#a87a48',
  wall: '#6b4a2f',
  counterTop: '#8a5a34',
  counterSide: '#5d3a20',
  steel: '#c8ccd2',
  steelDark: '#9aa0a8',
  cream: '#fff6e3',
  ink: '#2c1c10',
  tomatoRed: '#d9382b',
  gold: '#ffc93c',
};
