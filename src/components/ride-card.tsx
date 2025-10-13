'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, MapPin, Calendar, Clock, Users, DollarSign } from 'lucide-react';
import type { Ride } from '@/lib/types';
import { StarRating } from './star-rating';
import { format } from 'date-fns';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';

type RideCardProps = {
  ride: any; // Using 'any' for now to accommodate Firestore data structure
};

export function RideCard({ ride }: RideCardProps) {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();

  const driverDocRef = useMemoFirebase(() => {
    if (!ride.offererId || isUserLoading) return null;
    return doc(firestore, 'users', ride.offererId);
  }, [firestore, ride.offererId, isUserLoading]);

  const { data: driver, isLoading: isDriverLoading } = useDoc(driverDocRef);

  if (isDriverLoading || isUserLoading) {
    return <Skeleton className="h-96 w-full" />;
  }
  
  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        {driver ? (
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={driver.avatarUrl} alt={driver.firstName} />
              <AvatarFallback>{driver.firstName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{driver.firstName} {driver.lastName}</p>
              <StarRating rating={driver.rating || 0} />
            </div>
          </div>
        ) : (
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow grid gap-4">
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
        <div className="grid grid-cols-2 gap-4 text-sm mt-2">
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{ride.departureTime ? format(ride.departureTime.toDate(), 'MMM d, yyyy') : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{ride.departureTime ? format(ride.departureTime.toDate(), 'p') : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{ride.availableSeats} seats left</span>
            </div>
            <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-bold text-lg text-accent">{ride.cost.toFixed(2)}</span>
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full font-bold">
          <Link href={`/rides/${ride.id}`}>
            View Ride <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
