import { screen } from '@testing-library/react';
import App from '../App.jsx';
import { renderWithProviders } from '../test-utils.jsx';

jest.mock('../game/sound.js', () => ({
  initAudio: jest.fn(),
  sfx: { cash: jest.fn(), buy: jest.fn(), deny: jest.fn() },
}));

jest.mock('../game/engine.js', () => ({
  createEngine: jest.fn(() => ({ destroy: jest.fn() })),
}));

describe('App routing', () => {
  it('renders TitleScreen at /', () => {
    renderWithProviders(<App />, { route: '/' });
    expect(screen.getByText('RAFT RUMBLE')).toBeInTheDocument();
  });

  it('renders GameScreen at /play', () => {
    renderWithProviders(<App />, { route: '/play' });
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders Shop at /shop', () => {
    renderWithProviders(<App />, { route: '/shop' });
    expect(screen.getByText('SUPPLY SHOP')).toBeInTheDocument();
  });

  it('renders Victory at /victory', () => {
    renderWithProviders(<App />, { route: '/victory' });
    expect(screen.getByText('YOU WIN!')).toBeInTheDocument();
  });

  it('redirects unknown routes to TitleScreen', () => {
    renderWithProviders(<App />, { route: '/does-not-exist' });
    expect(screen.getByText('RAFT RUMBLE')).toBeInTheDocument();
  });
});
