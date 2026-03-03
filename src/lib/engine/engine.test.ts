import { describe, it, expect } from 'vitest';
import { evaluateSubmission, validateSubmission } from './config-engine';

const config = { rounds: [{ roundNumber: 1, fields: [{ key: 'x', label: 'X', type: 'number', min: 0, max: 10 }], scoring: { weights: { x: 2 } } }] };

describe('config engine', () => {
  it('validates payload', () => {
    expect(validateSubmission(config, 1, { x: 3 })).toEqual({ x: 3 });
  });
  it('scores payload', () => {
    expect(evaluateSubmission(config, 1, { x: 4 }).score).toBe(8);
  });
});
