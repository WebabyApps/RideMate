'use client';

import { RideCard } from "@/components/ride-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Ride } from "@/lib/types";

export function RideList({ rides, isLoading }: { rides: Ride[] | null, isLoading: boolean }) {
  if (isLoading) {
    return (
      <>
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  if (!rides || rides.length === 0) {
    return (
      <div className="col-span-full text-center py-10 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">No rides available for the selected criteria. Check back soon!</p>
      </div>
    );
  }

  return (
    <>
      {rides.map(ride => (
        <RideCard key={ride.id} ride={ride} />
      ))}
    </>
  );
}
