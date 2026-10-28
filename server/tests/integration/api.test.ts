import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/models/User';
import { Recipe } from '../../src/models/Recipe';
import { Review } from '../../src/models/Review';
import argon2 from 'argon2';

// Helper to register + login and get cookie
async function loginUser(email: string, password: string) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password });
  return agent;
}

async function createTestUser(email = 'test@plateful.dev', password = 'Password1!') {
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  return User.create({ displayName: 'Test User', email, passwordHash });
}

async function createTestRecipe(authorId: string, overrides = {}) {
  return Recipe.create({
    title: 'Classic Pancakes',
    slug: 'classic-pancakes',
    description: 'Fluffy pancakes for breakfast',
    author: authorId,
    originalServings: 4,
    cookingTimeMinutes: 20,
    tags: ['breakfast', 'quick'],
    imageUrl: '',
    ingredients: [
      { name: 'Flour', normalizedName: 'flour', quantity: 2, unit: 'cups' },
      { name: 'Milk', normalizedName: 'milk', quantity: 1, unit: 'cups' },
      { name: 'Eggs', normalizedName: 'eggs', quantity: 2, unit: '' },
    ],
    instructions: [
      { stepNumber: 1, text: 'Mix flour and milk together' },
      { stepNumber: 2, text: 'Add eggs and whisk until smooth' },
      { stepNumber: 3, text: 'Cook on a hot griddle until golden' },
    ],
    ...overrides,
  });
}

describe('Auth API', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send({
      displayName: 'Alice',
      email: 'alice@plateful.dev',
      password: 'Password1!',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('alice@plateful.dev');
    // Password hash must NEVER appear in response
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    expect(JSON.stringify(res.body)).not.toContain('argon2');
  });

  it('rejects registration with weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      displayName: 'Bob',
      email: 'bob@plateful.dev',
      password: 'weak',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects duplicate email registration', async () => {
    await createTestUser('dup@plateful.dev');
    const res = await request(app).post('/api/auth/register').send({
      displayName: 'Dup',
      email: 'dup@plateful.dev',
      password: 'Password1!',
    });
    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials', async () => {
    await createTestUser('login@plateful.dev');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@plateful.dev', password: 'Password1!' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    await createTestUser('wrongpw@plateful.dev');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrongpw@plateful.dev', password: 'WrongPassword1!' });
    expect(res.status).toBe(401);
  });
});

describe('Recipe API', () => {
  let authorAgent: ReturnType<typeof request.agent>;
  let authorId: string;

  beforeEach(async () => {
    const user = await createTestUser('author@plateful.dev');
    authorId = user._id.toString();
    authorAgent = request.agent(app);
    await authorAgent
      .post('/api/auth/login')
      .send({ email: 'author@plateful.dev', password: 'Password1!' });
  });

  it('creates a recipe successfully', async () => {
    const res = await authorAgent.post('/api/recipes').send({
      title: 'My Test Recipe',
      description: 'A delicious test recipe for the test suite',
      originalServings: 4,
      cookingTimeMinutes: 30,
      tags: ['test'],
      ingredients: [{ name: 'Flour', quantity: 2, unit: 'cups' }],
      instructions: [{ stepNumber: 1, text: 'Mix everything together' }],
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recipe.title).toBe('My Test Recipe');
    expect(res.body.data.recipe.slug).toBeDefined();
  });

  it('rejects recipe creation without auth', async () => {
    const res = await request(app).post('/api/recipes').send({
      title: 'Unauthorized Recipe',
      description: 'Should fail without authentication',
      originalServings: 2,
      cookingTimeMinutes: 10,
      ingredients: [{ name: 'Water', quantity: 1, unit: 'cup' }],
      instructions: [{ stepNumber: 1, text: 'Drink' }],
    });
    expect(res.status).toBe(401);
  });

  it('rejects malformed recipe (missing required fields)', async () => {
    const res = await authorAgent.post('/api/recipes').send({
      title: 'No Ingredients',
      description: 'Missing ingredients',
      originalServings: 2,
      cookingTimeMinutes: 10,
      ingredients: [], // empty — should fail validation
      instructions: [{ stepNumber: 1, text: 'Oops' }],
    });
    expect(res.status).toBe(400);
  });

  it('rejects unauthorized recipe update', async () => {
    const recipe = await createTestRecipe(authorId);

    // Create another user
    const otherUser = await createTestUser('other@plateful.dev');
    const otherAgent = request.agent(app);
    await otherAgent
      .post('/api/auth/login')
      .send({ email: 'other@plateful.dev', password: 'Password1!' });

    const res = await otherAgent
      .patch(`/api/recipes/${recipe._id}`)
      .send({ title: 'Hijacked Recipe' });

    expect(res.status).toBe(403);
  });

  it('searches recipes by title', async () => {
    await createTestRecipe(authorId, { title: 'Banana Bread', slug: 'banana-bread' });
    await createTestRecipe(authorId, { title: 'Apple Pie', slug: 'apple-pie' });

    const res = await request(app).get('/api/recipes?q=banana');
    expect(res.status).toBe(200);
    expect(res.body.data.recipes.some((r: { title: string }) => r.title === 'Banana Bread')).toBe(true);
  });

  it('filters recipes by tag', async () => {
    await createTestRecipe(authorId, {
      title: 'Vegan Stew',
      slug: 'vegan-stew',
      tags: ['vegan', 'dinner'],
    });
    await createTestRecipe(authorId, {
      title: 'Beef Burger',
      slug: 'beef-burger',
      tags: ['dinner', 'meat'],
    });

    const res = await request(app).get('/api/recipes?tag=vegan');
    expect(res.status).toBe(200);
    expect(res.body.data.recipes.some((r: { title: string }) => r.title === 'Vegan Stew')).toBe(true);
    expect(res.body.data.recipes.some((r: { title: string }) => r.title === 'Beef Burger')).toBe(false);
  });
});

describe('Ingredient Search', () => {
  let authorId: string;

  beforeEach(async () => {
    const user = await createTestUser('chef@plateful.dev');
    authorId = user._id.toString();

    await Recipe.create({
      title: 'Pasta Carbonara',
      slug: 'pasta-carbonara',
      description: 'Classic Italian pasta dish',
      author: authorId,
      originalServings: 2,
      cookingTimeMinutes: 25,
      tags: ['pasta', 'italian'],
      imageUrl: '',
      ingredients: [
        { name: 'Spaghetti', normalizedName: 'spaghetti', quantity: 200, unit: 'g' },
        { name: 'Eggs', normalizedName: 'eggs', quantity: 3, unit: '' },
        { name: 'Bacon', normalizedName: 'bacon', quantity: 150, unit: 'g' },
        { name: 'Parmesan', normalizedName: 'parmesan', quantity: 50, unit: 'g' },
      ],
      instructions: [{ stepNumber: 1, text: 'Cook pasta' }],
    });
  });

  it('finds recipes matching provided ingredients', async () => {
    const res = await request(app)
      .post('/api/recipes/search/ingredients')
      .send({ ingredients: ['eggs', 'bacon'] });

    expect(res.status).toBe(200);
    expect(res.body.data.results.length).toBeGreaterThan(0);
    expect(res.body.data.results[0].recipe.title).toBe('Pasta Carbonara');
    expect(res.body.data.results[0].matched).toContain('eggs');
    expect(res.body.data.results[0].matched).toContain('bacon');
  });

  it('shows missing ingredients correctly', async () => {
    const res = await request(app)
      .post('/api/recipes/search/ingredients')
      .send({ ingredients: ['eggs', 'cream', 'bacon'] });

    expect(res.status).toBe(200);
    const result = res.body.data.results[0];
    expect(result.missing).toContain('cream');
  });

  it('returns empty results when no ingredients match', async () => {
    const res = await request(app)
      .post('/api/recipes/search/ingredients')
      .send({ ingredients: ['dragonfruit', 'unicorn-tears'] });

    expect(res.status).toBe(200);
    expect(res.body.data.results).toHaveLength(0);
  });

  it('rejects empty ingredient array', async () => {
    const res = await request(app)
      .post('/api/recipes/search/ingredients')
      .send({ ingredients: [] });

    expect(res.status).toBe(400);
  });
});

describe('Reviews API', () => {
  let agent: ReturnType<typeof request.agent>;
  let userId: string;
  let recipeId: string;

  beforeEach(async () => {
    const user = await createTestUser('reviewer@plateful.dev');
    userId = user._id.toString();
    const recipe = await createTestRecipe(userId);
    recipeId = recipe._id.toString();

    agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: 'reviewer@plateful.dev', password: 'Password1!' });
  });

  it('creates a review successfully', async () => {
    const res = await agent.put(`/api/recipes/${recipeId}/review`).send({
      rating: 5,
      text: 'Absolutely delicious! Will make again.',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.review.rating).toBe(5);
    expect(res.body.data.averageRating).toBe(5);
    expect(res.body.data.reviewCount).toBe(1);
  });

  it('updates existing review instead of creating duplicate', async () => {
    await agent.put(`/api/recipes/${recipeId}/review`).send({ rating: 3, text: 'OK' });
    const res = await agent.put(`/api/recipes/${recipeId}/review`).send({ rating: 5, text: 'Amazing!' });

    expect(res.status).toBe(200);
    expect(res.body.data.review.rating).toBe(5);

    // Verify only one review exists in database
    const count = await Review.countDocuments({ recipe: recipeId, user: userId });
    expect(count).toBe(1);
  });

  it('rejects invalid rating (out of range)', async () => {
    const res = await agent.put(`/api/recipes/${recipeId}/review`).send({ rating: 6 });
    expect(res.status).toBe(400);
  });

  it('rejects review from unauthenticated user', async () => {
    const res = await request(app)
      .put(`/api/recipes/${recipeId}/review`)
      .send({ rating: 4, text: 'Sneaky review' });
    expect(res.status).toBe(401);
  });

  it('calculates correct average rating across multiple users', async () => {
    // First user already rated with agent
    await agent.put(`/api/recipes/${recipeId}/review`).send({ rating: 4, text: 'Good' });

    // Second user rates
    const user2 = await createTestUser('rater2@plateful.dev');
    const agent2 = request.agent(app);
    await agent2.post('/api/auth/login').send({ email: 'rater2@plateful.dev', password: 'Password1!' });
    await agent2.put(`/api/recipes/${recipeId}/review`).send({ rating: 2, text: 'Meh' });

    // Get reviews
    const res = await request(app).get(`/api/recipes/${recipeId}/reviews`);
    expect(res.status).toBe(200);
    expect(res.body.data.reviewCount).toBe(2);
    expect(res.body.data.averageRating).toBe(3); // (4 + 2) / 2 = 3
  });

  it('enforces database-level unique constraint (one review per user per recipe)', async () => {
    // Insert first review directly via model
    await Review.create({ recipe: recipeId, user: userId, rating: 5, text: 'First' });

    // Attempt to insert a second review for same user+recipe directly
    await expect(
      Review.create({ recipe: recipeId, user: userId, rating: 3, text: 'Second' })
    ).rejects.toThrow();

    const count = await Review.countDocuments({ recipe: recipeId, user: userId });
    expect(count).toBe(1);
  });
});

describe('Image Upload API', () => {
  let agent: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    await createTestUser('uploader@plateful.dev');
    agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: 'uploader@plateful.dev', password: 'Password1!' });
  });

  it('rejects upload without authentication', async () => {
    const res = await request(app)
      .post('/api/uploads/recipe-image')
      .attach('image', Buffer.from('hello world'), 'test.txt');

    expect(res.status).toBe(401);
  });

  it('rejects invalid image mime types (e.g. text or executable)', async () => {
    const res = await agent
      .post('/api/uploads/recipe-image')
      .attach('image', Buffer.from('plain text content'), {
        filename: 'malicious.exe',
        contentType: 'application/octet-stream',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects fake images where mime type claims image but content is not', async () => {
    const res = await agent
      .post('/api/uploads/recipe-image')
      .attach('image', Buffer.from('<html><body>Fake Image</body></html>'), {
        filename: 'fake.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects oversized image uploads (> 5MB)', async () => {
    // 6 MB buffer
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 0);

    const res = await agent
      .post('/api/uploads/recipe-image')
      .attach('image', largeBuffer, {
        filename: 'huge.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(413);
    expect(res.body.success).toBe(false);
  });
});
