'use client';

import { useState, useTransition, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Bot, Zap, Clock, Route, DollarSign, CalendarClock, Trash2, PlusCircle } from 'lucide-react';
import { WaypointMap } from '@/components/waypoint-map';
import type { OptimizeCarpoolRouteOutput } from '@/ai/flows/optimize-carpool-route';
import { cn } from '@/lib/utils';

type FormState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  data?: OptimizeCarpoolRouteOutput;
};

const initialState: FormState = {
  status: 'idle',
  message: '',
};

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
  const [state, setState] = useState<FormState>(initialState);
  const [isPending, startTransition] = useTransition();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState<string[]>(['']);
  const [activeWaypointInput, setActiveWaypointInput] = useState<string | null>(null);

  const allWaypoints = useMemo(() => [origin, ...stops, destination].filter(Boolean), [origin, stops, destination]);

  const handleAddStop = () => {
    setStops([...stops, '']);
  };

  const handleRemoveStop = (indexToRemove: number) => {
    setStops(stops.filter((_, index) => index !== indexToRemove));
  };
  
  const handleStopChange = (index: number, value: string) => {
    const newStops = [...stops];
    newStops[index] = value;
    setStops(newStops);
  };

  const handleMapClick = useCallback((address: string) => {
    if (!activeWaypointInput) return;

    if (activeWaypointInput === 'origin') {
        setOrigin(address);
    } else if (activeWaypointInput === 'destination') {
        setDestination(address);
    } else if (activeWaypointInput.startsWith('stop-')) {
        const index = parseInt(activeWaypointInput.split('-')[1], 10);
        handleStopChange(index, address);
    }
    // Deactivate after setting
    setActiveWaypointInput(null);
  }, [activeWaypointInput]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (origin.trim() === '' || destination.trim() === '') {
      toast({
        variant: "destructive",
        title: "Invalid Route",
        description: "Please provide at least an origin and a destination.",
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const waypoints = [origin, ...stops, destination].filter(Boolean);
    const waypointsLatLng = waypoints.join(';');

    const payload = {
      currentRoute: formData.get('currentRoute'),
      trafficConditions: formData.get('trafficConditions'),
      waypoints: waypointsLatLng,
      arrivalTimePreferences: formData.get('arrivalTimePreferences'),
    };

    setState({ ...initialState, status: 'loading' });

    startTransition(async () => {
      try {
        const response = await fetch('/api/optimize-route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'An error occurred.');
        }

        setState({
          status: 'success',
          message: 'Route optimized successfully!',
          data: result.data,
        });
        toast({
          title: 'Success!',
          description: 'Route optimized successfully!',
        });

      } catch (error: any) {
         setState({
          status: 'error',
          message: error.message || 'An unexpected error occurred.',
        });
        toast({
          variant: 'destructive',
          title: 'Optimization Failed',
          description: error.message,
        });
      }
    });
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
        <form onSubmit={handleSubmit}>
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
                        <WaypointInput
                            id={`stop-${index}`}
                            value={stop}
                            onChange={(e) => handleStopChange(index, e.target.value)}
                            placeholder={`Stop ${index + 1} address`}
                            onFocus={() => setActiveWaypointInput(`stop-${index}`)}
                            activeInput={activeWaypointInput}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStop(index)} className="shrink-0">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddStop}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Stop
                </Button>
            </div>

            <div className="h-96 w-full rounded-md overflow-hidden border">
                <WaypointMap waypoints={allWaypoints} onMapClick={handleMapClick} activeInput={activeWaypointInput} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="currentRoute">Route Description</Label>
                    <Textarea id="currentRoute" name="currentRoute" placeholder="e.g., 'Morning commute to the office with a stop at the coffee shop.'" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="trafficConditions">Traffic Conditions</Label>
                    <Textarea id="trafficConditions" name="trafficConditions" placeholder="e.g., 'Usual morning traffic, minor congestion on the bridge.'" required />
                </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="arrivalTimePreferences">Arrival Time Preferences</Label>
              <Input id="arrivalTimePreferences" name="arrivalTimePreferences" placeholder="e.g., 'Passenger at Stop 1 by 8:45 AM, Driver by 9:00 AM'" required />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>

      {state.status === 'success' && state.data && (
        <Card className="mt-8 shadow-lg animate-in fade-in-50">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Optimized Route Plan</CardTitle>
            <CardDescription>Here is the AI-suggested plan for your trip.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 bg-secondary/50 rounded-lg">
                <h4 className="font-semibold flex items-center gap-2 mb-2"><Route className="h-5 w-5 text-primary"/>Optimized Route</h4>
                <p className="text-muted-foreground">{state.data.optimizedRoute}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-2"><Clock className="h-5 w-5 text-primary"/>Est. Travel Time</h4>
                    <p className="text-2xl font-bold">{state.data.estimatedTravelTime}</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-2"><CalendarClock className="h-5 w-5 text-primary"/>Suggested Departure</h4>
                    <p className="text-2xl font-bold">{state.data.suggestedDepartureTime}</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-2"><DollarSign className="h-5 w-5 text-accent"/>Cost Estimate</h4>
                    <p className="text-2xl font-bold">{state.data.costEstimate}</p>
                </div>
            </div>
          </CardContent>
        </Card>
      )}

      {state.status === 'loading' && (
         <Card className="mt-8">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                <Bot className="h-10 w-10 text-primary animate-pulse" />
                <p className="font-semibold">AI is analyzing your route...</p>
                <p className="text-sm text-muted-foreground">This may take a moment. Please wait.</p>
            </CardContent>
         </Card>
      )}

      {state.status === 'error' && state.message && (
          <Alert variant="destructive" className="mt-8">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
      )}

    </div>
  );
}
