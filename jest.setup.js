import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

class MockAudioContext {
  get currentTime() { return 0; }
  get sampleRate() { return 44100; }
  get destination() { return {}; }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };
  }
  createGain() {
    return {
      gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
      connect: jest.fn(),
    };
  }
  createBuffer(channels, length) {
    return { getChannelData: () => new Float32Array(length) };
  }
  createBufferSource() {
    return { buffer: null, connect: jest.fn(), start: jest.fn() };
  }
  createBiquadFilter() {
    return { type: 'lowpass', frequency: { value: 0 }, connect: jest.fn() };
  }
}

global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

global.requestAnimationFrame = jest.fn(() => 1);
global.cancelAnimationFrame = jest.fn();

const mockContext = {
  fillRect: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  drawImage: jest.fn(),
  createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
};
HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);

class MockImage {
  set src(_) {
    if (this.onload) this.onload();
  }
}
global.Image = MockImage;
