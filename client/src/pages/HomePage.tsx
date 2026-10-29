import React, { useState, useCallback } from 'react';
import { Search, RotateCcw, SlidersHorizontal, ChefHat } from 'lucide-react';
import { useRecipes } from '../features/recipes/hooks';
import RecipeCard from '../components/RecipeCard';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/States';
import { useDebounce } from '../hooks/useDebounce';
import { DietaryClassification, MealType } from '../types';

const CUISINES = [
  { id: '', name: 'All Cuisines', icon: '🌍' },
  { id: 'Indian', name: 'Indian', icon: '🇮🇳' },
  { id: 'Italian', name: 'Italian', icon: '🇮🇹' },
  { id: 'Chinese', name: 'Chinese', icon: '🥢' },
  { id: 'Japanese', name: 'Japanese', icon: '🍣' },
  { id: 'Thai', name: 'Thai', icon: '🍜' },
  { id: 'Mexican', name: 'Mexican', icon: '🌮' },
  { id: 'Korean', name: 'Korean', icon: '🍚' },
  { id: 'Mediterranean', name: 'Mediterranean', icon: '🫒' },
  { id: 'Middle Eastern', name: 'Middle Eastern', icon: '🥙' },
  { id: 'American', name: 'American', icon: '🍔' },
  { id: 'French', name: 'French', icon: '🥐' },
];

const DIETARY_OPTIONS: Array<{ id: DietaryClassification | ''; label: string; icon: string }> = [
  { id: '', label: 'All Diets', icon: '🍽️' },
  { id: 'Vegetarian', label: 'Vegetarian', icon: '🌿' },
  { id: 'Vegan', label: 'Vegan', icon: '🌱' },
  { id: 'Eggetarian', label: 'Eggetarian', icon: '🥚' },
  { id: 'Non-Vegetarian', label: 'Non-Veg', icon: '🍗' },
];

const MEAL_TYPES: Array<{ id: MealType | ''; label: string }> = [
  { id: '', label: 'All Meals' },
  { id: 'Breakfast', label: 'Breakfast' },
  { id: 'Lunch', label: 'Lunch' },
  { id: 'Dinner', label: 'Dinner' },
  { id: 'Snack', label: 'Snack' },
  { id: 'Dessert', label: 'Dessert' },
  { id: 'Drink', label: 'Drink' },
];

const TIME_OPTIONS = [
  { value: 0, label: 'Any Time' },
  { value: 20, label: '≤ 20 mins' },
  { value: 30, label: '≤ 30 mins' },
  { value: 45, label: '≤ 45 mins' },
  { value: 60, label: '≤ 60 mins' },
];

export default function HomePage() {
  const [searchInput, setSearchInput] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedDietary, setSelectedDietary] = useState<DietaryClassification | ''>('');
  const [selectedMealType, setSelectedMealType] = useState<MealType | ''>('');
  const [maxCookingTime, setMaxCookingTime] = useState<number>(0);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchInput, 400);

  const hasActiveFilters = Boolean(
    searchInput || selectedCuisine || selectedDietary || selectedMealType || maxCookingTime > 0
  );

  const clearAllFilters = useCallback(() => {
    setSearchInput('');
    setSelectedCuisine('');
    setSelectedDietary('');
    setSelectedMealType('');
    setMaxCookingTime(0);
    setPage(1);
  }, []);

  const { data, isLoading, isError, error, refetch } = useRecipes({
    q: debouncedSearch || undefined,
    cuisine: selectedCuisine || undefined,
    dietary: selectedDietary || undefined,
    mealType: selectedMealType || undefined,
    maxCookingTime: maxCookingTime > 0 ? maxCookingTime : undefined,
    page,
    limit: 12,
  });

  const handleCuisineSelect = (cuisineId: string) => {
    setSelectedCuisine((prev) => (prev === cuisineId ? '' : cuisineId));
    setPage(1);
  };

  const handleDietarySelect = (diet: DietaryClassification | '') => {
    setSelectedDietary(diet);
    setPage(1);
  };

  const handleMealTypeSelect = (meal: MealType | '') => {
    setSelectedMealType(meal);
    setPage(1);
  };

  return (
    <div className="page-container space-y-8">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto pt-2 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-forest text-xs font-semibold mb-3">
          <ChefHat className="w-3.5 h-3.5" />
          50+ Authentic Multi-Cuisine Recipes
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-3">
          Explore Authentic Global Cuisines
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">
          From North & South Indian classics to Italian pastas, Japanese ramen, and Mexican tacos.
          Scale ingredients effortlessly and cook with confidence.
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-xl mx-auto">
        <div className="relative shadow-sm rounded-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by recipe, ingredient, or keyword (e.g. paneer, pasta, taco)..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            className="input pl-12 pr-10 py-3 text-base rounded-xl border-gray-200 focus:border-forest"
            aria-label="Search recipes"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                setPage(1);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Visual Cuisine Explorer Carousel / Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Browse by Cuisine
          </h2>
          {selectedCuisine && (
            <button
              onClick={() => setSelectedCuisine('')}
              className="text-xs text-forest hover:underline font-medium"
            >
              Show all cuisines
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
          {CUISINES.map((c) => {
            const isActive = selectedCuisine === c.id;
            return (
              <button
                key={c.name}
                onClick={() => handleCuisineSelect(c.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 border ${
                  isActive
                    ? 'bg-forest text-white border-forest shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-forest/50 hover:bg-brand-50/50'
                }`}
                aria-pressed={isActive}
              >
                <span className="text-base">{c.icon}</span>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <SlidersHorizontal className="w-4 h-4 text-forest" />
            <span>Refine Recipes</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 text-xs font-medium text-coral hover:text-rose-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dietary Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Dietary Preference</label>
            <div className="flex flex-wrap gap-1.5">
              {DIETARY_OPTIONS.map((d) => {
                const isActive = selectedDietary === d.id;
                return (
                  <button
                    key={d.label}
                    onClick={() => handleDietarySelect(d.id)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                      isActive
                        ? 'bg-forest text-white border-forest font-semibold'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    <span>{d.icon}</span>
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meal Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Meal Type</label>
            <div className="flex flex-wrap gap-1.5">
              {MEAL_TYPES.map((m) => {
                const isActive = selectedMealType === m.id;
                return (
                  <button
                    key={m.label}
                    onClick={() => handleMealTypeSelect(m.id)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-forest text-white border-forest font-semibold'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Max Cooking Time */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Max Cooking Time</label>
            <div className="flex flex-wrap gap-1.5">
              {TIME_OPTIONS.map((t) => {
                const isActive = maxCookingTime === t.value;
                return (
                  <button
                    key={t.label}
                    onClick={() => {
                      setMaxCookingTime(t.value);
                      setPage(1);
                    }}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-forest text-white border-forest font-semibold'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {isLoading && <LoadingSpinner message="Searching recipes..." />}

      {isError && (
        <ErrorMessage
          message={(error as Error)?.message || 'Failed to load recipes.'}
          retry={() => refetch()}
        />
      )}

      {!isLoading && !isError && data && (
        <div className="space-y-6">
          {/* Active summary & count */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <span className="font-semibold text-gray-900">{data.pagination.total}</span>{' '}
              {data.pagination.total === 1 ? 'recipe' : 'recipes'} available
              {selectedCuisine && (
                <span>
                  {' '}
                  in <strong className="text-forest">{selectedCuisine}</strong>
                </span>
              )}
              {selectedDietary && (
                <span>
                  {' '}
                  • <strong className="text-forest">{selectedDietary}</strong>
                </span>
              )}
              {selectedMealType && <span> • {selectedMealType}</span>}
              {debouncedSearch && <span> matching "{debouncedSearch}"</span>}
            </div>
          </div>

          {data.recipes.length === 0 ? (
            <EmptyState
              title="No recipes match your criteria"
              description="Try broadening your dietary filter or resetting your search to explore other cuisines."
              action={
                <button onClick={clearAllFilters} className="btn-secondary">
                  Reset All Filters
                </button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data.recipes.map((recipe) => (
                  <RecipeCard key={recipe._id} recipe={recipe} />
                ))}
              </div>

              {/* Pagination */}
              {data.pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-gray-600 px-2 font-medium">
                    Page {page} of {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                    disabled={page === data.pagination.pages}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
