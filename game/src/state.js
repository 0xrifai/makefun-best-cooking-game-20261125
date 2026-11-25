// Sizzle & Serve — game state: orders, the shift clock, the chef's hands,
// the board, the grill and the plate. Pure data and rules, no drawing.

import { RECIPES, TUNING } from './config.js';

let nextOrderId = 1;

export function createGame() {
  nextOrderId = 1; // ticket numbers restart with every fresh kitchen
  return {
    mode: 'play',            // play | dayend | gameover | paused (paused stored separately)
    paused: false,
    frozen: false,           // staged scene: clock stopped, no overlay shown
    day: 1,
    shiftLeft: TUNING.shiftSeconds,
    shiftTotal: TUNING.shiftSeconds,
    score: 0,
    coins: 0,
    hearts: 3,
    served: 0,
    failed: 0,
    orders: [],
    spawnIn: 6,
    chef: { x: 640, y: 620, dir: 1, holding: null, walk: 0, moving: false },
    board: { item: null, progress: 0 },   // { id, progress } chopping
    grill: { item: null, progress: 0 },   // { id, progress } grilling
    plate: [],                            // ingredient ids on the assembly counter
    popups: [],                           // floating score text
    particles: [],
    message: '',
    messageT: 0,
    flash: 0,                             // red flash on a failed order
    dayStats: null,
  };
}

// Difficulty for the current day: shorter tickets, faster spawns.
export function dayTuning(game) {
  const d = game.day - 1;
  return {
    orderSeconds: TUNING.orderSeconds * Math.pow(TUNING.dayOrderScale, d),
    spawnEvery: TUNING.spawnEvery * Math.pow(TUNING.daySpawnScale, d),
  };
}

export function pickRecipe() {
  return RECIPES[Math.floor(Math.random() * RECIPES.length)];
}

export function spawnOrder(game, recipe) {
  const tuning = dayTuning(game);
  const r = recipe || pickRecipe();
  const total = tuning.orderSeconds;
  game.orders.push({
    id: nextOrderId++,
    recipe: r,
    timeLeft: total,
    total,
    urgent: false,
  });
}

export function openOrders(game) {
  return game.orders;
}

// Does the plate on the assembly counter match this order, item for item?
export function plateMatchesOrder(plate, recipe) {
  if (plate.length !== recipe.items.length) return false;
  const have = [...plate].sort();
  const want = [...recipe.items].sort();
  return have.every((item, i) => item === want[i]);
}

// Which open order, if any, does the plate complete? First match wins.
export function matchingOrder(game, plate) {
  return game.orders.find((o) => plateMatchesOrder(plate, o.recipe)) || null;
}

// How many of the order's items are already on the plate (for ticket ticks).
export function plateProgress(game, order) {
  const pool = [...game.plate];
  let done = 0;
  for (const item of order.recipe.items) {
    const i = pool.indexOf(item);
    if (i !== -1) { pool.splice(i, 1); done++; }
  }
  return done;
}

export function serveOrder(game, order) {
  const tip = Math.round((order.timeLeft / order.total) * TUNING.tipMax);
  const earned = order.recipe.base + tip;
  game.coins += earned;
  game.score += earned * 10 + 50;
  game.served++;
  game.orders = game.orders.filter((o) => o.id !== order.id);
  game.plate = [];
  return earned;
}

export function expireOrder(game, order) {
  game.orders = game.orders.filter((o) => o.id !== order.id);
  game.failed++;
  game.hearts = Math.max(0, game.hearts - 1);
  game.flash = 0.6;
  if (game.hearts <= 0) game.mode = 'gameover';
}

export function addPopup(game, x, y, text, colour) {
  game.popups.push({ x, y, text, colour: colour || '#ffffff', life: 1.6 });
}

export function say(game, text) {
  game.message = text;
  game.messageT = 2.2;
}

export function startNextDay(game) {
  game.day++;
  game.shiftLeft = TUNING.shiftSeconds;
  game.shiftTotal = TUNING.shiftSeconds;
  game.orders = [];
  game.spawnIn = 4;
  game.plate = [];
  game.board = { item: null, progress: 0 };
  game.grill = { item: null, progress: 0 };
  game.chef.holding = null;
  game.mode = 'play';
  for (let i = 0; i < TUNING.startOrders; i++) spawnOrder(game);
}

export function restartGame(game) {
  const fresh = createGame();
  Object.keys(fresh).forEach((k) => { game[k] = fresh[k]; });
  for (let i = 0; i < TUNING.startOrders; i++) spawnOrder(game);
}
