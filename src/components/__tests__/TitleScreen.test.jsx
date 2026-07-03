import { screen, fireEvent } from '@testing-library/react';
import TitleScreen from '../TitleScreen.jsx';
import { renderWithProviders } from '../../test-utils.jsx';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../game/sound.js', () => ({
  initAudio: jest.fn(),
  sfx: { cash: jest.fn() },
}));

describe('TitleScreen', () => {
  beforeEach(() => { mockNavigate.mockClear(); });

  it('renders the game title', () => {
    renderWithProviders(<TitleScreen />);
    expect(screen.getByText('RAFT RUMBLE')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    renderWithProviders(<TitleScreen />);
    expect(screen.getByText(/Pirates want your raft/)).toBeInTheDocument();
  });

  it('renders the START GAME button', () => {
    renderWithProviders(<TitleScreen />);
    expect(screen.getByRole('button', { name: 'START GAME' })).toBeInTheDocument();
  });

  it('renders the aim hint text', () => {
    renderWithProviders(<TitleScreen />);
    expect(screen.getByText(/Aim with the mouse/)).toBeInTheDocument();
  });

  it('clicking START GAME navigates to /play', () => {
    renderWithProviders(<TitleScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'START GAME' }));
    expect(mockNavigate).toHaveBeenCalledWith('/play');
  });

  it('clicking START GAME resets game state', () => {
    const { store } = renderWithProviders(<TitleScreen />, {
      preloadedState: {
        game: { level: 4, levelsCleared: 3, shotsFired: 20, piratesSunk: 8 },
        player: { cash: 5000, owned: { ball: true, baseball: true }, equippedId: 'baseball' },
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'START GAME' }));
    const { game, player } = store.getState();
    expect(game.level).toBe(1);
    expect(game.shotsFired).toBe(0);
    expect(player.cash).toBe(0);
    expect(player.equippedId).toBe('ball');
  });
});
