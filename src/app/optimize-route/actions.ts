'use server';

import { optimizeCarpoolRoute } from '@/ai/flows/optimize-carpool-route';
import { z } from 'zod';

const OptimizeCarpoolRouteInputSchema = z.object({
  currentRoute: z.string().min(1, 'Current route is required.'),
  trafficConditions: z.string().min(1, 'Traffic conditions are required.'),
  // Waypoints are now lat/lng pairs separated by semicolons. e.g., "lat1,lng1;lat2,lng2"
  waypoints: z.string().min(1, 'At least one waypoint is required.'),
  arrivalTimePreferences: z.string().min(1, 'Arrival time preferences are required.'),
});

export type FormState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  data?: {
    optimizedRoute: string;
    estimatedTravelTime: string;
    suggestedDepartureTime: string;
    costEstimate: string;
  };
};

export async function optimizeRouteAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = OptimizeCarpoolRouteInputSchema.safeParse({
    currentRoute: formData.get('currentRoute'),
    trafficConditions: formData.get('trafficConditions'),
    waypoints: formData.get('waypoints'),
    arrivalTimePreferences: formData.get('arrivalTimePreferences'),
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: 'Invalid form data. Please check your inputs.',
      data: undefined,
    };
  }
  
  try {
    // The flow expects an array of strings. We'll send the lat/lng pairs as strings.
    const waypointsArray = validatedFields.data.waypoints.split(';').map(w => w.trim());

    const result = await optimizeCarpoolRoute({
      ...validatedFields.data,
      waypoints: waypointsArray,
    });
    
    return {
      status: 'success',
      message: 'Route optimized successfully!',
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      status: 'error',
      message: 'An unexpected error occurred. Please try again later.',
      data: undefined,
    };
  }
}
