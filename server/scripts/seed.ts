/**
 * Seed script — Plateful demo data with rich multi-cuisine catalog.
 * Idempotent: existing demo users and recipes are upserted, not duplicated.
 * Run with: npm run seed (from server/ directory) or npm run seed --workspace=server
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
import { SEED_RECIPES } from '../src/config/seedRecipes';

const DEMO_PASSWORD = 'Demo1234!';

const demoUsers = [
  { displayName: 'Alice Chen', email: 'alice@plateful.dev' },
  { displayName: 'Bob Martinez', email: 'bob@plateful.dev' },
];

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(config.MONGODB_URI);

  console.log('👤 Creating/verifying demo users...');
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

  console.log(`🍽 Seeding/upserting ${SEED_RECIPES.length} diverse recipes...`);

  const createdRecipes: Array<InstanceType<typeof Recipe>> = [];

  for (let i = 0; i < SEED_RECIPES.length; i++) {
    const recipeData = SEED_RECIPES[i];
    const author = i % 2 === 0 ? alice : bob;

    const recipe = await Recipe.findOneAndUpdate(
      { slug: recipeData.slug },
      {
        ...recipeData,
        author: author._id,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    createdRecipes.push(recipe);
  }

  console.log(`  ✓ Successfully upserted ${createdRecipes.length} recipes across all cuisines.`);

  console.log('⭐ Creating/updating demo reviews...');

  const reviewDefinitions = [
    {
      userEmail: 'bob@plateful.dev',
      slug: 'paneer-butter-masala',
      rating: 5,
      text: 'Restaurant quality gravy! Silky smooth and the fenugreek adds incredible depth of aroma.',
    },
    {
      userEmail: 'alice@plateful.dev',
      slug: 'masala-dosa',
      rating: 5,
      text: 'Fermenting overnight was completely worth it. Perfectly crisp exterior with fragrant potato masala.',
    },
    {
      userEmail: 'bob@plateful.dev',
      slug: 'margherita-pizza',
      rating: 5,
      text: 'Simple perfection. High oven heat made the crust wonderfully blistered and chewy.',
    },
    {
      userEmail: 'alice@plateful.dev',
      slug: 'vegetable-pad-thai',
      rating: 4,
      text: 'Balanced sweet, tangy, and salty notes. Added extra crushed peanuts and fresh lime juice.',
    },
    {
      userEmail: 'bob@plateful.dev',
      slug: 'chicken-biryani',
      rating: 5,
      text: 'The dum technique worked flawlessly! Every single grain of basmati remained distinct and aromatic.',
    },
    {
      userEmail: 'alice@plateful.dev',
      slug: 'creamy-hummus-with-tahini',
      rating: 5,
      text: 'Adding ice cubes while whipping made this lighter and creamier than store-bought hummus.',
    },
    {
      userEmail: 'bob@plateful.dev',
      slug: 'japanese-vegetable-ramen',
      rating: 5,
      text: 'Incredible broth depth from dried shiitake and miso paste. Hearty and deeply comforting.',
    },
    {
      userEmail: 'alice@plateful.dev',
      slug: 'chole-bhature',
      rating: 5,
      text: 'Rich, dark spiced chole paired with balloon-puffed bhaturas. Sunday brunch perfection!',
    },
    {
      userEmail: 'bob@plateful.dev',
      slug: 'fudgy-dark-chocolate-brownies',
      rating: 5,
      text: 'Genuinely crackly tops with rich fudgy centers. Disappeared in one afternoon.',
    },
    {
      userEmail: 'alice@plateful.dev',
      slug: 'mango-cardamom-lassi',
      rating: 5,
      text: 'Cooling, aromatic, and heavenly on warm summer afternoons. Alphonso pulp makes all the difference.',
    },
  ];

  for (const rv of reviewDefinitions) {
    const reviewer = users[rv.userEmail];
    const recipe = createdRecipes.find((r) => r.slug === rv.slug);
    if (!reviewer || !recipe) continue;

    await Review.findOneAndUpdate(
      { recipe: recipe._id, user: reviewer._id },
      {
        recipe: recipe._id,
        user: reviewer._id,
        rating: rv.rating,
        text: rv.text,
      },
      { upsert: true, new: true }
    );
  }

  console.log('  ✓ Demo reviews populated.');
  console.log('\n✅ Database seed complete!');
  console.log('\n🔐 Demo accounts:');
  console.log('   alice@plateful.dev / Demo1234!');
  console.log('   bob@plateful.dev   / Demo1234!');
  console.log(`\n📚 Total Recipes Seeded: ${createdRecipes.length}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
