// Shared TypeScript types used by the client

export interface User {
  _id: string;
  displayName: string;
  email: string;
  createdAt: string;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Instruction {
  stepNumber: number;
  text: string;
}

export interface Recipe {
  _id: string;
  title: string;
  slug: string;
  description: string;
  author: { _id: string; displayName: string; email?: string };
  imageUrl: string;
  imagePublicId?: string;
  originalServings: number;
  cookingTimeMinutes: number;
  tags: string[];
  ingredients: Ingredient[];
  instructions: Instruction[];
  averageRating?: number | null;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  recipe: string;
  user: { _id: string; displayName: string };
  rating: number;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface RecipeListResponse {
  recipes: Recipe[];
  pagination: PaginationMeta;
}

export interface ReviewsResponse {
  reviews: Review[];
  averageRating: number | null;
  reviewCount: number;
}

export interface IngredientSearchResult {
  recipe: Recipe;
  matched: string[];
  missing: string[];
  matchCount: number;
  matchPercent: number;
}
