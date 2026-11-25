# Sizzle & Serve — a tiny kitchen rush

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/0xrifai/makefun-best-cooking-game-20261125/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/0xrifai/makefun-best-cooking-game-20261125/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

A complete 2D cooking game that runs from static files in any desktop
browser — no network, no libraries, all art drawn in code.

You are the only chef in a small, busy kitchen. Tickets land on the order
board with a countdown each; fetch ingredients from the crates, chop the
tomato and lettuce on the board, grill the patty (and get it off before it
burns), build the dish on the assembly counter and ring it through the
serving window before the customer walks out. Serve fast for a tip. Survive
the shift and the next day comes faster, with shorter tickets.

## How to play

- **Move:** WASD or arrow keys, or click anywhere — click a station and the
  chef walks there and uses it on arrival.
- **Use a station:** E or Space (or click the station).
- **Crates (left wall):** bun, raw patty, tomato, lettuce, cheese.
- **Chopping board (top):** tomato and lettuce become chopped veg. It chops
  on its own once placed — come back and collect it.
- **Grill (top):** raw patty becomes a grilled patty. Leave it too long
  after it is done and it burns; bin the burnt one.
- **Assembly counter (middle):** add ingredients to the plate. The ticket
  ticks off each item as it lands. A finished plate can be picked up.
- **Serving window (right):** serve a plate that matches an open ticket.
- **Bin (right):** throw away whatever you are carrying.
- **P** pauses, **M** mutes, **R** restarts a shift, **Enter** starts the
  next day after a shift ends.

## Recipes

| Dish | What goes on the plate | Pays |
| --- | --- | --- |
| Classic Burger | bun, grilled patty, chopped lettuce | $12 + tip |
| Cheesy Burger | bun, grilled patty, cheese | $14 + tip |
| Garden Salad | chopped tomato, chopped lettuce | $10 + tip |
| Cheese Melt | bun, cheese, chopped tomato | $12 + tip |
| Double Stack | bun, grilled patty ×2, cheese | $18 + tip |
| Deluxe Stack | bun, grilled patty, chopped lettuce, chopped tomato, cheese | $24 + tip |

Lose three tickets in a shift and the kitchen closes. Finish a shift and
the next day brings faster tickets and quicker arrivals.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Source layout

- `game/index.html` — the page and the canvas
- `game/src/config.js` — recipes, stations, tuning
- `game/src/state.js` — orders, scoring, the shift clock
- `game/src/input.js` — keyboard and mouse
- `game/src/render.js` — all canvas drawing
- `game/src/audio.js` — WebAudio bleeps
- `game/src/main.js` — the loop and the station rules

Everything is original: the name, the art, the sounds and the code were
made for this entry. No external images, fonts, sounds or libraries.
