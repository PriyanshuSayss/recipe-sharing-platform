import React from 'react';
import { Star } from 'lucide-react';

interface Props {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({ rating, max = 5, size = 16, interactive = false, onChange }: Props) {
  return (
    <div className="flex gap-0.5" role="group" aria-label={`Rating: ${rating} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => {
        const val = i + 1;
        const filled = val <= Math.round(rating);
        return (
          <button
            key={i}
            type={interactive ? 'button' : undefined}
            disabled={!interactive}
            onClick={() => interactive && onChange?.(val)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} p-0 bg-transparent border-none`}
            aria-label={interactive ? `Rate ${val} out of ${max}` : undefined}
          >
            <Star
              style={{ width: size, height: size }}
              className={filled ? 'text-coral fill-coral' : 'text-gray-300 fill-gray-100'}
            />
          </button>
        );
      })}
    </div>
  );
}
