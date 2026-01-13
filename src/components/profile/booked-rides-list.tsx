'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, writeBatch, Unsubscribe, onSnapshot } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Ride, Booking } from '@/lib/types';
import { format } from 'date-fns';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
} from '@/components/ui/alert-dialog';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function BookedRidesList() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [bookedRides, setBookedRides] = useState<{ride: Ride, bookingId: string}[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !user) return;

        setIsLoading(true);
        const bookingsQuery = query(collection(firestore, 'bookings'), where('userId', '==', user.uid));

        const unsubscribe: Unsubscribe = onSnapshot(bookingsQuery, async (bookingsSnapshot) => {
            const userBookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));

            if (userBookings.length === 0) {
                setBookedRides([]);
                setIsLoading(false);
                return;
            }

            const rideIds = [...new Set(userBookings.map(b => b.rideId))];
            
            if (rideIds.length === 0) {
              setBookedRides([]);
              setIsLoading(false);
              return;
            }
            
            try {
                const ridesQuery = query(collection(firestore, 'rides'), where('__name__', 'in', rideIds));
                const ridesSnapshot = await getDocs(ridesQuery);
                const ridesMap = new Map(ridesSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as Ride]));

                const combinedData = userBookings.map(booking => {
                    const ride = ridesMap.get(booking.rideId);
                    return ride ? { ride, bookingId: booking.id } : null;
                }).filter(item => item !== null && item.ride.departureTime && item.ride.departureTime.toDate() > new Date()) as { ride: Ride, bookingId: string }[];
                
                combinedData.sort((a, b) => {
                  const timeA = a.ride.departureTime?.toDate?.().getTime() || 0;
                  const timeB = b.ride.departureTime?.toDate?.().getTime() || 0;
                  return timeB - timeA;
                });

                setBookedRides(combinedData);
            } catch (error) {
                console.error("Error fetching ride details for bookings:", error);
                 toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not fetch details for your booked rides.",
                });
            } finally {
                setIsLoading(false);
            }

        }, (error) => {
            console.error("Error listening to bookings:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not fetch your booked rides.",
            });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, user, toast]);

    const handleCancelBooking = async (bookingId: string) => {
        if (!firestore) return;

        const bookingDocRef = doc(firestore, 'bookings', bookingId);
        const bookingData = bookedRides?.find(br => br.bookingId === bookingId);
        if (!bookingData) return;

        const rideRef = doc(firestore, 'rides', bookingData.ride.id);

        const batch = writeBatch(firestore);
        batch.delete(bookingDocRef);
        batch.update(rideRef, { availableSeats: bookingData.ride.availableSeats + 1 });
        
        try {
            await batch.commit();
            toast({
                title: "Booking Cancelled",
                description: "You have successfully cancelled your booking.",
            });
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Could not cancel booking.",
            });
        }
    };
    
    if (isLoading) {
        return <Skeleton className="h-40 w-full" />;
    }

    if (!bookedRides || bookedRides.length === 0) {
        return (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">You haven't booked any rides.</p>
                <Button asChild variant="link" className="mt-2 text-primary">
                    <Link href="/rides">Find a ride now</Link>
                </Button>
            </div>
        );
    }
  
    return (
        <div className="space-y-4">
        {bookedRides.map(({ride, bookingId}) => (
            <Card key={ride.id} className="p-4 flex justify-between items-center">
                <div>
                    <Link href={`/rides/${ride.id}`} className="font-bold hover:underline">{ride.origin} to {ride.destination}</Link>
                    <p className="text-sm text-muted-foreground">{ride.departureTime ? format(ride.departureTime.toDate(), 'PPpp') : ''}</p>
                    <p className="text-sm">${ride.cost} per seat</p>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <Button variant="outline">Cancel Booking</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel your booking?</AlertDialogTitle>
                        <AlertDialogDescription>
                        This will remove you from the ride and free up your seat. Are you sure?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleCancelBooking(bookingId)}>
                        Yes, Cancel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </Card>
        ))}
        </div>
    );
}
