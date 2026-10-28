import { describe, it, expect } from 'vitest';
import {
  scaleQuantity,
  formatQuantity,
  validateServings,
  scaleIngredients,
  roundToSignificantFigures,
  toCommonFraction,
} from '../../src/utils/scaling';

describe('scaleQuantity', () => {
  it('scales 2 cups from 2 servings to 3 servings → 3', () => {
    expect(scaleQuantity(2, 2, 3)).toBe(3);
  });

  it('scales 1 cup from 2 servings to 3 servings → 1.5', () => {
    expect(scaleQuantity(1, 2, 3)).toBe(1.5);
  });

  it('scales 0.5 cups from 2 servings to 3 servings → 0.75', () => {
    expect(scaleQuantity(0.5, 2, 3)).toBe(0.75);
  });

  it('scales 2 eggs from 2 servings to 3 servings → 3', () => {
    expect(scaleQuantity(2, 2, 3)).toBe(3);
  });

  it('scales downward: 4 cups from 4 servings to 2 → 2', () => {
    expect(scaleQuantity(4, 4, 2)).toBe(2);
  });

  it('scales downward: 3 cups from 6 servings to 2 → 1', () => {
    expect(scaleQuantity(3, 6, 2)).toBe(1);
  });

  it('repeated scaling from original does not drift', () => {
    const original = 1;
    const origServings = 2;
    // Scale to 3 twice — both must return the same value
    const first = scaleQuantity(original, origServings, 3);
    const second = scaleQuantity(original, origServings, 3);
    expect(first).toBe(second);
    // Also verify no cumulative drift: scale to 7 servings
    const large = scaleQuantity(original, origServings, 7);
    expect(large).toBe(3.5);
  });

  it('throws on zero original servings', () => {
    expect(() => scaleQuantity(1, 0, 2)).toThrow();
  });

  it('throws on negative target servings', () => {
    expect(() => scaleQuantity(1, 2, -1)).toThrow();
  });

  it('throws on zero quantity', () => {
    expect(() => scaleQuantity(0, 2, 3)).toThrow();
  });

  it('throws on Infinity quantity', () => {
    expect(() => scaleQuantity(Infinity, 2, 3)).toThrow();
  });

  it('throws on NaN serving count', () => {
    expect(() => scaleQuantity(1, NaN, 3)).toThrow();
  });
});

describe('validateServings', () => {
  it('accepts valid serving counts', () => {
    expect(validateServings(1)).toBeNull();
    expect(validateServings(10)).toBeNull();
    expect(validateServings(100)).toBeNull();
    expect(validateServings(10000)).toBeNull();
  });

  it('rejects zero servings', () => {
    expect(validateServings(0)).toBeTruthy();
  });

  it('rejects negative servings', () => {
    expect(validateServings(-1)).toBeTruthy();
  });

  it('rejects Infinity', () => {
    expect(validateServings(Infinity)).toBeTruthy();
  });

  it('rejects NaN', () => {
    expect(validateServings(NaN)).toBeTruthy();
  });

  it('rejects servings exceeding maximum', () => {
    expect(validateServings(10001)).toBeTruthy();
  });
});

describe('formatQuantity', () => {
  it('removes trailing zeros: 3.000 → "3"', () => {
    expect(formatQuantity(3.0)).toBe('3');
  });

  it('removes trailing zeros: 1.500 → "1.5"', () => {
    expect(formatQuantity(1.5)).toBe('1.5');
  });

  it('shows 4 decimal places max', () => {
    const result = formatQuantity(1.23456789);
    expect(parseFloat(result)).toBeCloseTo(1.2346, 3);
  });

  it('handles small fractional values', () => {
    expect(formatQuantity(0.25)).toBe('0.25');
  });

  it('returns "?" for invalid values', () => {
    expect(formatQuantity(0)).toBe('?');
    expect(formatQuantity(-1)).toBe('?');
  });
});

describe('roundToSignificantFigures', () => {
  it('removes IEEE 754 drift: 1.4999999999 → 1.5', () => {
    expect(roundToSignificantFigures(1.4999999999, 10)).toBe(1.5);
  });

  it('preserves exact values', () => {
    expect(roundToSignificantFigures(3.14, 10)).toBe(3.14);
  });
});

describe('toCommonFraction', () => {
  it('converts 0.5 → "1/2"', () => {
    expect(toCommonFraction(0.5)).toBe('1/2');
  });

  it('converts 1.5 → "1 1/2"', () => {
    expect(toCommonFraction(1.5)).toBe('1 1/2');
  });

  it('converts 0.25 → "1/4"', () => {
    expect(toCommonFraction(0.25)).toBe('1/4');
  });

  it('returns null for values without common fraction', () => {
    expect(toCommonFraction(0.123)).toBeNull();
  });
});

describe('scaleIngredients', () => {
  it('scales a full ingredient array correctly', () => {
    const ingredients = [
      { name: 'Flour', quantity: 2, unit: 'cups' },
      { name: 'Milk', quantity: 1, unit: 'cups' },
      { name: 'Sugar', quantity: 0.5, unit: 'cups' },
      { name: 'Eggs', quantity: 2, unit: '' },
    ];

    const scaled = scaleIngredients(ingredients, 2, 3);

    expect(scaled[0].scaledQuantity).toBe(3);       // 2 × 3/2 = 3
    expect(scaled[1].scaledQuantity).toBe(1.5);     // 1 × 3/2 = 1.5
    expect(scaled[2].scaledQuantity).toBe(0.75);    // 0.5 × 3/2 = 0.75
    expect(scaled[3].scaledQuantity).toBe(3);       // 2 × 3/2 = 3

    // Display quantities should have no trailing zeros
    expect(scaled[0].displayQuantity).toBe('3');
    expect(scaled[1].displayQuantity).toBe('1.5');
    expect(scaled[2].displayQuantity).toBe('0.75');
    expect(scaled[3].displayQuantity).toBe('3');
  });

  it('does not modify the original ingredient objects', () => {
    const orig = [{ name: 'Salt', quantity: 1, unit: 'tsp' }];
    scaleIngredients(orig, 1, 3);
    expect(orig[0].quantity).toBe(1); // unchanged
  });
});
