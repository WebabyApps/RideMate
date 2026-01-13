
import 'server-only';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import {NextResponse} from 'next/server';
import * as admin from 'firebase-admin';
import { getDb } from '@/lib/admin';
import { bookRideAction } from '@/lib/actions';
import { headers } from 'next/headers';

async function getAuthenticatedUser() {
  const authorization = headers().get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authorization.split('Bearer ')[1];
  try {
    // This will implicitly use the initialized admin app from getDb()
    await getDb(); 
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rideId } = body;

    if (!rideId) {
       return NextResponse.json({message: 'Ride ID is required.'}, {status: 400});
    }

    const decodedToken = await getAuthenticatedUser();
    if (!decodedToken) {
       return NextResponse.json({message: 'Unauthorized.'}, {status: 401});
    }

    // Call the robust server action
    const result = await bookRideAction({
        rideId,
        userId: decodedToken.uid,
    });

    return NextResponse.json({
      status: 'success',
      message: 'Ride booked successfully!',
      data: result,
    });
  } catch (error: any) {
    console.error('API Route Error:', error);
    // Ensure that even if an error is thrown, the response is JSON
    return NextResponse.json(
      {message: error.message || 'An unexpected error occurred.'},
      {status: error.message === 'No available seats on this ride.' || error.message === 'You have already booked a seat on this ride.' ? 409 : 500}
    );
  }
}
