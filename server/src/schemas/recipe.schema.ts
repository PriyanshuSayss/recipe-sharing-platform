import { z } from 'zod';
import {
  SUPPORTED_UNITS,
  SUPPORTED_DIETARY,
  SUPPORTED_MEAL_TYPES,
  SUPPORTED_DIFFICULTIES,
} from '../models/Recipe';

const ingredientSchema = z.object({
  name: z.string().trim().min(1, 'Ingredient name required').max(100),
  quantity: z
    .number()
    .positive('Quantity must be positive')
    .finite('Quantity must be finite'),
  unit: z.enum(SUPPORTED_UNITS as unknown as [string, ...string[]]).default(''),
});

const instructionSchema = z.object({
  stepNumber: z.number().int().positive(),
  text: z.string().trim().min(1).max(2000),
});

export const createRecipeSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().trim().min(10, 'Description too short').max(5000),
  originalServings: z
    .number()
    .int('Servings must be an integer')
    .positive('Servings must be positive')
    .max(1000),
  cookingTimeMinutes: z
    .number()
    .int()
    .positive('Cooking time must be positive')
    .max(10000),
  tags: z.array(z.string().trim().max(50)).max(20).default([]),
  cuisine: z.string().trim().max(60).default('International'),
  cuisineRegion: z.string().trim().max(60).optional(),
  dietary: z.enum(SUPPORTED_DIETARY).default('Vegetarian'),
  dietaryTags: z.array(z.string().trim().max(50)).default([]),
  mealType: z.enum(SUPPORTED_MEAL_TYPES).default('Dinner'),
  difficulty: z.enum(SUPPORTED_DIFFICULTIES).default('Medium'),
  ingredients: z
    .array(ingredientSchema)
    .min(1, 'At least one ingredient required')
    .max(100),
  instructions: z
    .array(instructionSchema)
    .min(1, 'At least one step required')
    .max(50),
  imageUrl: z.string().default(''),
  imagePublicId: z.string().default(''),
});

export const updateRecipeSchema = createRecipeSchema.partial();

export const recipeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  q: z.string().trim().max(200).optional(),
  search: z.string().trim().max(200).optional(),
  tag: z.string().trim().max(50).optional(),
  cuisine: z.string().trim().max(60).optional(),
  dietary: z.string().trim().max(60).optional(),
  mealType: z.string().trim().max(60).optional(),
  difficulty: z.string().trim().max(60).optional(),
  maxCookingTime: z.coerce.number().int().positive().optional(),
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
