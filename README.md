# Raft Rumble (React)

A Raft Wars–style turn-based artillery game: babies on an inflatable raft vs. pirate crews. Aim with the mouse, click to throw, knock pirates overboard, earn cash, and buy bigger guns between levels.

Built with **React 19 + Redux Toolkit + React Router + Vite**. All sprites are hand-made SVGs in `public/assets/`, and sound effects are synthesized live with WebAudio (no audio files).

## Run it

```bash
npm install
npm run dev        # dev server at http://localhost:8643
```

Other scripts:

```bash
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

## How it's put together

- `src/game/engine.js` — the canvas battle engine (physics, enemy AI, particles, rendering). It owns per-frame state and reports meaningful events (cash earned, shot fired, pirate sunk, level won/lost) upward through callbacks. It never touches Redux directly.
- `src/store/playerSlice.js` — cash, owned weapons, equipped weapon (buy/equip/reset).
- `src/store/gameSlice.js` — level progression and run stats (shots fired, pirates sunk).
- `src/App.jsx` — routes: `/` title, `/play` battle, `/shop` weapon shop, `/victory` end screen.
- `src/components/` — screens and the in-game HUD (React DOM overlaying the canvas).

## Controls

- **Mouse move** — aim (dotted trajectory preview + power arrow)
- **Click** — throw
- **Keys 1–4** — switch between owned weapons mid-battle

## Dev/test hooks

- `window.__store` — the Redux store (`getState()` / `dispatch()`)
- `window.__rr` — battle engine hook while on `/play` (`state()`, `units()`, `shoot(vx, vy)`, `clearLevel()`, `tick(n)`)
