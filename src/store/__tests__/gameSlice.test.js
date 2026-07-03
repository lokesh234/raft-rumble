import gameReducer, { levelCleared, shotFired, pirateSunk, resetGame } from '../gameSlice.js';
import { MAX_LEVEL } from '../../game/constants.js';

const initial = { level: 1, levelsCleared: 0, shotsFired: 0, piratesSunk: 0 };

describe('gameSlice', () => {
  it('returns the initial state for an unknown action', () => {
    expect(gameReducer(undefined, { type: '@@INIT' })).toEqual(initial);
  });

  describe('levelCleared', () => {
    it('increments the level', () => {
      expect(gameReducer(initial, levelCleared()).level).toBe(2);
    });

    it('updates levelsCleared to the current level', () => {
      expect(gameReducer(initial, levelCleared()).levelsCleared).toBe(1);
    });

    it('does not exceed MAX_LEVEL', () => {
      const atMax = { ...initial, level: MAX_LEVEL };
      expect(gameReducer(atMax, levelCleared()).level).toBe(MAX_LEVEL);
    });

    it('levelsCleared tracks the highest level cleared', () => {
      const state = { ...initial, level: 3, levelsCleared: 2 };
      expect(gameReducer(state, levelCleared()).levelsCleared).toBe(3);
    });

    it('levelsCleared does not decrease', () => {
      const state = { ...initial, level: 2, levelsCleared: 4 };
      expect(gameReducer(state, levelCleared()).levelsCleared).toBe(4);
    });
  });

  describe('shotFired', () => {
    it('increments shotsFired by 1', () => {
      expect(gameReducer(initial, shotFired()).shotsFired).toBe(1);
    });

    it('accumulates across multiple shots', () => {
      let state = gameReducer(initial, shotFired());
      state = gameReducer(state, shotFired());
      expect(state.shotsFired).toBe(2);
    });
  });

  describe('pirateSunk', () => {
    it('increments piratesSunk by 1', () => {
      expect(gameReducer(initial, pirateSunk()).piratesSunk).toBe(1);
    });

    it('accumulates across multiple pirates', () => {
      let state = gameReducer(initial, pirateSunk());
      state = gameReducer(state, pirateSunk());
      state = gameReducer(state, pirateSunk());
      expect(state.piratesSunk).toBe(3);
    });
  });

  describe('resetGame', () => {
    it('resets all fields to initial values', () => {
      const dirty = { level: 4, levelsCleared: 3, shotsFired: 22, piratesSunk: 11 };
      expect(gameReducer(dirty, resetGame())).toEqual(initial);
    });
  });
});
