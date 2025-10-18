'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { collection, serverTimestamp, doc } from 'firebase/firestore';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useFirestore, useUser, addDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { WaypointMap } from "@/components/waypoint-map";
import { Checkbox } from "@/components/ui/checkbox";
import { useDoc } from "@/firebase/firestore/use-doc";
import type { UserProfile } from "@/lib/types";

const rideSchema = z.object({
  origin: z.string().min(3, "Origin must be at least 3 characters long."),
  destination: z.string().min(3, "Destination must be at least 3 characters long."),
  departureDate: z.date({ required_error: "A departure date is required." }),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  seats: z.coerce.number().int().min(1, "Must offer at least 1 seat.").max(8, "Cannot offer more than 8 seats."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  petsAllowed: z.boolean().default(false),
  largeBagsAllowed: z.boolean().default(false),
});

export default function OfferRidePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeWaypointInput, setActiveWaypointInput] = useState<string | null>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const form = useForm<z.infer<typeof rideSchema>>({
    resolver: zodResolver(rideSchema),
    defaultValues: {
      origin: "",
      destination: "",
      departureTime: "",
      seats: 1,
      price: 10,
      petsAllowed: false,
      largeBagsAllowed: false,
    },
  });
  
  const origin = form.watch('origin');
  const destination = form.watch('destination');

  const allWaypoints = useMemo(() => [origin, destination].filter(Boolean), [origin, destination]);

  const handleMapClick = useCallback((address: string) => {
    if (!activeWaypointInput) return;

    if (activeWaypointInput === 'origin') {
        form.setValue('origin', address);
    } else if (activeWaypointInput === 'destination') {
        form.setValue('destination', address);
    }
    setActiveWaypointInput(null);
  }, [activeWaypointInput, form]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  function onSubmit(data: z.infer<typeof rideSchema>) {
    if (!user || !userProfile) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in and have a profile to offer a ride.",
      });
      return;
    }

    const [hours, minutes] = data.departureTime.split(':').map(Number);
    const departureDateTime = new Date(data.departureDate);
    departureDateTime.setHours(hours, minutes);

    const ridesColRef = collection(firestore, 'rides');
    addDocumentNonBlocking(ridesColRef, {
      offererId: user.uid,
      offererName: `${userProfile.firstName} ${userProfile.lastName}`,
      offererAvatarUrl: userProfile.avatarUrl || '',
      offererRating: userProfile.rating || 0,
      origin: data.origin,
      destination: data.destination,
      departureTime: departureDateTime,
      availableSeats: data.seats,
      totalSeats: data.seats,
      cost: data.price,
      petsAllowed: data.petsAllowed,
      largeBagsAllowed: data.largeBagsAllowed,
      createdAt: serverTimestamp(),
    });

    toast({
      title: "Ride Offered!",
      description: "Your ride has been successfully posted.",
    });
    router.push('/profile');
  }
  
  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 md:px-6 py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Offer a Ride</CardTitle>
          <CardDescription>Share your route. Click an input, then click the map to set a location, or type an address.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 123 Main St, Anytown" 
                          {...field} 
                          onFocus={() => setActiveWaypointInput('origin')}
                          className={cn(activeWaypointInput === 'origin' && 'ring-2 ring-primary ring-offset-2')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <FormControl>
                        <Input 
                           placeholder="e.g., 456 Oak Ave, Otherville" 
                          {...field} 
                          onFocus={() => setActiveWaypointInput('destination')}
                          className={cn(activeWaypointInput === 'destination' && 'ring-2 ring-primary ring-offset-2')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <div className="h-80 w-full rounded-md overflow-hidden border">
                  <WaypointMap waypoints={allWaypoints} onMapClick={handleMapClick} activeInput={activeWaypointInput} />
              </div>


               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="departureDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Departure Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0,0,0,0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="departureTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departure Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="seats"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Seats</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="8" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Seat ($)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                
                <div className="space-y-4">
                    <FormLabel>Ride Options</FormLabel>
                    <FormField
                      control={form.control}
                      name="petsAllowed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Pets Allowed
                            </FormLabel>
                            <FormDescription>
                              You are comfortable with passengers bringing small pets.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="largeBagsAllowed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Large Bags/Luggage Allowed
                            </FormLabel>
                            <FormDescription>
                               You have space for large luggage like suitcases.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                </div>

              <Button type="submit" size="lg" className="w-full font-bold text-lg bg-accent hover:bg-accent/90 text-accent-foreground">Post Your Ride</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
