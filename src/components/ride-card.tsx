'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Calendar, Clock, Users, DollarSign, Dog, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from './ui/skeleton';
import type { Ride } from '@/lib/types';

type RideCardProps = {
  ride: Ride;
};

export function RideCard({ ride }: RideCardProps) {
  if (!ride) {
    return <Skeleton className="h-96 w-full" />;
  }

  // Convert Firestore Timestamp to Date if necessary
  const departureDate = ride.departureTime instanceof Date ? ride.departureTime : ride.departureTime.toDate();

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardContent className="flex-grow grid gap-4 p-6">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">From</p>
            <p className="text-muted-foreground">{ride.origin}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">To</p>
            <p className="text-muted-foreground">{ride.destination}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mt-2 pt-4 border-t">
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{format(departureDate, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{format(departureDate, 'p')}</span>
            </div>
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{ride.availableSeats} seats left</span>
            </div>
            <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-bold text-lg text-accent">${ride.cost.toFixed(2)}</span>
            </div>
             <div className="flex items-center gap-2 col-span-2">
                {ride.petsAllowed && (
                  <div className="flex items-center gap-1 text-muted-foreground" title="Pets allowed">
                    <Dog className="w-4 h-4" />
                    <span className="sr-only">Pets allowed</span>
                  </div>
                )}
                 {ride.largeBagsAllowed && (
                  <div className="flex items-center gap-1 text-muted-foreground" title="Large bags allowed">
                    <Briefcase className="w-4 h-4" />
                     <span className="sr-only">Large bags allowed</span>
                  </div>
                )}
            </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 bg-secondary/30">
        <Button asChild className="w-full font-bold">
          <Link href={`/rides/${ride.id}`}>
            View Ride <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
