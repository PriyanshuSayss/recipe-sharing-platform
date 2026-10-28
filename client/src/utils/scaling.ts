/**
 * Client-side serving-size scaling utility.
 * Mirrors the server-side scaling logic to avoid duplication.
 * All calculations use the same documented formula:
 *   newQuantity = originalQuantity × (targetServings / originalServings)
 */

export function scaleQuantity(
  originalQuantity: number,
  originalServings: number,
  targetServings: number
): number {
  if (!isFinite(originalQuantity) || originalQuantity <= 0) return 0;
  if (!isFinite(originalServings) || originalServings <= 0) return 0;
  if (!isFinite(targetServings) || targetServings <= 0) return 0;

  const scaled = originalQuantity * (targetServings / originalServings);
  return roundToSignificantFigures(scaled, 10);
}

function roundToSignificantFigures(n: number, sigFigs: number): number {
  if (n === 0) return 0;
  const d = Math.ceil(Math.log10(Math.abs(n)));
  const power = sigFigs - d;
  const magnitude = Math.pow(10, power);
  return Math.round(n * magnitude) / magnitude;
}

export function formatQuantity(quantity: number): string {
  if (!isFinite(quantity) || quantity <= 0) return '?';
  return parseFloat(quantity.toFixed(4)).toString();
}
