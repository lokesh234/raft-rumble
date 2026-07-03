import { W, H, WATER, GRAV, WEAPONS, LEVELS, ASSET_SOURCES, CASH_PER_HIT, CASH_PER_KO } from "./constants.js";
import { sfx, initAudio } from "./sound.js";

let imagesPromise = null;
function loadImages() {
  if (!imagesPromise) {
    imagesPromise = Promise.all(
      Object.entries(ASSET_SOURCES).map(([key, src]) =>
        new Promise(resolve => {
          const im = new Image();
          im.onload = () => resolve([key, im]);
          im.onerror = () => resolve([key, im]);
          im.src = src;
        })
      )
    ).then(Object.fromEntries);
  }
  return imagesPromise;
}

/**
 * Runs one battle on the given canvas. React owns everything outside the
 * battle: cash, weapon inventory, level progression, and win/lose screens.
 *
 * opts: {
 *   level: number,
 *   getWeaponId: () => string,        // player's equipped weapon (live)
 *   onCash: (amount) => void,
 *   onShot: () => void,
 *   onPirateSunk: () => void,
 *   onLevelWin: () => void,
 *   onGameOver: () => void,
 * }
 */
export function createEngine(canvas, opts) {
  const cx = canvas.getContext("2d");
  const { level, getWeaponId, onCash, onShot, onPirateSunk, onLevelWin, onGameOver } = opts;

  let IMG = null;
  let destroyed = false;
  let raf = 0;

  // ---------- battle state ----------
  let state = "aim";        // aim | fly | enemyThink | between | done
  let frame = 0;
  let timer = 0;
  let shake = 0;
  let mouse = { x: 480, y: 200 };

  let rafts = [];
  let units = [];
  let ball = null;
  let particles = [];
  let floaters = [];
  let turnTeam = "player";
  let shooterIdx = { player: 0, enemy: 0 };
  let activeUnit = null;
  let banner = { text: "", t: 0 };
  const clouds = [
    { x: 120, y: 60, s: 1.0, v: 0.12 },
    { x: 520, y: 95, s: 0.7, v: 0.08 },
    { x: 800, y: 45, s: 1.2, v: 0.15 },
  ];

  function weaponOf(team) {
    return team === "player"
      ? WEAPONS.find(w => w.id === getWeaponId()) || WEAPONS[0]
      : WEAPONS[0];
  }

  function makeUnit(team, raft, baseOff, hp) {
    return {
      team, raft, baseOff, off: 0, kbVel: 0,
      hp, maxHp: hp, alive: true, sink: 0,
      w: 58, h: 70, wobble: Math.random() * 6.28,
      x: 0, y: 0,
    };
  }

  function setupLevel(lv) {
    rafts = []; units = []; ball = null; particles = []; floaters = [];
    shooterIdx = { player: 0, enemy: 0 };

    const babyHp = 60 + (lv - 1) * 12;
    const pRaft = { x: 145, w: 220, img: "raftP", phase: 0, y: WATER };
    rafts.push(pRaft);
    units.push(makeUnit("player", pRaft, -45, babyHp));
    units.push(makeUnit("player", pRaft, 45, babyHp));

    const cfg = LEVELS[lv];
    for (const r of cfg.rafts) {
      const eRaft = { x: r.x, w: r.crew === 3 ? 230 : 200, img: "raftE", phase: Math.random() * 6.28, y: WATER, vx: r.vx ?? 0 };
      rafts.push(eRaft);
      const offs = r.crew === 1 ? [0] : r.crew === 2 ? [-42, 42] : [-60, 0, 60];
      for (const o of offs) units.push(makeUnit("enemy", eRaft, o, cfg.hp));
    }
    startTurn("player");
  }

  function aliveUnits(team) { return units.filter(u => u.team === team && u.alive); }

  function startTurn(team) {
    turnTeam = team;
    const crew = aliveUnits(team);
    if (!crew.length) return;
    shooterIdx[team] = shooterIdx[team] % crew.length;
    activeUnit = crew[shooterIdx[team]];
    shooterIdx[team]++;
    if (team === "player") {
      state = "aim";
      banner = { text: "YOUR TURN", t: 70 };
    } else {
      state = "enemyThink";
      timer = 55 + Math.random() * 30;
      banner = { text: "PIRATES' TURN", t: 70 };
    }
  }

  // ---------- physics ----------
  function muzzle(u) {
    const facing = u.team === "player" ? 1 : -1;
    return { x: u.x + facing * 20, y: u.y - 26 };
  }

  function simulateShot(sx, sy, vx, vy, grav = GRAV) {
    const pts = [];
    let x = sx, y = sy;
    for (let i = 0; i < 260; i++) {
      vy += grav; x += vx; y += vy;
      pts.push({ x, y });
      if (y > WATER + 14 || x < -60 || x > W + 60) break;
    }
    return pts;
  }

  function aimFromMouse(u) {
    const m = muzzle(u);
    const dx = mouse.x - m.x, dy = mouse.y - m.y;
    const ang = Math.atan2(dy, dx);
    const power = Math.min(Math.max(Math.hypot(dx, dy) / 12, 3), 17);
    return { m, vx: Math.cos(ang) * power, vy: Math.sin(ang) * power, power };
  }

  function fire(u, vx, vy) {
    const m = muzzle(u);
    const w = weaponOf(u.team);
    ball = { x: m.x, y: m.y, vx, vy, team: u.team, spin: 0, w };
    state = "fly";
    if (u.team === "player") onShot?.();
    sfx.fire();
  }

  // ---------- enemy AI ----------
  function enemyShoot(u) {
    const targets = aliveUnits("player");
    if (!targets.length) return;
    const t = targets[Math.floor(Math.random() * targets.length)];
    const m = muzzle(u);
    let best = { err: 1e9, vx: -8, vy: -8 };
    for (let deg = 25; deg <= 80; deg += 5) {
      const a = (deg * Math.PI) / 180;
      for (let p = 6; p <= 17; p += 1) {
        const vx = -Math.cos(a) * p, vy = -Math.sin(a) * p;
        let x = m.x, y = m.y, cvy = vy, err = 1e9;
        for (let i = 0; i < 240; i++) {
          cvy += GRAV; x += vx; y += cvy;
          const d = Math.hypot(x - t.x, y - (t.y - 10));
          if (d < err) err = d;
          if (y > WATER + 14 || x < -60) break;
        }
        if (err < best.err) best = { err, vx, vy };
      }
    }
    // wobble the perfect shot — pirates get sharper each level
    const fuzz = Math.max(0.15 - level * 0.025, 0.03);
    const speed = Math.hypot(best.vx, best.vy);
    const ang = Math.atan2(best.vy, best.vx) + (Math.random() * 2 - 1) * fuzz * 1.4;
    const pow = speed * (1 + (Math.random() * 2 - 1) * fuzz);
    fire(u, Math.cos(ang) * pow, Math.sin(ang) * pow);
  }

  // ---------- combat ----------
  function splash(x, y, big) {
    sfx.splash();
    const n = big ? 26 : 14;
    for (let i = 0; i < n; i++) {
      particles.push({
        x, y: WATER + 4,
        vx: (Math.random() - 0.5) * (big ? 7 : 4),
        vy: -Math.random() * (big ? 9 : 6) - 2,
        life: 40 + Math.random() * 20,
        r: 2 + Math.random() * 3,
        color: "rgba(210,240,255,0.9)",
      });
    }
  }

  function poof(x, y, color) {
    for (let i = 0; i < 12; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 1,
        life: 22 + Math.random() * 14,
        r: 2 + Math.random() * 3,
        color,
      });
    }
  }

  function award(amount, x, y) {
    onCash?.(amount);
    floaters.push({ x, y: y - 50, txt: "+$" + amount, life: 65, color: "#ffd257" });
    sfx.cash();
  }

  function applyDamage(u, dmg, kb, creditTeam) {
    u.hp -= dmg;
    u.kbVel += kb;
    floaters.push({ x: u.x, y: u.y - 55, txt: "-" + dmg, life: 55, color: "#ff5a4e" });
    if (creditTeam === "player") award(CASH_PER_HIT, u.x, u.y);
    if (u.hp <= 0) drown(u, creditTeam);
  }

  function hitUnit(u, b) {
    const speed = Math.hypot(b.vx, b.vy);
    const dmg = Math.min(Math.max(Math.round((8 + speed * 2.1) * b.w.dmg), 10), 150);
    poof(b.x, b.y, "rgba(255,220,120,0.95)");
    sfx.hit();
    shake = 8;
    applyDamage(u, dmg, b.vx * 0.85 * b.w.kb, b.team);
  }

  function explode(x, y, b) {
    sfx.boom();
    shake = 16;
    for (let i = 0; i < 32; i++) {
      const colors = ["rgba(255,150,40,0.95)", "rgba(255,210,80,0.95)", "rgba(130,130,130,0.8)"];
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 2,
        life: 24 + Math.random() * 20,
        r: 3 + Math.random() * 4,
        color: colors[i % 3],
      });
    }
    const speed = Math.hypot(b.vx, b.vy);
    for (const u of units) {
      if (!u.alive || u.team === b.team) continue;
      const d = Math.hypot(u.x - x, u.y - y);
      if (d > b.w.aoe) continue;
      const fall = 1 - 0.65 * (d / b.w.aoe);
      const dmg = Math.min(Math.max(Math.round((8 + speed * 2.1) * b.w.dmg * fall), 10), 150);
      const dir = Math.sign(u.x - x) || (b.vx >= 0 ? 1 : -1);
      applyDamage(u, dmg, dir * (5 + speed * 0.6) * fall * b.w.kb * 0.5, b.team);
    }
    if (y > WATER - 8) splash(x, WATER, true);
  }

  function drown(u, creditTeam) {
    u.alive = false;
    u.sink = 0;
    splash(u.x, WATER, true);
    sfx.ko();
    if (creditTeam === "player") {
      onPirateSunk?.();
      award(CASH_PER_KO, u.x, u.y - 20);
    }
  }

  function endShot() {
    ball = null;
    if (!aliveUnits("enemy").length) {
      state = "done";
      sfx.win();
      onLevelWin?.();
      return;
    }
    if (!aliveUnits("player").length) {
      state = "done";
      sfx.lose();
      onGameOver?.();
      return;
    }
    state = "between";
    timer = 45;
  }

  // ---------- update ----------
  function update() {
    frame++;
    if (shake > 0) shake *= 0.85;
    if (banner.t > 0) banner.t--;

    for (const c of clouds) {
      c.x += c.v;
      if (c.x > W + 120) c.x = -140;
    }

    for (const r of rafts) {
      r.y = WATER + 4 + Math.sin(frame * 0.022 + r.phase) * 3;
      if (r.vx) {
        r.x += r.vx;
        if (r.x < 480 || r.x > 870) r.vx = -r.vx;
      }
    }
    for (const u of units) {
      if (u.kbVel) {
        u.off += u.kbVel;
        u.kbVel *= 0.82;
        if (Math.abs(u.kbVel) < 0.05) u.kbVel = 0;
        if (u.alive && Math.abs(u.baseOff + u.off) > u.raft.w / 2 - 16) {
          drown(u, u.team === "player" ? "enemy" : "player"); // knocked overboard
          floaters.push({ x: u.x, y: u.y - 70, txt: "OVERBOARD!", life: 70, color: "#8fd8ff" });
        }
      }
      u.x = u.raft.x + u.baseOff + u.off;
      if (u.alive) {
        u.y = u.raft.y - 21 - u.h / 2 + Math.sin(frame * 0.05 + u.wobble) * 1.5;
      } else {
        u.sink += 1.4;
        u.y += 1.4;
      }
    }

    // if the active shooter drowned mid-turn (knockback), pass the turn
    if ((state === "aim" || state === "enemyThink") && activeUnit && !activeUnit.alive) {
      endShot();
    }

    if (state === "between" && --timer <= 0) {
      startTurn(turnTeam === "player" ? "enemy" : "player");
    }

    if (state === "enemyThink" && --timer <= 0) {
      enemyShoot(activeUnit);
    }

    if (state === "fly" && ball) {
      // substeps for reliable collision
      for (let s = 0; s < 2 && ball; s++) {
        ball.vy += (GRAV * ball.w.grav) / 2;
        ball.x += ball.vx / 2;
        ball.y += ball.vy / 2;
        ball.spin += ball.vx * 0.01;

        for (const u of units) {
          if (!u.alive || u.team === ball.team) continue;
          if (Math.hypot(ball.x - u.x, ball.y - u.y) < 30) {
            if (ball.w.aoe) explode(ball.x, ball.y, ball);
            else hitUnit(u, ball);
            endShot();
            break;
          }
        }
        if (!ball) break;
        if (ball.y > WATER + 6) {
          if (ball.w.aoe) explode(ball.x, ball.y, ball);
          else splash(ball.x, ball.y, false);
          endShot(); break;
        }
        if (ball.x < -50 || ball.x > W + 50 || ball.y > H + 50) { endShot(); break; }
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += 0.25; p.x += p.vx; p.y += p.vy;
      if (--p.life <= 0 || p.y > WATER + 40) particles.splice(i, 1);
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.y -= 0.7;
      if (--f.life <= 0) floaters.splice(i, 1);
    }
  }

  // ---------- drawing ----------
  function drawBackground() {
    const sky = cx.createLinearGradient(0, 0, 0, WATER);
    sky.addColorStop(0, "#7ec8f0");
    sky.addColorStop(0.7, "#c8ecfa");
    sky.addColorStop(1, "#eaf8ff");
    cx.fillStyle = sky;
    cx.fillRect(0, 0, W, WATER);

    cx.drawImage(IMG.sun, W - 165, 25, 110, 110);
    for (const c of clouds) cx.drawImage(IMG.cloud, c.x, c.y, 160 * c.s, 70 * c.s);
    cx.globalAlpha = 0.85;
    cx.drawImage(IMG.island, 380, WATER - 96, 200, 108);
    cx.globalAlpha = 1;

    const sea = cx.createLinearGradient(0, WATER, 0, H);
    sea.addColorStop(0, "#2f8fc4");
    sea.addColorStop(1, "#0d4d78");
    cx.fillStyle = sea;
    cx.fillRect(0, WATER, W, H - WATER);
  }

  function drawWaves(front) {
    cx.beginPath();
    const amp = front ? 5 : 3.5;
    const yBase = front ? WATER + 14 : WATER;
    const speed = front ? 0.05 : 0.03;
    cx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      cx.lineTo(x, yBase + Math.sin(x * 0.02 + frame * speed) * amp);
    }
    cx.lineTo(W, H);
    cx.closePath();
    cx.fillStyle = front ? "rgba(46,143,196,0.55)" : "rgba(120,200,235,0.5)";
    cx.fill();
  }

  function drawUnit(u) {
    if (!u.alive && u.sink > 130) return;
    cx.save();
    if (!u.alive) {
      cx.globalAlpha = Math.max(1 - u.sink / 120, 0);
      cx.translate(u.x, u.y);
      cx.rotate(u.team === "player" ? -0.6 : 0.6);
      cx.translate(-u.x, -u.y);
    }
    const img = u.team === "player" ? IMG.player : IMG.enemy;
    cx.drawImage(img, u.x - u.w / 2, u.y - u.h / 2, u.w, u.h);
    cx.restore();

    if (u.alive) {
      const bw = 44, bx = u.x - bw / 2, by = u.y - u.h / 2 - 14;
      cx.fillStyle = "rgba(0,0,0,0.45)";
      cx.fillRect(bx - 1, by - 1, bw + 2, 7);
      const pct = Math.max(u.hp / u.maxHp, 0);
      cx.fillStyle = pct > 0.5 ? "#5ad24e" : pct > 0.25 ? "#f5b21e" : "#ef4b3d";
      cx.fillRect(bx, by, bw * pct, 5);
      if (u === activeUnit && (state === "aim" || state === "enemyThink")) {
        const yy = by - 12 + Math.sin(frame * 0.15) * 2.5;
        cx.fillStyle = u.team === "player" ? "#2e6fd8" : "#c0392b";
        cx.beginPath();
        cx.moveTo(u.x - 7, yy - 8); cx.lineTo(u.x + 7, yy - 8); cx.lineTo(u.x, yy);
        cx.closePath(); cx.fill();
      }
    }
  }

  function drawAim() {
    if (state !== "aim" || !activeUnit || !activeUnit.alive) return;
    const { m, vx, vy, power } = aimFromMouse(activeUnit);

    // dotted trajectory preview (partial — keep some challenge)
    const pts = simulateShot(m.x, m.y, vx, vy, GRAV * weaponOf("player").grav).slice(0, 22);
    cx.fillStyle = "rgba(255,255,255,0.85)";
    pts.forEach((p, i) => {
      if (i % 2) return;
      cx.globalAlpha = 1 - i / 26;
      cx.beginPath();
      cx.arc(p.x, p.y, 3.2, 0, 7);
      cx.fill();
    });
    cx.globalAlpha = 1;

    const ang = Math.atan2(vy, vx), len = 18 + power * 3.2;
    const hue = 120 - (power / 19) * 120; // green -> red
    cx.strokeStyle = `hsl(${hue},85%,50%)`;
    cx.lineWidth = 5; cx.lineCap = "round";
    cx.beginPath();
    cx.moveTo(m.x, m.y);
    cx.lineTo(m.x + Math.cos(ang) * len, m.y + Math.sin(ang) * len);
    cx.stroke();
  }

  function drawFloaters() {
    if (banner.t > 0 && state !== "done") {
      cx.globalAlpha = Math.min(banner.t / 20, 1);
      cx.textAlign = "center";
      cx.font = "bold 30px 'Trebuchet MS', sans-serif";
      cx.fillStyle = turnTeam === "player" ? "#1b4fa8" : "#c0392b";
      cx.strokeStyle = "rgba(255,255,255,0.9)";
      cx.lineWidth = 6; cx.lineJoin = "round";
      cx.strokeText(banner.text, W / 2, 52);
      cx.fillText(banner.text, W / 2, 52);
      cx.globalAlpha = 1;
    }

    for (const f of floaters) {
      cx.globalAlpha = Math.min(f.life / 25, 1);
      cx.textAlign = "center";
      cx.font = "bold 19px 'Trebuchet MS', sans-serif";
      cx.strokeStyle = "rgba(0,0,0,0.55)"; cx.lineWidth = 4; cx.lineJoin = "round";
      cx.strokeText(f.txt, f.x, f.y);
      cx.fillStyle = f.color;
      cx.fillText(f.txt, f.x, f.y);
      cx.globalAlpha = 1;
    }
  }

  function draw() {
    cx.save();
    if (shake > 0.5) cx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

    drawBackground();
    drawWaves(false);

    for (const r of rafts) cx.drawImage(IMG[r.img], r.x - r.w / 2, r.y - 32, r.w, 64);
    for (const u of units) drawUnit(u);

    if (ball) {
      cx.save();
      cx.translate(ball.x, ball.y);
      cx.rotate(ball.w.rot ? Math.atan2(ball.vy, ball.vx) : ball.spin);
      cx.drawImage(IMG[ball.w.img], -ball.w.dw / 2, -ball.w.dh / 2, ball.w.dw, ball.w.dh);
      cx.restore();
    }

    drawWaves(true);

    for (const p of particles) {
      cx.globalAlpha = Math.min(p.life / 20, 1);
      cx.fillStyle = p.color;
      cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 7); cx.fill();
    }
    cx.globalAlpha = 1;

    drawAim();
    drawFloaters();
    cx.restore();
  }

  // ---------- input ----------
  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
  }

  function onPointerMove(e) { mouse = canvasPos(e); }

  function onPointerDown(e) {
    initAudio();
    mouse = canvasPos(e);
    if (state === "aim" && activeUnit && activeUnit.alive) {
      const a = aimFromMouse(activeUnit);
      fire(activeUnit, a.vx, a.vy);
    }
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerDown);

  // ---------- main loop ----------
  function loop() {
    if (destroyed) return;
    if (IMG) {
      update(); // turn logic self-gates on state, so "done" just keeps the water moving
      draw();
    } else {
      cx.fillStyle = "#0e2a3f"; cx.fillRect(0, 0, W, H);
      cx.fillStyle = "#fff"; cx.textAlign = "center";
      cx.font = "bold 24px sans-serif";
      cx.fillText("Loading…", W / 2, H / 2);
    }
    raf = requestAnimationFrame(loop);
  }

  loadImages().then(images => {
    if (destroyed) return;
    IMG = images;
  });
  setupLevel(level);
  loop();

  const engine = {
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      if (window.__rr === debug) delete window.__rr;
    },
  };

  // dev/test hook, same shape as the vanilla version
  const debug = {
    state: () => ({ state, level, enemies: aliveUnits("enemy").length, babies: aliveUnits("player").length }),
    units: () => units.map(u => ({ team: u.team, x: Math.round(u.x), y: Math.round(u.y), hp: u.hp, alive: u.alive })),
    ball: () => (ball ? { x: Math.round(ball.x), y: Math.round(ball.y), id: ball.w.id, team: ball.team } : null),
    shoot: (vx, vy) => { if (state === "aim" && activeUnit && activeUnit.alive) fire(activeUnit, vx, vy); },
    clearLevel: () => { for (const u of aliveUnits("enemy")) { u.alive = false; u.sink = 999; } ball = null; endShot(); },
    tick: n => { for (let i = 0; i < n && state !== "done"; i++) update(); },
  };
  window.__rr = debug;

  return engine;
}
