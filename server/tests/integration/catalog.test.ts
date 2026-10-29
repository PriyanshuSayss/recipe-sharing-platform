import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { Recipe } from '../../src/models/Recipe';
import { User } from '../../src/models/User';
import { SEED_RECIPES } from '../../src/config/seedRecipes';
import argon2 from 'argon2';

describe('Multi-Cuisine Catalog & Filter Suite', () => {
  describe('Seed Catalog Integrity & Diversity', () => {
    it('has at least 48 complete, realistic recipes', () => {
      expect(SEED_RECIPES.length).toBeGreaterThanOrEqual(48);
    });

    it('ensures all recipe slugs are unique', () => {
      const slugs = SEED_RECIPES.map((r) => r.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    it('validates that every recipe has required structured fields', () => {
      for (const recipe of SEED_RECIPES) {
        expect(recipe.title).toBeTruthy();
        expect(recipe.slug).toBeTruthy();
        expect(recipe.description).toBeTruthy();
        expect(recipe.cuisine).toBeTruthy();
        expect(recipe.dietary).toBeTruthy();
        expect(recipe.mealType).toBeTruthy();
        expect(recipe.difficulty).toBeTruthy();
        expect(recipe.originalServings).toBeGreaterThan(0);
        expect(recipe.cookingTimeMinutes).toBeGreaterThan(0);
        expect(recipe.ingredients.length).toBeGreaterThanOrEqual(2);
        expect(recipe.instructions.length).toBeGreaterThanOrEqual(2);

        for (const ing of recipe.ingredients) {
          expect(ing.name).toBeTruthy();
          expect(ing.normalizedName).toBeTruthy();
          expect(ing.quantity).toBeGreaterThan(0);
        }

        for (const step of recipe.instructions) {
          expect(step.stepNumber).toBeGreaterThan(0);
          expect(step.text.trim().length).toBeGreaterThan(5);
        }
      }
    });

    it('contains comprehensive global cuisine coverage', () => {
      const cuisines = new Set(SEED_RECIPES.map((r) => r.cuisine));
      expect(cuisines.has('Indian')).toBe(true);
      expect(cuisines.has('Italian')).toBe(true);
      expect(cuisines.has('Chinese')).toBe(true);
      expect(cuisines.has('Japanese')).toBe(true);
      expect(cuisines.has('Thai')).toBe(true);
      expect(cuisines.has('Mexican')).toBe(true);
      expect(cuisines.has('Korean')).toBe(true);
      expect(cuisines.has('Middle Eastern')).toBe(true);
      expect(cuisines.has('Mediterranean')).toBe(true);
      expect(cuisines.has('American')).toBe(true);
      expect(cuisines.has('French')).toBe(true);
    });

    it('covers all dietary preference categories realistically', () => {
      const dietary = new Set(SEED_RECIPES.map((r) => r.dietary));
      expect(dietary.has('Vegetarian')).toBe(true);
      expect(dietary.has('Vegan')).toBe(true);
      expect(dietary.has('Eggetarian')).toBe(true);
      expect(dietary.has('Non-Vegetarian')).toBe(true);
    });

    it('has Indian regional diversity (North, South, and Regional)', () => {
      const indianRecipes = SEED_RECIPES.filter((r) => r.cuisine === 'Indian');
      const north = indianRecipes.filter((r) => r.cuisineRegion === 'North Indian');
      const south = indianRecipes.filter((r) => r.cuisineRegion === 'South Indian');
      expect(north.length).toBeGreaterThanOrEqual(5);
      expect(south.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('API Multi-Filter & Semantic Dietary Queries', () => {
    beforeEach(async () => {
      const passwordHash = await argon2.hash('Demo1234!', { type: argon2.argon2id });
      const user = await User.create({
        displayName: 'Catalog Admin',
        email: 'admin@plateful.dev',
        passwordHash,
      });

      const docs = SEED_RECIPES.map((r) => ({
        ...r,
        author: user._id,
      }));
      await Recipe.insertMany(docs);
    });

    it('filters recipes strictly by cuisine', async () => {
      const res = await request(app).get('/api/recipes?cuisine=Italian');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recipes.length).toBeGreaterThan(0);
      for (const recipe of res.body.data.recipes) {
        expect(recipe.cuisine).toBe('Italian');
      }
    });

    it('applies semantic dietary filtering: vegetarian includes vegan', async () => {
      const res = await request(app).get('/api/recipes?dietary=vegetarian');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recipes.length).toBeGreaterThan(0);

      const dietarySet = new Set(res.body.data.recipes.map((r: { dietary: string }) => r.dietary));
      expect(dietarySet.has('Non-Vegetarian')).toBe(false);
      expect(dietarySet.has('Eggetarian')).toBe(false);
      expect(dietarySet.has('Vegetarian') || dietarySet.has('Vegan')).toBe(true);
    });

    it('filters strictly for vegan recipes without non-vegan vegetarian', async () => {
      const res = await request(app).get('/api/recipes?dietary=vegan');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recipes.length).toBeGreaterThan(0);
      for (const recipe of res.body.data.recipes) {
        expect(recipe.dietary).toBe('Vegan');
      }
    });

    it('filters recipes by maximum cooking time', async () => {
      const maxTime = 25;
      const res = await request(app).get(`/api/recipes?maxCookingTime=${maxTime}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recipes.length).toBeGreaterThan(0);
      for (const recipe of res.body.data.recipes) {
        expect(recipe.cookingTimeMinutes).toBeLessThanOrEqual(maxTime);
      }
    });

    it('filters by combined multi-criteria: cuisine + dietary + mealType', async () => {
      const res = await request(app).get('/api/recipes?cuisine=Indian&dietary=vegetarian&mealType=Breakfast');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recipes.length).toBeGreaterThan(0);
      for (const recipe of res.body.data.recipes) {
        expect(recipe.cuisine).toBe('Indian');
        expect(['Vegetarian', 'Vegan']).toContain(recipe.dietary);
        expect(recipe.mealType).toBe('Breakfast');
      }
    });

    it('supports text search query combined with cuisine filtering', async () => {
      const res = await request(app).get('/api/recipes?search=rice&cuisine=Indian');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recipes.length).toBeGreaterThan(0);
      for (const recipe of res.body.data.recipes) {
        expect(recipe.cuisine).toBe('Indian');
        const inTitle = recipe.title.toLowerCase().includes('rice');
        const inTags = (recipe.tags || []).some((t: string) => t.toLowerCase().includes('rice'));
        const inDesc = (recipe.description || '').toLowerCase().includes('rice');
        const matchesQuery = inTitle || inTags || inDesc;
        if (!matchesQuery) {
          console.log('FAILING RECIPE:', {
            title: recipe.title,
            tags: recipe.tags,
            description: recipe.description,
            cuisine: recipe.cuisine,
          });
        }
        expect(matchesQuery).toBe(true);
      }
    });
  });
});
