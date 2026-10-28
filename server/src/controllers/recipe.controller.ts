import { Request, Response, NextFunction } from 'express';
import { Recipe } from '../models/Recipe';
import { Review } from '../models/Review';
import { sendSuccess, sendError, AppError } from '../utils/response';
import { createRecipeSchema, updateRecipeSchema, recipeQuerySchema } from '../schemas/recipe.schema';
import { generateUniqueSlug } from '../utils/slug';
import { ZodError } from 'zod';

export async function listRecipes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, q, tag } = recipeQuerySchema.parse(req.query);
    const skip = (page - 1) * limit;

    // Build query filter
    const filter: Record<string, unknown> = {};

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { tags: { $regex: escaped, $options: 'i' } },
      ];
    }

    if (tag) {
      filter.tags = { $regex: `^${tag}$`, $options: 'i' };
    }

    const [recipes, total] = await Promise.all([
      Recipe.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'displayName')
        .lean(),
      Recipe.countDocuments(filter),
    ]);

    // Attach rating summaries
    const recipeIds = recipes.map(r => r._id);
    const ratingSummaries = await Review.aggregate([
      { $match: { recipe: { $in: recipeIds } } },
      {
        $group: {
          _id: '$recipe',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const ratingMap = new Map(
      ratingSummaries.map(r => [r._id.toString(), r])
    );

    const enriched = recipes.map(r => ({
      ...r,
      averageRating: ratingMap.get(r._id.toString())?.averageRating ?? null,
      reviewCount: ratingMap.get(r._id.toString())?.reviewCount ?? 0,
    }));

    sendSuccess(res, {
      recipes: enriched,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(res, 400, err.errors.map(e => e.message).join('; '));
      return;
    }
    next(err);
  }
}

export async function getRecipeBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const recipe = await Recipe.findOne({ slug: req.params.slug })
      .populate('author', 'displayName email')
      .lean();

    if (!recipe) {
      throw new AppError(404, 'Recipe not found');
    }

    // Compute rating summary from reviews
    const [ratingResult] = await Review.aggregate([
      { $match: { recipe: recipe._id } },
      {
        $group: {
          _id: '$recipe',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    sendSuccess(res, {
      recipe: {
        ...recipe,
        averageRating: ratingResult?.averageRating ?? null,
        reviewCount: ratingResult?.reviewCount ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createRecipe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = createRecipeSchema.parse(req.body);

    // Normalize ingredients
    const ingredients = data.ingredients.map(ing => ({
      ...ing,
      normalizedName: ing.name.toLowerCase().trim(),
    }));

    const slug = await generateUniqueSlug(data.title);

    const recipe = await Recipe.create({
      ...data,
      ingredients,
      author: req.user!._id,
      slug,
    });

    const populated = await recipe.populate('author', 'displayName');

    sendSuccess(res, { recipe: populated }, 201, 'Recipe created successfully');
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(res, 400, err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '));
      return;
    }
    next(err);
  }
}

export async function updateRecipe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      throw new AppError(404, 'Recipe not found');
    }

    if (recipe.author.toString() !== req.user!._id) {
      throw new AppError(403, 'You are not authorized to edit this recipe');
    }

    const data = updateRecipeSchema.parse(req.body);

    if (data.ingredients) {
      data.ingredients = data.ingredients.map(ing => ({
        ...ing,
        normalizedName: ing.name.toLowerCase().trim(),
      })) as typeof data.ingredients;
    }

    // Update slug if title changed
    if (data.title && data.title !== recipe.title) {
      const newSlug = await generateUniqueSlug(data.title, recipe._id.toString());
      (data as Record<string, unknown>).slug = newSlug;
    }

    Object.assign(recipe, data);
    await recipe.save();

    const populated = await recipe.populate('author', 'displayName');

    sendSuccess(res, { recipe: populated }, 200, 'Recipe updated successfully');
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(res, 400, err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '));
      return;
    }
    next(err);
  }
}

export async function deleteRecipe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      throw new AppError(404, 'Recipe not found');
    }

    if (recipe.author.toString() !== req.user!._id) {
      throw new AppError(403, 'You are not authorized to delete this recipe');
    }

    await Recipe.deleteOne({ _id: recipe._id });
    // Also remove associated reviews
    await Review.deleteMany({ recipe: recipe._id });

    sendSuccess(res, null, 200, 'Recipe deleted successfully');
  } catch (err) {
    next(err);
  }
}

export async function getMyRecipes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.min(50, parseInt((req.query.limit as string) || '20'));
    const skip = (page - 1) * limit;

    const [recipes, total] = await Promise.all([
      Recipe.find({ author: req.user!._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'displayName')
        .lean(),
      Recipe.countDocuments({ author: req.user!._id }),
    ]);

    sendSuccess(res, {
      recipes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function searchByIngredients(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawIngredients = req.body.ingredients as unknown;

    if (!Array.isArray(rawIngredients) || rawIngredients.length === 0) {
      sendError(res, 400, 'Please provide at least one ingredient');
      return;
    }

    if (rawIngredients.length > 20) {
      sendError(res, 400, 'Maximum 20 ingredients allowed');
      return;
    }

    // Normalize: trim, lowercase, deduplicate
    const ingredients: string[] = [
      ...new Set(
        rawIngredients
          .filter((i): i is string => typeof i === 'string' && i.trim().length > 0)
          .map(i => i.trim().toLowerCase())
      ),
    ];

    if (ingredients.length === 0) {
      sendError(res, 400, 'No valid ingredients provided');
      return;
    }

    // Validate individual ingredient lengths
    for (const ing of ingredients) {
      if (ing.length > 100) {
        sendError(res, 400, `Ingredient name too long: "${ing.slice(0, 30)}..."`);
        return;
      }
    }

    // Find recipes that contain at least one of the supplied ingredients
    // Use regex for partial matching (e.g., "flour" matches "all-purpose flour")
    const ingredientRegexes = ingredients.map(
      ing => new RegExp(ing.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    );

    const recipes = await Recipe.find({
      'ingredients.normalizedName': { $in: ingredientRegexes },
    })
      .populate('author', 'displayName')
      .limit(50)
      .lean();

    // Rank by number of matching ingredients
    const results = recipes
      .map(recipe => {
        const recipeIngNames = recipe.ingredients.map(i => i.normalizedName);

        const matched = ingredients.filter(ing =>
          recipeIngNames.some(rn => rn.includes(ing) || ing.includes(rn))
        );

        const missing = ingredients.filter(
          ing => !recipeIngNames.some(rn => rn.includes(ing) || ing.includes(rn))
        );

        const matchCount = matched.length;
        const matchPercent = Math.round((matchCount / ingredients.length) * 100);

        return {
          recipe: {
            _id: recipe._id,
            title: recipe.title,
            slug: recipe.slug,
            imageUrl: recipe.imageUrl,
            cookingTimeMinutes: recipe.cookingTimeMinutes,
            originalServings: recipe.originalServings,
            tags: recipe.tags,
            author: recipe.author,
            ingredients: recipe.ingredients,
          },
          matched,
          missing,
          matchCount,
          matchPercent,
        };
      })
      // Sort by most ingredients matched, then by percentage
      .sort((a, b) => b.matchCount - a.matchCount || b.matchPercent - a.matchPercent)
      // Only return recipes that match at least one ingredient
      .filter(r => r.matchCount > 0);

    sendSuccess(res, { results, count: results.length });
  } catch (err) {
    next(err);
  }
}
