'use client';

import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { Calendar, Clock, Users, DollarSign, MessageSquare, AlertCircle, Dog, Briefcase } from "lucide-react";
import { format } from 'date-fns';
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { RideMap } from "@/components/ride-map";
import type { Ride, Booking, UserProfile } from '@/lib/types';
import Link from 'next/link';
import { useDoc } from "@/firebase/firestore/use-doc";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useState, useCallback } from "react";
import { PassengerList } from "@/components/profile/passenger-list";
import { bookRide } from "@/ai/flows/book-ride";

export default function RideDetailPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const params = useParams();
  const rideId = typeof params.id === 'string' ? params.id : '';
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [areBookingsLoading, setAreBookingsLoading] = useState(true);

  const rideDocRef = useMemoFirebase(() => {
    if (!firestore || !rideId) return null;
    return doc(firestore, 'rides', rideId);
  }, [firestore, rideId]);

  const { data: ride, isLoading: isRideLoading } = useDoc<Ride>(rideDocRef);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);


  const fetchBookings = useCallback(async () => {
    if (!firestore || !rideId) return;
    setAreBookingsLoading(true);
    try {
        const bookingsQuery = query(collection(firestore, 'rides', rideId, 'bookings'));
        const snapshot = await getDocs(bookingsQuery);
        const bookingData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        setBookings(bookingData);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch booking information for this ride.",
        });
        setBookings([]);
    } finally {
        setAreBookingsLoading(false);
    }
  }, [firestore, rideId, toast]);

  useEffect(() => {
      fetchBookings();
  }, [fetchBookings]);

  const handleBookSeat = async () => {
    if (!user || user.isAnonymous || !userProfile) {
      toast({
        title: "Please Sign In",
        description: "You need to have a full account to book a ride.",
        variant: "destructive"
      });
      router.push('/signup');
      return;
    }
  
    if (!ride) {
      toast({
        variant: "destructive",
        title: "Ride not available",
        description: "This ride is no longer available.",
      });
      return;
    }
  
    try {
      await bookRide({
        rideId: ride.id,
        userId: user.uid,
        userProfile: userProfile,
      });
      
      toast({
        title: "Seat Booked!",
        description: "You have successfully booked a seat for this ride.",
      });
      fetchBookings(); // Refresh the bookings list
  
    } catch (error: any) {
      console.error("Error booking ride:", error);
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: error.message || "An unexpected error occurred while booking.",
      });
    }
  };

  const handleCancelBooking = async () => {
    if (!user || !firestore || !rideId) return;

    const userBooking = bookings?.find(b => b.userId === user.uid);

    if (!userBooking) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not find your booking to cancel."
      });
      return;
    }
    
    // We will need a server-side function for this as well for security.
    // For now, let's assume it's not implemented, but this is where it would go.
    toast({
        title: "Cancellation not implemented",
        description: "The cancellation flow needs to be implemented securely on the backend."
    })
  };
  
  const isLoading = isRideLoading || areBookingsLoading || isProfileLoading || isUserLoading;
  const availableSeats = ride ? ride.availableSeats : 0;

  if (isLoading) {
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
                    <Button asChild>
                      <Link href="/rides">Go back to rides</Link>
                    </Button>
                </div>
            </Card>
        </div>
    )
  }

  const isUserBooked = user ? bookings?.some(b => b.userId === user.uid) : false;
  const isUserTheDriver = user ? ride.offererId === user.uid : false;
  const isRideFull = availableSeats <= 0;
  
  return (
    <div className="container mx-auto max-w-5xl px-4 md:px-6 py-8">
      <div className="grid md:grid-cols-3 gap-8 items-start">
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
                    <p className="font-semibold">{availableSeats} of {ride.totalSeats} Seats Left</p>
                </div>
                 <div className="flex flex-col items-center text-center">
                    <DollarSign className="w-8 h-8 text-accent mb-2" />
                    <p className="font-semibold text-2xl">${ride.cost.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">per seat</p>
                </div>
                {ride.petsAllowed && (
                    <div className="flex flex-col items-center text-center">
                        <Dog className="w-8 h-8 text-primary mb-2" />
                        <p className="font-semibold">Pets Allowed</p>
                    </div>
                )}
                {ride.largeBagsAllowed && (
                    <div className="flex flex-col items-center text-center">
                        <Briefcase className="w-8 h-8 text-primary mb-2" />
                        <p className="font-semibold">Large Bags</p>
                    </div>
                )}
            </CardContent>
          </Card>

        </div>
        <div className="space-y-6 sticky top-24">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle className="font-headline">Driver</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <Avatar className="w-24 h-24 border-4 border-primary">
                    <AvatarImage src={ride.offererAvatarUrl} alt={ride.offererName} />
                    <AvatarFallback>{ride.offererName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                    <p className="font-bold text-xl">{ride.offererName || 'Driver'}</p>
                    <StarRating rating={ride.offererRating || 0} className="justify-center mt-1" />
                    </div>
                    <Button variant="outline" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" /> Message {ride.offererName ? ride.offererName.split(' ')[0] : 'Driver'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Users className="h-5 w-5"/>Passengers</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                <PassengerList rideId={ride.id} />
                </CardContent>
            </Card>
           <div className="sticky top-24">
           {isUserBooked ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="lg" className="w-full text-lg font-bold">Cancel Booking</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove you from the ride and notify the driver. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelBooking}>
                      Yes, Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button 
                size="lg" 
                className="w-full text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground" 
                onClick={handleBookSeat} 
                disabled={isRideFull || isUserTheDriver}
              >
                {isRideFull ? 'Ride Full' : 'Book a Seat'}
              </Button>
            )}
           </div>
        </div>
      </div>
    </div>
  );
}
