import 'server-only';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

function getAdminDb() {
  if (!getApps().length) {
    initializeApp({ credential: applicationDefault() }); // works on Firebase Hosting
  }
  return getFirestore();
}

export async function POST(req: Request) {
  try {
    const { origin, destination, sort } = await req.json();
    const db = getFirestore();

    let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('rides');
    
    // Apply origin filter if it exists. This is an inequality filter.
    if (origin) {
        q = q.where('origin', '>=', origin).where('origin', '<=', origin + '\uf8ff');
    }

    // Firestore requires the first orderBy to match the inequality field if one exists.
    if (origin) {
        q = q.orderBy('origin'); // Primary sort on the filtered field.
    }
    
    // Apply secondary sort based on user selection.
    switch (sort) {
        case 'price-asc':
            q = q.orderBy('cost', 'asc');
            break;
        case 'price-desc':
            q = q.orderBy('cost', 'desc');
            break;
        case 'departure-asc':
        default:
             // If no origin filter, we can sort by departureTime directly.
             // If there is an origin filter, we need a composite index on (origin, departureTime).
             // Assuming the index exists or adding it for this functionality.
             // If origin is not present, this is the primary sort.
            q = q.orderBy('departureTime', 'asc');
            break;
    }

    const snap = await q.limit(50).get();

    let rides = snap.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamps to serializable strings safely
        const departureTime = data.departureTime ? data.departureTime.toDate().toISOString() : null;
        const createdAt = data.createdAt ? data.createdAt.toDate().toISOString() : null;
        return { id: doc.id, ...data, departureTime, createdAt };
    });

    // Since Firestore can't filter on two different fields (e.g., origin prefix and destination contains)
    // we do the destination filtering in memory after the initial query.
    if (destination) {
        rides = rides.filter(ride => ride.destination && ride.destination.toLowerCase().includes(destination.toLowerCase()));
    }


    return NextResponse.json({ rides });
  } catch (error: any) {
    console.error('Error fetching rides:', error);
    return NextResponse.json({ message: error.message || 'An internal error occurred.' }, { status: 500 });
  }
}
