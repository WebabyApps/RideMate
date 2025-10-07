import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, MapPin, Calendar, Clock, Users, DollarSign } from 'lucide-react';
import type { Ride } from '@/lib/types';
import { StarRating } from './star-rating';
import { format } from 'date-fns';

type RideCardProps = {
  ride: Ride;
};

export function RideCard({ ride }: RideCardProps) {
  const { driver } = ride;
  
  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={driver.avatarUrl} alt={driver.name} />
            <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{driver.name}</p>
            <StarRating rating={driver.rating} />
          </div>
        </div>
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
                <span>{format(ride.departureTime, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{format(ride.departureTime, 'p')}</span>
            </div>
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{ride.availableSeats} seats left</span>
            </div>
            <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-bold text-lg text-accent">{ride.price.toFixed(2)}</span>
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
