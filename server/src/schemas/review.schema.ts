import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  text: z.string().trim().max(2000, 'Review text cannot exceed 2000 characters').default(''),
});

export const ingredientSearchSchema = z.object({
  ingredients: z
    .array(z.string().trim().max(100))
    .min(1, 'At least one ingredient required')
    .max(20, 'Maximum 20 ingredients'),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
