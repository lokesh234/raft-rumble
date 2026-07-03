import { createSlice } from "@reduxjs/toolkit";
import { WEAPONS, AMMO } from "../game/constants.js";

const initialState = {
  cash: 0,
  owned: { ball: true },
  equippedId: "ball",
  ammo: {},
};

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    addCash(state, action) {
      state.cash += action.payload;
    },
    buyWeapon(state, action) {
      const weapon = WEAPONS.find(w => w.id === action.payload);
      if (!weapon || state.owned[weapon.id] || state.cash < weapon.price) return;
      state.cash -= weapon.price;
      state.owned[weapon.id] = true;
      state.equippedId = weapon.id;
      if (AMMO[weapon.id]) state.ammo[weapon.id] = AMMO[weapon.id].initial;
    },
    buyAmmo(state, action) {
      const id = action.payload;
      const cfg = AMMO[id];
      if (!cfg || !state.owned[id] || state.cash < cfg.refillPrice) return;
      state.cash -= cfg.refillPrice;
      state.ammo[id] = (state.ammo[id] ?? 0) + cfg.refillQty;
    },
    useAmmo(state, action) {
      const id = action.payload;
      if (state.ammo[id] > 0) state.ammo[id]--;
    },
    equipWeapon(state, action) {
      if (state.owned[action.payload]) state.equippedId = action.payload;
    },
    resetPlayer() {
      return initialState;
    },
  },
});

export const { addCash, buyWeapon, buyAmmo, useAmmo, equipWeapon, resetPlayer } = playerSlice.actions;
export default playerSlice.reducer;
