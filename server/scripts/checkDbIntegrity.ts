import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import { Recipe } from '../src/models/Recipe';
import { config } from '../src/config/env';

async function check() {
  await mongoose.connect(config.MONGODB_URI);
  console.log('=== CHECKING MONGODB RECIPE INTEGRITY ===');

  const allRecipes = await Recipe.find({}).lean();
  console.log(`Total recipes in DB: ${allRecipes.length}`);

  let missingCuisine = 0;
  let missingDietary = 0;
  let missingMealType = 0;
  let missingDifficulty = 0;
  const missingSlugs: string[] = [];

  for (const r of allRecipes) {
    let issue = false;
    if (!r.cuisine) { missingCuisine++; issue = true; }
    if (!r.dietary) { missingDietary++; issue = true; }
    if (!r.mealType) { missingMealType++; issue = true; }
    if (!r.difficulty) { missingDifficulty++; issue = true; }
    if (issue) missingSlugs.push(r.slug || r.title);
  }

  console.log(`Missing cuisine: ${missingCuisine}`);
  console.log(`Missing dietary: ${missingDietary}`);
  console.log(`Missing mealType: ${missingMealType}`);
  console.log(`Missing difficulty: ${missingDifficulty}`);
  if (missingSlugs.length > 0) {
    console.log('Recipes with missing fields:', missingSlugs);
  } else {
    console.log('✅ All recipes in DB have complete fields!');
  }

  await mongoose.disconnect();
}

check().catch(console.error);
