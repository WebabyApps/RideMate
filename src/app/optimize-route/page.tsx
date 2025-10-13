'use client';

import { useActionState, useFormStatus } from 'react';
import { optimizeRouteAction, type FormState } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Bot, Zap, Clock, Route, DollarSign, CalendarClock } from 'lucide-react';

const initialState: FormState = {
  status: 'idle',
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full font-bold bg-accent hover:bg-accent/90 text-accent-foreground">
      {pending ? (
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
  const [state, formAction] = useActionState(optimizeRouteAction, initialState);

  useEffect(() => {
    if (state.status === 'error') {
      toast({
        variant: 'destructive',
        title: 'Optimization Failed',
        description: state.message,
      });
    } else if (state.status === 'success') {
      toast({
        title: 'Success!',
        description: state.message,
      });
    }
  }, [state]);

  return (
    <div className="container mx-auto max-w-4xl px-4 md:px-6 py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" /> AI Route Optimizer
          </CardTitle>
          <CardDescription>
            Let our AI find the best route for your carpool, considering traffic, waypoints, and arrival times.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="currentRoute">Current Route Description</Label>
                    <Textarea id="currentRoute" name="currentRoute" placeholder="e.g., 'Taking I-280 South from SF to Googleplex'" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="trafficConditions">Current Traffic Conditions</Label>
                    <Textarea id="trafficConditions" name="trafficConditions" placeholder="e.g., 'Heavy traffic on US-101 near Palo Alto'" required />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="waypoints">Waypoints (comma-separated addresses)</Label>
              <Textarea id="waypoints" name="waypoints" placeholder="e.g., '123 Main St, SF', '456 Oak Ave, Palo Alto', '1600 Amphitheatre Pkwy, Mountain View'" required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="arrivalTimePreferences">Arrival Time Preferences</Label>
              <Input id="arrivalTimePreferences" name="arrivalTimePreferences" placeholder="e.g., 'Passenger 1 by 8:45 AM, Driver by 9:00 AM'" required />
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
