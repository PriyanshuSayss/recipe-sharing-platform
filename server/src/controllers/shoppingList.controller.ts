import { Request, Response, NextFunction } from 'express';
import { Recipe } from '../models/Recipe';
import { sendSuccess, sendError } from '../utils/response';
import { scaleQuantity } from '../utils/scaling';
import { aggregateShoppingList, RawIngredientInput } from '../utils/shoppingList';

export async function aggregateShoppingListHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { items } = req.body as {
      items?: Array<{ recipeId: string; servings?: number }>;
    };

    if (!Array.isArray(items) || items.length === 0) {
      sendError(res, 400, 'Please provide an array of recipe items to generate a shopping list');
      return;
    }

    if (items.length > 50) {
      sendError(res, 400, 'Maximum 50 recipes allowed in shopping list');
      return;
    }

    const recipeIds = items.map(i => i.recipeId);
    const recipes = await Recipe.find({ _id: { $in: recipeIds } }).lean();

    const recipeMap = new Map(recipes.map(r => [r._id.toString(), r]));

    const rawIngredients: RawIngredientInput[] = [];

    for (const item of items) {
      const recipe = recipeMap.get(item.recipeId);
      if (!recipe) continue;

      const targetServings = item.servings && item.servings > 0
        ? item.servings
        : recipe.originalServings;

      for (const ing of recipe.ingredients) {
        const scaledQty = scaleQuantity(
          ing.quantity,
          recipe.originalServings,
          targetServings
        );

        rawIngredients.push({
          name: ing.name,
          quantity: scaledQty,
          unit: ing.unit,
          recipeTitle: recipe.title,
        });
      }
    }

    const aggregated = aggregateShoppingList(rawIngredients);

    sendSuccess(res, {
      items: aggregated,
      totalCount: aggregated.length,
      recipesIncluded: recipes.map(r => ({ id: r._id, title: r.title, slug: r.slug })),
    });
  } catch (err) {
    next(err);
  }
}
