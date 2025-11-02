/**
 * @fileOverview A carpool route optimization AI agent.
 *
 * - optimizeCarpoolRoute - A function that handles the carpool route optimization.
 */

import {ai} from '@/ai/getAI';
import {
  OptimizeCarpoolRouteInput,
  OptimizeCarpoolRouteInputSchema,
  OptimizeCarpoolRouteOutput,
  OptimizeCarpoolRouteOutputSchema,
} from '@/lib/types';


const optimizeCarpoolRouteFlow = ai.defineFlow(
  {
    name: 'optimizeCarpoolRouteFlow',
    inputSchema: OptimizeCarpoolRouteInputSchema,
    outputSchema: OptimizeCarpoolRouteOutputSchema,
  },
  async (input) => {
    const optimizeCarpoolRoutePrompt = ai.definePrompt({
        name: 'optimizeCarpoolRoutePrompt',
        input: {schema: OptimizeCarpoolRouteInputSchema},
        output: {schema: OptimizeCarpoolRouteOutputSchema},
        prompt: `You are a world-class route optimization expert specializing in creating efficient and cost-effective carpool routes. Your primary goal is to determine the optimal order of visiting waypoints and suggest the best departure time to meet all constraints.

        You will be provided with the following information:
        - A general description of the carpool's purpose (e.g., "Work commute").
        - Real-time traffic conditions (e.g., "light", "moderate", "heavy congestion").
        - An ordered list of geographic waypoints (as "latitude,longitude" strings). This list represents the origin (index 0), one or more passenger pickups, and the final destination (last index). The initial order is not optimized.
        - The preferred or required arrival times for participants associated with specific waypoints.

        Your task is to analyze this data and generate a comprehensive, optimized plan. You must:
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
    
    const {output} = await optimizeCarpoolRoutePrompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid response.');
    }
    return output;
  }
);

export async function optimizeCarpoolRoute(input: OptimizeCarpoolRouteInput): Promise<OptimizeCarpoolRouteOutput> {
    return optimizeCarpoolRouteFlow(input);
}
