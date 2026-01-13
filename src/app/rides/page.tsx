
'use client';
import { RideCard } from "@/components/ride-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo, useEffect, useCallback } from "react";
import type { Ride } from "@/lib/types";
import { useFirestore } from "@/firebase";
import { collection, query, getDocs, orderBy, where, Timestamp } from "firebase/firestore";
import { RideList } from "@/components/rides/ride-list";
import { Label } from "@/components/ui/label";

export const dynamic = 'force-dynamic';

export default function RidesPage() {
  const firestore = useFirestore();
  const [allRides, setAllRides] = useState<Ride[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [originFilter, setOriginFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [sort, setSort] = useState('departure-asc');
  const [showAll, setShowAll] = useState(false);
  const [aiQuery, setAiQuery] = useState('');

  const fetchRides = useCallback(async () => {
    if (!firestore) return;
    setIsLoading(true);
    try {
      const ridesQuery = query(
        collection(firestore, 'rides'),
        where('departureTime', '>', Timestamp.now())
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
  }, [firestore]);


  useEffect(() => {
    fetchRides();
  }, [fetchRides]);


  const filteredAndSortedRides = useMemo(() => {
    if (!allRides) {
      return null;
    }
    let processedRides = [...allRides];

    if (!showAll) {
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
  }, [allRides, originFilter, destinationFilter, sort, showAll]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fromValue = (form.elements.namedItem('from') as HTMLInputElement).value;
    const toValue = (form.elements.namedItem('to') as HTMLInputElement).value;
    setShowAll(false); // Disable showAll when performing a specific search
    setOriginFilter(fromValue);
    setDestinationFilter(toValue);
  }

  const handleShowAllChange = (checked: boolean) => {
    setShowAll(checked);
    if (checked) {
        setOriginFilter('');
        setDestinationFilter('');
        const fromInput = document.getElementById('from') as HTMLInputElement;
        const toInput = document.getElementById('to') as HTMLInputElement;
        if(fromInput) fromInput.value = '';
        if(toInput) toInput.value = '';
    }
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-headline font-bold">Find Your Next Ride</h1>
        <p className="text-muted-foreground text-lg mt-2">Browse available carpools or search for your specific route.</p>
      </header>

      <Card className="mb-8 shadow-md">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2 lg:col-span-2">
              <label htmlFor="from" className="text-sm font-medium">From</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input name="from" id="from" placeholder="e.g., San Francisco" className="pl-10" disabled={showAll} />
              </div>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label htmlFor="to" className="text-sm font-medium">To</label>
               <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input name="to" id="to" placeholder="e.g., Los Angeles" className="pl-10" disabled={showAll} />
              </div>
            </div>
            <Button type="submit" className="w-full font-bold lg:col-span-1" disabled={isLoading || showAll}>
              <Search className="mr-2 h-4 w-4" />
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </form>
          <div className="flex items-center space-x-2">
            <Checkbox id="showAll" checked={showAll} onCheckedChange={handleShowAllChange} />
            <label
                htmlFor="showAll"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
                Show all available rides
            </label>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>
           <div className="space-y-2">
              <Label htmlFor="ai-search" className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                Ask AI to find a ride for you
              </Label>
              <div className="flex gap-4">
                 <Input name="ai-search" id="ai-search" placeholder="e.g., 'From downtown to the airport this evening'" />
                 <Button variant="secondary" className="font-bold">Ask AI</Button>
              </div>
            </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm font-medium">Sort by</label>
            <Select onValueChange={setSort} defaultValue={sort}>
                <SelectTrigger id="sort" className="w-[180px]">
                    <SelectValue placeholder="Recommended" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="departure-asc">Departure: Soonest</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RideList rides={filteredAndSortedRides} isLoading={isLoading} />
      </div>
    </div>
  );
}
