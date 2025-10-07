import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type StarRatingProps = {
  rating: number;
  totalStars?: number;
  className?: string;
  starClassName?: string;
};

export function StarRating({ rating, totalStars = 5, className, starClassName }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const partialStar = rating % 1 > 0;
  const emptyStars = totalStars - fullStars - (partialStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`Rating: ${rating} out of ${totalStars} stars`}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className={cn("w-4 h-4 text-yellow-400 fill-yellow-400", starClassName)} />
      ))}
      {partialStar && (
        <div className="relative">
          <Star className={cn("w-4 h-4 text-yellow-400", starClassName)} />
          <div className="absolute top-0 left-0 overflow-hidden" style={{ width: `${(rating % 1) * 100}%` }}>
            <Star className={cn("w-4 h-4 text-yellow-400 fill-yellow-400", starClassName)} />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className={cn("w-4 h-4 text-gray-300", starClassName)} />
      ))}
    </div>
  );
}
