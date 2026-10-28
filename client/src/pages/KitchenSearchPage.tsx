import React, { useState, KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Check, AlertCircle, Clock, Users } from 'lucide-react';
import { useIngredientSearch } from '../features/recipes/hooks';
import { LoadingSpinner } from '../components/States';
import { IngredientSearchResult } from '../types';

export default function KitchenSearchPage() {
  const [inputValue, setInputValue] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [validationError, setValidationError] = useState('');

  const search = useIngredientSearch();

  const addIngredient = () => {
    const trimmed = inputValue.trim().toLowerCase();
    setValidationError('');

    if (!trimmed) return;
    if (trimmed.length > 100) {
      setValidationError('Ingredient name too long');
      return;
    }
    if (ingredients.includes(trimmed)) {
      setValidationError('Already added');
      return;
    }
    if (ingredients.length >= 20) {
      setValidationError('Maximum 20 ingredients');
      return;
    }

    setIngredients(prev => [...prev, trimmed]);
    setInputValue('');
  };

  const removeIngredient = (ing: string) => {
    setIngredients(prev => prev.filter(i => i !== ing));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  };

  const handleSearch = () => {
    if (ingredients.length === 0) {
      setValidationError('Add at least one ingredient');
      return;
    }
    search.mutate(ingredients);
  };

  const results: IngredientSearchResult[] = search.data?.results ?? [];

  return (
    <div className="page-container max-w-3xl">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">
          What Can I Cook?
        </h1>
        <p className="text-gray-500 text-base max-w-xl mx-auto">
          Enter the ingredients you have on hand. We'll find recipes you can make right now.
        </p>
      </div>

      {/* Ingredient entry */}
      <div className="card p-6 mb-6">
        <label className="label" htmlFor="ingredient-input">Add Ingredients</label>
        <div className="flex gap-2 mb-3">
          <input
            id="ingredient-input"
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. eggs, flour, butter..."
            className="input flex-1"
            aria-label="Enter an ingredient"
          />
          <button
            type="button"
            onClick={addIngredient}
            className="btn-primary shrink-0"
          >
            Add
          </button>
        </div>

        {validationError && <p className="error-text mb-3">{validationError}</p>}

        {/* Chips */}
        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {ingredients.map(ing => (
              <span
                key={ing}
                className="flex items-center gap-1.5 px-3 py-1 bg-forest text-white rounded-full text-sm"
              >
                {ing}
                <button
                  onClick={() => removeIngredient(ing)}
                  className="hover:opacity-75 transition-opacity"
                  aria-label={`Remove ${ing}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={search.isPending || ingredients.length === 0}
          className="btn-primary flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          {search.isPending ? 'Searching...' : 'Find Recipes'}
        </button>

        {ingredients.length === 0 && (
          <p className="text-gray-400 text-xs mt-3">
            Tip: Press Enter or click Add after each ingredient
          </p>
        )}
      </div>

      {/* Results */}
      {search.isPending && <LoadingSpinner message="Searching recipes..." />}

      {search.isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700">
          Search failed. Please try again.
        </div>
      )}

      {search.isSuccess && (
        <div>
          <h2 className="font-semibold text-gray-800 mb-4">
            {results.length === 0
              ? 'No recipes found'
              : `${results.length} recipe${results.length === 1 ? '' : 's'} found`}
          </h2>

          {results.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-3">🤔</div>
              <p className="text-gray-600 font-medium mb-2">No matching recipes</p>
              <p className="text-gray-500 text-sm">
                Try different ingredients or{' '}
                <Link to="/recipes/new" className="text-forest hover:underline">
                  create a new recipe
                </Link>{' '}
                with what you have.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result, i) => (
                <Link
                  key={result.recipe._id}
                  to={`/recipes/${result.recipe.slug}`}
                  className="card p-5 flex gap-4 hover:shadow-card-hover transition-shadow group"
                >
                  {/* Image */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={result.recipe.imageUrl || 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=200&q=80'}
                      alt={result.recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-forest transition-colors">
                        {result.recipe.title}
                      </h3>
                      {/* Match badge */}
                      <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${
                        result.matchPercent === 100
                          ? 'bg-green-100 text-green-700'
                          : result.matchPercent >= 50
                          ? 'bg-brand-100 text-forest'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {result.matchPercent}% match
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex gap-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {result.recipe.cookingTimeMinutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Serves {result.recipe.originalServings}
                      </span>
                    </div>

                    {/* Matched ingredients */}
                    {result.matched.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {result.matched.map(ing => (
                          <span key={ing} className="flex items-center gap-0.5 text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                            <Check className="w-3 h-3" />
                            {ing}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Missing ingredients */}
                    {result.missing.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {result.missing.map(ing => (
                          <span key={ing} className="flex items-center gap-0.5 text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" />
                            {ing}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
