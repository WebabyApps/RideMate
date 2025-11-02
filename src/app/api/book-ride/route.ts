import 'server-only';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import {NextResponse} from 'next/server';
import * as admin from 'firebase-admin';
import {getDb} from '@/lib/admin';
import {bookRide} from '@/ai/flows/book-ride';
import {headers} from 'next/headers';
import type { UserProfile } from '@/lib/types';


async function getAuthenticatedUser() {
  const authorization = headers().get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authorization.split('Bearer ')[1];
  try {
    // Ensure admin is initialized before using it
    if (admin.apps.length === 0) {
      await getDb(); // This will call initialize() if needed
    }
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const db = await getDb();
    const userDoc = await db.doc(`users/${userId}`).get();
    if (!userDoc.exists) {
        return null;
    }
    return userDoc.data() as UserProfile;
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

    const userProfile = await getUserProfile(decodedToken.uid);
     if (!userProfile) {
        return NextResponse.json({message: 'User profile not found.'}, {status: 404});
    }

    const result = await bookRide({
        rideId,
        userId: decodedToken.uid,
        userProfile: userProfile
    });

    return NextResponse.json({
      status: 'success',
      message: 'Ride booked successfully!',
      data: result,
    });
  } catch (error: any) {
    console.error('API Route Error:', error);
    if (error.stack) {
      console.error(error.stack);
    }
    return NextResponse.json(
      {message: error.message || 'An unexpected error occurred.'},
      {status: 500}
    );
  }
}
