import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star, Users, Globe2 } from 'lucide-react';
import { Recipe, DietaryClassification } from '../types';

interface Props {
  recipe: Recipe;
}

function getImageSrc(url: string): string {
  if (!url) return 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=600&q=80';
  return url;
}

function getDietaryBadge(dietary?: DietaryClassification) {
  switch (dietary) {
    case 'Vegetarian':
      return {
        label: 'Vegetarian',
        classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'Vegan':
      return {
        label: 'Vegan',
        classes: 'bg-green-50 text-green-800 border-green-300 font-medium',
        dot: 'bg-green-600',
      };
    case 'Eggetarian':
      return {
        label: 'Egg',
        classes: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'Non-Vegetarian':
      return {
        label: 'Non-Veg',
        classes: 'bg-rose-50 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
      };
    default:
      return null;
  }
}

export default function RecipeCard({ recipe }: Props) {
  const dietaryBadge = getDietaryBadge(recipe.dietary);

  return (
    <Link
      to={`/recipes/${recipe.slug}`}
      className="card group hover:shadow-card-hover transition-all duration-200 flex flex-col overflow-hidden border border-gray-200/80 hover:border-forest/40 bg-white rounded-2xl"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={getImageSrc(recipe.imageUrl)}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
          {recipe.cuisine && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-forest shadow-sm flex items-center gap-1 border border-brand-100">
              <Globe2 className="w-3 h-3 text-forest" />
              {recipe.cuisine}
            </span>
          )}

          {dietaryBadge && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full border shadow-sm backdrop-blur-sm bg-white/95 flex items-center gap-1.5 ${dietaryBadge.classes}`}
            >
              <span className={`w-2 h-2 rounded-full ${dietaryBadge.dot}`} />
              {dietaryBadge.label}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {recipe.mealType && (
            <span className="text-[11px] font-medium px-2 py-0.5 bg-brand-50 text-forest rounded-md">
              {recipe.mealType}
            </span>
          )}
          {recipe.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
              #{tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1 group-hover:text-forest transition-colors line-clamp-2">
          {recipe.title}
        </h3>

        {/* Author / Subtitle */}
        <p className="text-xs text-gray-500 mb-3">
          by {typeof recipe.author === 'object' ? recipe.author.displayName : 'Unknown'}
          {recipe.cuisineRegion && ` • ${recipe.cuisineRegion}`}
        </p>

        {/* Meta */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-forest" />
            {recipe.cookingTimeMinutes}m
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-forest" />
            {recipe.originalServings} serv
          </span>
          <span className="flex items-center gap-1 text-coral font-medium">
            <Star className="w-3.5 h-3.5 fill-coral text-coral" />
            {typeof recipe.averageRating === 'number' ? recipe.averageRating.toFixed(1) : '—'}
          </span>
        </div>
      </div>
    </Link>
  );
}
