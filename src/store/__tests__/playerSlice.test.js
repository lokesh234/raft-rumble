import playerReducer, { addCash, buyWeapon, equipWeapon, resetPlayer } from '../playerSlice.js';
import { WEAPONS } from '../../game/constants.js';

const initial = { cash: 0, owned: { ball: true }, equippedId: 'ball' };
const baseball = WEAPONS.find(w => w.id === 'baseball');
const grenade = WEAPONS.find(w => w.id === 'grenade');

describe('playerSlice', () => {
  it('returns the initial state for an unknown action', () => {
    expect(playerReducer(undefined, { type: '@@INIT' })).toEqual(initial);
  });

  describe('addCash', () => {
    it('adds amount to cash', () => {
      expect(playerReducer(initial, addCash(100)).cash).toBe(100);
    });

    it('accumulates across multiple additions', () => {
      let state = playerReducer(initial, addCash(100));
      state = playerReducer(state, addCash(250));
      expect(state.cash).toBe(350);
    });
  });

  describe('buyWeapon', () => {
    it('purchases weapon with sufficient cash', () => {
      const rich = { ...initial, cash: baseball.price };
      const state = playerReducer(rich, buyWeapon('baseball'));
      expect(state.owned.baseball).toBe(true);
      expect(state.cash).toBe(0);
      expect(state.equippedId).toBe('baseball');
    });

    it('does not purchase without sufficient cash', () => {
      const state = playerReducer(initial, buyWeapon('baseball'));
      expect(state.owned.baseball).toBeUndefined();
      expect(state.cash).toBe(0);
    });

    it('does not deduct cash for already-owned weapon', () => {
      const already = { cash: baseball.price * 2, owned: { ball: true, baseball: true }, equippedId: 'ball' };
      const state = playerReducer(already, buyWeapon('baseball'));
      expect(state.cash).toBe(baseball.price * 2);
    });

    it('does nothing for an unknown weapon id', () => {
      const rich = { ...initial, cash: 9999 };
      const state = playerReducer(rich, buyWeapon('unknown-weapon'));
      expect(state.cash).toBe(9999);
      expect(Object.keys(state.owned)).toEqual(['ball']);
    });

    it('equips the newly purchased weapon', () => {
      const rich = { ...initial, cash: grenade.price };
      const state = playerReducer(rich, buyWeapon('grenade'));
      expect(state.equippedId).toBe('grenade');
    });
  });

  describe('equipWeapon', () => {
    it('equips an owned weapon', () => {
      const ownsBoth = { ...initial, owned: { ball: true, baseball: true } };
      const state = playerReducer(ownsBoth, equipWeapon('baseball'));
      expect(state.equippedId).toBe('baseball');
    });

    it('does not equip an unowned weapon', () => {
      const state = playerReducer(initial, equipWeapon('baseball'));
      expect(state.equippedId).toBe('ball');
    });

    it('stays on current weapon when equipping same weapon', () => {
      const state = playerReducer(initial, equipWeapon('ball'));
      expect(state.equippedId).toBe('ball');
    });
  });

  describe('resetPlayer', () => {
    it('resets all fields to initial values', () => {
      const dirty = { cash: 5000, owned: { ball: true, baseball: true, grenade: true }, equippedId: 'grenade' };
      expect(playerReducer(dirty, resetPlayer())).toEqual(initial);
    });
  });
});
