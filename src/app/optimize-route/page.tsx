'use client';

import { useState, useTransition, useMemo, useCallback, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { collection, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Bot, Zap, Clock, Route, DollarSign, CalendarClock, Trash2, PlusCircle, Calendar as CalendarIcon, Car, Euro } from 'lucide-react';
import { WaypointMap } from '@/components/waypoint-map';
import type { OptimizeCarpoolRouteOutput, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useUser, useFirestore, addDocumentNonBlocking, useDoc, useMemoFirebase } from "@/firebase";

const rideSchema = z.object({
  departureDate: z.date({ required_error: "A departure date is required." }),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  seats: z.coerce.number().int().min(1, "Must offer at least 1 seat.").max(8, "Cannot offer more than 8 seats."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
});

const WaypointInput = ({ id, value, onChange, placeholder, onFocus, activeInput }: { id: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; onFocus: () => void; activeInput: string | null; }) => {
  return (
    <Input
      id={id}
      name={id}
      placeholder={placeholder}
      required={id === 'origin' || id === 'destination'}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      className={cn(activeInput === id && 'ring-2 ring-primary ring-offset-2')}
    />
  );
};


function SubmitButton() {
  const [isPending] = useTransition();
  return (
    <Button type="submit" disabled={isPending} size="lg" className="w-full font-bold bg-accent hover:bg-accent/90 text-accent-foreground">
      {isPending ? (
        <>
          <Bot className="mr-2 h-5 w-5 animate-spin" /> Optimizing...
        </>
      ) : (
        <>
          <Zap className="mr-2 h-5 w-5" /> Optimize My Route
        </>
      )}
    </Button>
  );
}

export default function OptimizeRoutePage() {
  const [optimizationState, setOptimizationState] = useState<{status: 'idle' | 'loading' | 'success' | 'error'; message: string; data?: OptimizeCarpoolRouteOutput;}>({status: 'idle', message: ''});
  const [isPending, startTransition] = useTransition();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState<string[]>(['']);
  const [activeWaypointInput, setActiveWaypointInput] = useState<string | null>(null);

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const form = useForm<z.infer<typeof rideSchema>>({
    resolver: zodResolver(rideSchema),
    defaultValues: {
      seats: 1,
      price: 10,
    },
  });

  useEffect(() => {
    if (optimizationState.status === 'success' && optimizationState.data) {
        const time = optimizationState.data.suggestedDepartureTime.replace(/ (AM|PM)/, '');
        form.setValue('departureTime', time);
    }
  }, [optimizationState, form]);

  const allWaypoints = useMemo(() => [origin, ...stops, destination].filter(Boolean), [origin, stops, destination]);

  const handleAddStop = () => setStops([...stops, '']);
  const handleRemoveStop = (indexToRemove: number) => setStops(stops.filter((_, index) => index !== indexToRemove));
  const handleStopChange = (index: number, value: string) => {
    const newStops = [...stops];
    newStops[index] = value;
    setStops(newStops);
  };

  const handleMapClick = useCallback((address: string) => {
    if (!activeWaypointInput) return;

    if (activeWaypointInput === 'origin') setOrigin(address);
    else if (activeWaypointInput === 'destination') setDestination(address);
    else if (activeWaypointInput.startsWith('stop-')) {
        const index = parseInt(activeWaypointInput.split('-')[1], 10);
        handleStopChange(index, address);
    }
    setActiveWaypointInput(null);
  }, [activeWaypointInput]);

  const handleOptimizationSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (origin.trim() === '' || destination.trim() === '') {
      toast({ variant: "destructive", title: "Invalid Route", description: "Please provide at least an origin and a destination." });
      return;
    }
    const formData = new FormData(event.currentTarget);
    const waypointsLatLng = allWaypoints.join(';');
    const payload = {
      currentRoute: formData.get('currentRoute'),
      trafficConditions: formData.get('trafficConditions'),
      waypoints: waypointsLatLng,
      arrivalTimePreferences: formData.get('arrivalTimePreferences'),
    };
    setOptimizationState({ status: 'loading', message: '' });
    startTransition(async () => {
      try {
        const response = await fetch('/api/optimize-route', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'An error occurred.');
        setOptimizationState({ status: 'success', message: 'Route optimized successfully!', data: result.data });
        toast({ title: 'Success!', description: 'Route optimized successfully!' });
      } catch (error: any) {
         setOptimizationState({ status: 'error', message: error.message || 'An unexpected error occurred.' });
        toast({ variant: 'destructive', title: 'Optimization Failed', description: error.message });
      }
    });
  };

  const handlePostRideSubmit = (data: z.infer<typeof rideSchema>) => {
    if (!user || !userProfile || !origin || !destination) {
      toast({ variant: "destructive", title: "Error", description: "Cannot post ride. Make sure you are logged in and have set an origin and destination." });
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
      origin: origin,
      destination: destination,
      departureTime: departureDateTime,
      availableSeats: data.seats,
      totalSeats: data.seats,
      cost: data.price,
      petsAllowed: false, // Defaulting these, can be added to form
      largeBagsAllowed: false, // Defaulting these, can be added to form
      createdAt: serverTimestamp(),
    });
    toast({ title: "Ride Offered!", description: "Your optimized ride has been posted." });
    router.push('/profile');
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 md:px-6 py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" /> AI Route Optimizer
          </CardTitle>
          <CardDescription>
            Enter your route details below. You can click an input field then click the map to set a location, or type an address directly.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleOptimizationSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin</Label>
                <WaypointInput id="origin" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Starting point address" onFocus={() => setActiveWaypointInput('origin')} activeInput={activeWaypointInput} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <WaypointInput id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Ending point address" onFocus={() => setActiveWaypointInput('destination')} activeInput={activeWaypointInput} />
              </div>
            </div>
            <div className="space-y-4">
              <Label>Stops</Label>
              {stops.map((stop, index) => (
                <div key={index} className="flex items-center gap-2">
                  <WaypointInput id={`stop-${index}`} value={stop} onChange={(e) => handleStopChange(index, e.target.value)} placeholder={`Stop ${index + 1} address`} onFocus={() => setActiveWaypointInput(`stop-${index}`)} activeInput={activeWaypointInput} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStop(index)} className="shrink-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={handleAddStop}><PlusCircle className="mr-2 h-4 w-4" /> Add Stop</Button>
            </div>
            <div className="h-96 w-full rounded-md overflow-hidden border">
              <WaypointMap waypoints={allWaypoints} onMapClick={handleMapClick} activeInput={activeWaypointInput} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label htmlFor="currentRoute">Route Description</Label><Textarea id="currentRoute" name="currentRoute" placeholder="e.g., 'Morning commute to the office with a stop at the coffee shop.'" required /></div>
              <div className="space-y-2"><Label htmlFor="trafficConditions">Traffic Conditions</Label><Textarea id="trafficConditions" name="trafficConditions" placeholder="e.g., 'Usual morning traffic, minor congestion on the bridge.'" required /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="arrivalTimePreferences">Arrival Time Preferences</Label><Input id="arrivalTimePreferences" name="arrivalTimePreferences" placeholder="e.g., 'Passenger at Stop 1 by 8:45 AM, Driver by 9:00 AM'" required /></div>
          </CardContent>
          <CardFooter><SubmitButton /></CardFooter>
        </form>
      </Card>
      
      {optimizationState.status === 'success' && optimizationState.data && (
        <>
          <Card className="mt-8 shadow-lg animate-in fade-in-50">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Optimized Route Plan</CardTitle>
              <CardDescription>Here is the AI-suggested plan for your trip.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-lg"><h4 className="font-semibold flex items-center gap-2 mb-2"><Route className="h-5 w-5 text-primary"/>Optimized Route</h4><p className="text-muted-foreground">{optimizationState.data.optimizedRoute}</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-secondary/50 rounded-lg"><h4 className="font-semibold flex items-center gap-2 mb-2"><Clock className="h-5 w-5 text-primary"/>Est. Travel Time</h4><p className="text-2xl font-bold">{optimizationState.data.estimatedTravelTime}</p></div>
                <div className="p-4 bg-secondary/50 rounded-lg"><h4 className="font-semibold flex items-center gap-2 mb-2"><CalendarClock className="h-5 w-5 text-primary"/>Suggested Departure</h4><p className="text-2xl font-bold">{optimizationState.data.suggestedDepartureTime}</p></div>
                <div className="p-4 bg-secondary/50 rounded-lg"><h4 className="font-semibold flex items-center gap-2 mb-2"><DollarSign className="h-5 w-5 text-accent"/>Cost Estimate</h4><p className="text-2xl font-bold">{optimizationState.data.costEstimate}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8 shadow-lg animate-in fade-in-50">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2"><Car className="h-6 w-6 text-primary"/>Post This Ride</CardTitle>
                <CardDescription>Fill in the final details and offer this optimized route to the community.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handlePostRideSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="departureDate" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Departure Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="departureTime" render={({ field }) => (
                                <FormItem><FormLabel>Departure Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="seats" render={({ field }) => (
                                <FormItem><FormLabel>Available Seats</FormLabel><FormControl><Input type="number" min="1" max="8" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="price" render={({ field }) => (
                                <FormItem><FormLabel>Price per Seat ($)</FormLabel><FormControl><Input type="number" min="0" step="0.50" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <Button type="submit" size="lg" className="w-full font-bold text-lg bg-accent hover:bg-accent/90 text-accent-foreground">Post Your Optimized Ride</Button>
                    </form>
                </Form>
            </CardContent>
          </Card>
        </>
      )}

      {optimizationState.status === 'loading' && (
         <Card className="mt-8"><CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3"><Bot className="h-10 w-10 text-primary animate-pulse" /><p className="font-semibold">AI is analyzing your route...</p><p className="text-sm text-muted-foreground">This may take a moment. Please wait.</p></CardContent></Card>
      )}

      {optimizationState.status === 'error' && optimizationState.message && (
          <Alert variant="destructive" className="mt-8"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{optimizationState.message}</AlertDescription></Alert>
      )}
    </div>
  );
}
