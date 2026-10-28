import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { ReviewsResponse } from '../../types';

export function useReviews(recipeId: string) {
  return useQuery<ReviewsResponse>({
    queryKey: ['reviews', recipeId],
    queryFn: async () => {
      const res = await api.get(`/recipes/${recipeId}/reviews`);
      return res.data.data;
    },
    enabled: !!recipeId,
  });
}

export function useUpsertReview(recipeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { rating: number; text: string }) => {
      const res = await api.put(`/recipes/${recipeId}/review`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', recipeId] });
      qc.invalidateQueries({ queryKey: ['recipe'] }); // refresh rating on detail page
    },
  });
}

export function useDeleteReview(recipeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/recipes/${recipeId}/review`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', recipeId] });
    },
  });
}
