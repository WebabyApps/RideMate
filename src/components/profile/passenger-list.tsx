'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Passenger, Booking } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function PassengerList({ rideId }: { rideId: string }) {
    const firestore = useFirestore();
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPassengers = useCallback(async () => {
        if (!firestore || !rideId) return;
        setIsLoading(true);
        try {
            const bookingsQuery = query(collection(firestore, 'bookings'), where('rideId', '==', rideId));
            const snapshot = await getDocs(bookingsQuery);
            const bookingData = snapshot.docs.map(doc => doc.data() as Booking);
            setPassengers(bookingData.map(b => b.passengerInfo));
        } catch (error) {
            console.error("Error fetching passengers:", error);
            setPassengers([]);
        } finally {
            setIsLoading(false);
        }
    }, [firestore, rideId]);

    useEffect(() => {
        fetchPassengers();
    }, [fetchPassengers]);

    if (isLoading) {
        return <Skeleton className="h-12 w-full" />
    }

    if (passengers.length === 0) {
        return <p className="text-sm text-muted-foreground">No passengers have booked yet.</p>;
    }

    return (
      <div className="flex flex-wrap gap-4">
        {passengers.map(p => (
            <div key={p.id} className="flex items-center gap-2 text-sm" title={`${p.firstName} ${p.lastName}`}>
                <Avatar className="h-8 w-8">
                    <AvatarImage src={p.avatarUrl} alt={p.firstName} />
                    <AvatarFallback>{p.firstName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{p.firstName}</span>
            </div>
        ))}
      </div>
    );
}