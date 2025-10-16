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
  optimizedRoute: z.string().describe('The optimized carpool route, listing waypoints in order.'),
  estimatedTravelTime: z.string().describe('The estimated total travel time for the optimized route.'),
  suggestedDepartureTime: z.string().describe('The single suggested departure time from the origin to meet all arrival preferences.'),
  costEstimate: z.string().describe('The estimated cost, considering fuel and tolls. Provide a monetary value.'),
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
- A general description of the current planned route.
- Real-time traffic conditions.
- A list of waypoints (pickup/drop-off addresses) for all participants.
- The preferred arrival times for each participant.

Your task is to analyze this data and generate an optimized carpool plan.

Your response MUST include:
1.  **Optimized Route**: A clear, turn-by-turn or waypoint-by-waypoint description of the most efficient route.
2.  **Estimated Travel Time**: The total estimated duration of the trip from start to finish.
3.  **Suggested Departure Time**: The single best time to depart from the origin to accommodate everyone's arrival preferences, factoring in traffic and travel time.
4.  **Cost Estimate**: An estimated cost for the trip, considering fuel and potential tolls.

Here is the data for the current request:
- Current Route: {{{currentRoute}}}
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
