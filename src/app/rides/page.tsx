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
import { useState, useMemo } from "react";
import type { Ride } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, Query } from "firebase/firestore";

export default function RidesPage() {
  const firestore = useFirestore();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [sort, setSort] = useState('departure-asc');

  const ridesQuery = useMemoFirebase(() => {
    if (!firestore) return null;

    let q: Query = query(collection(firestore, 'rides'), where('visibility', '==', 'public'));

    if (origin) {
      q = query(q, where('origin', '>=', origin), where('origin', '<=', origin + '\uf8ff'));
    }
    if (destination) {
      q = query(q, where('destination', '>=', destination), where('destination', '<=', destination + '\uf8ff'));
    }
    
    switch (sort) {
      case 'price-asc':
        q = query(q, orderBy('cost', 'asc'));
        break;
      case 'price-desc':
        q = query(q, orderBy('cost', 'desc'));
        break;
      case 'departure-asc':
      default:
        q = query(q, orderBy('departureTime', 'asc'));
        break;
    }

    return q;
  }, [firestore, origin, destination, sort]);

  const { data: rides, isLoading } = useCollection<Ride>(ridesQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fromValue = (form.elements.namedItem('from') as HTMLInputElement).value;
    const toValue = (form.elements.namedItem('to') as HTMLInputElement).value;
    setOrigin(fromValue);
    setDestination(toValue);
  }

  const filteredRides = useMemo(() => {
    if (!rides) return [];
    let processedRides = rides.filter(ride => ride.departureTime && ride.departureTime.toDate() > new Date());
    return processedRides;
  }, [rides]);

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
        {isLoading ? (
          <>
            <Skeleton className="h-[28rem] w-full" />
            <Skeleton className="h-[28rem] w-full" />
            <Skeleton className="h-[28rem] w-full" />
          </>
        ) : filteredRides.length > 0 ? (
          filteredRides.map(ride => (
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
