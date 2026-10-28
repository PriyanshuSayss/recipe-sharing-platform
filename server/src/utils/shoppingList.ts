import { roundToSignificantFigures, formatQuantity } from './scaling';

export interface RawIngredientInput {
  name: string;
  quantity: number;
  unit: string;
  recipeTitle?: string;
}

export interface AggregatedShoppingItem {
  id: string; // unique key: `${normalizedName}__${normalizedUnit}`
  name: string;
  normalizedName: string;
  quantity: number;
  displayQuantity: string;
  unit: string;
  recipeTitles: string[];
}

/**
 * Normalizes a unit for aggregation comparison.
 * e.g., 'cups' and 'cup' normalize to 'cup'; 'slices' and 'slice' to 'slice'.
 */
export function normalizeUnit(unit: string): string {
  const u = (unit || '').trim().toLowerCase();
  if (u === 'cups') return 'cup';
  if (u === 'pieces') return 'piece';
  if (u === 'cloves') return 'clove';
  if (u === 'slices') return 'slice';
  if (u === 'pinches') return 'pinch';
  if (u === 'cans') return 'can';
  if (u === 'sheets') return 'sheet';
  return u;
}

/**
 * Normalizes an ingredient name for grouping.
 * Strips punctuation, lowers case, trims whitespace.
 */
export function normalizeIngredientName(name: string): string {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Aggregates ingredients from multiple recipes.
 * Rule: Sum quantities ONLY when normalized ingredient name AND normalized unit match.
 * Incompatible units (e.g. 100g vs 2 cups) are kept as separate line items with their respective units.
 */
export function aggregateShoppingList(
  ingredients: RawIngredientInput[]
): AggregatedShoppingItem[] {
  const groups = new Map<string, AggregatedShoppingItem>();

  for (const item of ingredients) {
    if (!item.name || typeof item.quantity !== 'number' || item.quantity <= 0) {
      continue;
    }

    const normName = normalizeIngredientName(item.name);
    const normUnit = normalizeUnit(item.unit);
    const groupKey = `${normName}__${normUnit}`;

    const existing = groups.get(groupKey);

    if (existing) {
      // Same ingredient and same unit: sum quantities
      existing.quantity = roundToSignificantFigures(existing.quantity + item.quantity, 10);
      existing.displayQuantity = formatQuantity(existing.quantity);
      if (item.recipeTitle && !existing.recipeTitles.includes(item.recipeTitle)) {
        existing.recipeTitles.push(item.recipeTitle);
      }
    } else {
      // New ingredient or different unit for the same ingredient: separate item
      groups.set(groupKey, {
        id: groupKey,
        name: item.name.trim(),
        normalizedName: normName,
        quantity: roundToSignificantFigures(item.quantity, 10),
        displayQuantity: formatQuantity(item.quantity),
        unit: item.unit.trim(),
        recipeTitles: item.recipeTitle ? [item.recipeTitle] : [],
      });
    }
  }

  // Sort alphabetically by ingredient name
  return Array.from(groups.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
