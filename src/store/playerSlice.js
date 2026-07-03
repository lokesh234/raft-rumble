import { createSlice } from "@reduxjs/toolkit";
import { WEAPONS } from "../game/constants.js";

const initialState = {
  cash: 0,
  owned: { ball: true },
  equippedId: "ball",
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
    },
    equipWeapon(state, action) {
      if (state.owned[action.payload]) state.equippedId = action.payload;
    },
    resetPlayer() {
      return initialState;
    },
  },
});

export const { addCash, buyWeapon, equipWeapon, resetPlayer } = playerSlice.actions;
export default playerSlice.reducer;
