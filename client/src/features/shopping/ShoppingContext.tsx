import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ShoppingRecipeSelection {
  recipeId: string;
  title: string;
  slug: string;
  servings: number;
  imageUrl?: string;
}

interface ShoppingContextType {
  selectedRecipes: ShoppingRecipeSelection[];
  addRecipeToShoppingList: (recipe: { _id: string; title: string; slug: string; originalServings: number; imageUrl?: string }, servings?: number) => void;
  removeRecipeFromShoppingList: (recipeId: string) => void;
  updateRecipeServings: (recipeId: string, servings: number) => void;
  clearShoppingList: () => void;
  checkedItemIds: string[];
  toggleCheckItem: (id: string) => void;
  clearCheckedItems: () => void;
}

const STORAGE_KEY_RECIPES = 'plateful_shopping_recipes';
const STORAGE_KEY_CHECKED = 'plateful_shopping_checked';

const ShoppingContext = createContext<ShoppingContextType | null>(null);

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const [selectedRecipes, setSelectedRecipes] = useState<ShoppingRecipeSelection[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECIPES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [checkedItemIds, setCheckedItemIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHECKED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECIPES, JSON.stringify(selectedRecipes));
  }, [selectedRecipes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CHECKED, JSON.stringify(checkedItemIds));
  }, [checkedItemIds]);

  const addRecipeToShoppingList = (
    recipe: { _id: string; title: string; slug: string; originalServings: number; imageUrl?: string },
    servings?: number
  ) => {
    setSelectedRecipes((prev) => {
      const exists = prev.find((r) => r.recipeId === recipe._id);
      if (exists) {
        return prev.map((r) =>
          r.recipeId === recipe._id
            ? { ...r, servings: servings || r.servings }
            : r
        );
      }
      return [
        ...prev,
        {
          recipeId: recipe._id,
          title: recipe.title,
          slug: recipe.slug,
          servings: servings || recipe.originalServings,
          imageUrl: recipe.imageUrl,
        },
      ];
    });
  };

  const removeRecipeFromShoppingList = (recipeId: string) => {
    setSelectedRecipes((prev) => prev.filter((r) => r.recipeId !== recipeId));
  };

  const updateRecipeServings = (recipeId: string, servings: number) => {
    if (servings < 1) return;
    setSelectedRecipes((prev) =>
      prev.map((r) => (r.recipeId === recipeId ? { ...r, servings } : r))
    );
  };

  const clearShoppingList = () => {
    setSelectedRecipes([]);
    setCheckedItemIds([]);
  };

  const toggleCheckItem = (id: string) => {
    setCheckedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const clearCheckedItems = () => {
    setCheckedItemIds([]);
  };

  return (
    <ShoppingContext.Provider
      value={{
        selectedRecipes,
        addRecipeToShoppingList,
        removeRecipeFromShoppingList,
        updateRecipeServings,
        clearShoppingList,
        checkedItemIds,
        toggleCheckItem,
        clearCheckedItems,
      }}
    >
      {children}
    </ShoppingContext.Provider>
  );
}

export function useShopping() {
  const ctx = useContext(ShoppingContext);
  if (!ctx) throw new Error('useShopping must be used within ShoppingProvider');
  return ctx;
}
