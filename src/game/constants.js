export const W = 960;
export const H = 540;
export const WATER = 400;   // waterline y
export const GRAV = 0.35;   // px / frame^2
export const MAX_LEVEL = 7;

export const CASH_PER_HIT = 75;
export const CASH_PER_KO = 400;
export const LEVEL_BONUS = 1000;

// weapons with finite ammo: how many shots on purchase, refill pack size, refill price
export const AMMO = {
  grenade: { initial: 3, refillQty: 3, refillPrice: 350 },
  rocket:  { initial: 2, refillQty: 2, refillPrice: 550 },
};

const _base = import.meta.env.BASE_URL;
export const ASSET_SOURCES = {
  player:    `${_base}assets/player.svg`,
  enemy:     `${_base}assets/enemy.svg`,
  enemyBoss: `${_base}assets/enemy-boss.svg`,
  raftP:     `${_base}assets/raft-player.svg`,
  raftE:     `${_base}assets/raft-enemy.svg`,
  ball:      `${_base}assets/ball.svg`,
  baseball:  `${_base}assets/baseball.svg`,
  grenade:   `${_base}assets/grenade.svg`,
  rocket:    `${_base}assets/rocket.svg`,
  cloud:     `${_base}assets/cloud.svg`,
  sun:       `${_base}assets/sun.svg`,
  island:    `${_base}assets/island.svg`,
};

// dmg/kb are multipliers on the tennis ball; aoe > 0 explodes on impact;
// grav < 1 flies flatter; dw/dh is in-flight sprite size
export const WEAPONS = [
  { id: "ball",     name: "Tennis Ball", price: 0,    dmg: 1,   kb: 1,   aoe: 0,  grav: 1,    img: "ball",     dw: 18, dh: 18, rot: false, blast: "—",    blurb: "Trusty and bouncy." },
  { id: "baseball", name: "Baseball",    price: 900,  dmg: 1.6, kb: 1.4, aoe: 0,  grav: 1,    img: "baseball", dw: 18, dh: 18, rot: false, blast: "—",    blurb: "Hits like a slugger." },
  { id: "grenade",  name: "Grenade",     price: 2600, dmg: 2.2, kb: 1.6, aoe: 75, grav: 1,    img: "grenade",  dw: 20, dh: 22, rot: false, blast: "WIDE", blurb: "Splash damage. Literally." },
  { id: "rocket",   name: "Rocket",      price: 6000, dmg: 3.2, kb: 2.2, aoe: 95, grav: 0.55, img: "rocket",   dw: 38, dh: 17, rot: true,  blast: "HUGE", blurb: "Flies flat. Ka-boom." },
];

export const LEVELS = {
  1: { hp: 40,  rafts: [{ x: 780, crew: 2 }] },
  2: { hp: 55,  rafts: [{ x: 660, crew: 1 }, { x: 850, crew: 2 }] },
  3: { hp: 70,  rafts: [{ x: 640, crew: 2 }, { x: 850, crew: 2 }] },
  4: { hp: 85,  rafts: [{ x: 630, crew: 2 }, { x: 855, crew: 3 }] },
  5: { hp: 100, rafts: [{ x: 600, crew: 3 }, { x: 848, crew: 3 }] },
  6: { hp: 118, rafts: [{ x: 640, crew: 2, vx: 0.55 }, { x: 855, crew: 3, vx: -0.4 }] },
  7: { hp: 138, rafts: [{ x: 600, crew: 3, vx: 0.75 }, { x: 845, crew: 3, vx: -0.65 }] },
};
