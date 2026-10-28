import { Request, Response, NextFunction } from 'express';
import { Review } from '../models/Review';
import { Recipe } from '../models/Recipe';
import { sendSuccess, sendError, AppError } from '../utils/response';
import { reviewSchema } from '../schemas/review.schema';
import { ZodError } from 'zod';

export async function getReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const recipe = await Recipe.findById(req.params.id).lean();
    if (!recipe) {
      throw new AppError(404, 'Recipe not found');
    }

    const reviews = await Review.find({ recipe: req.params.id })
      .populate('user', 'displayName')
      .sort({ createdAt: -1 })
      .lean();

    // Compute aggregate
    const [agg] = await Review.aggregate([
      { $match: { recipe: recipe._id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    sendSuccess(res, {
      reviews,
      averageRating: agg?.averageRating ?? null,
      reviewCount: agg?.reviewCount ?? 0,
    });
  } catch (err) {
    next(err);
  }
}

export async function upsertReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const recipe = await Recipe.findById(req.params.id).lean();
    if (!recipe) {
      throw new AppError(404, 'Recipe not found');
    }

    const data = reviewSchema.parse(req.body);

    // Use findOneAndUpdate with upsert to atomically handle create/update
    // The unique index on {recipe, user} prevents duplicates even under concurrent requests
    const review = await Review.findOneAndUpdate(
      { recipe: req.params.id, user: req.user!._id },
      {
        $set: {
          rating: data.rating,
          text: data.text,
          recipe: req.params.id,
          user: req.user!._id,
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).populate('user', 'displayName');

    // Recompute aggregate after update
    const [agg] = await Review.aggregate([
      { $match: { recipe: recipe._id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    sendSuccess(res, {
      review,
      averageRating: agg?.averageRating ?? null,
      reviewCount: agg?.reviewCount ?? 0,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(res, 400, err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '));
      return;
    }
    next(err);
  }
}

export async function deleteReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const deleted = await Review.findOneAndDelete({
      recipe: req.params.id,
      user: req.user!._id,
    });

    if (!deleted) {
      throw new AppError(404, 'Review not found');
    }

    sendSuccess(res, null, 200, 'Review deleted');
  } catch (err) {
    next(err);
  }
}
