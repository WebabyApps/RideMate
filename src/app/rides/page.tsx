
'use client';
import { RideCard } from "@/components/ride-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo, useEffect } from "react";
import type { Ride } from "@/lib/types";
import { useFirestore } from "@/firebase";
import { collection, query, getDocs, orderBy, where, Timestamp } from "firebase/firestore";

export const dynamic = 'force-dynamic';

function RideList({ rides, isLoading }: { rides: Ride[] | null, isLoading: boolean }) {
  if (isLoading) {
    return (
      <>
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  if (!rides || rides.length === 0) {
    return (
      <div className="col-span-full text-center py-10 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">No rides available for the selected criteria. Check back soon!</p>
      </div>
    );
  }

  return (
    <>
      {rides.map(ride => (
        <RideCard key={ride.id} ride={ride} />
      ))}
    </>
  );
}


export default function RidesPage() {
  const firestore = useFirestore();
  const [allRides, setAllRides] = useState<Ride[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [originFilter, setOriginFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [sort, setSort] = useState('departure-asc');

  useEffect(() => {
    if (!firestore) return;

    const fetchRides = async () => {
      setIsLoading(true);
      try {
        const ridesQuery = query(
          collection(firestore, 'rides'),
          where('departureTime', '>', Timestamp.now()),
          orderBy('departureTime', 'asc')
        );
        const querySnapshot = await getDocs(ridesQuery);
        const ridesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));
        setAllRides(ridesData);
      } catch (error) {
        console.error("Error fetching rides:", error);
        setAllRides([]); // Set to empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchRides();
  }, [firestore]);


  const filteredAndSortedRides = useMemo(() => {
    if (!allRides) return null;

    let processedRides = [...allRides]; // Create a mutable copy

    if (originFilter) {
      processedRides = processedRides.filter(ride =>
        ride.origin.toLowerCase().includes(originFilter.toLowerCase())
      );
    }

    if (destinationFilter) {
      processedRides = processedRides.filter(ride =>
        ride.destination.toLowerCase().includes(destinationFilter.toLowerCase())
      );
    }
    
    // Client-side sorting
    processedRides.sort((a, b) => {
        switch (sort) {
            case 'price-asc':
                return a.cost - b.cost;
            case 'price-desc':
                return b.cost - a.cost;
            case 'departure-asc':
                 // Fallback to prevent error if departureTime is not a valid date
                const timeA = a.departureTime?.toDate?.().getTime() || 0;
                const timeB = b.departureTime?.toDate?.().getTime() || 0;
                return timeA - timeB;
            default:
                return 0;
        }
    });

    return processedRides;
  }, [allRides, originFilter, destinationFilter, sort]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fromValue = (form.elements.namedItem('from') as HTMLInputElement).value;
    const toValue = (form.elements.namedItem('to') as HTMLInputElement).value;
    setOriginFilter(fromValue);
    setDestinationFilter(toValue);
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-headline font-bold">Find Your Next Ride</h1>
        <p className="text-muted-foreground text-lg mt-2">Browse available carpools or search for your specific route.</p>
      </header>

      <Card className="mb-8 shadow-md">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label htmlFor="from" className="text-sm font-medium">From</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input name="from" id="from" placeholder="e.g., San Francisco" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="to" className="text-sm font-medium">To</label>
               <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input name="to" id="to" placeholder="e.g., Los Angeles" className="pl-10" />
              </div>
            </div>
             <div className="space-y-2">
                <label htmlFor="sort" className="text-sm font-medium">Sort by</label>
                <Select onValueChange={setSort} defaultValue={sort}>
                    <SelectTrigger id="sort">
                        <SelectValue placeholder="Recommended" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="departure-asc">Departure: Soonest</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit" className="w-full lg:w-auto font-bold" disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" />
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RideList rides={filteredAndSortedRides} isLoading={isLoading} />
      </div>
    </div>
  );
}
