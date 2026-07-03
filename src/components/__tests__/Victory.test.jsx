import { screen, fireEvent } from '@testing-library/react';
import Victory from '../Victory.jsx';
import { renderWithProviders } from '../../test-utils.jsx';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function defaultState(overrides = {}) {
  return {
    player: { cash: 0, owned: { ball: true }, equippedId: 'ball' },
    game: { level: 5, levelsCleared: 5, shotsFired: 0, piratesSunk: 0 },
    ...overrides,
  };
}

describe('Victory', () => {
  beforeEach(() => { mockNavigate.mockClear(); });

  it('renders YOU WIN!', () => {
    renderWithProviders(<Victory />, { preloadedState: defaultState() });
    expect(screen.getByText('YOU WIN!')).toBeInTheDocument();
  });

  it('renders the victory subtitle', () => {
    renderWithProviders(<Victory />, { preloadedState: defaultState() });
    expect(screen.getByText('The seas are yours.')).toBeInTheDocument();
  });

  it('shows the final cash haul', () => {
    renderWithProviders(<Victory />, {
      preloadedState: defaultState({ player: { cash: 12500, owned: { ball: true }, equippedId: 'ball' } }),
    });
    expect(screen.getByText('$12500')).toBeInTheDocument();
  });

  it('shows the number of pirates sunk', () => {
    renderWithProviders(<Victory />, {
      preloadedState: defaultState({ game: { level: 5, levelsCleared: 5, shotsFired: 30, piratesSunk: 15 } }),
    });
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('shows the number of shots thrown', () => {
    renderWithProviders(<Victory />, {
      preloadedState: defaultState({ game: { level: 5, levelsCleared: 5, shotsFired: 42, piratesSunk: 0 } }),
    });
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows a PLAY AGAIN button', () => {
    renderWithProviders(<Victory />, { preloadedState: defaultState() });
    expect(screen.getByRole('button', { name: 'PLAY AGAIN' })).toBeInTheDocument();
  });

  it('PLAY AGAIN resets game and player state', () => {
    const { store } = renderWithProviders(<Victory />, {
      preloadedState: {
        player: { cash: 8000, owned: { ball: true, baseball: true }, equippedId: 'baseball' },
        game: { level: 5, levelsCleared: 5, shotsFired: 40, piratesSunk: 20 },
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'PLAY AGAIN' }));
    const { game, player } = store.getState();
    expect(game.level).toBe(1);
    expect(game.shotsFired).toBe(0);
    expect(player.cash).toBe(0);
    expect(player.equippedId).toBe('ball');
  });

  it('PLAY AGAIN navigates to /', () => {
    renderWithProviders(<Victory />, { preloadedState: defaultState() });
    fireEvent.click(screen.getByRole('button', { name: 'PLAY AGAIN' }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
