// Sizzle & Serve — the loop: move the chef, run the stations, tick the
// orders and the shift clock. This file wires config, state, input, audio
// and render together and owns the ?scene= setups used for screenshots.

import { CANVAS_W, CANVAS_H, INGREDIENTS, STATIONS, FLOOR, TUNING } from './config.js';
import {
  createGame, spawnOrder, matchingOrder, serveOrder, expireOrder,
  addPopup, say, startNextDay, restartGame, dayTuning,
} from './state.js';
import { createInput, consumeFlags } from './input.js';
import { createAudio } from './audio.js';
import { drawGame } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const game = createGame();
for (let i = 0; i < TUNING.startOrders; i++) spawnOrder(game);
const input = createInput(canvas);
const audio = createAudio();
let nearStation = null;   // id of the station the chef can use right now
let promptText = '';
let lastTime = performance.now();
let chopTick = 0;

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(CANVAS_W * dpr);
  canvas.height = Math.floor(CANVAS_H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

// ---- stations: where the chef stands, and what E does there ----------------

function stationSpots() {
  const spots = [];
  for (const crate of STATIONS.crates) {
    spots.push({ id: 'crate:' + crate.id, x: crate.x + crate.w + 40, y: crate.y + crate.h / 2 });
  }
  spots.push({ id: 'board', x: STATIONS.board.x + STATIONS.board.w / 2, y: STATIONS.board.y + STATIONS.board.h + 30 });
  spots.push({ id: 'grill', x: STATIONS.grill.x + STATIONS.grill.w / 2, y: STATIONS.grill.y + STATIONS.grill.h + 30 });
  spots.push({ id: 'assembly', x: STATIONS.assembly.x + STATIONS.assembly.w / 2, y: STATIONS.assembly.y + STATIONS.assembly.h + 32 });
  spots.push({ id: 'window', x: STATIONS.window.x - 50, y: STATIONS.window.y + STATIONS.window.h / 2 });
  spots.push({ id: 'trash', x: STATIONS.trash.x - 70, y: STATIONS.trash.y + STATIONS.trash.h / 2 });
  return spots;
}

function stationDefs() {
  const defs = STATIONS.crates.map((c) => ({ id: 'crate:' + c.id, rect: c }));
  defs.push({ id: 'board', rect: STATIONS.board });
  defs.push({ id: 'grill', rect: STATIONS.grill });
  defs.push({ id: 'assembly', rect: STATIONS.assembly });
  defs.push({ id: 'window', rect: STATIONS.window });
  defs.push({ id: 'trash', rect: STATIONS.trash });
  return defs;
}

function stationDef(id) {
  return stationDefs().find((s) => s.id === id);
}

// Distance from a point to a station's counter: 0 when touching it.
function distToRect(x, y, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return Math.hypot(x - cx, y - cy);
}

function nearestStation() {
  let best = null;
  let bestD = 70;
  for (const def of stationDefs()) {
    const d = distToRect(game.chef.x, game.chef.y, def.rect);
    if (d < bestD) { bestD = d; best = def.id; }
  }
  return best;
}

function stationRects() {
  return stationDefs().map((s) => s.rect);
}

// Is the chef's centre inside any counter, grown by the chef's radius?
function hitsCounter(x, y) {
  const r = TUNING.chefRadius;
  for (const rect of stationRects()) {
    if (x > rect.x - r && x < rect.x + rect.w + r && y > rect.y - r && y < rect.y + rect.h + r) return true;
  }
  return false;
}

// Keep the chef out of counters, one axis at a time, so the chef slides
// along a counter instead of sticking to its corner.
function collide(nx, ny, ox, oy) {
  const r = TUNING.chefRadius;
  let x = Math.max(FLOOR.x + r, Math.min(FLOOR.x + FLOOR.w - r, nx));
  let y = Math.max(FLOOR.y + r, Math.min(FLOOR.y + FLOOR.h - r, ny));
  if (hitsCounter(x, oy)) x = ox;
  if (hitsCounter(x, y)) y = oy;
  return { x, y };
}

function interact(stationId) {
  const chef = game.chef;
  // A walk-to arrival names its station; a key press uses the nearest one.
  const near = stationId || nearestStation();
  if (!near) { say(game, 'Walk up to a station to use it'); return; }
  audio.unlock();

  if (near.startsWith('crate:')) {
    const id = near.slice(6);
    if (chef.holding) { say(game, 'Hands full — serve or bin what you carry first'); return; }
    chef.holding = { kind: 'ingredient', id };
    audio.pickup();
    say(game, `Picked up ${INGREDIENTS[id].name}`);
    return;
  }

  if (near === 'board') {
    if (!game.board.item) {
      if (chef.holding && chef.holding.kind === 'ingredient' && INGREDIENTS[chef.holding.id].chop) {
        game.board.item = { id: chef.holding.id, progress: 0 };
        chef.holding = null;
        audio.place();
        say(game, 'Chopping… stay close, it is quick');
      } else if (chef.holding) {
        say(game, 'Only tomato and lettuce go on the board');
      } else {
        say(game, 'Bring a tomato or lettuce to chop');
      }
      return;
    }
    if (game.board.progress >= TUNING.chopSeconds) {
      if (chef.holding) { say(game, 'Hands full'); return; }
      chef.holding = { kind: 'ingredient', id: game.board.item.id + '_c' };
      game.board.item = null;
      game.board.progress = 0;
      audio.pickup();
      say(game, `Chopped ${INGREDIENTS[chef.holding.id].name}`);
    } else {
      say(game, 'Still chopping…');
    }
    return;
  }

  if (near === 'grill') {
    if (!game.grill.item) {
      if (chef.holding && chef.holding.kind === 'ingredient' && chef.holding.id === 'patty') {
        game.grill.item = { id: 'patty', progress: 0 };
        chef.holding = null;
        audio.sizzle();
        say(game, 'Patty on the grill — do not walk away too long');
      } else if (chef.holding) {
        say(game, 'Only a raw patty goes on the grill');
      } else {
        say(game, 'Bring a raw patty to grill');
      }
      return;
    }
    const burnt = game.grill.progress >= TUNING.grillSeconds + TUNING.overcookSeconds;
    if (game.grill.progress >= TUNING.grillSeconds) {
      if (chef.holding) { say(game, 'Hands full'); return; }
      chef.holding = { kind: 'ingredient', id: burnt ? 'burnt' : 'patty_cooked' };
      game.grill.item = null;
      game.grill.progress = 0;
      audio.pickup();
      say(game, burnt ? 'Burnt! Bin it.' : 'Grilled patty, hot off the grill');
    } else {
      say(game, 'Still grilling…');
    }
    return;
  }

  if (near === 'assembly') {
    if (chef.holding && chef.holding.kind === 'ingredient') {
      if (game.plate.length >= 6) { say(game, 'The plate is full'); return; }
      if (chef.holding.id === 'burnt' || chef.holding.id === 'patty' || chef.holding.id === 'tomato' || chef.holding.id === 'lettuce') {
        say(game, `${INGREDIENTS[chef.holding.id].name} is not ready for a plate — chop it, grill it or bin it`);
        return;
      }
      game.plate.push(chef.holding.id);
      chef.holding = null;
      audio.place();
      const match = matchingOrder(game, game.plate);
      if (match) say(game, `That completes order #${match.id} — pick the plate up!`);
      else say(game, 'Added to the plate');
      return;
    }
    if (chef.holding && chef.holding.kind === 'plate') {
      say(game, 'Already carrying a plate');
      return;
    }
    if (game.plate.length > 0) {
      const held = [...game.plate];
      const match = matchingOrder(game, held);
      chef.holding = { kind: 'plate', items: held };
      game.plate = [];
      audio.pickup();
      say(game, match ? 'Plate up! Take it to the serving window' : 'Plate picked up — it matches no order yet');
    } else {
      say(game, 'The plate is empty — bring ingredients');
    }
    return;
  }

  if (near === 'window') {
    if (!chef.holding || chef.holding.kind !== 'plate') {
      say(game, 'Bring a finished plate to serve');
      return;
    }
    const match = game.orders.find((o) => {
      const have = [...chef.holding.items].sort();
      const want = [...o.recipe.items].sort();
      return have.length === want.length && have.every((v, i) => v === want[i]);
    });
    if (!match) {
      audio.fail();
      say(game, 'No open order wants this plate — check the tickets');
      return;
    }
    const earned = serveOrder(game, match);
    chef.holding = null;
    audio.serve();
    addPopup(game, STATIONS.window.x - 40, STATIONS.window.y + 40, `+$${earned} SERVED!`, '#ffe08a');
    burst(game, STATIONS.window.x - 30, STATIONS.window.y + 60, '#ffc93c', 14);
    say(game, `Order #${match.id} served — $${earned} in the till!`);
    return;
  }

  if (near === 'trash') {
    if (chef.holding) {
      say(game, `Binned the ${chef.holding.kind === 'plate' ? 'plate' : INGREDIENTS[chef.holding.id].name}`);
      chef.holding = null;
      audio.place();
    } else {
      say(game, 'Nothing to bin');
    }
  }
}

function burst(game, x, y, colour, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 90;
    game.particles.push({
      x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
      r: 3 + Math.random() * 4, colour, life: 0.9, max: 0.9,
    });
  }
}

// What the prompt bar should say for the nearest station.
function promptFor(near) {
  const chef = game.chef;
  if (!near) return '';
  if (near.startsWith('crate:')) {
    return chef.holding ? 'Hands full' : `Pick up ${INGREDIENTS[near.slice(6)].name}`;
  }
  if (near === 'board') {
    if (!game.board.item) return chef.holding ? 'Place it on the board' : 'Chopping board — bring tomato or lettuce';
    return game.board.progress >= TUNING.chopSeconds ? 'Take the chopped veg' : 'Chopping…';
  }
  if (near === 'grill') {
    if (!game.grill.item) return chef.holding ? 'Put it on the grill' : 'Grill — bring a raw patty';
    return game.grill.progress >= TUNING.grillSeconds ? 'Take it off the grill' : 'Grilling…';
  }
  if (near === 'assembly') {
    if (chef.holding && chef.holding.kind === 'ingredient') return 'Add to the plate';
    if (chef.holding && chef.holding.kind === 'plate') return 'Carrying a plate';
    return game.plate.length ? 'Pick up the plate' : 'Assembly counter — bring ingredients';
  }
  if (near === 'window') return chef.holding && chef.holding.kind === 'plate' ? 'Serve the plate!' : 'Serving window — bring a finished plate';
  if (near === 'trash') return chef.holding ? 'Bin what you are carrying' : 'Bin — nothing to throw away';
  return '';
}

// ---- screenshot scenes: real states built through the state machine --------

function setupScene(name) {
  // Every scene starts from a fresh mid-service state, then arranges the
  // kitchen the way a busy moment would look. All of it is the game's own
  // state — the renderer just draws what is there.
  restartGame(game);
  const first = game.orders[0];
  if (name === 'cover') {
    // A dish mid-assembly, a plate ready in the chef's hands, a patty on
    // the grill and a tomato half-chopped: the whole kitchen at once.
    game.plate = ['bun', 'patty_cooked', 'lettuce_c', 'tomato_c'];
    game.chef.holding = { kind: 'plate', items: [...first.recipe.items] };
    game.chef.x = 1000; game.chef.y = 320;
    game.grill.item = { id: 'patty', progress: 4.2 };
    game.board.item = { id: 'tomato', progress: 1.4 };
    game.orders.forEach((o, i) => { o.timeLeft = [48, 34, 22][i % 3]; });
    game.shiftLeft = 118;
    game.score = 340; game.coins = 46; game.served = 3;
  } else if (name === 'chop') {
    game.chef.x = 395; game.chef.y = 260;
    game.board.item = { id: 'lettuce', progress: 1.7 };
    game.grill.item = { id: 'patty', progress: 5.1 };
    game.plate = ['bun', 'patty_cooked'];
    game.chef.holding = { kind: 'ingredient', id: 'tomato' };
    game.shiftLeft = 96;
    game.score = 210; game.coins = 28; game.served = 2;
  } else if (name === 'serve') {
    game.chef.x = 1000; game.chef.y = 310;
    game.chef.holding = { kind: 'plate', items: [...first.recipe.items] };
    game.plate = ['bun'];
    game.grill.item = { id: 'patty', progress: 2.0 };
    game.orders.forEach((o, i) => { o.timeLeft = [40, 26, 12][i % 3]; });
    game.shiftLeft = 74;
    game.score = 480; game.coins = 62; game.served = 4;
    addPopup(game, 1020, 260, '+$18 SERVED!', '#ffe08a');
  }
  // freeze the clock for staged shots so the frame is stable — frozen,
  // not paused, so no overlay covers the kitchen
  game.frozen = true;
}

const params = new URLSearchParams(location.search);
const scene = params.get('scene') || params.get('shot');
if (scene === 'cover' || scene === 'chop' || scene === 'serve') setupScene(scene);

// ---- the frame -------------------------------------------------------------

function update(dt) {
  const flags = consumeFlags(input);
  if (flags.mute) { const m = audio.toggleMute(); say(game, m ? 'Sound off' : 'Sound on'); }
  if (flags.restart) { restartGame(game); say(game, 'Fresh shift — good luck, chef!'); return; }
  if (flags.pause && game.mode === 'play') { game.paused = !game.paused; return; }
  if (game.mode === 'dayend' && flags.confirm) { startNextDay(game); return; }
  if (game.mode === 'gameover' && flags.restart) { restartGame(game); return; }
  if (game.paused || game.frozen || game.mode !== 'play') return;

  // movement: keys first, then a click walk target
  const chef = game.chef;
  let mx = 0;
  let my = 0;
  if (input.keys.has('left')) mx -= 1;
  if (input.keys.has('right')) mx += 1;
  if (input.keys.has('up')) my -= 1;
  if (input.keys.has('down')) my += 1;
  if (mx !== 0 || my !== 0) {
    input.target = null;
  } else if (input.target) {
    const dx = input.target.x - chef.x;
    const dy = input.target.y - chef.y;
    const d = Math.hypot(dx, dy);
    if (input.target.station) {
      // A station counts as reached as soon as the chef is up against its
      // counter — no need to circle to one exact spot.
      const def = stationDef(input.target.station);
      const nearRect = def && distToRect(chef.x, chef.y, def.rect) < 70;
      if (nearRect || d < 8) {
        interact(input.target.station);
        input.target = null;
      } else {
        mx = dx / d;
        my = dy / d;
      }
    } else if (d < 8) {
      input.target = null;
    } else {
      mx = dx / d;
      my = dy / d;
    }
  }
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my);
    const step = TUNING.chefSpeed * dt;
    const next = collide(chef.x + (mx / len) * step, chef.y + (my / len) * step, chef.x, chef.y);
    chef.x = next.x;
    chef.y = next.y;
    chef.dir = mx < 0 ? -1 : mx > 0 ? 1 : chef.dir;
    chef.walk += dt;
    chef.moving = true;
  } else {
    chef.moving = false;
  }
  if (flags.interact) interact();

  nearStation = nearestStation();
  promptText = promptFor(nearStation);

  // chopping and grilling run on their own clocks
  if (game.board.item && game.board.progress < TUNING.chopSeconds) {
    game.board.progress += dt;
    chopTick += dt;
    if (chopTick > 0.35) { chopTick = 0; audio.chop(); }
    if (game.board.progress >= TUNING.chopSeconds) audio.ding();
  }
  if (game.grill.item) {
    game.grill.progress += dt;
    if (Math.random() < dt * 6) {
      game.particles.push({
        x: STATIONS.grill.x + 30 + Math.random() * (STATIONS.grill.w - 60),
        y: STATIONS.grill.y + 16,
        vx: (Math.random() - 0.5) * 12, vy: -28 - Math.random() * 20,
        r: 2 + Math.random() * 3, colour: 'rgba(255,255,255,0.55)', life: 0.8, max: 0.8,
      });
    }
    const burntAt = TUNING.grillSeconds + TUNING.overcookSeconds;
    if (game.grill.progress >= burntAt && game.grill.progress - dt < burntAt) {
      audio.fail();
      say(game, 'The patty burnt! Take it off and bin it');
    }
  }

  // orders tick down; an expired ticket costs a heart
  const tuning = dayTuning(game);
  for (const order of [...game.orders]) {
    order.timeLeft -= dt;
    if (order.timeLeft <= 0) {
      expireOrder(game, order);
      audio.fail();
      say(game, `Order #${order.id} walked out!`);
      addPopup(game, 400, 60, 'ORDER LOST', '#ff6b5e');
      if (game.mode === 'gameover') return;
    }
  }

  // new tickets arrive through the shift
  game.spawnIn -= dt;
  if (game.spawnIn <= 0 && game.orders.length < TUNING.maxOrders) {
    spawnOrder(game);
    game.spawnIn = tuning.spawnEvery;
    audio.tick();
  }

  // the shift clock; at zero the day ends and the next one gets harder
  game.shiftLeft -= dt;
  if (game.shiftLeft <= 0) {
    game.shiftLeft = 0;
    game.dayStats = { served: game.served, failed: game.failed };
    game.mode = 'dayend';
    audio.dayEnd();
  }

  // popups, particles, messages
  for (const p of game.popups) { p.life -= dt; p.y -= 26 * dt; }
  game.popups = game.popups.filter((p) => p.life > 0);
  for (const p of game.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  game.particles = game.particles.filter((p) => p.life > 0);
  if (game.messageT > 0) game.messageT -= dt;
  if (game.flash > 0) game.flash -= dt;
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  drawGame(ctx, game, promptText, nearStation);
  statusEl.textContent = `Day ${game.day}, score ${game.score}, ${game.orders.length} orders open, shift ${Math.ceil(game.shiftLeft)} seconds left`;
  requestAnimationFrame(frame);
}

// Clicking a station should walk the chef to it and use it on arrival:
// resolve the click against station rectangles here, at the source.
canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const px = ((event.clientX - rect.left) / rect.width) * CANVAS_W;
  const py = ((event.clientY - rect.top) / rect.height) * CANVAS_H;
  for (const spot of stationSpots()) {
    const d = Math.hypot(px - spot.x, py - spot.y);
    if (d < 70) {
      input.target = { x: spot.x, y: spot.y, station: spot.id };
      return;
    }
  }
});

requestAnimationFrame(frame);

// Exposed for playtesting and debugging only: the live game state.
window.__sizzle = game;
