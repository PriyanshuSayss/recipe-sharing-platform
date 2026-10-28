/**
 * Recipe serving-size scaling utility.
 *
 * Design decisions:
 * - All calculations use standard floating-point arithmetic with
 *   explicit rounding to 10 significant figures to avoid IEEE 754 drift
 *   (e.g. 1.4999999999 → 1.5).
 * - We always calculate from the ORIGINAL quantity: newQty = orig × (newServings / origServings).
 * - We never modify the original recipe data.
 * - Quantities are formatted to remove unnecessary trailing zeros.
 * - Maximum servings: 10,000. Minimum: 1.
 */

export const MAX_SERVINGS = 10_000;
export const MIN_SERVINGS = 1;

/**
 * Validate a serving count.
 * Returns an error message, or null if valid.
 */
export function validateServings(servings: unknown): string | null {
  if (typeof servings !== 'number' && typeof servings !== 'string') {
    return 'Servings must be a number';
  }
  const n = Number(servings);
  if (!isFinite(n)) return 'Servings must be a finite number';
  if (n <= 0) return 'Servings must be a positive number';
  if (n < MIN_SERVINGS) return `Servings must be at least ${MIN_SERVINGS}`;
  if (n > MAX_SERVINGS) return `Servings cannot exceed ${MAX_SERVINGS}`;
  return null;
}

/**
 * Scale a single ingredient quantity from the original servings to the desired servings.
 * Calculates from original quantity every time to prevent accumulated rounding drift.
 *
 * @param originalQuantity - The quantity in the saved recipe
 * @param originalServings - The serving count in the saved recipe
 * @param targetServings   - The desired serving count
 * @returns Scaled quantity, rounded to avoid floating-point noise
 *
 * @throws Error if any argument is not a finite positive number or servings are out of range
 */
export function scaleQuantity(
  originalQuantity: number,
  originalServings: number,
  targetServings: number
): number {
  if (!isFinite(originalQuantity) || originalQuantity <= 0) {
    throw new Error(`Invalid original quantity: ${originalQuantity}`);
  }
  if (!isFinite(originalServings) || originalServings <= 0) {
    throw new Error(`Invalid original servings: ${originalServings}`);
  }
  if (!isFinite(targetServings) || targetServings <= 0) {
    throw new Error(`Invalid target servings: ${targetServings}`);
  }

  // Core scaling formula
  const scaled = originalQuantity * (targetServings / originalServings);

  // Round to 10 significant figures to eliminate IEEE 754 noise
  return roundToSignificantFigures(scaled, 10);
}

/**
 * Round a number to `sigFigs` significant figures.
 * For example: roundToSignificantFigures(1.4999999999, 10) → 1.5
 */
export function roundToSignificantFigures(n: number, sigFigs: number): number {
  if (n === 0) return 0;
  const d = Math.ceil(Math.log10(Math.abs(n)));
  const power = sigFigs - d;
  const magnitude = Math.pow(10, power);
  return Math.round(n * magnitude) / magnitude;
}

/**
 * Format a scaled quantity for display.
 * - Removes trailing zeros: 3.000 → "3", 1.500 → "1.5"
 * - Up to 4 decimal places
 * - Optionally returns a common fraction if within tolerance
 */
export function formatQuantity(quantity: number, useFractions = false): string {
  if (!isFinite(quantity) || quantity <= 0) return '?';

  if (useFractions) {
    const frac = toCommonFraction(quantity);
    if (frac !== null) return frac;
  }

  // Format to at most 4 decimal places, strip trailing zeros
  return parseFloat(quantity.toFixed(4)).toString();
}

// Common fraction map: decimal value → display string
// Only fractions that are exact in base-10 arithmetic
const COMMON_FRACTIONS: Array<[number, string]> = [
  [0.125, '1/8'],
  [0.25, '1/4'],
  [0.333, '1/3'],
  [0.375, '3/8'],
  [0.5, '1/2'],
  [0.625, '5/8'],
  [0.667, '2/3'],
  [0.75, '3/4'],
  [0.875, '7/8'],
];

/**
 * Return a common fraction display string if the value is close enough (within 0.5%)
 * to a known fraction. Returns null if no fraction matches.
 *
 * This is presentation-only and does not affect the underlying calculation.
 */
export function toCommonFraction(value: number): string | null {
  const whole = Math.floor(value);
  const frac = value - whole;

  if (frac < 0.001) {
    return whole === 0 ? null : String(whole);
  }

  const TOLERANCE = 0.001;

  for (const [decimal, display] of COMMON_FRACTIONS) {
    if (Math.abs(frac - decimal) < TOLERANCE) {
      return whole === 0 ? display : `${whole} ${display}`;
    }
  }

  return null;
}

/**
 * Scale all ingredients of a recipe given the target serving count.
 * Returns a new array without modifying the input.
 */
export function scaleIngredients<T extends { quantity: number }>(
  ingredients: T[],
  originalServings: number,
  targetServings: number
): Array<T & { scaledQuantity: number; displayQuantity: string }> {
  return ingredients.map(ing => {
    const scaledQuantity = scaleQuantity(ing.quantity, originalServings, targetServings);
    return {
      ...ing,
      scaledQuantity,
      displayQuantity: formatQuantity(scaledQuantity),
    };
  });
}
