import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/models/User';
import { Recipe } from '../../src/models/Recipe';
import { SavedRecipe } from '../../src/models/SavedRecipe';
import argon2 from 'argon2';

async function createTestUser(email: string) {
  const passwordHash = await argon2.hash('Password1!', { type: argon2.argon2id });
  return User.create({ displayName: 'Collector', email, passwordHash });
}

async function createTestRecipe(authorId: string, title = 'Berry Tart') {
  return Recipe.create({
    title,
    slug: title.toLowerCase().replace(/\s+/g, '-'),
    description: 'A delicious tart',
    author: authorId,
    originalServings: 4,
    cookingTimeMinutes: 30,
    tags: ['dessert'],
    imageUrl: '',
    ingredients: [
      { name: 'Flour', normalizedName: 'flour', quantity: 2, unit: 'cups' },
      { name: 'Butter', normalizedName: 'butter', quantity: 100, unit: 'g' },
    ],
    instructions: [{ stepNumber: 1, text: 'Bake' }],
  });
}

describe('Saved Recipes (Collections) API', () => {
  let agent: ReturnType<typeof request.agent>;
  let userId: string;
  let recipeId: string;

  beforeEach(async () => {
    const user = await createTestUser('collector@plateful.dev');
    userId = user._id.toString();
    const recipe = await createTestRecipe(userId, 'Blueberry Pie');
    recipeId = recipe._id.toString();

    agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: 'collector@plateful.dev', password: 'Password1!' });
  });

  it('saves a recipe to user collection', async () => {
    const res = await agent.post(`/api/recipes/${recipeId}/save`);
    expect(res.status).toBe(200);
    expect(res.body.data.saved).toBe(true);

    const saved = await SavedRecipe.findOne({ user: userId, recipe: recipeId });
    expect(saved).toBeDefined();
  });

  it('prevents duplicate saves when saving twice', async () => {
    await agent.post(`/api/recipes/${recipeId}/save`);
    const res2 = await agent.post(`/api/recipes/${recipeId}/save`);
    expect(res2.status).toBe(200);

    const count = await SavedRecipe.countDocuments({ user: userId, recipe: recipeId });
    expect(count).toBe(1);
  });

  it('checks if a recipe is saved', async () => {
    await agent.post(`/api/recipes/${recipeId}/save`);
    const res = await agent.get(`/api/recipes/${recipeId}/is-saved`);
    expect(res.status).toBe(200);
    expect(res.body.data.isSaved).toBe(true);
  });

  it('removes a saved recipe from collection', async () => {
    await agent.post(`/api/recipes/${recipeId}/save`);
    const res = await agent.delete(`/api/recipes/${recipeId}/save`);
    expect(res.status).toBe(200);
    expect(res.body.data.saved).toBe(false);

    const count = await SavedRecipe.countDocuments({ user: userId, recipe: recipeId });
    expect(count).toBe(0);
  });

  it('retrieves all saved recipes for the user', async () => {
    const recipe2 = await createTestRecipe(userId, 'Apple Crumble');
    await agent.post(`/api/recipes/${recipeId}/save`);
    await agent.post(`/api/recipes/${recipe2._id}/save`);

    const res = await agent.get('/api/recipes/saved');
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(2);
    expect(res.body.data.recipes.some((r: { title: string }) => r.title === 'Blueberry Pie')).toBe(true);
    expect(res.body.data.recipes.some((r: { title: string }) => r.title === 'Apple Crumble')).toBe(true);
  });

  it('rejects save request without authentication', async () => {
    const res = await request(app).post(`/api/recipes/${recipeId}/save`);
    expect(res.status).toBe(401);
  });
});

describe('Shopping List Aggregation API', () => {
  let recipe1Id: string;
  let recipe2Id: string;

  beforeEach(async () => {
    const user = await createTestUser('shopper@plateful.dev');
    const r1 = await Recipe.create({
      title: 'Pancake Breakfast',
      slug: 'pancake-breakfast',
      description: 'Breakfast',
      author: user._id,
      originalServings: 2,
      cookingTimeMinutes: 15,
      ingredients: [
        { name: 'Flour', normalizedName: 'flour', quantity: 1, unit: 'cup' },
        { name: 'Eggs', normalizedName: 'eggs', quantity: 2, unit: '' },
      ],
      instructions: [{ stepNumber: 1, text: 'Cook' }],
    });

    const r2 = await Recipe.create({
      title: 'Waffle Morning',
      slug: 'waffle-morning',
      description: 'Waffles',
      author: user._id,
      originalServings: 4,
      cookingTimeMinutes: 20,
      ingredients: [
        { name: 'Flour', normalizedName: 'flour', quantity: 2, unit: 'cups' },
        { name: 'Sugar', normalizedName: 'sugar', quantity: 50, unit: 'g' },
      ],
      instructions: [{ stepNumber: 1, text: 'Bake' }],
    });

    recipe1Id = r1._id.toString();
    recipe2Id = r2._id.toString();
  });

  it('aggregates ingredients from multiple recipes with serving scaling', async () => {
    // r1: 2 servings -> 1 cup flour, 2 eggs
    // r2 scaled from 4 to 8 servings -> 2 * (8/4) = 4 cups flour, 50 * (8/4) = 100g sugar
    // Total Flour = 1 + 4 = 5 cups
    const res = await request(app)
      .post('/api/shopping-list/aggregate')
      .send({
        items: [
          { recipeId: recipe1Id, servings: 2 },
          { recipeId: recipe2Id, servings: 8 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const items = res.body.data.items as Array<{
      normalizedName: string;
      quantity: number;
      unit: string;
    }>;

    const flour = items.find(i => i.normalizedName === 'flour');
    expect(flour).toBeDefined();
    expect(flour?.quantity).toBe(5);

    const sugar = items.find(i => i.normalizedName === 'sugar');
    expect(sugar).toBeDefined();
    expect(sugar?.quantity).toBe(100);

    const eggs = items.find(i => i.normalizedName === 'eggs');
    expect(eggs).toBeDefined();
    expect(eggs?.quantity).toBe(2);
  });

  it('rejects empty recipe list', async () => {
    const res = await request(app)
      .post('/api/shopping-list/aggregate')
      .send({ items: [] });

    expect(res.status).toBe(400);
  });
});
