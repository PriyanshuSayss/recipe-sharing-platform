import { Request, Response, NextFunction } from 'express';
import { SavedRecipe } from '../models/SavedRecipe';
import { Recipe } from '../models/Recipe';
import { sendSuccess, sendError, AppError } from '../utils/response';

export async function saveRecipe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const recipeId = req.params.id;
    const userId = req.user!._id;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw new AppError(404, 'Recipe not found');
    }

    const saved = await SavedRecipe.findOneAndUpdate(
      { user: userId, recipe: recipeId },
      { $setOnInsert: { user: userId, recipe: recipeId } },
      { upsert: true, new: true }
    );

    sendSuccess(res, { saved: true, savedRecipe: saved }, 200, 'Recipe saved to collection');
  } catch (err) {
    next(err);
  }
}

export async function unsaveRecipe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const recipeId = req.params.id;
    const userId = req.user!._id;

    await SavedRecipe.findOneAndDelete({ user: userId, recipe: recipeId });

    sendSuccess(res, { saved: false }, 200, 'Recipe removed from collection');
  } catch (err) {
    next(err);
  }
}

export async function getSavedRecipes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;

    const savedEntries = await SavedRecipe.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'recipe',
        populate: { path: 'author', select: 'displayName' },
      })
      .lean();

    // Filter out any entries where the recipe was deleted
    const recipes = savedEntries
      .map(entry => entry.recipe)
      .filter((r): r is NonNullable<typeof r> => r !== null && typeof r === 'object');

    sendSuccess(res, { recipes, count: recipes.length });
  } catch (err) {
    next(err);
  }
}

export async function checkIsSaved(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const recipeId = req.params.id;
    const userId = req.user?._id;

    if (!userId) {
      sendSuccess(res, { isSaved: false });
      return;
    }

    const existing = await SavedRecipe.findOne({ user: userId, recipe: recipeId }).lean();
    sendSuccess(res, { isSaved: !!existing });
  } catch (err) {
    next(err);
  }
}
