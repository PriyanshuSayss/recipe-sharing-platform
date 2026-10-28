import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedRecipe extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  recipe: mongoose.Types.ObjectId;
  createdAt: Date;
}

const savedRecipeSchema = new Schema<ISavedRecipe>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipe: {
      type: Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Prevent duplicate saves per user per recipe
savedRecipeSchema.index({ user: 1, recipe: 1 }, { unique: true });

savedRecipeSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const r = ret as unknown as Record<string, unknown>;
    delete r.__v;
    return r;
  },
});

export const SavedRecipe = mongoose.model<ISavedRecipe>('SavedRecipe', savedRecipeSchema);
