import 'server-only';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

function getAdminDb() {
  if (!getApps().length) {
    initializeApp({ credential: applicationDefault() });
  }
  return getFirestore();
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Ride ID is required.' }, { status: 400 });
    }

    const db = getAdminDb();
    const rideDoc = await db.collection('rides').doc(id).get();

    if (!rideDoc.exists) {
      return NextResponse.json({ message: 'Ride not found.' }, { status: 404 });
    }

    const rideData = rideDoc.data();
    // Convert Firestore Timestamps to serializable ISO strings
    const serializableData = {
        ...rideData,
        id: rideDoc.id,
        departureTime: rideData?.departureTime.toDate().toISOString(),
        createdAt: rideData?.createdAt?.toDate().toISOString(),
    };

    return NextResponse.json({ ride: serializableData });
  } catch (error: any) {
    console.error(`Error fetching ride ${params.id}:`, error);
    return NextResponse.json({ message: error.message || 'An internal error occurred.' }, { status: 500 });
  }
}
