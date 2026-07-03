import { initAudio, sfx } from '../sound.js';

describe('sfx object', () => {
  it('has all expected sound methods', () => {
    const methods = ['fire', 'hit', 'splash', 'ko', 'cash', 'win', 'lose', 'boom', 'buy', 'deny'];
    for (const method of methods) {
      expect(typeof sfx[method]).toBe('function');
    }
  });

  it('sfx methods do not throw without an audio context', () => {
    expect(() => sfx.fire()).not.toThrow();
    expect(() => sfx.hit()).not.toThrow();
    expect(() => sfx.splash()).not.toThrow();
    expect(() => sfx.ko()).not.toThrow();
    expect(() => sfx.cash()).not.toThrow();
    expect(() => sfx.win()).not.toThrow();
    expect(() => sfx.lose()).not.toThrow();
    expect(() => sfx.boom()).not.toThrow();
    expect(() => sfx.buy()).not.toThrow();
    expect(() => sfx.deny()).not.toThrow();
  });
});

describe('initAudio', () => {
  it('is a function', () => {
    expect(typeof initAudio).toBe('function');
  });

  it('does not throw when called', () => {
    expect(() => initAudio()).not.toThrow();
  });

  it('after initAudio, sfx methods still do not throw', () => {
    initAudio();
    expect(() => sfx.fire()).not.toThrow();
    expect(() => sfx.boom()).not.toThrow();
    expect(() => sfx.win()).not.toThrow();
    expect(() => sfx.lose()).not.toThrow();
  });

  it('calling initAudio multiple times does not throw', () => {
    expect(() => {
      initAudio();
      initAudio();
      initAudio();
    }).not.toThrow();
  });
});
