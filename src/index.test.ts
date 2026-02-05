import { describe, it, expect } from 'vitest';
import { VERSION, main } from './index.js';

describe('IRSB Solver', () => {
  it('should export version', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('should have main function', () => {
    expect(typeof main).toBe('function');
  });

  it('main should not throw', () => {
    expect(() => {
      main();
    }).not.toThrow();
  });
});
