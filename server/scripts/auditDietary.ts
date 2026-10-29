import { SEED_RECIPES } from '../src/config/seedRecipes';

console.log('=== DIETARY CLASSIFICATION AUDIT ===');

const eggRecipes: string[] = [];
const meatFishRecipes: string[] = [];
const veganRecipes: string[] = [];
const vegetarianRecipes: string[] = [];
const eggetarianRecipes: string[] = [];
const nonVegRecipes: string[] = [];

SEED_RECIPES.forEach((r) => {
  const ingNames = r.ingredients.map(i => i.name.toLowerCase()).join(' | ');

  const containsEgg = r.ingredients.some(i => {
    const n = i.name.toLowerCase();
    return (/\b(egg|eggs|mayo|mayonnaise)\b/i.test(n) && !/\beggplant\b/i.test(n));
  });

  const containsMeatOrFish = r.ingredients.some(i => {
    // Strip negation qualifiers like "fish-free", "shrimp-paste free" before testing
    const n = i.name.toLowerCase().replace(/\b[\w-]+(?:free|less)\b/gi, '').replace(/\b(?:fish-free|shrimp-free|meat-free)\b/gi, '');
    return ['chicken', 'beef', 'pork', 'bacon', 'pancetta', 'fish', 'salmon',
      'shrimp', 'prawn', 'lamb', 'mutton', 'anchovy', 'tuna', 'meat',
      'gelatin', 'fish sauce', 'oyster sauce', 'bonito', 'crab',
      'squid', 'clam', 'ham', 'sausage', 'prosciutto', 'turkey'].some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(n));
  });

  const containsDairy = r.ingredients.some(i => {
    const n = i.name.toLowerCase();
    // Exclude plant milks/butters
    if (n.includes('coconut milk') || n.includes('almond milk') || n.includes('oat milk') || n.includes('peanut butter')) {
      return false;
    }
    return ['butter', 'ghee', 'milk', 'cream', 'cheese', 'paneer', 'yogurt',
      'curd', 'feta', 'parmesan', 'mozzarella', 'ricotta', 'cheddar',
      'mascarpone'].some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(n));
  });

  if (r.dietary === 'Vegan') veganRecipes.push(r.slug);
  if (r.dietary === 'Vegetarian') vegetarianRecipes.push(r.slug);
  if (r.dietary === 'Eggetarian') eggetarianRecipes.push(r.slug);
  if (r.dietary === 'Non-Vegetarian') nonVegRecipes.push(r.slug);

  if (containsEgg) {
    eggRecipes.push(`${r.slug} (${r.dietary})`);
    if (r.dietary === 'Vegetarian') {
      console.error(`🚨 INCONSISTENCY: Recipe "${r.slug}" has eggs but is labeled "Vegetarian"! Must be "Eggetarian" or "Non-Vegetarian".`);
    }
    if (r.dietary === 'Vegan') {
      console.error(`🚨 CRITICAL: Recipe "${r.slug}" has eggs but is labeled "Vegan"!`);
    }
  }

  if (containsMeatOrFish) {
    meatFishRecipes.push(`${r.slug} (${r.dietary})`);
    if (r.dietary === 'Vegetarian' || r.dietary === 'Vegan' || r.dietary === 'Eggetarian') {
      console.error(`🚨 CRITICAL: Recipe "${r.slug}" has meat/fish but is labeled "${r.dietary}"!`);
    }
  }

  if (containsDairy && r.dietary === 'Vegan') {
    console.error(`🚨 CRITICAL: Recipe "${r.slug}" has dairy (${ingNames}) but is labeled "Vegan"!`);
  }
});

console.log('\n--- Summary ---');
console.log(`Total Vegan: ${veganRecipes.length}`);
console.log(`Total Vegetarian: ${vegetarianRecipes.length}`);
console.log(`Total Eggetarian: ${eggetarianRecipes.length}`);
console.log(`Total Non-Vegetarian: ${nonVegRecipes.length}`);
console.log('\nRecipes with Egg:', eggRecipes);
console.log('\nRecipes with Meat/Fish:', meatFishRecipes);
