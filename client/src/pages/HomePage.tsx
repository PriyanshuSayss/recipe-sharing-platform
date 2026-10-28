import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Tag } from 'lucide-react';
import { useRecipes } from '../features/recipes/hooks';
import RecipeCard from '../components/RecipeCard';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/States';
import { useDebounce } from '../hooks/useDebounce';

const POPULAR_TAGS = ['breakfast', 'dinner', 'vegan', 'quick', 'pasta', 'dessert', 'healthy', 'italian'];

export default function HomePage() {
  const [searchInput, setSearchInput] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchInput, 400);

  const { data, isLoading, isError, error, refetch } = useRecipes({
    q: debouncedSearch || undefined,
    tag: selectedTag || undefined,
    page,
    limit: 12,
  });

  const handleTagClick = useCallback((tag: string) => {
    setSelectedTag(prev => (prev === tag ? '' : tag));
    setPage(1);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setPage(1);
  };

  return (
    <div className="page-container">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold text-gray-900 mb-3">
          Discover & Share Recipes
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Find dishes you'll love. Scale servings, rate recipes, and share your own creations.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-xl mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchInput}
            onChange={handleSearchChange}
            className="input pl-11 text-base"
            aria-label="Search recipes"
          />
        </div>
      </div>

      {/* Tag filters */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {POPULAR_TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-colors ${
              selectedTag === tag
                ? 'bg-forest text-white border-forest'
                : 'bg-white text-gray-600 border-gray-200 hover:border-forest hover:text-forest'
            }`}
            aria-pressed={selectedTag === tag}
          >
            <Tag className="w-3 h-3" />
            {tag}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading && <LoadingSpinner message="Loading recipes..." />}

      {isError && (
        <ErrorMessage
          message={(error as Error)?.message}
          retry={() => refetch()}
        />
      )}

      {!isLoading && !isError && data && (
        <>
          {/* Results count */}
          <div className="text-sm text-gray-500 mb-4">
            {data.pagination.total} {data.pagination.total === 1 ? 'recipe' : 'recipes'} found
            {debouncedSearch && ` for "${debouncedSearch}"`}
            {selectedTag && ` tagged "${selectedTag}"`}
          </div>

          {data.recipes.length === 0 ? (
            <EmptyState
              title="No recipes found"
              description="Try a different search term or clear the filters."
              action={
                <button
                  onClick={() => { setSearchInput(''); setSelectedTag(''); }}
                  className="btn-secondary"
                >
                  Clear Filters
                </button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data.recipes.map(recipe => (
                  <RecipeCard key={recipe._id} recipe={recipe} />
                ))}
              </div>

              {/* Pagination */}
              {data.pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {page} of {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                    disabled={page === data.pagination.pages}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
