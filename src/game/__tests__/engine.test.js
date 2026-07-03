import { createEngine } from '../engine.js';
import { LEVELS } from '../constants.js';

jest.mock('../sound.js', () => ({
  sfx: {
    fire: jest.fn(),
    hit: jest.fn(),
    splash: jest.fn(),
    ko: jest.fn(),
    cash: jest.fn(),
    win: jest.fn(),
    lose: jest.fn(),
    boom: jest.fn(),
  },
  initAudio: jest.fn(),
}));

function makeCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  return canvas;
}

function makeOpts(overrides = {}) {
  return {
    level: 1,
    getWeaponId: jest.fn(() => 'ball'),
    onCash: jest.fn(),
    onShot: jest.fn(),
    onPirateSunk: jest.fn(),
    onLevelWin: jest.fn(),
    onGameOver: jest.fn(),
    ...overrides,
  };
}

describe('createEngine', () => {
  afterEach(() => { delete window.__rr; });

  it('returns an object with a destroy method', () => {
    const engine = createEngine(makeCanvas(), makeOpts());
    expect(engine).toHaveProperty('destroy');
    expect(typeof engine.destroy).toBe('function');
    engine.destroy();
  });

  it('populates window.__rr with the debug interface', () => {
    const engine = createEngine(makeCanvas(), makeOpts());
    expect(window.__rr).toBeDefined();
    expect(typeof window.__rr.state).toBe('function');
    expect(typeof window.__rr.units).toBe('function');
    expect(typeof window.__rr.ball).toBe('function');
    expect(typeof window.__rr.shoot).toBe('function');
    expect(typeof window.__rr.clearLevel).toBe('function');
    expect(typeof window.__rr.tick).toBe('function');
    engine.destroy();
  });

  it('initial game state is "aim"', () => {
    const engine = createEngine(makeCanvas(), makeOpts());
    expect(window.__rr.state().state).toBe('aim');
    engine.destroy();
  });

  it('initial state reflects the requested level', () => {
    const engine = createEngine(makeCanvas(), makeOpts({ level: 3 }));
    expect(window.__rr.state().level).toBe(3);
    engine.destroy();
  });

  it('ball is null before the first shot', () => {
    const engine = createEngine(makeCanvas(), makeOpts());
    expect(window.__rr.ball()).toBeNull();
    engine.destroy();
  });

  it('spawns 2 player units on every level', () => {
    const engine = createEngine(makeCanvas(), makeOpts());
    const players = window.__rr.units().filter(u => u.team === 'player');
    expect(players).toHaveLength(2);
    engine.destroy();
  });

  it('spawns the correct number of enemy units for level 1', () => {
    const engine = createEngine(makeCanvas(), makeOpts({ level: 1 }));
    const enemies = window.__rr.units().filter(u => u.team === 'enemy');
    const expected = LEVELS[1].rafts.reduce((sum, r) => sum + r.crew, 0);
    expect(enemies).toHaveLength(expected);
    engine.destroy();
  });

  it('all units start alive', () => {
    const engine = createEngine(makeCanvas(), makeOpts());
    for (const u of window.__rr.units()) {
      expect(u.alive).toBe(true);
    }
    engine.destroy();
  });

  it('shoot fires a ball for the player', () => {
    const engine = createEngine(makeCanvas(), makeOpts());
    window.__rr.shoot(-10, -8);
    const ball = window.__rr.ball();
    expect(ball).not.toBeNull();
    expect(ball.team).toBe('player');
    expect(ball.id).toBeDefined();
    engine.destroy();
  });

  it('tick advances game frame count without crashing', () => {
    const engine = createEngine(makeCanvas(), makeOpts());
    expect(() => window.__rr.tick(10)).not.toThrow();
    engine.destroy();
  });

  it('clearLevel marks all enemies as dead', () => {
    const engine = createEngine(makeCanvas(), makeOpts());
    window.__rr.clearLevel();
    const enemies = window.__rr.units().filter(u => u.team === 'enemy');
    for (const u of enemies) {
      expect(u.alive).toBe(false);
    }
    engine.destroy();
  });

  it('destroy removes event listeners from the canvas', () => {
    const canvas = makeCanvas();
    const removeSpy = jest.spyOn(canvas, 'removeEventListener');
    const engine = createEngine(canvas, makeOpts());
    engine.destroy();
    expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
  });

  it('destroy stops the animation loop', () => {
    const engine = createEngine(makeCanvas(), makeOpts());
    engine.destroy();
    expect(global.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('destroy clears window.__rr', () => {
    const engine = createEngine(makeCanvas(), makeOpts());
    engine.destroy();
    expect(window.__rr).toBeUndefined();
  });

  describe('ammo system', () => {
    it('uses the ball when grenade is equipped but getAmmo returns 0', () => {
      const engine = createEngine(makeCanvas(), makeOpts({
        getWeaponId: jest.fn(() => 'grenade'),
        getAmmo: jest.fn(() => 0),
      }));
      window.__rr.shoot(-10, -8);
      expect(window.__rr.ball().id).toBe('ball');
      engine.destroy();
    });

    it('uses the grenade when getAmmo returns a positive count', () => {
      const onUseAmmo = jest.fn();
      const engine = createEngine(makeCanvas(), makeOpts({
        getWeaponId: jest.fn(() => 'grenade'),
        getAmmo: jest.fn(() => 3),
        onUseAmmo,
      }));
      window.__rr.shoot(-10, -8);
      expect(window.__rr.ball().id).toBe('grenade');
      engine.destroy();
    });

    it('calls onUseAmmo when an ammo weapon is fired', () => {
      const onUseAmmo = jest.fn();
      const engine = createEngine(makeCanvas(), makeOpts({
        getWeaponId: jest.fn(() => 'grenade'),
        getAmmo: jest.fn(() => 2),
        onUseAmmo,
      }));
      window.__rr.shoot(-10, -8);
      expect(onUseAmmo).toHaveBeenCalledWith('grenade');
      engine.destroy();
    });

    it('does not call onUseAmmo when firing the ball', () => {
      const onUseAmmo = jest.fn();
      const engine = createEngine(makeCanvas(), makeOpts({ onUseAmmo }));
      window.__rr.shoot(-10, -8);
      expect(onUseAmmo).not.toHaveBeenCalled();
      engine.destroy();
    });

    it('does not call onUseAmmo for the enemy', () => {
      const onUseAmmo = jest.fn();
      const engine = createEngine(makeCanvas(), makeOpts({ onUseAmmo }));
      // advance to enemy turn
      window.__rr.shoot(-10, -8);
      window.__rr.tick(300); // let the shot resolve and enemy turn begin
      expect(onUseAmmo).not.toHaveBeenCalled();
      engine.destroy();
    });
  });
});
