'use server';

/**
 * @fileOverview A carpool route optimization AI agent.
 *
 * - optimizeCarpoolRoute - A function that optimizes carpool routes.
 * - OptimizeCarpoolRouteInput - The input type for the optimizeCarpoolRoute function.
 * - OptimizeCarpoolRouteOutput - The return type for the optimizeCarpoolRoute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeCarpoolRouteInputSchema = z.object({
  currentRoute: z.string().describe('The current route of the carpool.'),
  trafficConditions: z.string().describe('Real-time traffic conditions along the route.'),
  waypoints: z.array(z.string()).describe('List of waypoints (addresses) for all participants.'),
  arrivalTimePreferences: z.string().describe('Preferred arrival times for each participant.'),
});
export type OptimizeCarpoolRouteInput = z.infer<typeof OptimizeCarpoolRouteInputSchema>;

const OptimizeCarpoolRouteOutputSchema = z.object({
  optimizedRoute: z.string().describe('The optimized carpool route.'),
  estimatedTravelTime: z.string().describe('The estimated travel time for the optimized route.'),
  suggestedDepartureTime: z.string().describe('The suggested departure time to meet arrival preferences.'),
  costEstimate: z.string().describe('The estimated cost, considering fuel and tolls.'),
});
export type OptimizeCarpoolRouteOutput = z.infer<typeof OptimizeCarpoolRouteOutputSchema>;

export async function optimizeCarpoolRoute(input: OptimizeCarpoolRouteInput): Promise<OptimizeCarpoolRouteOutput> {
  return optimizeCarpoolRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeCarpoolRoutePrompt',
  input: {schema: OptimizeCarpoolRouteInputSchema},
  output: {schema: OptimizeCarpoolRouteOutputSchema},
  prompt: `You are a route optimization expert specializing in carpooling.

You will be provided with the current carpool route, real-time traffic conditions, waypoints for all participants, and their preferred arrival times.

Your goal is to suggest an optimized route that minimizes travel time and considers the arrival time preferences of all participants.

Current Route: {{{currentRoute}}}
Traffic Conditions: {{{trafficConditions}}}
Waypoints: {{#each waypoints}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Arrival Time Preferences: {{{arrivalTimePreferences}}}

Based on this information, provide an optimized route, estimated travel time, suggested departure time, and estimated cost.

Optimized Route: 
Estimated Travel Time:
Suggested Departure Time:
Cost Estimate:
`,
});

const optimizeCarpoolRouteFlow = ai.defineFlow(
  {
    name: 'optimizeCarpoolRouteFlow',
    inputSchema: OptimizeCarpoolRouteInputSchema,
    outputSchema: OptimizeCarpoolRouteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
