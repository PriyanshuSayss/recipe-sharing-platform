import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight, Heart } from 'lucide-react';
import { useSavedRecipes } from '../features/recipes/hooks';
import RecipeCard from '../components/RecipeCard';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/States';

export default function SavedRecipesPage() {
  const { data, isLoading, isError, refetch } = useSavedRecipes();

  if (isLoading) return <LoadingSpinner message="Loading your saved collection..." />;
  if (isError) return <ErrorMessage message="Failed to load saved recipes." retry={() => refetch()} />;

  const recipes = data?.recipes ?? [];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bookmark className="w-7 h-7 text-forest fill-forest/20" />
            Saved Recipes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Your personal collection of bookmarked favorites ({recipes.length})
          </p>
        </div>
        <Link to="/" className="btn-secondary text-sm flex items-center gap-1">
          Browse More <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {recipes.length === 0 ? (
        <EmptyState
          title="No saved recipes yet"
          description="Bookmark recipes you want to cook later by clicking the 'Save Recipe' button on any recipe detail page."
          action={
            <Link to="/" className="btn-primary">
              Discover Recipes
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe._id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
