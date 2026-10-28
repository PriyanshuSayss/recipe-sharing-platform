import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { RecipeListResponse, Recipe } from '../../types';

export function useRecipes(params: {
  page?: number;
  limit?: number;
  q?: string;
  tag?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.q) searchParams.set('q', params.q);
  if (params.tag) searchParams.set('tag', params.tag);

  return useQuery<RecipeListResponse>({
    queryKey: ['recipes', params],
    queryFn: async () => {
      const res = await api.get(`/recipes?${searchParams}`);
      return res.data.data;
    },
  });
}

export function useRecipe(slug: string) {
  return useQuery<Recipe>({
    queryKey: ['recipe', slug],
    queryFn: async () => {
      const res = await api.get(`/recipes/${slug}`);
      return res.data.data.recipe;
    },
    enabled: !!slug,
  });
}

export function useMyRecipes(params: { page?: number } = {}) {
  return useQuery<RecipeListResponse>({
    queryKey: ['myRecipes', params],
    queryFn: async () => {
      const res = await api.get(`/recipes/mine?page=${params.page ?? 1}`);
      return res.data.data;
    },
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await api.post('/recipes', data);
      return res.data.data.recipe as Recipe;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.invalidateQueries({ queryKey: ['myRecipes'] });
    },
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const res = await api.patch(`/recipes/${id}`, data);
      return res.data.data.recipe as Recipe;
    },
    onSuccess: (recipe) => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.invalidateQueries({ queryKey: ['recipe', recipe.slug] });
      qc.invalidateQueries({ queryKey: ['myRecipes'] });
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/recipes/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.invalidateQueries({ queryKey: ['myRecipes'] });
    },
  });
}

export function useIngredientSearch() {
  return useMutation({
    mutationFn: async (ingredients: string[]) => {
      const res = await api.post('/recipes/search/ingredients', { ingredients });
      return res.data.data;
    },
  });
}

export function useSavedRecipes() {
  return useQuery<{ recipes: Recipe[]; count: number }>({
    queryKey: ['savedRecipes'],
    queryFn: async () => {
      const res = await api.get('/recipes/saved');
      return res.data.data;
    },
  });
}

export function useIsRecipeSaved(recipeId: string) {
  return useQuery<boolean>({
    queryKey: ['isSaved', recipeId],
    queryFn: async () => {
      const res = await api.get(`/recipes/${recipeId}/is-saved`);
      return res.data.data.isSaved;
    },
    enabled: !!recipeId,
  });
}

export function useToggleSaveRecipe(recipeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (currentlySaved: boolean) => {
      if (currentlySaved) {
        await api.delete(`/recipes/${recipeId}/save`);
        return false;
      } else {
        await api.post(`/recipes/${recipeId}/save`);
        return true;
      }
    },
    onSuccess: (isSaved) => {
      qc.setQueryData(['isSaved', recipeId], isSaved);
      qc.invalidateQueries({ queryKey: ['savedRecipes'] });
    },
  });
}

export function useAggregateShoppingList() {
  return useMutation({
    mutationFn: async (items: Array<{ recipeId: string; servings?: number }>) => {
      const res = await api.post('/shopping-list/aggregate', { items });
      return res.data.data;
    },
  });
}
