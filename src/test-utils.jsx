import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import playerReducer from './store/playerSlice.js';
import gameReducer from './store/gameSlice.js';

export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: { player: playerReducer, game: gameReducer },
    preloadedState,
  });
}

export function renderWithProviders(ui, {
  preloadedState = {},
  store = createTestStore(preloadedState),
  route = '/',
  ...renderOptions
} = {}) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>
          {children}
        </MemoryRouter>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
