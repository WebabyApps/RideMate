'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, writeBatch, Unsubscribe, onSnapshot } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Ride } from '@/lib/types';
import { format } from 'date-fns';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
import { Trash2, Users } from 'lucide-react';
import { PassengerList } from './passenger-list';

export function OfferedRidesList() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [userRides, setUserRides] = useState<Ride[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
        if (!firestore || !user) return;
        setIsLoading(true);

        const ridesQuery = query(
            collection(firestore, 'rides'), 
            where('offererId', '==', user.uid)
        );

        const unsubscribe: Unsubscribe = onSnapshot(ridesQuery, (snapshot) => {
            const rides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));
            
            rides.sort((a, b) => {
              const timeA = a.departureTime?.toDate?.().getTime() || 0;
              const timeB = b.departureTime?.toDate?.().getTime() || 0;
              return timeB - timeA;
            });
            setUserRides(rides);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching offered rides:", error);
            toast({
                variant: "destructive",
                title: "Error fetching rides",
                description: "Could not fetch your offered rides.",
            });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, user, toast]);

    const handleCancelRide = async (rideId: string) => {
        if (!firestore) return;

        const batch = writeBatch(firestore);
        
        const rideDocRef = doc(firestore, 'rides', rideId);
        batch.delete(rideDocRef);

        const bookingsQuery = query(collection(firestore, `rides/${rideId}/bookings`));
        const bookingsSnapshot = await getDocs(bookingsQuery);
        bookingsSnapshot.forEach(bookingDoc => {
            batch.delete(bookingDoc.ref);
        });

        try {
            await batch.commit();
            // No need to manually update state, onSnapshot will do it.
            toast({
                title: "Ride Cancelled",
                description: "You have successfully cancelled the ride and all its bookings.",
            });
        } catch (error) {
            console.error("Error cancelling ride:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not cancel the ride. Please try again.",
            });
        }
    };

    if (isLoading) {
        return <Skeleton className="h-40 w-full" />;
    }

    if (!userRides || userRides.length === 0) {
        return (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">You haven't offered any rides yet.</p>
                <Button asChild variant="link" className="mt-2 text-primary">
                    <Link href="/offer-ride">Offer a ride now</Link>
                </Button>
            </div>
        );
    }
  
    return (
        <div className="space-y-4">
        {userRides.map(ride => (
            <Card key={ride.id} className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold">{ride.origin} to {ride.destination}</p>
                        <p className="text-sm text-muted-foreground">{ride.departureTime ? format(ride.departureTime.toDate(), 'PPpp') : ''}</p>
                        <p className="text-sm">${ride.cost} per seat</p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This action cannot be undone. This will permanently cancel your ride and notify any booked passengers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Back</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleCancelRide(ride.id)}>
                            Yes, Cancel Ride
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <Separator className="my-3"/>
                <div>
                    <h4 className="font-semibold text-sm flex items-center gap-2"><Users className="h-4 w-4"/>Passengers</h4>
                    <PassengerList rideId={ride.id} />
                </div>
            </Card>
        ))}
        </div>
    );
}
