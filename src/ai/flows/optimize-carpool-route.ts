'use server';

/**
 * @fileOverview A carpool route optimization AI agent.
 *
 * - optimizeCarpoolRoute - A function that optimizes carpool routes.
 * - OptimizeCarpoolRouteInput - The input type for the optimizeCarpoolRoute function.
 * - OptimizeCarpoolRouteOutput - The return type for the optimizeCarpoolRoute function.
 */

import {ai} from '@/ai/genkit-server';
import {z} from 'genkit';

const OptimizeCarpoolRouteInputSchema = z.object({
  currentRoute: z.string().describe('A general text description of the carpool plan or goal (e.g., "morning commute to work").'),
  trafficConditions: z.string().describe('Real-time traffic conditions along the general route area (e.g., "heavy congestion on the main highway").'),
  waypoints: z.array(z.string()).describe('An ordered list of waypoints. Each waypoint is a string containing latitude,longitude coordinates (e.g., ["37.7749,-122.4194", "37.3861,-122.0839"]). The first waypoint is the origin, the last is the final destination.'),
  arrivalTimePreferences: z.string().describe('Text description of preferred arrival times for each participant (e.g., "Alice needs to be at work by 8:45 AM, Bob is flexible but prefers before 9:15 AM").'),
});
export type OptimizeCarpoolRouteInput = z.infer<typeof OptimizeCarpoolRouteInputSchema>;

const OptimizeCarpoolRouteOutputSchema = z.object({
  optimizedRoute: z.string().describe('The optimized carpool route, describing the sequence of pickups and drop-offs. Refer to waypoints by their order (e.g., "Start at Waypoint 1, pick up passenger at Waypoint 2, then proceed to destination at Waypoint 3.").'),
  estimatedTravelTime: z.string().describe('The estimated total travel time for the optimized route in minutes or hours.'),
  suggestedDepartureTime: z.string().describe('The single suggested departure time from the origin (Waypoint 1) to meet all arrival preferences, formatted as HH:MM AM/PM.'),
  costEstimate: z.string().describe('The estimated cost, considering fuel and tolls. Provide a monetary value (e.g., "$15.50").'),
});
export type OptimizeCarpoolRouteOutput = z.infer<typeof OptimizeCarpoolRouteOutputSchema>;

export async function optimizeCarpoolRoute(input: OptimizeCarpoolRouteInput): Promise<OptimizeCarpoolRouteOutput> {
  return optimizeCarpoolRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeCarpoolRoutePrompt',
  input: {schema: OptimizeCarpoolRouteInputSchema},
  output: {schema: OptimizeCarpoolRouteOutputSchema},
  prompt: `You are a world-class route optimization expert specializing in creating efficient and cost-effective carpool routes. Your primary goal is to determine the optimal order of visiting waypoints and suggest the best departure time to meet all constraints.

You will be provided with the following information:
- A general description of the carpool's purpose (e.g., "Work commute").
- Real-time traffic conditions (e.g., "light", "moderate", "heavy congestion").
- An ordered list of geographic waypoints (as "latitude,longitude" strings). This list represents the origin (index 0), one or more passenger pickups, and the final destination (last index). The initial order is not optimized.
- The preferred or required arrival times for participants associated with specific waypoints.

Your task is to analyze this data and generate a comprehensive, optimized carpool plan. You must:
1.  Determine the most efficient sequence of travel between all waypoints to minimize travel time and cost. The final destination must be the last stop.
2.  Calculate the total travel time based on the optimized route and traffic conditions.
3.  Suggest a single, precise departure time from the origin (Waypoint 1) that ensures all participants arrive at their respective destinations on time.
4.  Provide a reasonable cost estimate for the trip, considering factors like distance and potential tolls.

Here is the data for the current request:
- Route Goal: {{{currentRoute}}}
- Traffic Conditions: {{{trafficConditions}}}
- Waypoints: {{#each waypoints}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
- Arrival Time Preferences: {{{arrivalTimePreferences}}}

Please provide the optimized plan in the required structured format. Your optimized route description should be clear and easy to follow, referring to waypoints by their original index for clarity (e.g., "Start at Waypoint 1 (Origin), pick up at Waypoint 3, then pick up at Waypoint 2, and finally arrive at Waypoint 4 (Destination).").
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
