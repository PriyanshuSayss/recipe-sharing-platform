/**
 * Seed script — Plateful demo data.
 * Idempotent: existing demo users and recipes are reused, not duplicated.
 * Run with: npm run seed (from server/ directory)
 *
 * Demo credentials (hashed at runtime — no plaintext stored):
 *   alice@plateful.dev / Demo1234!
 *   bob@plateful.dev   / Demo1234!
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import argon2 from 'argon2';
import { User } from '../src/models/User';
import { Recipe } from '../src/models/Recipe';
import { Review } from '../src/models/Review';
import { config } from '../src/config/env';

const DEMO_PASSWORD = 'Demo1234!';

const demoUsers = [
  { displayName: 'Alice Chen', email: 'alice@plateful.dev' },
  { displayName: 'Bob Martinez', email: 'bob@plateful.dev' },
];

const demoRecipes = [
  {
    title: 'Classic Pancakes',
    slug: 'classic-pancakes',
    description:
      'Light, fluffy, golden pancakes that are perfect for weekend mornings. These come together in minutes and taste incredible with maple syrup and fresh berries.',
    originalServings: 4,
    cookingTimeMinutes: 20,
    tags: ['breakfast', 'quick', 'vegetarian', 'family'],
    imageUrl:
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
    ingredients: [
      { name: 'All-purpose flour', normalizedName: 'all-purpose flour', quantity: 2, unit: 'cups' },
      { name: 'Milk', normalizedName: 'milk', quantity: 1, unit: 'cups' },
      { name: 'Eggs', normalizedName: 'eggs', quantity: 2, unit: '' },
      { name: 'Butter', normalizedName: 'butter', quantity: 2, unit: 'tbsp' },
      { name: 'Sugar', normalizedName: 'sugar', quantity: 2, unit: 'tbsp' },
      { name: 'Baking powder', normalizedName: 'baking powder', quantity: 2, unit: 'tsp' },
      { name: 'Salt', normalizedName: 'salt', quantity: 0.5, unit: 'tsp' },
    ],
    instructions: [
      { stepNumber: 1, text: 'Whisk together flour, sugar, baking powder, and salt in a large bowl.' },
      { stepNumber: 2, text: 'In a separate bowl, beat eggs, milk, and melted butter.' },
      { stepNumber: 3, text: 'Pour wet ingredients into dry ingredients and stir until just combined — do not overmix.' },
      { stepNumber: 4, text: 'Heat a non-stick griddle or pan over medium heat. Lightly grease with butter.' },
      { stepNumber: 5, text: 'Pour approximately 1/4 cup batter per pancake. Cook until bubbles form on surface, then flip.' },
      { stepNumber: 6, text: 'Cook the other side until golden, about 1–2 minutes. Serve immediately.' },
    ],
  },
  {
    title: 'Spaghetti Carbonara',
    slug: 'spaghetti-carbonara',
    description:
      'Authentic Roman pasta carbonara with crispy pancetta, silky egg sauce, and generous Parmesan. No cream needed — the secret is technique.',
    originalServings: 2,
    cookingTimeMinutes: 25,
    tags: ['pasta', 'italian', 'dinner', 'quick'],
    imageUrl:
      'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
    ingredients: [
      { name: 'Spaghetti', normalizedName: 'spaghetti', quantity: 200, unit: 'g' },
      { name: 'Pancetta or bacon', normalizedName: 'pancetta or bacon', quantity: 150, unit: 'g' },
      { name: 'Eggs', normalizedName: 'eggs', quantity: 3, unit: '' },
      { name: 'Parmesan cheese', normalizedName: 'parmesan cheese', quantity: 100, unit: 'g' },
      { name: 'Black pepper', normalizedName: 'black pepper', quantity: 1, unit: 'tsp' },
      { name: 'Salt', normalizedName: 'salt', quantity: 1, unit: 'tsp' },
    ],
    instructions: [
      { stepNumber: 1, text: 'Cook spaghetti in salted boiling water until al dente. Reserve 1 cup pasta water.' },
      { stepNumber: 2, text: 'Fry pancetta in a large pan until crispy. Remove from heat.' },
      { stepNumber: 3, text: 'Whisk eggs, grated Parmesan, and black pepper together in a bowl.' },
      { stepNumber: 4, text: 'Add hot drained pasta to the pancetta pan. Toss off the heat.' },
      { stepNumber: 5, text: 'Add egg mixture gradually, tossing continuously. Add pasta water as needed for a silky sauce.' },
      { stepNumber: 6, text: 'Serve immediately topped with extra Parmesan and freshly cracked pepper.' },
    ],
  },
  {
    title: 'Honey Garlic Salmon',
    slug: 'honey-garlic-salmon',
    description:
      'Perfectly seared salmon fillets glazed with a sticky honey-garlic sauce. Ready in under 20 minutes, this dish is weeknight dinner perfection.',
    originalServings: 4,
    cookingTimeMinutes: 18,
    tags: ['fish', 'dinner', 'healthy', 'quick', 'gluten-free'],
    imageUrl:
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    ingredients: [
      { name: 'Salmon fillets', normalizedName: 'salmon fillets', quantity: 4, unit: 'piece' },
      { name: 'Honey', normalizedName: 'honey', quantity: 3, unit: 'tbsp' },
      { name: 'Soy sauce', normalizedName: 'soy sauce', quantity: 2, unit: 'tbsp' },
      { name: 'Garlic cloves', normalizedName: 'garlic cloves', quantity: 4, unit: 'clove' },
      { name: 'Butter', normalizedName: 'butter', quantity: 1, unit: 'tbsp' },
      { name: 'Lemon juice', normalizedName: 'lemon juice', quantity: 1, unit: 'tbsp' },
      { name: 'Olive oil', normalizedName: 'olive oil', quantity: 1, unit: 'tbsp' },
    ],
    instructions: [
      { stepNumber: 1, text: 'Pat salmon fillets dry and season with salt and pepper.' },
      { stepNumber: 2, text: 'Whisk together honey, soy sauce, lemon juice, and minced garlic.' },
      { stepNumber: 3, text: 'Heat olive oil and butter in an oven-safe skillet over medium-high heat.' },
      { stepNumber: 4, text: 'Sear salmon skin-side up for 3 minutes until golden. Flip carefully.' },
      { stepNumber: 5, text: 'Pour honey-garlic sauce over salmon. Cook 2 more minutes, basting frequently.' },
      { stepNumber: 6, text: 'Transfer to oven at 200°C (400°F) for 5 minutes if thicker fillets. Serve immediately.' },
    ],
  },
  {
    title: 'Chocolate Chip Cookies',
    slug: 'chocolate-chip-cookies',
    description:
      'The ultimate chewy chocolate chip cookies with crispy edges, soft centers, and perfectly melted chocolate pools. This recipe has been perfected over years.',
    originalServings: 24,
    cookingTimeMinutes: 35,
    tags: ['baking', 'dessert', 'cookies', 'vegetarian'],
    imageUrl:
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80',
    ingredients: [
      { name: 'All-purpose flour', normalizedName: 'all-purpose flour', quantity: 2.25, unit: 'cups' },
      { name: 'Butter', normalizedName: 'butter', quantity: 1, unit: 'cups' },
      { name: 'Brown sugar', normalizedName: 'brown sugar', quantity: 0.75, unit: 'cups' },
      { name: 'Granulated sugar', normalizedName: 'granulated sugar', quantity: 0.75, unit: 'cups' },
      { name: 'Eggs', normalizedName: 'eggs', quantity: 2, unit: '' },
      { name: 'Vanilla extract', normalizedName: 'vanilla extract', quantity: 2, unit: 'tsp' },
      { name: 'Baking soda', normalizedName: 'baking soda', quantity: 1, unit: 'tsp' },
      { name: 'Salt', normalizedName: 'salt', quantity: 1, unit: 'tsp' },
      { name: 'Chocolate chips', normalizedName: 'chocolate chips', quantity: 2, unit: 'cups' },
    ],
    instructions: [
      { stepNumber: 1, text: 'Preheat oven to 190°C (375°F). Line baking sheets with parchment.' },
      { stepNumber: 2, text: 'Beat softened butter and both sugars until light and fluffy, about 4 minutes.' },
      { stepNumber: 3, text: 'Beat in eggs one at a time, then vanilla extract.' },
      { stepNumber: 4, text: 'Whisk together flour, baking soda, and salt. Gradually blend into butter mixture.' },
      { stepNumber: 5, text: 'Stir in chocolate chips.' },
      { stepNumber: 6, text: 'Drop rounded tablespoons onto prepared baking sheets, spacing 5cm apart.' },
      { stepNumber: 7, text: 'Bake 9–11 minutes or until golden brown. Cool on baking sheets for 2 minutes, then transfer.' },
    ],
  },
  {
    title: 'Vegetable Stir Fry',
    slug: 'vegetable-stir-fry',
    description:
      'A vibrant, healthy stir fry packed with crisp vegetables in a savory ginger-garlic sauce. Ready in under 15 minutes and endlessly customizable.',
    originalServings: 3,
    cookingTimeMinutes: 15,
    tags: ['vegan', 'vegetarian', 'healthy', 'quick', 'asian'],
    imageUrl:
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',
    ingredients: [
      { name: 'Broccoli florets', normalizedName: 'broccoli florets', quantity: 2, unit: 'cups' },
      { name: 'Bell peppers', normalizedName: 'bell peppers', quantity: 2, unit: 'piece' },
      { name: 'Carrots', normalizedName: 'carrots', quantity: 2, unit: 'piece' },
      { name: 'Snap peas', normalizedName: 'snap peas', quantity: 1, unit: 'cups' },
      { name: 'Garlic cloves', normalizedName: 'garlic cloves', quantity: 3, unit: 'clove' },
      { name: 'Ginger', normalizedName: 'ginger', quantity: 1, unit: 'tbsp' },
      { name: 'Soy sauce', normalizedName: 'soy sauce', quantity: 3, unit: 'tbsp' },
      { name: 'Sesame oil', normalizedName: 'sesame oil', quantity: 1, unit: 'tbsp' },
      { name: 'Vegetable oil', normalizedName: 'vegetable oil', quantity: 2, unit: 'tbsp' },
    ],
    instructions: [
      { stepNumber: 1, text: 'Prepare all vegetables: cut broccoli into florets, slice peppers and carrots, mince garlic and ginger.' },
      { stepNumber: 2, text: 'Whisk together soy sauce, sesame oil, and 2 tbsp water for the sauce.' },
      { stepNumber: 3, text: 'Heat vegetable oil in a wok or large skillet over high heat until smoking.' },
      { stepNumber: 4, text: 'Add garlic and ginger, stir-fry 30 seconds until fragrant.' },
      { stepNumber: 5, text: 'Add harder vegetables (carrots, broccoli) first, stir-fry 3 minutes.' },
      { stepNumber: 6, text: 'Add remaining vegetables, pour sauce over. Stir-fry 2–3 minutes until crisp-tender. Serve over rice.' },
    ],
  },
];

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(config.MONGODB_URI);

  console.log('👤 Creating demo users...');
  const passwordHash = await argon2.hash(DEMO_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const users: { [email: string]: InstanceType<typeof User> } = {};

  for (const userData of demoUsers) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`  ↩ User already exists: ${userData.email}`);
      users[userData.email] = existing;
    } else {
      const user = await User.create({ ...userData, passwordHash });
      console.log(`  ✓ Created user: ${userData.email}`);
      users[userData.email] = user;
    }
  }

  const alice = users['alice@plateful.dev'];
  const bob = users['bob@plateful.dev'];

  console.log('🍽 Creating demo recipes...');

  const createdRecipes: Array<InstanceType<typeof Recipe>> = [];

  for (let i = 0; i < demoRecipes.length; i++) {
    const recipeData = demoRecipes[i];
    const existing = await Recipe.findOne({ slug: recipeData.slug });

    if (existing) {
      console.log(`  ↩ Recipe already exists: ${recipeData.title}`);
      createdRecipes.push(existing);
    } else {
      const author = i % 2 === 0 ? alice : bob;
      const recipe = await Recipe.create({
        ...recipeData,
        author: author._id,
      });
      console.log(`  ✓ Created recipe: ${recipeData.title}`);
      createdRecipes.push(recipe);
    }
  }

  console.log('⭐ Creating demo reviews...');

  const reviewData = [
    { userEmail: 'bob@plateful.dev', recipeIndex: 0, rating: 5, text: 'Best pancakes I have ever made! Perfectly fluffy every time.' },
    { userEmail: 'alice@plateful.dev', recipeIndex: 1, rating: 4, text: 'Authentic and delicious. Took a few tries to get the sauce right.' },
    { userEmail: 'bob@plateful.dev', recipeIndex: 2, rating: 5, text: 'Quick, healthy, and absolutely delicious. A weeknight staple now.' },
    { userEmail: 'alice@plateful.dev', recipeIndex: 3, rating: 5, text: 'These cookies are dangerously good. I made three batches already.' },
    { userEmail: 'bob@plateful.dev', recipeIndex: 4, rating: 4, text: 'Great flavor and so fast. Love that it is vegan-friendly.' },
  ];

  for (const rv of reviewData) {
    const reviewer = users[rv.userEmail];
    const recipe = createdRecipes[rv.recipeIndex];
    if (!reviewer || !recipe) continue;

    const exists = await Review.findOne({ recipe: recipe._id, user: reviewer._id });
    if (exists) {
      console.log(`  ↩ Review already exists for ${recipe.title} by ${rv.userEmail}`);
    } else {
      await Review.create({
        recipe: recipe._id,
        user: reviewer._id,
        rating: rv.rating,
        text: rv.text,
      });
      console.log(`  ✓ Created review: ${recipe.title} — ${rv.rating}★`);
    }
  }

  console.log('\n✅ Seed complete!');
  console.log('\n🔐 Demo accounts:');
  console.log('   alice@plateful.dev / Demo1234!');
  console.log('   bob@plateful.dev   / Demo1234!');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
