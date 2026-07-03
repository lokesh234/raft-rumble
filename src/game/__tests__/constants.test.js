import {
  W, H, WATER, GRAV, MAX_LEVEL,
  CASH_PER_HIT, CASH_PER_KO, LEVEL_BONUS,
  WEAPONS, LEVELS, ASSET_SOURCES, AMMO,
} from '../constants.js';

describe('canvas dimensions', () => {
  it('W is 960', () => expect(W).toBe(960));
  it('H is 540', () => expect(H).toBe(540));
  it('waterline is within canvas height', () => {
    expect(WATER).toBeGreaterThan(0);
    expect(WATER).toBeLessThan(H);
  });
});

describe('physics constants', () => {
  it('gravity is positive', () => expect(GRAV).toBeGreaterThan(0));
  it('MAX_LEVEL is 10', () => expect(MAX_LEVEL).toBe(10));
});

describe('cash constants', () => {
  it('all rewards are positive', () => {
    expect(CASH_PER_HIT).toBeGreaterThan(0);
    expect(CASH_PER_KO).toBeGreaterThan(0);
    expect(LEVEL_BONUS).toBeGreaterThan(0);
  });
  it('KO reward is greater than hit reward', () => {
    expect(CASH_PER_KO).toBeGreaterThan(CASH_PER_HIT);
  });
});

describe('WEAPONS', () => {
  it('has at least one weapon', () => expect(WEAPONS.length).toBeGreaterThan(0));

  it('first weapon is the free ball', () => {
    expect(WEAPONS[0].id).toBe('ball');
    expect(WEAPONS[0].price).toBe(0);
  });

  it('each weapon has all required fields', () => {
    const required = ['id', 'name', 'price', 'dmg', 'kb', 'aoe', 'grav', 'img', 'dw', 'dh', 'rot', 'blast', 'blurb'];
    for (const w of WEAPONS) {
      for (const field of required) {
        expect(w).toHaveProperty(field);
      }
    }
  });

  it('weapons are sorted by price ascending', () => {
    for (let i = 1; i < WEAPONS.length; i++) {
      expect(WEAPONS[i].price).toBeGreaterThanOrEqual(WEAPONS[i - 1].price);
    }
  });

  it('damage multipliers are positive', () => {
    for (const w of WEAPONS) {
      expect(w.dmg).toBeGreaterThan(0);
      expect(w.kb).toBeGreaterThan(0);
    }
  });

  it('grav values are in a sensible range', () => {
    for (const w of WEAPONS) {
      expect(w.grav).toBeGreaterThan(0);
      expect(w.grav).toBeLessThanOrEqual(1);
    }
  });
});

describe('LEVELS', () => {
  it('has an entry for every level up to MAX_LEVEL', () => {
    for (let i = 1; i <= MAX_LEVEL; i++) {
      expect(LEVELS[i]).toBeDefined();
    }
  });

  it('each level has hp and rafts array', () => {
    for (let i = 1; i <= MAX_LEVEL; i++) {
      expect(LEVELS[i]).toHaveProperty('hp');
      expect(Array.isArray(LEVELS[i].rafts)).toBe(true);
      expect(LEVELS[i].rafts.length).toBeGreaterThan(0);
    }
  });

  it('hp increases with each level', () => {
    for (let i = 2; i <= MAX_LEVEL; i++) {
      expect(LEVELS[i].hp).toBeGreaterThan(LEVELS[i - 1].hp);
    }
  });

  it('each raft entry has x and crew', () => {
    for (let i = 1; i <= MAX_LEVEL; i++) {
      for (const raft of LEVELS[i].rafts) {
        expect(raft).toHaveProperty('x');
        expect(raft).toHaveProperty('crew');
        expect(raft.crew).toBeGreaterThan(0);
      }
    }
  });

  it('levels 9 and 10 declare a playerVx for the moving raft', () => {
    expect(typeof LEVELS[9].playerVx).toBe('number');
    expect(typeof LEVELS[10].playerVx).toBe('number');
    expect(LEVELS[9].playerVx).toBeGreaterThan(0);
    expect(LEVELS[10].playerVx).toBeGreaterThan(0);
  });
});

describe('AMMO', () => {
  it('only defines ammo for grenade and rocket', () => {
    expect(Object.keys(AMMO)).toEqual(['grenade', 'rocket']);
  });

  it('each entry has initial, refillQty, and refillPrice', () => {
    for (const cfg of Object.values(AMMO)) {
      expect(cfg).toHaveProperty('initial');
      expect(cfg).toHaveProperty('refillQty');
      expect(cfg).toHaveProperty('refillPrice');
      expect(cfg.initial).toBeGreaterThan(0);
      expect(cfg.refillQty).toBeGreaterThan(0);
      expect(cfg.refillPrice).toBeGreaterThan(0);
    }
  });

  it('rocket costs more to refill than grenade', () => {
    expect(AMMO.rocket.refillPrice).toBeGreaterThan(AMMO.grenade.refillPrice);
  });
});

describe('ASSET_SOURCES', () => {
  it('has all required keys', () => {
    const required = ['player', 'enemy', 'raftP', 'raftE', 'ball', 'cloud', 'sun', 'island'];
    for (const key of required) {
      expect(ASSET_SOURCES).toHaveProperty(key);
    }
  });

  it('all sources are SVG paths', () => {
    for (const src of Object.values(ASSET_SOURCES)) {
      expect(src).toMatch(/\.svg$/);
    }
  });
});
