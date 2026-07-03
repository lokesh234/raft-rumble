import { screen, fireEvent, act } from '@testing-library/react';
import GameScreen from '../GameScreen.jsx';
import { renderWithProviders } from '../../test-utils.jsx';
import { LEVEL_BONUS, WEAPONS, MAX_LEVEL } from '../../game/constants.js';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

let capturedOpts = null;
const mockDestroy = jest.fn();
jest.mock('../../game/engine.js', () => ({
  createEngine: jest.fn((canvas, opts) => {
    capturedOpts = opts;
    return { destroy: mockDestroy };
  }),
}));

function defaultState(level = 1) {
  return {
    game: { level, levelsCleared: 0, shotsFired: 0, piratesSunk: 0 },
    player: { cash: 0, owned: { ball: true }, equippedId: 'ball', ammo: {} },
  };
}

describe('GameScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockDestroy.mockClear();
    capturedOpts = null;
  });

  it('renders a canvas element', () => {
    renderWithProviders(<GameScreen />, { preloadedState: defaultState() });
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('shows no outcome overlay on mount', () => {
    renderWithProviders(<GameScreen />, { preloadedState: defaultState() });
    expect(screen.queryByText('LEVEL CLEAR!')).not.toBeInTheDocument();
    expect(screen.queryByText('SOAKED!')).not.toBeInTheDocument();
  });

  it('shows win overlay after onLevelWin fires', () => {
    renderWithProviders(<GameScreen />, { preloadedState: defaultState() });
    act(() => { capturedOpts.onLevelWin(); });
    expect(screen.getByText('LEVEL CLEAR!')).toBeInTheDocument();
  });

  it('shows lose overlay after onGameOver fires', () => {
    renderWithProviders(<GameScreen />, { preloadedState: defaultState() });
    act(() => { capturedOpts.onGameOver(); });
    expect(screen.getByText('SOAKED!')).toBeInTheDocument();
  });

  it('win overlay includes the level bonus amount', () => {
    renderWithProviders(<GameScreen />, { preloadedState: defaultState() });
    act(() => { capturedOpts.onLevelWin(); });
    expect(screen.getByText(new RegExp(`\\+\\$${LEVEL_BONUS}`))).toBeInTheDocument();
  });

  it('non-final level win shows VISIT THE SHOP button', () => {
    renderWithProviders(<GameScreen />, { preloadedState: defaultState(1) });
    act(() => { capturedOpts.onLevelWin(); });
    expect(screen.getByRole('button', { name: 'VISIT THE SHOP' })).toBeInTheDocument();
  });

  it('final level win shows CLAIM VICTORY button', () => {
    renderWithProviders(<GameScreen />, { preloadedState: defaultState(MAX_LEVEL) });
    act(() => { capturedOpts.onLevelWin(); });
    expect(screen.getByRole('button', { name: 'CLAIM VICTORY' })).toBeInTheDocument();
  });

  it('lose overlay shows GEAR UP & RETRY button', () => {
    renderWithProviders(<GameScreen />, { preloadedState: defaultState() });
    act(() => { capturedOpts.onGameOver(); });
    expect(screen.getByRole('button', { name: /GEAR UP/i })).toBeInTheDocument();
  });

  it('calls engine.destroy when unmounted', () => {
    const { unmount } = renderWithProviders(<GameScreen />, { preloadedState: defaultState() });
    unmount();
    expect(mockDestroy).toHaveBeenCalled();
  });

  it('onCash dispatches addCash to the store', () => {
    const { store } = renderWithProviders(<GameScreen />, { preloadedState: defaultState() });
    act(() => { capturedOpts.onCash(300); });
    expect(store.getState().player.cash).toBe(300);
  });

  it('onShot dispatches shotFired to the store', () => {
    const { store } = renderWithProviders(<GameScreen />, { preloadedState: defaultState() });
    act(() => { capturedOpts.onShot(); });
    expect(store.getState().game.shotsFired).toBe(1);
  });

  it('onPirateSunk dispatches pirateSunk to the store', () => {
    const { store } = renderWithProviders(<GameScreen />, { preloadedState: defaultState() });
    act(() => { capturedOpts.onPirateSunk(); });
    expect(store.getState().game.piratesSunk).toBe(1);
  });

  it('onUseAmmo dispatches useAmmo to the store', () => {
    const { store } = renderWithProviders(<GameScreen />, {
      preloadedState: {
        game: { level: 1, levelsCleared: 0, shotsFired: 0, piratesSunk: 0 },
        player: { cash: 0, owned: { ball: true, grenade: true }, equippedId: 'grenade', ammo: { grenade: 3 } },
      },
    });
    act(() => { capturedOpts.onUseAmmo('grenade'); });
    expect(store.getState().player.ammo.grenade).toBe(2);
  });

  it('getAmmo returns current ammo for a weapon', () => {
    renderWithProviders(<GameScreen />, {
      preloadedState: {
        game: { level: 1, levelsCleared: 0, shotsFired: 0, piratesSunk: 0 },
        player: { cash: 0, owned: { ball: true, rocket: true }, equippedId: 'rocket', ammo: { rocket: 2 } },
      },
    });
    expect(capturedOpts.getAmmo('rocket')).toBe(2);
  });

  it('getAmmo returns 0 for a weapon with no ammo tracked', () => {
    renderWithProviders(<GameScreen />, { preloadedState: defaultState() });
    expect(capturedOpts.getAmmo('grenade')).toBe(0);
  });

  it('keyboard shortcut "1" equips the ball', () => {
    const { store } = renderWithProviders(<GameScreen />, {
      preloadedState: {
        game: { level: 1, levelsCleared: 0, shotsFired: 0, piratesSunk: 0 },
        player: { cash: 0, owned: { ball: true, baseball: true }, equippedId: 'baseball', ammo: {} },
      },
    });
    fireEvent.keyDown(window, { key: '1' });
    expect(store.getState().player.equippedId).toBe('ball');
  });

  it('keyboard shortcut "2" equips the baseball when owned', () => {
    const { store } = renderWithProviders(<GameScreen />, {
      preloadedState: {
        game: { level: 1, levelsCleared: 0, shotsFired: 0, piratesSunk: 0 },
        player: { cash: 0, owned: { ball: true, baseball: true }, equippedId: 'ball', ammo: {} },
      },
    });
    fireEvent.keyDown(window, { key: '2' });
    expect(store.getState().player.equippedId).toBe('baseball');
  });

  it('keyboard shortcut "2" does not equip baseball when not owned', () => {
    const { store } = renderWithProviders(<GameScreen />, { preloadedState: defaultState() });
    fireEvent.keyDown(window, { key: '2' });
    expect(store.getState().player.equippedId).toBe('ball');
  });

  it('VISIT THE SHOP button dispatches levelCleared and navigates', () => {
    const { store } = renderWithProviders(<GameScreen />, { preloadedState: defaultState(1) });
    act(() => { capturedOpts.onLevelWin(); });
    fireEvent.click(screen.getByRole('button', { name: 'VISIT THE SHOP' }));
    expect(store.getState().game.levelsCleared).toBe(1);
    expect(mockNavigate).toHaveBeenCalledWith('/shop');
  });

  it('CLAIM VICTORY dispatches levelCleared and navigates to /victory', () => {
    const { store } = renderWithProviders(<GameScreen />, { preloadedState: defaultState(MAX_LEVEL) });
    act(() => { capturedOpts.onLevelWin(); });
    fireEvent.click(screen.getByRole('button', { name: 'CLAIM VICTORY' }));
    expect(store.getState().game.levelsCleared).toBe(MAX_LEVEL);
    expect(mockNavigate).toHaveBeenCalledWith('/victory');
  });
});
