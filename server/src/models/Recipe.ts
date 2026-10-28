import mongoose, { Document, Schema } from 'mongoose';

export const SUPPORTED_UNITS = [
  'g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'cups',
  'piece', 'pieces', 'clove', 'cloves', 'slice', 'slices',
  'pinch', 'pinches', 'oz', 'lb', 'bunch', 'handful',
  'can', 'cans', 'sheet', 'sheets', 'whole', '',
] as const;

export type Unit = (typeof SUPPORTED_UNITS)[number];

export interface IIngredient {
  name: string;
  normalizedName: string;
  quantity: number;
  unit: Unit;
}

export interface IInstruction {
  stepNumber: number;
  text: string;
}

export interface IRecipe extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  author: mongoose.Types.ObjectId;
  imageUrl: string;
  imagePublicId?: string;
  originalServings: number;
  cookingTimeMinutes: number;
  tags: string[];
  ingredients: IIngredient[];
  instructions: IInstruction[];
  createdAt: Date;
  updatedAt: Date;
}

const ingredientSchema = new Schema<IIngredient>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    normalizedName: { type: String, required: true, lowercase: true, trim: true },
    quantity: {
      type: Number,
      required: true,
      min: [0.001, 'Quantity must be positive'],
      validate: {
        validator: (v: number) => isFinite(v) && v > 0,
        message: 'Quantity must be a finite positive number',
      },
    },
    unit: {
      type: String,
      enum: SUPPORTED_UNITS,
      default: '',
    },
  },
  { _id: false }
);

const instructionSchema = new Schema<IInstruction>(
  {
    stepNumber: { type: Number, required: true, min: 1 },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { _id: false }
);

const recipeSchema = new Schema<IRecipe>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    originalServings: {
      type: Number,
      required: true,
      min: [1, 'Servings must be at least 1'],
      max: [1000, 'Servings cannot exceed 1000'],
      validate: {
        validator: (v: number) => Number.isInteger(v) && v > 0,
        message: 'Servings must be a positive integer',
      },
    },
    cookingTimeMinutes: {
      type: Number,
      required: true,
      min: [1, 'Cooking time must be at least 1 minute'],
      max: [10000, 'Cooking time is unreasonably large'],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags: string[]) => tags.length <= 20,
        message: 'Too many tags (maximum 20)',
      },
    },
    ingredients: {
      type: [ingredientSchema],
      required: true,
      validate: {
        validator: (ing: IIngredient[]) => ing.length >= 1 && ing.length <= 100,
        message: 'Recipe must have 1–100 ingredients',
      },
    },
    instructions: {
      type: [instructionSchema],
      required: true,
      validate: {
        validator: (steps: IInstruction[]) => steps.length >= 1 && steps.length <= 50,
        message: 'Recipe must have 1–50 steps',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Full-text search index
recipeSchema.index({ title: 'text', tags: 'text' });
// Tag filter index
recipeSchema.index({ tags: 1 });
// Ingredient search index
recipeSchema.index({ 'ingredients.normalizedName': 1 });

recipeSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const r = ret as unknown as Record<string, unknown>;
    delete r.__v;
    return r;
  },
});

export const Recipe = mongoose.model<IRecipe>('Recipe', recipeSchema);
