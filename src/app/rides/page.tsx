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
import { useState, useMemo, useEffect, useTransition } from "react";
import type { Ride } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

// This is the shape of the data we'll get from our API route
type ApiRide = Omit<Ride, 'departureTime'> & {
  departureTime: string | null;
};

export default function RidesPage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [sort, setSort] = useState('departure-asc');

  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchRides = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/rides/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ origin, destination, sort }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch rides');
      }
      const data: { rides: ApiRide[] } = await response.json();
      
      // Convert ISO strings back to Timestamp-like objects for the RideCard
      const formattedRides = data.rides.map(ride => ({
        ...ride,
        departureTime: ride.departureTime ? Timestamp.fromDate(new Date(ride.departureTime)) : Timestamp.now(),
      }));

      setRides(formattedRides);

    } catch (error) {
      console.error(error);
      setRides([]); // Clear rides on error
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch rides on initial load and when search criteria change
  useEffect(() => {
    startTransition(() => {
      fetchRides();
    });
  }, [origin, destination, sort]);
  

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    setOrigin(formData.get('from') as string);
    setDestination(formData.get('to') as string);
  }

  const isSearching = isLoading || isPending;

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
            <Button type="submit" className="w-full lg:w-auto font-bold" disabled={isSearching}>
              <Search className="mr-2 h-4 w-4" />
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isSearching ? (
          <>
            <Skeleton className="h-[28rem] w-full" />
            <Skeleton className="h-[28rem] w-full" />
            <Skeleton className="h-[28rem] w-full" />
          </>
        ) : rides && rides.length > 0 ? (
          rides.map(ride => (
            <RideCard key={ride.id} ride={ride} />
          ))
        ) : (
          <div className="col-span-full text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No rides available for the selected criteria. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
