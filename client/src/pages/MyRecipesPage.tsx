import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useMyRecipes, useDeleteRecipe } from '../features/recipes/hooks';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/States';
import { useState } from 'react';
import { Recipe } from '../types';

export default function MyRecipesPage() {
  const { data, isLoading, isError, refetch } = useMyRecipes();
  const deleteRecipe = useDeleteRecipe();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteRecipe.mutateAsync(id);
      setConfirmId(null);
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading your recipes..." />;
  if (isError) return <ErrorMessage message="Failed to load recipes." retry={() => refetch()} />;

  const recipes = data?.recipes ?? [];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">My Recipes</h1>
        <Link to="/recipes/new" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          New Recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <EmptyState
          title="You haven't created any recipes yet"
          description="Share your favorite dishes with the Plateful community."
          action={
            <Link to="/recipes/new" className="btn-primary">
              Create Your First Recipe
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {recipes.map((recipe: Recipe) => (
            <div key={recipe._id} className="card p-5 flex items-start gap-4">
              {/* Thumbnail */}
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <img
                  src={recipe.imageUrl || 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=200&q=80'}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-base truncate mb-1">
                  <Link to={`/recipes/${recipe.slug}`} className="hover:text-forest transition-colors">
                    {recipe.title}
                  </Link>
                </h3>
                <div className="flex flex-wrap gap-1 mb-2">
                  {recipe.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-brand-50 text-forest rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {recipe.cookingTimeMinutes} min · Serves {recipe.originalServings}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <Link
                  to={`/recipes/${recipe._id}/edit`}
                  className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
                {confirmId === recipe._id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(recipe._id)}
                      disabled={deleting}
                      className="btn-danger text-sm py-1.5 px-3"
                    >
                      {deleting ? '...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="btn-secondary text-sm py-1.5 px-3"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(recipe._id)}
                    className="btn-danger text-sm py-1.5 px-3 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
