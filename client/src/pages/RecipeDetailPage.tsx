import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, Users, Tag, ArrowLeft, Edit, Trash2, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { useRecipe, useDeleteRecipe } from '../features/recipes/hooks';
import { useReviews, useUpsertReview, useDeleteReview } from '../features/reviews/hooks';
import { useAuth } from '../features/auth/AuthContext';
import { LoadingSpinner, ErrorMessage } from '../components/States';
import StarRating from '../components/StarRating';
import { scaleQuantity, formatQuantity } from '../utils/scaling';

export default function RecipeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: recipe, isLoading, isError } = useRecipe(slug!);
  const { data: reviewData, isLoading: reviewsLoading } = useReviews(recipe?._id ?? '');

  const deleteRecipe = useDeleteRecipe();
  const upsertReview = useUpsertReview(recipe?._id ?? '');
  const deleteReview = useDeleteReview(recipe?._id ?? '');

  const [servings, setServings] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewError, setReviewError] = useState('');

  const currentServings = servings ?? recipe?.originalServings ?? 1;
  const isOwner = user && recipe && user._id === recipe.author._id;

  const handleServingsChange = (delta: number) => {
    const next = currentServings + delta;
    if (next >= 1 && next <= 10000) setServings(next);
  };

  const handleServingsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= 1 && v <= 10000) setServings(v);
  };

  const handleDelete = async () => {
    if (!recipe) return;
    await deleteRecipe.mutateAsync(recipe._id);
    navigate('/my-recipes');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError('Rating must be between 1 and 5');
      return;
    }
    try {
      await upsertReview.mutateAsync({ rating: reviewRating, text: reviewText });
      setReviewText('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setReviewError(msg || 'Failed to submit review');
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading recipe..." className="min-h-[60vh]" />;
  if (isError || !recipe) return (
    <div className="page-container">
      <ErrorMessage message="Recipe not found or could not be loaded." />
      <Link to="/" className="flex items-center gap-2 text-forest mt-4">
        <ArrowLeft className="w-4 h-4" /> Back to recipes
      </Link>
    </div>
  );

  return (
    <div className="page-container max-w-4xl">
      {/* Back link */}
      <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-forest mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        All Recipes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap gap-1 mb-2">
            {recipe.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-brand-50 text-forest rounded-full border border-brand-200">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2 leading-tight">{recipe.title}</h1>
          <p className="text-gray-500 text-sm">
            by <span className="text-gray-700 font-medium">{recipe.author.displayName}</span>
          </p>
        </div>
        {isOwner && (
          <div className="flex gap-2 shrink-0">
            <Link to={`/recipes/${recipe._id}/edit`} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1">
              <Edit className="w-4 h-4" /> Edit
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-danger text-sm py-2 px-3 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 font-medium mb-3">Are you sure you want to delete this recipe?</p>
          <p className="text-red-600 text-sm mb-4">This action cannot be undone. All reviews will also be deleted.</p>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleteRecipe.isPending}
              className="btn-danger text-sm"
            >
              {deleteRecipe.isPending ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Image */}
      {recipe.imageUrl && (
        <div className="rounded-xl overflow-hidden mb-8 aspect-video bg-gray-100">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-6 text-sm mb-8 pb-8 border-b border-gray-200">
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-5 h-5 text-forest" />
          <span><strong>{recipe.cookingTimeMinutes}</strong> minutes</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Star className="w-5 h-5 text-coral fill-coral" />
          <span>
            {recipe.averageRating != null
              ? <><strong>{recipe.averageRating.toFixed(1)}</strong> ({recipe.reviewCount} {recipe.reviewCount === 1 ? 'review' : 'reviews'})</>
              : 'No ratings yet'
            }
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 leading-relaxed mb-10">{recipe.description}</p>

      {/* Serving scaler */}
      <div className="bg-brand-50 rounded-xl p-5 mb-8 border border-brand-100">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-forest" />
          Adjust Servings
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleServingsChange(-1)}
            disabled={currentServings <= 1}
            className="w-9 h-9 rounded-lg border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Decrease servings"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          <input
            type="number"
            value={currentServings}
            onChange={handleServingsInput}
            min={1}
            max={10000}
            className="w-20 text-center border border-gray-300 rounded-lg px-2 py-1.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-forest bg-white"
            aria-label="Number of servings"
          />
          <button
            onClick={() => handleServingsChange(1)}
            disabled={currentServings >= 10000}
            className="w-9 h-9 rounded-lg border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Increase servings"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500">
            (original: {recipe.originalServings})
          </span>
        </div>
      </div>

      {/* Ingredients */}
      <div className="mb-10">
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ing, i) => {
            const scaled = scaleQuantity(ing.quantity, recipe.originalServings, currentServings);
            const display = formatQuantity(scaled);
            return (
              <li key={i} className="flex items-baseline gap-3 py-2 border-b border-gray-100 last:border-0">
                <span className="font-semibold text-forest min-w-[80px] text-right tabular-nums">
                  {display} {ing.unit}
                </span>
                <span className="text-gray-700">{ing.name}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Instructions */}
      <div className="mb-12">
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
        <ol className="space-y-6">
          {recipe.instructions
            .slice()
            .sort((a, b) => a.stepNumber - b.stepNumber)
            .map((step) => (
              <li key={step.stepNumber} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center font-bold text-sm">
                  {step.stepNumber}
                </span>
                <p className="text-gray-700 leading-relaxed pt-1">{step.text}</p>
              </li>
            ))}
        </ol>
      </div>

      {/* Reviews section */}
      <div className="border-t border-gray-200 pt-10">
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">Reviews</h2>

        {/* Review form */}
        {user ? (
          <form onSubmit={handleSubmitReview} className="card p-5 mb-8">
            <h3 className="font-semibold text-gray-800 mb-3">Write a Review</h3>
            <div className="mb-3">
              <label className="label">Your Rating</label>
              <StarRating
                rating={reviewRating}
                interactive
                onChange={setReviewRating}
                size={28}
              />
            </div>
            <div className="mb-4">
              <label className="label" htmlFor="review-text">Your Review (optional)</label>
              <textarea
                id="review-text"
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                maxLength={2000}
                rows={3}
                className="input resize-none"
                placeholder="Share your experience with this recipe..."
              />
              <p className="text-xs text-gray-400 mt-1">{reviewText.length}/2000</p>
            </div>
            {reviewError && <p className="error-text mb-3">{reviewError}</p>}
            <button
              type="submit"
              disabled={upsertReview.isPending}
              className="btn-primary"
            >
              {upsertReview.isPending ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <div className="card p-5 mb-8 text-center">
            <p className="text-gray-600 mb-3">Sign in to leave a review</p>
            <Link to="/login" className="btn-primary inline-block">Sign In</Link>
          </div>
        )}

        {/* Reviews list */}
        {reviewsLoading ? (
          <LoadingSpinner message="Loading reviews..." />
        ) : reviewData?.reviews.length === 0 ? (
          <p className="text-gray-500 text-sm">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {reviewData?.reviews.map(review => (
              <div key={review._id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">
                    {typeof review.user === 'object' ? review.user.displayName : 'User'}
                  </span>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} size={14} />
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {review.text && <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
