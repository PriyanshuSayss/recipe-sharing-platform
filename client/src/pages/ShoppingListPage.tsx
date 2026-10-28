import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Printer, Check, Plus, Minus, ArrowRight } from 'lucide-react';
import { useShopping } from '../features/shopping/ShoppingContext';
import { useAggregateShoppingList } from '../features/recipes/hooks';
import { LoadingSpinner, EmptyState } from '../components/States';
import { AggregatedShoppingItem } from '../types';

export default function ShoppingListPage() {
  const {
    selectedRecipes,
    removeRecipeFromShoppingList,
    updateRecipeServings,
    clearShoppingList,
    checkedItemIds,
    toggleCheckItem,
    clearCheckedItems,
  } = useShopping();

  const aggregateMutation = useAggregateShoppingList();

  useEffect(() => {
    if (selectedRecipes.length > 0) {
      aggregateMutation.mutate(
        selectedRecipes.map((r) => ({ recipeId: r.recipeId, servings: r.servings }))
      );
    }
  }, [selectedRecipes]);

  const items: AggregatedShoppingItem[] = aggregateMutation.data?.items ?? [];
  const completedCount = items.filter((i: AggregatedShoppingItem) => checkedItemIds.includes(i.id)).length;

  return (
    <div className="page-container max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-forest" />
            Shopping List
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Aggregated grocery list combining ingredients from your selected recipes.
          </p>
        </div>
        {selectedRecipes.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="btn-secondary text-sm flex items-center gap-1.5 py-2 px-3"
              title="Print shopping list"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={clearShoppingList}
              className="btn-danger text-sm flex items-center gap-1.5 py-2 px-3"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          </div>
        )}
      </div>

      {selectedRecipes.length === 0 ? (
        <EmptyState
          title="Your shopping list is empty"
          description="Add recipes to your shopping list directly from any recipe detail page to automatically aggregate and sum ingredients."
          action={
            <Link to="/" className="btn-primary flex items-center gap-1">
              Browse Recipes <ArrowRight className="w-4 h-4" />
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Selected Recipes Pills/Card */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">
              Included Recipes ({selectedRecipes.length})
            </h2>
            <div className="flex flex-wrap gap-3">
              {selectedRecipes.map((recipe) => (
                <div
                  key={recipe.recipeId}
                  className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-lg p-2 text-sm"
                >
                  <Link
                    to={`/recipes/${recipe.slug}`}
                    className="font-medium text-forest hover:underline"
                  >
                    {recipe.title}
                  </Link>

                  {/* Servings control */}
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 py-0.5 text-xs">
                    <span className="text-gray-500">Servings:</span>
                    <button
                      onClick={() =>
                        updateRecipeServings(recipe.recipeId, Math.max(1, recipe.servings - 1))
                      }
                      className="text-gray-600 hover:text-forest p-0.5"
                      title="Decrease servings"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-semibold tabular-nums w-4 text-center">
                      {recipe.servings}
                    </span>
                    <button
                      onClick={() =>
                        updateRecipeServings(recipe.recipeId, recipe.servings + 1)
                      }
                      className="text-gray-600 hover:text-forest p-0.5"
                      title="Increase servings"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeRecipeFromShoppingList(recipe.recipeId)}
                    className="text-gray-400 hover:text-red-600 p-0.5"
                    title="Remove recipe from shopping list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Aggregated Ingredients List */}
          <div className="card p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <h2 className="font-semibold text-gray-900 text-lg">Ingredients to Buy</h2>
                <p className="text-xs text-gray-400">
                  {completedCount} of {items.length} items checked
                </p>
              </div>
              {completedCount > 0 && (
                <button
                  onClick={clearCheckedItems}
                  className="text-xs text-gray-500 hover:text-forest underline"
                >
                  Uncheck all
                </button>
              )}
            </div>

            {aggregateMutation.isPending ? (
              <LoadingSpinner message="Calculating combined quantities..." />
            ) : items.length === 0 ? (
              <p className="text-gray-500 text-sm">No ingredients found.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((item: AggregatedShoppingItem) => {
                  const isChecked = checkedItemIds.includes(item.id);
                  return (
                    <li
                      key={item.id}
                      onClick={() => toggleCheckItem(item.id)}
                      className={`py-3 flex items-start gap-3 cursor-pointer group transition-colors ${
                        isChecked ? 'opacity-50' : 'hover:bg-amber-50/50'
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-forest border-forest text-white'
                            : 'border-gray-300 bg-white group-hover:border-forest'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      {/* Ingredient & quantity */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={`font-medium text-gray-800 ${
                              isChecked ? 'line-through text-gray-400' : ''
                            }`}
                          >
                            {item.name}
                          </span>
                          <span
                            className={`font-semibold text-forest text-sm tabular-nums shrink-0 ${
                              isChecked ? 'line-through text-gray-400' : ''
                            }`}
                          >
                            {item.displayQuantity} {item.unit}
                          </span>
                        </div>
                        {item.recipeTitles.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            From: {item.recipeTitles.join(', ')}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
