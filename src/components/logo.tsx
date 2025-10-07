import { Car } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center font-headline font-bold text-primary", className)}>
      <Car className="h-6 w-6 mr-2" />
      <span className="text-xl">RideMate</span>
    </div>
  );
}
