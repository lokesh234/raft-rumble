import playerReducer, { addCash, buyWeapon, buyAmmo, useAmmo, equipWeapon, resetPlayer } from '../playerSlice.js';
import { WEAPONS, AMMO } from '../../game/constants.js';

const initial = { cash: 0, owned: { ball: true }, equippedId: 'ball', ammo: {} };
const baseball = WEAPONS.find(w => w.id === 'baseball');
const grenade = WEAPONS.find(w => w.id === 'grenade');
const rocket  = WEAPONS.find(w => w.id === 'rocket');

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
      const already = { ...initial, cash: baseball.price * 2, owned: { ball: true, baseball: true } };
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

    it('grants initial ammo when buying an ammo weapon', () => {
      const rich = { ...initial, cash: grenade.price };
      const state = playerReducer(rich, buyWeapon('grenade'));
      expect(state.ammo.grenade).toBe(AMMO.grenade.initial);
    });

    it('grants initial ammo for rockets', () => {
      const rich = { ...initial, cash: rocket.price };
      const state = playerReducer(rich, buyWeapon('rocket'));
      expect(state.ammo.rocket).toBe(AMMO.rocket.initial);
    });

    it('does not add ammo for non-ammo weapons', () => {
      const rich = { ...initial, cash: baseball.price };
      const state = playerReducer(rich, buyWeapon('baseball'));
      expect(state.ammo.baseball).toBeUndefined();
    });
  });

  describe('buyAmmo', () => {
    const withGrenade = { ...initial, cash: AMMO.grenade.refillPrice, owned: { ball: true, grenade: true }, ammo: { grenade: 1 } };

    it('adds the refill quantity to ammo count', () => {
      const state = playerReducer(withGrenade, buyAmmo('grenade'));
      expect(state.ammo.grenade).toBe(1 + AMMO.grenade.refillQty);
    });

    it('deducts the refill price from cash', () => {
      const state = playerReducer(withGrenade, buyAmmo('grenade'));
      expect(state.cash).toBe(0);
    });

    it('does nothing without enough cash', () => {
      const broke = { ...withGrenade, cash: AMMO.grenade.refillPrice - 1 };
      const state = playerReducer(broke, buyAmmo('grenade'));
      expect(state.ammo.grenade).toBe(1);
      expect(state.cash).toBe(broke.cash);
    });

    it('does nothing if weapon is not owned', () => {
      const notOwned = { ...initial, cash: 9999 };
      const state = playerReducer(notOwned, buyAmmo('grenade'));
      expect(state.ammo.grenade).toBeUndefined();
    });

    it('does nothing for a non-ammo weapon id', () => {
      const state = playerReducer({ ...initial, cash: 9999 }, buyAmmo('baseball'));
      expect(state.cash).toBe(9999);
    });

    it('stacks with existing ammo', () => {
      const state1 = playerReducer(withGrenade, buyAmmo('grenade'));
      const state2 = playerReducer({ ...state1, cash: AMMO.grenade.refillPrice }, buyAmmo('grenade'));
      expect(state2.ammo.grenade).toBe(1 + AMMO.grenade.refillQty * 2);
    });
  });

  describe('useAmmo', () => {
    it('decrements the ammo count by 1', () => {
      const state = playerReducer({ ...initial, ammo: { grenade: 3 } }, useAmmo('grenade'));
      expect(state.ammo.grenade).toBe(2);
    });

    it('does not go below 0', () => {
      const state = playerReducer({ ...initial, ammo: { grenade: 0 } }, useAmmo('grenade'));
      expect(state.ammo.grenade).toBe(0);
    });

    it('does not affect other weapon ammo', () => {
      const state = playerReducer({ ...initial, ammo: { grenade: 3, rocket: 2 } }, useAmmo('grenade'));
      expect(state.ammo.rocket).toBe(2);
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
      const dirty = { cash: 5000, owned: { ball: true, baseball: true, grenade: true }, equippedId: 'grenade', ammo: { grenade: 1 } };
      expect(playerReducer(dirty, resetPlayer())).toEqual(initial);
    });
  });
});
