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
  prompt: `You are a world-class route optimization expert specializing in creating efficient and cost-effective carpool routes.

You will be provided with the following information:
- A general description of the carpool's purpose.
- Real-time traffic conditions.
- An ordered list of geographic waypoints (as "latitude,longitude" strings) representing the origin, pickups, and final destination.
- The preferred arrival times for participants.

Your task is to analyze this data and generate an optimized carpool plan. You must determine the best sequence of travel between the waypoints to minimize travel time and cost while respecting arrival preferences. The input waypoints are just a list of required stops; you must determine the optimal order to visit them.

Your response MUST include:
1.  **Optimized Route**: A clear, waypoint-by-waypoint description of the most efficient route. Refer to the waypoints by their original index (e.g., "Start at Waypoint 1...").
2.  **Estimated Travel Time**: The total estimated duration of the trip from start to finish.
3.  **Suggested Departure Time**: The single best time to depart from the origin to accommodate everyone's arrival preferences, factoring in traffic and travel time.
4.  **Cost Estimate**: An estimated cost for the trip, considering fuel and potential tolls.

Here is the data for the current request:
- Route Goal: {{{currentRoute}}}
- Traffic Conditions: {{{trafficConditions}}}
- Waypoints: {{#each waypoints}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
- Arrival Time Preferences: {{{arrivalTimePreferences}}}

Please provide the optimized plan in the required structured format.
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
