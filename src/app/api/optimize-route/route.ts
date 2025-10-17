import 'server-only';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { optimizeCarpoolRoute } from '@/ai/flows/optimize-carpool-route';
import { OptimizeCarpoolRouteInputSchema } from '@/lib/types';
import {NextResponse} from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const waypointsArray = body.waypoints
      ? body.waypoints
          .split(';')
          .map((w: string) => w.trim())
          .filter((w: string) => w)
      : [];

    const validatedInput = OptimizeCarpoolRouteInputSchema.safeParse({
      ...body,
      waypoints: waypointsArray,
    });

    if (!validatedInput.success) {
      console.error('API Validation Error:', validatedInput.error.format());
      return NextResponse.json(
        {message: 'Invalid input.', errors: validatedInput.error.format()},
        {status: 400}
      );
    }

    const result = await optimizeCarpoolRoute(validatedInput.data);

    return NextResponse.json({
      status: 'success',
      message: 'Route optimized successfully!',
      data: result,
    });
  } catch (error: any) {
    console.error('API Route Error:', error);
    // Also log the stack trace if available
    if (error.stack) {
      console.error(error.stack);
    }
    return NextResponse.json(
      {message: error.message || 'An unexpected error occurred.'},
      {status: 500}
    );
  }
}
