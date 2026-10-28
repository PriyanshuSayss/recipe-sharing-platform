import { Router } from 'express';
import {
  listRecipes,
  getRecipeBySlug,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getMyRecipes,
  searchByIngredients,
} from '../controllers/recipe.controller';
import { getReviews, upsertReview, deleteReview } from '../controllers/review.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', listRecipes);
router.get('/mine', requireAuth, getMyRecipes);
router.post('/search/ingredients', searchByIngredients);
router.get('/:slug', getRecipeBySlug);

// Authenticated routes
router.post('/', requireAuth, createRecipe);
router.patch('/:id', requireAuth, updateRecipe);
router.delete('/:id', requireAuth, deleteRecipe);

// Reviews
router.get('/:id/reviews', getReviews);
router.put('/:id/review', requireAuth, upsertReview);
router.delete('/:id/review', requireAuth, deleteReview);

export default router;
