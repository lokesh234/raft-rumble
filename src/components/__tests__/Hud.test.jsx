import { screen } from '@testing-library/react';
import Hud from '../Hud.jsx';
import { renderWithProviders } from '../../test-utils.jsx';
import { MAX_LEVEL } from '../../game/constants.js';

function state(level = 1, cash = 0, equippedId = 'ball', owned = { ball: true }) {
  return {
    game: { level, levelsCleared: 0, shotsFired: 0, piratesSunk: 0 },
    player: { cash, owned, equippedId },
  };
}

describe('Hud', () => {
  it('shows the current level and max level', () => {
    renderWithProviders(<Hud />, { preloadedState: state(2) });
    expect(screen.getByText(`LEVEL 2 / ${MAX_LEVEL}`)).toBeInTheDocument();
  });

  it('shows level 1 by default', () => {
    renderWithProviders(<Hud />, { preloadedState: state(1) });
    expect(screen.getByText(`LEVEL 1 / ${MAX_LEVEL}`)).toBeInTheDocument();
  });

  it('shows the current cash', () => {
    renderWithProviders(<Hud />, { preloadedState: state(1, 750) });
    expect(screen.getByText('$750')).toBeInTheDocument();
  });

  it('shows $0 cash when broke', () => {
    renderWithProviders(<Hud />, { preloadedState: state() });
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('shows the equipped weapon name in uppercase', () => {
    renderWithProviders(<Hud />, { preloadedState: state(1, 0, 'ball', { ball: true }) });
    expect(screen.getByText(/TENNIS BALL/)).toBeInTheDocument();
  });

  it('shows the correct weapon when baseball is equipped', () => {
    renderWithProviders(<Hud />, {
      preloadedState: state(1, 0, 'baseball', { ball: true, baseball: true }),
    });
    expect(screen.getByText(/BASEBALL/)).toBeInTheDocument();
  });

  it('falls back to the ball when equipped id is unrecognised', () => {
    renderWithProviders(<Hud />, {
      preloadedState: state(1, 0, 'does-not-exist', { ball: true }),
    });
    expect(screen.getByText(/TENNIS BALL/)).toBeInTheDocument();
  });

  it('shows the keys hint', () => {
    renderWithProviders(<Hud />, { preloadedState: state() });
    expect(screen.getByText(/keys 1-4/i)).toBeInTheDocument();
  });
});
