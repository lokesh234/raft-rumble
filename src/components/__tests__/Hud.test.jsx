import { screen } from '@testing-library/react';
import Hud from '../Hud.jsx';
import { renderWithProviders } from '../../test-utils.jsx';
import { MAX_LEVEL, AMMO } from '../../game/constants.js';

function state(level = 1, cash = 0, equippedId = 'ball', owned = { ball: true }, ammo = {}) {
  return {
    game: { level, levelsCleared: 0, shotsFired: 0, piratesSunk: 0 },
    player: { cash, owned, equippedId, ammo },
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

  it('shows no ammo count for ball (unlimited)', () => {
    renderWithProviders(<Hud />, { preloadedState: state() });
    expect(screen.queryByText(/ammo/i)).not.toBeInTheDocument();
  });

  it('shows no ammo count for baseball (unlimited)', () => {
    renderWithProviders(<Hud />, {
      preloadedState: state(1, 0, 'baseball', { ball: true, baseball: true }),
    });
    expect(screen.queryByText(/ammo/i)).not.toBeInTheDocument();
  });

  it('shows ammo count when grenade is equipped', () => {
    renderWithProviders(<Hud />, {
      preloadedState: state(1, 0, 'grenade', { ball: true, grenade: true }, { grenade: 3 }),
    });
    expect(screen.getByText(/3 ammo/i)).toBeInTheDocument();
  });

  it('shows ammo count when rocket is equipped', () => {
    renderWithProviders(<Hud />, {
      preloadedState: state(1, 0, 'rocket', { ball: true, rocket: true }, { rocket: 2 }),
    });
    expect(screen.getByText(/2 ammo/i)).toBeInTheDocument();
  });

  it('falls back to showing ball when grenade ammo is depleted', () => {
    renderWithProviders(<Hud />, {
      preloadedState: state(1, 0, 'grenade', { ball: true, grenade: true }, { grenade: 0 }),
    });
    expect(screen.getByText(/TENNIS BALL/)).toBeInTheDocument();
  });

  it('shows an OUT badge with the weapon name when ammo is depleted', () => {
    renderWithProviders(<Hud />, {
      preloadedState: state(1, 0, 'grenade', { ball: true, grenade: true }, { grenade: 0 }),
    });
    expect(screen.getByText(/Grenade OUT/i)).toBeInTheDocument();
  });

  it('hides the ammo badge and shows OUT when rocket ammo is depleted', () => {
    renderWithProviders(<Hud />, {
      preloadedState: state(1, 0, 'rocket', { ball: true, rocket: true }, { rocket: 0 }),
    });
    expect(screen.queryByText(/ammo$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Rocket OUT/i)).toBeInTheDocument();
  });
});
