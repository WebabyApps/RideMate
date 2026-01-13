'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback, useTransition } from "react";
import { collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';

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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, PlusCircle, Trash2, Zap, Bot, Route, Clock, DollarSign, CalendarClock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useFirestore, useUser, addDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { WaypointMap } from "@/components/waypoint-map";
import { Checkbox } from "@/components/ui/checkbox";
import { useDoc } from "@/firebase/firestore/use-doc";
import type { UserProfile, OptimizeCarpoolRouteOutput } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const rideSchema = z.object({
  origin: z.string().min(3, "Origin must be at least 3 characters long."),
  destination: z.string().min(3, "Destination must be at least 3 characters long."),
  departureDate: z.date({ required_error: "A departure date is required." }),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  seats: z.coerce.number().int().min(1, "Must offer at least 1 seat.").max(8, "Cannot offer more than 8 seats."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  petsAllowed: z.boolean().default(false),
  largeBagsAllowed: z.boolean().default(false),
  // AI fields are optional
  currentRoute: z.string().optional(),
  trafficConditions: z.string().optional(),
  arrivalTimePreferences: z.string().optional(),
});

export default function OfferRidePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeWaypointInput, setActiveWaypointInput] = useState<string | null>('origin');
  const [stops, setStops] = useState<string[]>([]);
  const [isAiSectionOpen, setAiSectionOpen] = useState(false);
  const [optimizationState, setOptimizationState] = useState<{status: 'idle' | 'loading' | 'success' | 'error'; message: string; data?: OptimizeCarpoolRouteOutput;}>({status: 'idle', message: ''});
  const [isOptimizing, startOptimizationTransition] = useTransition();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfileFromHook } = useDoc<UserProfile>(userDocRef);

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
  const allWaypoints = useMemo(() => [origin, ...stops, destination].filter(Boolean), [origin, stops, destination]);

  useEffect(() => {
    if (optimizationState.status === 'success' && optimizationState.data) {
        const time = optimizationState.data.suggestedDepartureTime.replace(/ (AM|PM)/, '');
        const costMatch = optimizationState.data.costEstimate.match(/[\d.]+/);
        const cost = costMatch ? parseFloat(costMatch[0]) : 10;
        
        form.setValue('departureTime', time);
        form.setValue('price', cost);
    }
  }, [optimizationState, form]);

  const handleAddStop = () => setStops([...stops, '']);
  const handleRemoveStop = (indexToRemove: number) => setStops(stops.filter((_, index) => index !== indexToRemove));
  
  const handleStopChange = (index: number, value: string) => {
    const newStops = [...stops];
    newStops[index] = value;
    setStops(newStops);
  };

  const handleMapClick = useCallback((address: string) => {
    if (!activeWaypointInput) return;

    if (activeWaypointInput === 'origin') {
        form.setValue('origin', address);
    } else if (activeWaypointInput === 'destination') {
        form.setValue('destination', address);
    } else if (activeWaypointInput.startsWith('stop-')) {
        const index = parseInt(activeWaypointInput.split('-')[1], 10);
        handleStopChange(index, address);
    }
    setActiveWaypointInput(null);
  }, [activeWaypointInput, form]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleOptimizeSubmit = () => {
    const formData = form.getValues();
    if (formData.origin.trim() === '' || formData.destination.trim() === '') {
      toast({ variant: "destructive", title: "Invalid Route", description: "Please provide at least an origin and a destination." });
      return;
    }
    const waypointsLatLng = allWaypoints.join(';');
    const payload = {
      currentRoute: formData.currentRoute,
      trafficConditions: formData.trafficConditions,
      waypoints: waypointsLatLng,
      arrivalTimePreferences: formData.arrivalTimePreferences,
    };
    setOptimizationState({ status: 'loading', message: '' });
    startOptimizationTransition(async () => {
      try {
        const response = await fetch('/api/optimize-route', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'An error occurred.');
        setOptimizationState({ status: 'success', message: 'Route optimized successfully!', data: result.data });
        toast({ title: 'Success!', description: 'Route optimized successfully! Form fields have been updated.' });
      } catch (error: any) {
         setOptimizationState({ status: 'error', message: error.message || 'An unexpected error occurred.' });
        toast({ variant: 'destructive', title: 'Optimization Failed', description: error.message });
      }
    });
  };

  async function onPostRideSubmit(data: z.infer<typeof rideSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to offer a ride." });
      return;
    }
    
    // Ensure we have the user profile, fetching it if necessary
    let userProfile = userProfileFromHook;
    if (!userProfile && userDocRef) {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            userProfile = { id: userDoc.id, ...userDoc.data() } as UserProfile;
        }
    }
    
    if (!userProfile) {
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not find user profile. Please try again." });
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
      stops: stops.filter(Boolean),
      departureTime: departureDateTime,
      availableSeats: data.seats,
      totalSeats: data.seats,
      cost: data.price,
      petsAllowed: data.petsAllowed,
      largeBagsAllowed: data.largeBagsAllowed,
      createdAt: serverTimestamp(),
    });

    toast({ title: "Ride Offered!", description: "Your ride has been successfully posted." });
    router.push('/profile');
  }
  
  if (isUserLoading || !user) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><p>Loading...</p></div>;
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 md:px-6 py-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onPostRideSubmit)} className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">Offer a Ride</CardTitle>
              <CardDescription>Share your route. Click an input, then click the map to set a location, or type an address.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                  <FormField control={form.control} name="origin" render={({ field }) => (
                    <FormItem><FormLabel>Origin</FormLabel><FormControl><Input placeholder="e.g., 123 Main St, Anytown" {...field} onFocus={() => setActiveWaypointInput('origin')} className={cn(activeWaypointInput === 'origin' && 'ring-2 ring-primary ring-offset-2')} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  
                  {stops.map((stop, index) => (
                    <div key={`stop-${index}`} className="flex items-center gap-2">
                        <Input placeholder={`Stop ${index + 1}`} value={stop} onChange={(e) => handleStopChange(index, e.target.value)} onFocus={() => setActiveWaypointInput(`stop-${index}`)} className={cn(activeWaypointInput === `stop-${index}` && 'ring-2 ring-primary ring-offset-2')} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStop(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ))}

                  <FormField control={form.control} name="destination" render={({ field }) => (
                    <FormItem><FormLabel>Destination</FormLabel><FormControl><Input placeholder="e.g., 456 Oak Ave, Otherville" {...field} onFocus={() => setActiveWaypointInput('destination')} className={cn(activeWaypointInput === 'destination' && 'ring-2 ring-primary ring-offset-2')} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddStop}><PlusCircle className="mr-2 h-4 w-4" /> Add Stop</Button>
                </div>
               <div className="h-80 w-full rounded-md overflow-hidden border">
                  <WaypointMap waypoints={allWaypoints} onMapClick={handleMapClick} activeInput={activeWaypointInput} />
               </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="departureDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Departure Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
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
                <div className="space-y-4">
                    <FormLabel>Ride Options</FormLabel>
                    <FormField control={form.control} name="petsAllowed" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Pets Allowed</FormLabel><FormDescription>You are comfortable with passengers bringing small pets.</FormDescription></div></FormItem>
                    )}/>
                    <FormField control={form.control} name="largeBagsAllowed" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Large Bags/Luggage Allowed</FormLabel><FormDescription>You have space for large luggage like suitcases.</FormDescription></div></FormItem>
                    )}/>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-primary"/>AI Route Optimizer</h3>
                    <Switch checked={isAiSectionOpen} onCheckedChange={setAiSectionOpen} />
                  </div>
                  {isAiSectionOpen && (
                    <div className="space-y-4 mt-4 p-4 border rounded-lg bg-secondary/30 animate-in fade-in-50">
                      <p className="text-sm text-muted-foreground">Provide extra details for the AI to suggest the best route, departure time, and price.</p>
                       <FormField control={form.control} name="currentRoute" render={({ field }) => (<FormItem><FormLabel>Route Description</FormLabel><FormControl><Textarea placeholder="e.g., 'Morning commute to the office with a stop at the coffee shop.'" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                       <FormField control={form.control} name="trafficConditions" render={({ field }) => (<FormItem><FormLabel>Traffic Conditions</FormLabel><FormControl><Textarea placeholder="e.g., 'Usual morning traffic, minor congestion on the bridge.'" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                       <FormField control={form.control} name="arrivalTimePreferences" render={({ field }) => (<FormItem><FormLabel>Arrival Time Preferences</FormLabel><FormControl><Input placeholder="e.g., 'Passenger at Stop 1 by 8:45 AM, Driver by 9:00 AM'" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                       <Button type="button" onClick={handleOptimizeSubmit} disabled={isOptimizing} className="w-full">
                         {isOptimizing ? <><Bot className="mr-2 h-5 w-5 animate-spin" /> Optimizing...</> : <><Zap className="mr-2 h-5 w-5" /> Optimize with AI</>}
                       </Button>
                    </div>
                  )}
                </div>

                {optimizationState.status === 'success' && optimizationState.data && (
                    <Card className="mt-4 shadow-inner bg-secondary/50">
                        <CardHeader><CardTitle className="font-headline text-xl">AI Optimized Plan</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                        <div className="p-3 bg-background/50 rounded-lg"><h4 className="font-semibold flex items-center gap-2 mb-1"><Route className="h-5 w-5 text-primary"/>Optimized Route</h4><p className="text-sm text-muted-foreground">{optimizationState.data.optimizedRoute}</p></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3 bg-background/50 rounded-lg"><h4 className="font-semibold flex items-center gap-2 mb-1"><Clock className="h-5 w-5 text-primary"/>Travel Time</h4><p className="font-bold">{optimizationState.data.estimatedTravelTime}</p></div>
                            <div className="p-3 bg-background/50 rounded-lg"><h4 className="font-semibold flex items-center gap-2 mb-1"><CalendarClock className="h-5 w-5 text-primary"/>Departure</h4><p className="font-bold">{optimizationState.data.suggestedDepartureTime}</p></div>
                            <div className="p-3 bg-background/50 rounded-lg"><h4 className="font-semibold flex items-center gap-2 mb-1"><DollarSign className="h-5 w-5 text-accent"/>Cost</h4><p className="font-bold">{optimizationState.data.costEstimate}</p></div>
                        </div>
                        </CardContent>
                    </Card>
                )}
                 {optimizationState.status === 'loading' && (
                    <div className="p-6 flex flex-col items-center justify-center text-center space-y-3"><Bot className="h-8 w-8 text-primary animate-pulse" /><p className="font-semibold">AI is analyzing your route...</p></div>
                )}
                {optimizationState.status === 'error' && optimizationState.message && (
                    <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{optimizationState.message}</AlertDescription></Alert>
                )}

            </CardContent>
             <CardFooter>
                <Button type="submit" size="lg" className="w-full font-bold text-lg bg-accent hover:bg-accent/90 text-accent-foreground">Post Your Ride</Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
