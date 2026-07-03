import { screen, fireEvent } from '@testing-library/react';
import Shop from '../Shop.jsx';
import { renderWithProviders } from '../../test-utils.jsx';
import { WEAPONS } from '../../game/constants.js';

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

function defaultState(overrides = {}) {
  return {
    player: { cash: 0, owned: { ball: true }, equippedId: 'ball' },
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
      preloadedState: defaultState({ player: { cash: 750, owned: { ball: true }, equippedId: 'ball' } }),
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
        player: { cash: 0, owned: { ball: true, baseball: true }, equippedId: 'ball' },
      }),
    });
    expect(screen.getByText('CLICK TO EQUIP')).toBeInTheDocument();
  });

  it('buys a weapon when the player has enough cash', () => {
    const { store } = renderWithProviders(<Shop />, {
      preloadedState: defaultState({ player: { cash: baseball.price, owned: { ball: true }, equippedId: 'ball' } }),
    });
    fireEvent.click(screen.getByRole('button', { name: /baseball/i }));
    expect(store.getState().player.owned.baseball).toBe(true);
    expect(store.getState().player.cash).toBe(0);
  });

  it('equips an owned weapon when clicked', () => {
    const { store } = renderWithProviders(<Shop />, {
      preloadedState: defaultState({
        player: { cash: 0, owned: { ball: true, baseball: true }, equippedId: 'ball' },
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
});
