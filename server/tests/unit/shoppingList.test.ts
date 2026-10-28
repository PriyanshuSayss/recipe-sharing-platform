import { describe, it, expect } from 'vitest';
import {
  aggregateShoppingList,
  normalizeUnit,
  normalizeIngredientName,
} from '../../src/utils/shoppingList';

describe('normalizeUnit', () => {
  it('normalizes plural units to singular', () => {
    expect(normalizeUnit('cups')).toBe('cup');
    expect(normalizeUnit('pieces')).toBe('piece');
    expect(normalizeUnit('cloves')).toBe('clove');
    expect(normalizeUnit('slices')).toBe('slice');
    expect(normalizeUnit('pinches')).toBe('pinch');
    expect(normalizeUnit('cans')).toBe('can');
  });

  it('handles empty and untrimmed units', () => {
    expect(normalizeUnit('')).toBe('');
    expect(normalizeUnit('  tbsp  ')).toBe('tbsp');
  });
});

describe('normalizeIngredientName', () => {
  it('lowercases, trims, and cleans punctuation', () => {
    expect(normalizeIngredientName('  All-Purpose Flour! ')).toBe('all-purpose flour');
    expect(normalizeIngredientName('Eggs (large)')).toBe('eggs large');
  });
});

describe('aggregateShoppingList', () => {
  it('combines matching ingredients with identical units', () => {
    const list = aggregateShoppingList([
      { name: 'All-purpose flour', quantity: 2, unit: 'cups', recipeTitle: 'Pancakes' },
      { name: 'All-purpose flour', quantity: 1, unit: 'cup', recipeTitle: 'Cookies' },
    ]);

    expect(list).toHaveLength(1);
    expect(list[0].quantity).toBe(3);
    expect(list[0].displayQuantity).toBe('3');
    expect(list[0].recipeTitles).toContain('Pancakes');
    expect(list[0].recipeTitles).toContain('Cookies');
  });

  it('keeps incompatible units as separate items and never sums them together', () => {
    const list = aggregateShoppingList([
      { name: 'Sugar', quantity: 200, unit: 'g', recipeTitle: 'Cake' },
      { name: 'Sugar', quantity: 1, unit: 'cup', recipeTitle: 'Cookies' },
    ]);

    // Must be 2 separate items, NOT combined into 201
    expect(list).toHaveLength(2);
    const gramItem = list.find(i => i.unit === 'g');
    const cupItem = list.find(i => i.unit === 'cup');

    expect(gramItem).toBeDefined();
    expect(gramItem?.quantity).toBe(200);

    expect(cupItem).toBeDefined();
    expect(cupItem?.quantity).toBe(1);
  });

  it('handles multiple ingredients from multiple recipes', () => {
    const list = aggregateShoppingList([
      { name: 'Eggs', quantity: 2, unit: '', recipeTitle: 'Pancakes' },
      { name: 'Milk', quantity: 1, unit: 'cup', recipeTitle: 'Pancakes' },
      { name: 'Eggs', quantity: 3, unit: '', recipeTitle: 'Carbonara' },
      { name: 'Bacon', quantity: 150, unit: 'g', recipeTitle: 'Carbonara' },
    ]);

    expect(list).toHaveLength(3); // Eggs, Milk, Bacon
    const eggs = list.find(i => i.normalizedName === 'eggs');
    expect(eggs?.quantity).toBe(5); // 2 + 3 = 5
  });

  it('handles empty input gracefully', () => {
    expect(aggregateShoppingList([])).toEqual([]);
  });
});
