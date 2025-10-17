import { NextRequest, NextResponse } from 'next/server';
import { runOptimizeCarpoolRouteFlow, OptimizeCarpoolRouteInputSchema } from '@/ai/flows/optimize-carpool-route';
import 'server-only';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // The form sends waypoints as a single semicolon-separated string.
    // The AI flow expects an array of strings.
    const waypointsArray = body.waypoints ? body.waypoints.split(';').map((w: string) => w.trim()).filter((w: string) => w) : [];

    const validatedInput = OptimizeCarpoolRouteInputSchema.safeParse({
      ...body,
      waypoints: waypointsArray,
    });

    if (!validatedInput.success) {
      return NextResponse.json(
        { message: 'Invalid input.', errors: validatedInput.error.format() },
        { status: 400 }
      );
    }
    
    // Lazy-load Genkit and plugins only within the API route
    const [{ genkit }, { googleAI }] = await Promise.all([
        import('genkit'),
        import('@genkit-ai/google-genai'),
    ]);
    
    // Configure AI instance within the server-side context
    const ai = genkit({
        plugins: [googleAI()],
        logLevel: 'debug',
        enableTracing: true,
    });

    // Run the flow with the initialized AI instance
    const result = await runOptimizeCarpoolRouteFlow(ai, validatedInput.data);

    return NextResponse.json({
        status: 'success',
        message: 'Route optimized successfully!',
        data: result,
      });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { message: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
