'use client';

import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Clock, Users, DollarSign, MessageSquare } from "lucide-react";
import { format } from 'date-fns';
import { useDoc, useUser, useFirestore, updateDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { doc, arrayUnion } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

export default function RideDetailPage({ params }: { params: { id: string } }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const mapImage = PlaceHolderImages.find(p => p.id === 'map-placeholder');

  const rideDocRef = useMemoFirebase(() => {
    if (!params.id || !firestore) return null;
    return doc(firestore, 'rides', params.id);
  }, [firestore, params.id]);
  const { data: ride, isLoading: isRideLoading } = useDoc(rideDocRef);

  const driverDocRef = useMemoFirebase(() => {
    if (!ride || !firestore) return null;
    return doc(firestore, 'users', ride.offererId);
  }, [firestore, ride]);
  const { data: driver, isLoading: isDriverLoading } = useDoc(driverDocRef);

  const passengersQuery = useMemoFirebase(() => {
    if (!ride || !ride.riderIds || ride.riderIds.length === 0 || !firestore) return [];
    return ride.riderIds.map((id: string) => doc(firestore, 'users', id));
  }, [firestore, ride]);
  // This is a simplified way to fetch passengers. For a real app, you'd use a more robust method.
  // We're not using a hook here to keep it simple for now.

  const handleBookSeat = () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (ride?.riderIds?.includes(user.uid) || ride?.offererId === user.uid) {
        toast({
            variant: "destructive",
            title: "Cannot book seat",
            description: "You are already associated with this ride.",
        });
        return;
    }
    
    if (!rideDocRef || !ride) return;

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
    return <div className="container mx-auto max-w-5xl px-4 md:px-6 py-8"><Skeleton className="h-96 w-full"/></div>;
  }

  if (!ride) {
    notFound();
  }

  const totalSeats = ride.totalSeats ?? ride.availableSeats + (ride.riderIds?.length || 0);

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
            <CardContent>
              {mapImage && (
                <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden border">
                  <Image
                    src={mapImage.imageUrl}
                    alt="Route map"
                    data-ai-hint={mapImage.imageHint}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Ride Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center text-center">
                    <Users className="w-8 h-8 text-primary mb-2" />
                    <p className="font-semibold">{ride.availableSeats} of {totalSeats} Seats Left</p>
                </div>
                 <div className="flex flex-col items-center text-center">
                    <DollarSign className="w-8 h-8 text-accent mb-2" />
                    <p className="font-semibold text-2xl">${ride.cost.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">per seat</p>
                </div>
                 <div className="flex flex-col items-center text-center">
                    <MapPin className="w-8 h-8 text-primary mb-2" />
                    <p className="font-semibold">Origin</p>
                    <p className="text-sm text-muted-foreground">{ride.origin}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                    <MapPin className="w-8 h-8 text-accent mb-2" />
                    <p className="font-semibold">Destination</p>
                    <p className="text-sm text-muted-foreground">{ride.destination}</p>
                </div>
            </CardContent>
          </Card>

        </div>
        <div className="space-y-6">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="font-headline">Driver</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {isDriverLoading ? (
                 <Skeleton className="w-24 h-24 rounded-full"/>
              ) : driver ? (
                <>
                <Avatar className="w-24 h-24 border-4 border-primary">
                  <AvatarImage src={driver.avatarUrl} alt={`${driver.firstName} ${driver.lastName}`} />
                  <AvatarFallback>{driver.firstName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-bold text-xl">{`${driver.firstName} ${driver.lastName}`}</p>
                  <StarRating rating={driver.rating || 0} className="justify-center mt-1" />
                </div>
                </>
              ) : null }
              <Button variant="outline" className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" /> Message {driver?.firstName}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Passengers</CardTitle>
            </CardHeader>
            <CardContent>
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
