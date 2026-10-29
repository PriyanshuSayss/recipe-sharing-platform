import { SEED_RECIPES } from '../src/config/seedRecipes';
import { SUPPORTED_UNITS } from '../src/models/Recipe';

console.log('--- STARTING COMPREHENSIVE RECIPE AUDIT ---');
console.log(`Total seed recipes: ${SEED_RECIPES.length}`);

const MEAT_FISH_KEYWORDS = [
  'chicken', 'beef', 'pork', 'bacon', 'pancetta', 'fish', 'salmon',
  'shrimp', 'prawn', 'lamb', 'mutton', 'anchovy', 'tuna', 'meat',
  'gelatin', 'fish sauce', 'oyster sauce', 'bonito', 'dashi', 'crab',
  'squid', 'clam', 'ham', 'sausage', 'prosciutto', 'turkey'
];

const DAIRY_KEYWORDS = [
  'butter', 'ghee', 'milk', 'cream', 'cheese', 'paneer', 'yogurt',
  'curd', 'feta', 'parmesan', 'mozzarella', 'ricotta', 'cheddar',
  'mascarpone', 'whey', 'buttermilk'
];

const EGG_KEYWORDS = ['egg', 'eggs', 'mayo', 'mayonnaise'];

const HONEY_KEYWORDS = ['honey'];

let issuesCount = 0;

function reportIssue(slug: string, msg: string) {
  issuesCount++;
  console.error(`❌ [${slug}] ${msg}`);
}

const seenSlugs = new Set<string>();
const seenTitles = new Set<string>();

SEED_RECIPES.forEach((recipe, idx) => {
  // 1. Slugs & Titles uniqueness
  if (seenSlugs.has(recipe.slug)) {
    reportIssue(recipe.slug, `Duplicate slug found at index ${idx}`);
  }
  seenSlugs.add(recipe.slug);

  if (seenTitles.has(recipe.title.toLowerCase())) {
    reportIssue(recipe.slug, `Duplicate title "${recipe.title}" found at index ${idx}`);
  }
  seenTitles.add(recipe.title.toLowerCase());

  // 2. Units check
  recipe.ingredients.forEach((ing) => {
    if (!SUPPORTED_UNITS.includes(ing.unit as any)) {
      reportIssue(recipe.slug, `Unsupported unit: "${ing.unit}" in ingredient "${ing.name}"`);
    }
    if (typeof ing.quantity !== 'number' || isNaN(ing.quantity) || ing.quantity <= 0) {
      reportIssue(recipe.slug, `Invalid quantity: ${ing.quantity} for "${ing.name}"`);
    }
  });

  // 3. Instructions check
  if (!recipe.instructions || recipe.instructions.length === 0) {
    reportIssue(recipe.slug, `No instructions provided`);
  }
  recipe.instructions.forEach((step, sIdx) => {
    if (step.stepNumber !== sIdx + 1) {
      reportIssue(recipe.slug, `Instruction step number mismatch: expected ${sIdx + 1}, got ${step.stepNumber}`);
    }
    if (!step.text || step.text.trim().length === 0) {
      reportIssue(recipe.slug, `Empty instruction step at #${step.stepNumber}`);
    }
  });

  // 4. Dietary consistency check
  const ingredientNames = recipe.ingredients.map(i => (i.name + ' ' + i.normalizedName).toLowerCase()).join(' ');
  const instructionText = recipe.instructions.map(s => s.text.toLowerCase()).join(' ');
  const fullText = `${ingredientNames} ${instructionText}`;

  const hasMeat = MEAT_FISH_KEYWORDS.some(kw => {
    // Avoid false positives like "fish-free", "shrimp-free", "eggplant", etc.
    const textWithoutNegatives = fullText
      .replace(/fish-free/gi, '')
      .replace(/shrimp-free/gi, '')
      .replace(/shrimp-paste free/gi, '')
      .replace(/meat-free/gi, '')
      .replace(/kombu kelp dashi/gi, 'kombu seaweed kelp stock')
      .replace(/kombu dashi/gi, 'kombu seaweed kelp stock');
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(textWithoutNegatives);
  });

  const hasDairy = DAIRY_KEYWORDS.some(kw => {
    // Check for dairy, avoiding "peanut butter" or "coconut milk" or "almond milk"
    const regex = new RegExp(`(?<!peanut\\s|coconut\\s|almond\\s|oat\\s|soy\\s)\\b${kw}\\b`, 'i');
    return regex.test(fullText);
  });

  const hasEgg = EGG_KEYWORDS.some(kw => {
    // Avoid "eggplant"
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(ingredientNames) && !ingredientNames.includes('eggplant');
  });

  const hasHoney = HONEY_KEYWORDS.some(kw => {
    return new RegExp(`\\b${kw}\\b`, 'i').test(fullText);
  });

  // Vegan Checks: NO Meat, NO Dairy, NO Egg, NO Honey
  if (recipe.dietary === 'Vegan') {
    if (hasMeat) {
      reportIssue(recipe.slug, `Labeled Vegan but contains meat/fish/animal sauce keyword!`);
    }
    if (hasDairy) {
      reportIssue(recipe.slug, `Labeled Vegan but contains dairy keyword!`);
    }
    if (hasEgg) {
      reportIssue(recipe.slug, `Labeled Vegan but contains egg keyword!`);
    }
    if (hasHoney) {
      reportIssue(recipe.slug, `Labeled Vegan but contains honey! (Honey is not strictly vegan)`);
    }
  }

  // Vegetarian Checks: NO Meat
  if (recipe.dietary === 'Vegetarian') {
    if (hasMeat) {
      reportIssue(recipe.slug, `Labeled Vegetarian but contains meat/fish!`);
    }
    if (hasEgg) {
      reportIssue(recipe.slug, `Labeled Vegetarian but contains eggs (should be Eggetarian)!`);
    }
  }

  // Eggetarian Checks: Has Egg, NO Meat
  if (recipe.dietary === 'Eggetarian') {
    if (hasMeat) {
      reportIssue(recipe.slug, `Labeled Eggetarian but contains meat/fish!`);
    }
    if (!hasEgg) {
      reportIssue(recipe.slug, `Labeled Eggetarian but does not appear to contain eggs!`);
    }
  }

  // Non-Vegetarian Checks: SHOULD contain meat/fish
  if (recipe.dietary === 'Non-Vegetarian') {
    if (!hasMeat) {
      reportIssue(recipe.slug, `Labeled Non-Vegetarian but no meat/fish keywords detected! Verify ingredient list.`);
    }
  }
});

console.log(`\nAudit finished with ${issuesCount} potential issue(s).`);
