'use client';

import { useRouter, useParams, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { Calendar, Clock, Users, DollarSign, MessageSquare, AlertCircle } from "lucide-react";
import { format } from 'date-fns';
import { useDoc, useUser, useFirestore, updateDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { doc, arrayUnion } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { RideMap } from "@/components/ride-map";
import { useState, useEffect } from "react";

function DriverInfo({ driverId }: { driverId: string }) {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();
  const [driverDocRef, setDriverDocRef] = useState<any>(null);

  useEffect(() => {
    // Only set the doc ref if auth is done and we have the required info
    if (!isUserLoading && firestore && driverId) {
      setDriverDocRef(doc(firestore, 'users', driverId));
    }
  }, [firestore, driverId, isUserLoading]);

  const { data: driver, isLoading: isDriverLoading } = useDoc(driverDocRef);

  if (isUserLoading || isDriverLoading) {
    return (
        <Card className="text-center">
            <CardHeader>
              <CardTitle className="font-headline">Driver</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <Skeleton className="w-24 h-24 rounded-full"/>
                <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );
  }

  if (!driver) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Driver Not Found</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="font-headline">Driver</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <Avatar className="w-24 h-24 border-4 border-primary">
          <AvatarImage src={driver.avatarUrl} alt={`${driver.firstName} ${driver.lastName}`} />
          <AvatarFallback>{driver.firstName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="font-bold text-xl">{`${driver.firstName} ${driver.lastName}`}</p>
          <StarRating rating={driver.rating || 0} className="justify-center mt-1" />
        </div>
        <Button variant="outline" className="w-full">
          <MessageSquare className="w-4 h-4 mr-2" /> Message {driver.firstName}
        </Button>
      </CardContent>
    </Card>
  );
}


export default function RideDetailPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const params = useParams();
  const rideId = typeof params.id === 'string' ? params.id : '';

  const rideDocRef = useMemoFirebase(() => {
    if (!rideId || !firestore) return null;
    return doc(firestore, 'rides', rideId);
  }, [firestore, rideId]);

  const { data: ride, isLoading: isRideLoading } = useDoc(rideDocRef);

  const handleBookSeat = () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!rideDocRef || !ride) return;

    if (ride?.riderIds?.includes(user.uid) || ride?.offererId === user.uid) {
        toast({
            variant: "destructive",
            title: "Cannot book seat",
            description: "You are already associated with this ride.",
        });
        return;
    }

    updateDocumentNonBlocking(rideDocRef, {
        riderIds: arrayUnion(user.uid),
        availableSeats: ride.availableSeats - 1,
    });

    toast({
        title: "Seat Booked!",
        description: "You have successfully booked a seat for this ride.",
    });
  };

  if (isRideLoading || isUserLoading) {
    return (
        <div className="container mx-auto max-w-5xl px-4 md:px-6 py-8">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </div>
    );
  }

  if (!ride) {
    return (
        <div className="container mx-auto max-w-2xl px-4 md:px-6 py-12 text-center">
            <Card className="p-8">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Ride Not Found</h1>
                <p className="mt-6 text-base leading-7 text-muted-foreground">Sorry, we couldn’t find the ride you’re looking for.</p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <Button onClick={() => router.push('/rides')}>Go back to rides</Button>
                </div>
            </Card>
        </div>
    )
  }
  
  return (
    <div className="container mx-auto max-w-5xl px-4 md:px-6 py-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-3xl">{ride.origin} to {ride.destination}</CardTitle>
              <CardDescription className="flex items-center gap-4 pt-2">
                 <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{ride.departureTime ? format(ride.departureTime.toDate(), 'EEEE, MMMM d, yyyy') : 'Date N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>at {ride.departureTime ? format(ride.departureTime.toDate(), 'p') : 'Time N/A'}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
               <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden border">
                  <RideMap origin={ride.origin} destination={ride.destination} />
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Ride Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center text-center">
                    <Users className="w-8 h-8 text-primary mb-2" />
                    <p className="font-semibold">{ride.availableSeats} of {ride.totalSeats} Seats Left</p>
                </div>
                 <div className="flex flex-col items-center text-center">
                    <DollarSign className="w-8 h-8 text-accent mb-2" />
                    <p className="font-semibold text-2xl">${ride.cost.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">per seat</p>
                </div>
                 <div className="flex flex-col items-center text-center">
                    <p className="font-semibold">Origin</p>
                    <p className="text-sm text-muted-foreground">{ride.origin}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                    <p className="font-semibold">Destination</p>
                    <p className="text-sm text-muted-foreground">{ride.destination}</p>
                </div>
            </CardContent>
          </Card>

        </div>
        <div className="space-y-6">
          {ride.offererId && <DriverInfo driverId={ride.offererId} />}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Passengers</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {ride.riderIds && ride.riderIds.length > 0 ? (
                <p>{ride.riderIds.length} passenger(s) booked.</p>
              ) : (
                <p className="text-sm text-muted-foreground">No passengers have booked yet.</p>
              )}
            </CardContent>
          </Card>
           <div className="sticky top-24">
            <Button size="lg" className="w-full text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleBookSeat} disabled={isUserLoading || !user || ride.availableSeats === 0 || ride.offererId === user?.uid || ride.riderIds?.includes(user?.uid)}>
              {ride.availableSeats > 0 ? 'Book a Seat' : 'Ride Full'}
            </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
