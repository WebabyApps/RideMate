'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { useFirestore, useUser, deleteDocumentNonBlocking } from '@/firebase';
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

export function BookedRidesList() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [bookedRides, setBookedRides] = useState<{ride: Ride, bookingId: string}[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBookedRides = useCallback(async () => {
        if (!firestore || !user) return;
        setIsLoading(true);
        try {
            const bookingsQuery = query(collection(firestore, 'bookings'), where('userId', '==', user.uid));
            const bookingsSnapshot = await getDocs(bookingsQuery);
            const userBookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));

            if (userBookings.length === 0) {
                setBookedRides([]);
                setIsLoading(false);
                return;
            }

            const ridePromises = userBookings.map(async (booking) => {
                const rideDocRef = doc(firestore, 'rides', booking.rideId);
                const rideQuery = query(collection(firestore, 'rides'), where('__name__', '==', rideDocRef.id));
                const rideDocSnapshot = await getDocs(rideQuery);

                if (!rideDocSnapshot.empty) {
                    const rideData = { id: rideDocSnapshot.docs[0].id, ...rideDocSnapshot.docs[0].data() } as Ride;
                    return { ride: rideData, bookingId: booking.id };
                }
                return null;
            });

            const rideResults = (await Promise.all(ridePromises)).filter(r => r !== null) as {ride: Ride, bookingId: string}[];
            setBookedRides(rideResults);
        } catch (error) {
            console.error("Error fetching booked rides:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not fetch your booked rides.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [firestore, user, toast]);

    useEffect(() => {
        fetchBookedRides();
    }, [fetchBookedRides]);

    const handleCancelBooking = async (bookingId: string) => {
        if (!firestore) return;
        const bookingDocRef = doc(firestore, 'bookings', bookingId);
        try {
            await deleteDocumentNonBlocking(bookingDocRef);
            setBookedRides(prev => prev?.filter(br => br.bookingId !== bookingId) || null);
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
                    <p className="font-bold">{ride.origin} to {ride.destination}</p>
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