import 'server-only';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getOptimizeCarpoolRouteFlow, OptimizeCarpoolRouteInputSchema } from '@/ai/flows/optimize-carpool-route';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

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
    
    const flow = await getOptimizeCarpoolRouteFlow();
    const result = await flow(validatedInput.data);

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
