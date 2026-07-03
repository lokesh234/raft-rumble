import { store } from '../store.js';

describe('Redux store', () => {
  it('has a player slice', () => {
    expect(store.getState()).toHaveProperty('player');
  });

  it('has a game slice', () => {
    expect(store.getState()).toHaveProperty('game');
  });

  it('player initial state is correct', () => {
    const { player } = store.getState();
    expect(player.cash).toBe(0);
    expect(player.owned).toEqual({ ball: true });
    expect(player.equippedId).toBe('ball');
  });

  it('game initial state is correct', () => {
    const { game } = store.getState();
    expect(game.level).toBe(1);
    expect(game.levelsCleared).toBe(0);
    expect(game.shotsFired).toBe(0);
    expect(game.piratesSunk).toBe(0);
  });

  it('dispatch returns an action object', () => {
    const result = store.dispatch({ type: '@@TEST' });
    expect(result).toBeDefined();
  });
});
