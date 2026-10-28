import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star, Users } from 'lucide-react';
import { Recipe } from '../types';

interface Props {
  recipe: Recipe;
}

function formatRating(rating: number | null | undefined): string {
  if (rating == null) return 'No ratings';
  return rating.toFixed(1);
}

function getImageSrc(url: string): string {
  if (!url) return 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=600&q=80';
  return url;
}

export default function RecipeCard({ recipe }: Props) {
  return (
    <Link to={`/recipes/${recipe.slug}`} className="card group hover:shadow-card-hover transition-shadow duration-200 flex flex-col">
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={getImageSrc(recipe.imageUrl)}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {recipe.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-brand-50 text-forest rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1 group-hover:text-forest transition-colors line-clamp-2">
          {recipe.title}
        </h3>

        {/* Author */}
        <p className="text-xs text-gray-500 mb-3">
          by {typeof recipe.author === 'object' ? recipe.author.displayName : 'Unknown'}
        </p>

        {/* Meta */}
        <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {recipe.cookingTimeMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Serves {recipe.originalServings}
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
