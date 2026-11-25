// Sizzle & Serve — everything the player sees, drawn in code.
// Canvas shapes only: floor, counters, stations, food, the chef, the order
// board, the shift timer and the prompts. No images, no fonts from the web.

import { CANVAS_W, CANVAS_H, HUD_H, INGREDIENTS, STATIONS, FLOOR, COLOURS, TUNING } from './config.js';
import { plateProgress } from './state.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, colour, align, weight) {
  ctx.fillStyle = colour;
  ctx.font = `${weight || 700} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---- food, drawn as little vector dishes ---------------------------------

export function drawIngredient(ctx, id, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 40; // unit scale: art is drawn for a 40px box
  if (id === 'bun') {
    ctx.fillStyle = '#e8b25e';
    ctx.beginPath(); ctx.arc(0, 2 * u, 17 * u, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d99a3e'; ctx.fillRect(-17 * u, 2 * u, 34 * u, 6 * u);
    ctx.fillStyle = '#fff2cf';
    [[-9, -8], [0, -12], [9, -8], [-4, -5], [5, -5]].forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.ellipse(dx * u, dy * u, 2.2 * u, 1.4 * u, 0, 0, Math.PI * 2); ctx.fill();
    });
  } else if (id === 'patty' || id === 'patty_cooked') {
    ctx.fillStyle = id === 'patty' ? '#c26a4a' : '#6e3f22';
    rr(ctx, -18 * u, -7 * u, 36 * u, 14 * u, 7 * u); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5 * u;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo((i * 10 - 4) * u, -6 * u); ctx.lineTo((i * 10 + 2) * u, 6 * u); ctx.stroke();
    }
  } else if (id === 'tomato' || id === 'tomato_c') {
    ctx.fillStyle = id === 'tomato' ? '#e23b2e' : '#ef5b4a';
    ctx.beginPath(); ctx.arc(0, 0, 15 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f9e4d';
    ctx.beginPath(); ctx.moveTo(0, -14 * u); ctx.lineTo(5 * u, -6 * u); ctx.lineTo(-5 * u, -6 * u); ctx.closePath(); ctx.fill();
    if (id === 'tomato_c') {
      ctx.strokeStyle = '#c22a20'; ctx.lineWidth = 2 * u;
      ctx.beginPath(); ctx.moveTo(-13 * u, -4 * u); ctx.lineTo(13 * u, 6 * u); ctx.stroke();
    }
  } else if (id === 'lettuce' || id === 'lettuce_c') {
    ctx.fillStyle = id === 'lettuce' ? '#4da34d' : '#7cc46a';
    if (id === 'lettuce') {
      ctx.beginPath();
      ctx.arc(-9 * u, 0, 9 * u, 0, Math.PI * 2);
      ctx.arc(0, -5 * u, 10 * u, 0, Math.PI * 2);
      ctx.arc(9 * u, 0, 9 * u, 0, Math.PI * 2);
      ctx.fill();
    } else {
      for (let i = -1; i <= 1; i++) {
        ctx.save(); ctx.translate(i * 11 * u, 0); ctx.rotate(i * 0.5);
        rr(ctx, -4 * u, -12 * u, 8 * u, 24 * u, 4 * u); ctx.fill(); ctx.restore();
      }
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = '#ffc93c';
    ctx.beginPath(); ctx.moveTo(-17 * u, 10 * u); ctx.lineTo(17 * u, 10 * u); ctx.lineTo(0, -13 * u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8a91c';
    [[-6, 4], [5, 5], [0, -3]].forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.arc(dx * u, dy * u, 2.4 * u, 0, Math.PI * 2); ctx.fill();
    });
  } else if (id === 'burnt') {
    ctx.fillStyle = '#241a12';
    ctx.beginPath(); ctx.arc(-6 * u, 2 * u, 9 * u, 0, Math.PI * 2); ctx.arc(6 * u, 0, 10 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(120,120,120,0.7)';
    ctx.beginPath(); ctx.arc(-2 * u, -14 * u, 4 * u, 0, Math.PI * 2); ctx.arc(4 * u, -20 * u, 3 * u, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, s, items) {
  ctx.fillStyle = '#f4f6f8';
  ctx.beginPath(); ctx.ellipse(x, y, s * 0.62, s * 0.24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9ced6'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, s * 0.62, s * 0.24, 0, 0, Math.PI * 2); ctx.stroke();
  items.forEach((id, i) => {
    drawIngredient(ctx, id, x, y - 6 - i * s * 0.16, s * 0.62);
  });
}

// ---- the kitchen ----------------------------------------------------------

function drawFloor(ctx) {
  ctx.fillStyle = COLOURS.wall;
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(0, HUD_H - 8, CANVAS_W, 8);
  const tile = 64;
  for (let y = HUD_H; y < CANVAS_H; y += tile) {
    for (let x = 0; x < CANVAS_W; x += tile) {
      ctx.fillStyle = ((x / tile + y / tile) % 2 === 0) ? COLOURS.floorA : COLOURS.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  for (let y = HUD_H; y < CANVAS_H; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }
  for (let x = 0; x < CANVAS_W; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, HUD_H); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
}

function drawCounter(ctx, st, label, highlight) {
  ctx.fillStyle = COLOURS.counterSide;
  rr(ctx, st.x, st.y + 8, st.w, st.h, 10); ctx.fill();
  ctx.fillStyle = highlight ? '#c98d4e' : COLOURS.counterTop;
  rr(ctx, st.x, st.y, st.w, st.h, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
  rr(ctx, st.x, st.y, st.w, st.h, 10); ctx.stroke();
  text(ctx, label, st.x + st.w / 2, st.y + st.h - 12, 13, '#fff6e3', 'center', 800);
}

function progressRing(ctx, x, y, r, frac, colour) {
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = colour; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
  ctx.lineCap = 'butt';
}

function drawStations(ctx, game, near) {
  // ingredient crates, left wall
  for (const crate of STATIONS.crates) {
    const ing = INGREDIENTS[crate.id];
    drawCounter(ctx, crate, ing.name.toUpperCase(), near === 'crate:' + crate.id);
    drawIngredient(ctx, crate.id, crate.x + 34, crate.y + crate.h / 2 - 6, 44);
    drawIngredient(ctx, crate.id, crate.x + 78, crate.y + crate.h / 2 - 10, 36);
    drawIngredient(ctx, crate.id, crate.x + 118, crate.y + crate.h / 2 - 4, 40);
  }

  // chopping board — the label becomes the status while something is on it
  const board = STATIONS.board;
  const boardBusy = !!game.board.item;
  const boardDone = boardBusy && game.board.progress >= TUNING.chopSeconds;
  drawCounter(ctx, board, boardDone ? 'READY — TAKE IT!' : boardBusy ? 'CHOPPING…' : 'CHOPPING BOARD', near === 'board');
  ctx.fillStyle = '#d9b380';
  rr(ctx, board.x + 18, board.y + 10, board.w - 36, board.h - 34, 6); ctx.fill();
  if (game.board.item) {
    drawIngredient(ctx, game.board.item.id, board.x + board.w / 2, board.y + 26, 40);
    progressRing(ctx, board.x + board.w / 2, board.y + 26, 26, Math.min(1, game.board.progress / TUNING.chopSeconds), boardDone ? '#4da34d' : '#ffc93c');
    if (!boardDone) {
      // little knife, bobbing while it chops
      const bob = Math.sin(performance.now() / 90) * 4;
      ctx.save(); ctx.translate(board.x + board.w / 2 + 34, board.y + 24 + bob); ctx.rotate(0.5);
      ctx.fillStyle = '#e8ecf0'; ctx.fillRect(0, -3, 26, 6);
      ctx.fillStyle = '#5d3a20'; ctx.fillRect(-10, -3, 10, 6); ctx.restore();
    }
  } else {
    text(ctx, 'chop tomato / lettuce', board.x + board.w / 2, board.y + 26, 12, 'rgba(255,246,227,0.75)', 'center', 600);
  }

  // grill — same idea: the label carries the status while a patty is on
  const grill = STATIONS.grill;
  const grillBusy = !!game.grill.item;
  const grillDone = grillBusy && game.grill.progress >= TUNING.grillSeconds;
  const grillBurnt = grillBusy && game.grill.progress >= TUNING.grillSeconds + TUNING.overcookSeconds;
  drawCounter(ctx, grill, grillBurnt ? 'BURNT — BIN IT!' : grillDone ? 'READY — TAKE IT!' : grillBusy ? 'GRILLING…' : 'GRILL', near === 'grill');
  ctx.fillStyle = '#3a3a40';
  rr(ctx, grill.x + 14, grill.y + 8, grill.w - 28, grill.h - 30, 6); ctx.fill();
  ctx.strokeStyle = '#565660'; ctx.lineWidth = 3;
  for (let i = 1; i <= 3; i++) {
    const gx = grill.x + 14 + (i * (grill.w - 28)) / 4;
    ctx.beginPath(); ctx.moveTo(gx, grill.y + 12); ctx.lineTo(gx, grill.y + grill.h - 26); ctx.stroke();
  }
  if (game.grill.item) {
    drawIngredient(ctx, grillBurnt ? 'burnt' : 'patty_cooked', grill.x + grill.w / 2, grill.y + 28, 40);
    progressRing(ctx, grill.x + grill.w / 2, grill.y + 28, 26,
      Math.min(1, game.grill.progress / TUNING.grillSeconds), grillBurnt ? '#e23b2e' : grillDone ? '#4da34d' : '#ff8c42');
  } else {
    text(ctx, 'grill a patty', grill.x + grill.w / 2, grill.y + 28, 12, 'rgba(255,246,227,0.75)', 'center', 600);
  }

  // assembly counter, middle of the room
  const asm = STATIONS.assembly;
  drawCounter(ctx, asm, 'ASSEMBLY — BUILD THE DISH HERE', near === 'assembly');
  if (game.plate.length > 0) {
    drawPlate(ctx, asm.x + asm.w / 2, asm.y + 44, 84, game.plate);
  } else {
    text(ctx, 'empty plate — add ingredients', asm.x + asm.w / 2, asm.y + 40, 13, 'rgba(255,246,227,0.8)', 'center', 600);
  }

  // serving window, right wall
  const win = STATIONS.window;
  drawCounter(ctx, win, 'SERVING WINDOW', near === 'window');
  ctx.fillStyle = '#2c1c10';
  rr(ctx, win.x + 14, win.y + 12, win.w - 28, 74, 8); ctx.fill();
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath(); ctx.arc(win.x + win.w / 2, win.y + 48, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2c1c10';
  ctx.beginPath(); ctx.arc(win.x + win.w / 2, win.y + 48, 16, Math.PI, 0); ctx.fill();
  ctx.fillRect(win.x + win.w / 2 - 22, win.y + 46, 44, 5);
  text(ctx, 'ring the bell', win.x + win.w / 2, win.y + 104, 12, 'rgba(255,246,227,0.75)', 'center', 600);
  text(ctx, 'serve a finished plate', win.x + win.w / 2, win.y + 122, 12, 'rgba(255,246,227,0.75)', 'center', 600);
  // a happy customer peeking over the sill
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(win.x + win.w / 2, win.y + 158, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a4a28';
  ctx.beginPath(); ctx.arc(win.x + win.w / 2, win.y + 150, 22, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#2c1c10';
  ctx.beginPath(); ctx.arc(win.x + win.w / 2 - 8, win.y + 158, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(win.x + win.w / 2 + 8, win.y + 158, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2c1c10'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(win.x + win.w / 2, win.y + 164, 7, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();

  // trash bin
  const trash = STATIONS.trash;
  drawCounter(ctx, trash, 'BIN', near === 'trash');
  ctx.fillStyle = '#565660';
  rr(ctx, trash.x + 30, trash.y + 12, trash.w - 60, trash.h - 34, 6); ctx.fill();
  ctx.fillStyle = '#3a3a40';
  ctx.fillRect(trash.x + 24, trash.y + 8, trash.w - 48, 8);
}

function drawChef(ctx, game) {
  const c = game.chef;
  const bob = c.moving ? Math.sin(c.walk * 14) * 2 : 0;
  ctx.save();
  ctx.translate(c.x, c.y + bob * 0.4);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 20, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  // body / apron
  ctx.fillStyle = '#f4f6f8';
  rr(ctx, -16, -6, 32, 26, 10); ctx.fill();
  ctx.fillStyle = '#d9382b';
  ctx.fillRect(-16, 8, 32, 4);
  // arms
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(-17, 4, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(17, 4, 6, 0, Math.PI * 2); ctx.fill();
  // head
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(0, -18, 13, 0, Math.PI * 2); ctx.fill();
  // chef hat
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-8, -30, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -34, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -30, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-13, -32, 26, 7);
  // eyes, looking the way the chef faces
  ctx.fillStyle = '#2c1c10';
  ctx.beginPath(); ctx.arc(c.dir * 3 - 4, -18, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(c.dir * 3 + 4, -18, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // what the chef is carrying, held high over the hat
  if (c.holding) {
    if (c.holding.kind === 'plate') {
      drawPlate(ctx, c.x, c.y - 60, 64, c.holding.items);
      text(ctx, 'READY TO SERVE!', c.x, c.y - 92, 13, '#ffe08a', 'center', 800);
    } else {
      drawIngredient(ctx, c.holding.id, c.x, c.y - 58, 44);
    }
  }
}

function drawParticles(ctx, game) {
  for (const p of game.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.colour;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---- the order board (top of the screen) -----------------------------------

function drawOrders(ctx, game) {
  const slotW = 218;
  const x0 = 16;
  game.orders.forEach((order, i) => {
    const x = x0 + i * (slotW + 10);
    const y = 10;
    const w = slotW;
    const h = 100;
    const done = plateProgress(game, order);
    const frac = Math.max(0, order.timeLeft / order.total);
    const urgent = order.timeLeft < 15;
    ctx.fillStyle = urgent ? '#5e1f16' : '#fff6e3';
    rr(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = urgent ? '#ff6b5e' : '#d9b380'; ctx.lineWidth = 2;
    rr(ctx, x, y, w, h, 10); ctx.stroke();
    // ticket header
    ctx.fillStyle = urgent ? '#ff6b5e' : '#8a5a34';
    rr(ctx, x, y, w, 26, 10); ctx.fill();
    ctx.fillRect(x, y + 16, w, 10);
    text(ctx, `#${order.id}  ${order.recipe.name.toUpperCase()}`, x + 10, y + 14, 13, '#ffffff', 'left', 800);
    text(ctx, `$${order.recipe.base}`, x + w - 10, y + 14, 13, '#ffe08a', 'right', 800);
    // ingredient checklist
    const pool = [...game.plate];
    order.recipe.items.forEach((item, j) => {
      const ix = x + 16 + j * 34;
      const iy = y + 48;
      const k = pool.indexOf(item);
      const got = k !== -1;
      if (got) pool.splice(k, 1);
      ctx.globalAlpha = got ? 1 : 0.45;
      drawIngredient(ctx, item, ix + 10, iy, 26);
      ctx.globalAlpha = 1;
      if (got) {
        ctx.strokeStyle = '#2c7a35'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ix + 2, iy + 2); ctx.lineTo(ix + 8, iy + 8); ctx.lineTo(ix + 18, iy - 6); ctx.stroke();
        ctx.lineCap = 'butt';
      }
    });
    text(ctx, `${done}/${order.recipe.items.length} on the plate`, x + 12, y + 74, 12, '#6b4a2f', 'left', 700);
    // countdown bar
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    rr(ctx, x + 10, y + 86, w - 20, 10, 5); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#4da34d' : frac > 0.25 ? '#ffc93c' : '#e23b2e';
    if (frac > 0) { rr(ctx, x + 10, y + 86, (w - 20) * frac, 10, 5); ctx.fill(); }
    text(ctx, `${Math.ceil(order.timeLeft)}s`, x + w - 12, y + 74, 13, urgent ? '#e23b2e' : '#6b4a2f', 'right', 800);
  });
  if (game.orders.length === 0) {
    text(ctx, 'No orders yet — more customers soon…', x0 + 8, 60, 15, 'rgba(255,246,227,0.85)', 'left', 700);
  }
}

function drawHud(ctx, game) {
  // shift timer, in its own column clear of the order tickets: the tickets
  // run to x=918 with four open, the score block starts near x=1110.
  const cx = 990;
  const mins = Math.floor(Math.max(0, game.shiftLeft) / 60);
  const secs = Math.floor(Math.max(0, game.shiftLeft) % 60);
  const rush = game.shiftLeft < 30;
  text(ctx, 'SHIFT', cx, 24, 13, 'rgba(255,246,227,0.8)', 'center', 800);
  text(ctx, `${mins}:${String(secs).padStart(2, '0')}`, cx, 56, 40, rush ? '#ff6b5e' : '#ffffff', 'center', 800);
  text(ctx, `DAY ${game.day}`, cx, 88, 14, '#ffe08a', 'center', 800);

  // score, coins, hearts on the right
  const rx = CANVAS_W - 16;
  text(ctx, `SCORE ${game.score}`, rx, 26, 17, '#ffffff', 'right', 800);
  ctx.fillStyle = '#ffc93c';
  ctx.beginPath(); ctx.arc(rx - 118, 52, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a5a34';
  ctx.font = '800 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('$', rx - 118, 53);
  text(ctx, `${game.coins} coins`, rx, 52, 16, '#ffe08a', 'right', 700);
  const hearts = '♥'.repeat(game.hearts) + '♡'.repeat(Math.max(0, 3 - game.hearts));
  text(ctx, hearts, rx, 78, 18, '#ff6b7a', 'right', 800);
  text(ctx, `served ${game.served} · lost ${game.failed}`, rx, 100, 12, 'rgba(255,246,227,0.7)', 'right', 600);
}

function drawPrompt(ctx, game, prompt) {
  if (!prompt) return;
  const w = ctx.measureText(prompt).width + 44;
  ctx.fillStyle = 'rgba(20,12,6,0.85)';
  rr(ctx, CANVAS_W / 2 - w / 2, CANVAS_H - 52, w, 36, 18); ctx.fill();
  ctx.fillStyle = '#ffc93c';
  ctx.font = '800 15px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('E', CANVAS_W / 2 - w / 2 + 20, CANVAS_H - 33);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(prompt, CANVAS_W / 2 + 8, CANVAS_H - 33);
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(20,12,6,0.78)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff6e3';
  rr(ctx, CANVAS_W / 2 - 320, CANVAS_H / 2 - 170, 640, 340, 16); ctx.fill();
  ctx.strokeStyle = accent || '#8a5a34'; ctx.lineWidth = 3;
  rr(ctx, CANVAS_W / 2 - 320, CANVAS_H / 2 - 170, 640, 340, 16); ctx.stroke();
  text(ctx, title, CANVAS_W / 2, CANVAS_H / 2 - 120, 34, '#2c1c10', 'center', 800);
  lines.forEach((line, i) => {
    text(ctx, line, CANVAS_W / 2, CANVAS_H / 2 - 62 + i * 30, 17, '#4a3220', 'center', 600);
  });
}

// ---- the one public entry point --------------------------------------------

export function drawGame(ctx, game, prompt, near) {
  drawFloor(ctx);
  drawStations(ctx, game, near);
  drawChef(ctx, game);
  drawParticles(ctx, game);
  drawOrders(ctx, game);
  drawHud(ctx, game);

  // floating score popups
  for (const p of game.popups) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    text(ctx, p.text, p.x, p.y, 22, p.colour, 'center', 800);
  }
  ctx.globalAlpha = 1;

  // help line, always visible
  text(ctx, 'WASD / arrows to move · click a station to walk there · E to use it · P pause · M mute', CANVAS_W / 2, CANVAS_H - 66, 13, 'rgba(255,246,227,0.75)', 'center', 600);
  if (game.messageT > 0) {
    text(ctx, game.message, CANVAS_W / 2, CANVAS_H - 96, 16, '#ffe08a', 'center', 800);
  }
  drawPrompt(ctx, game, prompt);

  if (game.flash > 0) {
    ctx.fillStyle = `rgba(226,59,46,${game.flash * 0.25})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  if (game.mode === 'dayend' && game.dayStats) {
    drawOverlay(ctx, `Day ${game.day} done!`, [
      `Served ${game.dayStats.served} dishes · ${game.dayStats.failed} orders lost`,
      `Score ${game.score} · ${game.coins} coins in the till`,
      `Day ${game.day + 1}: tickets run out faster and arrive sooner.`,
      '',
      'Press ENTER for the next shift',
    ], '#4da34d');
  } else if (game.mode === 'gameover') {
    drawOverlay(ctx, 'Kitchen closed!', [
      `Three orders lost — the dinner rush beat you.`,
      `You served ${game.served} dishes and scored ${game.score}.`,
      '',
      'Press R to open the kitchen again',
    ], '#d9382b');
  } else if (game.paused) {
    drawOverlay(ctx, 'Paused', ['Take a breath, chef.', '', 'Press P to get back to the pass'], '#8a5a34');
  }
}
