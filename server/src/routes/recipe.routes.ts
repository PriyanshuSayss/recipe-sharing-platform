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
import {
  saveRecipe,
  unsaveRecipe,
  getSavedRecipes,
  checkIsSaved,
} from '../controllers/savedRecipe.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Public / discovery routes
router.get('/', listRecipes);
router.get('/mine', requireAuth, getMyRecipes);
router.get('/saved', requireAuth, getSavedRecipes);
router.post('/search/ingredients', searchByIngredients);
router.get('/:slug', getRecipeBySlug);

// Collections / saved recipes
router.post('/:id/save', requireAuth, saveRecipe);
router.delete('/:id/save', requireAuth, unsaveRecipe);
router.get('/:id/is-saved', optionalAuth, checkIsSaved);

// Authenticated CRUD routes
router.post('/', requireAuth, createRecipe);
router.patch('/:id', requireAuth, updateRecipe);
router.delete('/:id', requireAuth, deleteRecipe);

// Reviews
router.get('/:id/reviews', getReviews);
router.put('/:id/review', requireAuth, upsertReview);
router.delete('/:id/review', requireAuth, deleteReview);

export default router;
