import { screen, fireEvent } from '@testing-library/react';
import Shop from '../Shop.jsx';
import { renderWithProviders } from '../../test-utils.jsx';
import { WEAPONS, AMMO } from '../../game/constants.js';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../game/sound.js', () => ({
  initAudio: jest.fn(),
  sfx: { cash: jest.fn(), buy: jest.fn(), deny: jest.fn() },
}));

const baseball = WEAPONS.find(w => w.id === 'baseball');
const grenade  = WEAPONS.find(w => w.id === 'grenade');

function defaultState(overrides = {}) {
  return {
    player: { cash: 0, owned: { ball: true }, equippedId: 'ball', ammo: {} },
    game: { level: 1, levelsCleared: 0, shotsFired: 0, piratesSunk: 0 },
    ...overrides,
  };
}

describe('Shop', () => {
  beforeEach(() => { mockNavigate.mockClear(); });

  it('renders all weapon cards', () => {
    renderWithProviders(<Shop />, { preloadedState: defaultState() });
    for (const w of WEAPONS) {
      expect(screen.getByText(w.name)).toBeInTheDocument();
    }
  });

  it('shows SUPPLY SHOP header', () => {
    renderWithProviders(<Shop />, { preloadedState: defaultState() });
    expect(screen.getByText('SUPPLY SHOP')).toBeInTheDocument();
  });

  it('shows current cash', () => {
    renderWithProviders(<Shop />, {
      preloadedState: defaultState({ player: { cash: 750, owned: { ball: true }, equippedId: 'ball', ammo: {} } }),
    });
    expect(screen.getByText('YOUR CASH: $750')).toBeInTheDocument();
  });

  it('shows EQUIPPED badge on the active weapon', () => {
    renderWithProviders(<Shop />, { preloadedState: defaultState() });
    expect(screen.getByText('EQUIPPED')).toBeInTheDocument();
  });

  it('shows buy price for unowned weapons', () => {
    renderWithProviders(<Shop />, { preloadedState: defaultState() });
    expect(screen.getByText(`BUY $${baseball.price}`)).toBeInTheDocument();
  });

  it('shows CLICK TO EQUIP for owned but unequipped weapons', () => {
    renderWithProviders(<Shop />, {
      preloadedState: defaultState({
        player: { cash: 0, owned: { ball: true, baseball: true }, equippedId: 'ball', ammo: {} },
      }),
    });
    expect(screen.getByText('CLICK TO EQUIP')).toBeInTheDocument();
  });

  it('buys a weapon when the player has enough cash', () => {
    const { store } = renderWithProviders(<Shop />, {
      preloadedState: defaultState({ player: { cash: baseball.price, owned: { ball: true }, equippedId: 'ball', ammo: {} } }),
    });
    fireEvent.click(screen.getByRole('button', { name: /baseball/i }));
    expect(store.getState().player.owned.baseball).toBe(true);
    expect(store.getState().player.cash).toBe(0);
  });

  it('equips an owned weapon when clicked', () => {
    const { store } = renderWithProviders(<Shop />, {
      preloadedState: defaultState({
        player: { cash: 0, owned: { ball: true, baseball: true }, equippedId: 'ball', ammo: {} },
      }),
    });
    fireEvent.click(screen.getByRole('button', { name: /baseball/i }));
    expect(store.getState().player.equippedId).toBe('baseball');
  });

  it('clicking START LEVEL navigates to /play', () => {
    renderWithProviders(<Shop />, { preloadedState: defaultState() });
    fireEvent.click(screen.getByRole('button', { name: /START LEVEL/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/play');
  });

  it('shows the current level in the navigate button', () => {
    renderWithProviders(<Shop />, {
      preloadedState: defaultState({
        game: { level: 3, levelsCleared: 2, shotsFired: 0, piratesSunk: 0 },
      }),
    });
    expect(screen.getByRole('button', { name: /START LEVEL 3/i })).toBeInTheDocument();
  });

  it('marks weapon card as aria-pressed when equipped', () => {
    renderWithProviders(<Shop />, { preloadedState: defaultState() });
    const ballCard = screen.getByRole('button', { name: /Tennis Ball/i });
    expect(ballCard).toHaveAttribute('aria-pressed', 'true');
  });

  describe('AmmoPanel', () => {
    const grenadeState = {
      player: { cash: 1000, owned: { ball: true, grenade: true }, equippedId: 'grenade', ammo: { grenade: 3 } },
      game: { level: 1, levelsCleared: 0, shotsFired: 0, piratesSunk: 0 },
    };

    it('is hidden when the ammo weapon is not yet owned', () => {
      renderWithProviders(<Shop />, { preloadedState: defaultState() });
      expect(screen.queryByText(/ammo left/)).not.toBeInTheDocument();
    });

    it('shows ammo count when ammo weapon is owned', () => {
      renderWithProviders(<Shop />, { preloadedState: grenadeState });
      expect(screen.getByText('3 ammo left')).toBeInTheDocument();
    });

    it('shows refill button with correct quantity and price', () => {
      renderWithProviders(<Shop />, { preloadedState: grenadeState });
      expect(screen.getByRole('button', { name: `+${AMMO.grenade.refillQty} for $${AMMO.grenade.refillPrice}` })).toBeInTheDocument();
    });

    it('buying ammo deducts cash and increases ammo count', () => {
      const { store } = renderWithProviders(<Shop />, { preloadedState: grenadeState });
      fireEvent.click(screen.getByRole('button', { name: /for \$/ }));
      expect(store.getState().player.ammo.grenade).toBe(3 + AMMO.grenade.refillQty);
      expect(store.getState().player.cash).toBe(1000 - AMMO.grenade.refillPrice);
    });

    it('does not buy ammo when player cannot afford it', () => {
      const broke = { ...grenadeState, player: { ...grenadeState.player, cash: 0 } };
      const { store } = renderWithProviders(<Shop />, { preloadedState: broke });
      fireEvent.click(screen.getByRole('button', { name: /for \$/ }));
      expect(store.getState().player.ammo.grenade).toBe(3);
    });

    it('shows ammo panels for both grenade and rocket when both are owned', () => {
      const both = {
        player: { cash: 0, owned: { ball: true, grenade: true, rocket: true }, equippedId: 'ball', ammo: { grenade: 2, rocket: 1 } },
        game: { level: 1, levelsCleared: 0, shotsFired: 0, piratesSunk: 0 },
      };
      renderWithProviders(<Shop />, { preloadedState: both });
      expect(screen.getByText('2 ammo left')).toBeInTheDocument();
      expect(screen.getByText('1 ammo left')).toBeInTheDocument();
    });
  });
});
