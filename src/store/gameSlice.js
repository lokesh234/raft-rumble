import { createSlice } from "@reduxjs/toolkit";
import { MAX_LEVEL } from "../game/constants.js";

const initialState = {
  level: 1,
  levelsCleared: 0,
  shotsFired: 0,
  piratesSunk: 0,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    levelCleared(state) {
      state.levelsCleared = Math.max(state.levelsCleared, state.level);
      if (state.level < MAX_LEVEL) state.level += 1;
    },
    shotFired(state) {
      state.shotsFired += 1;
    },
    pirateSunk(state) {
      state.piratesSunk += 1;
    },
    resetGame() {
      return initialState;
    },
  },
});

export const { levelCleared, shotFired, pirateSunk, resetGame } = gameSlice.actions;
export default gameSlice.reducer;
