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

export async function POST(req: Request) {
  try {
    const { origin, destination, sort } = await req.json();
    const db = getAdminDb();

    // 1. Fetch all rides (or a reasonable limit).
    // This simplifies the logic and avoids complex query errors.
    // Filtering and sorting will be done in-memory on the server.
    const ridesSnapshot = await db.collection('rides').orderBy('departureTime', 'asc').limit(100).get();

    let rides = ridesSnapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamps to serializable strings safely
        const departureTime = data.departureTime ? data.departureTime.toDate().toISOString() : null;
        // Safely handle optional createdAt
        const createdAt = data.createdAt ? data.createdAt.toDate().toISOString() : null;
        return { id: doc.id, ...data, departureTime, createdAt };
    });

    // 2. In-memory filtering
    if (origin) {
        rides = rides.filter(ride => ride.origin && ride.origin.toLowerCase().includes(origin.toLowerCase()));
    }
    if (destination) {
        rides = rides.filter(ride => ride.destination && ride.destination.toLowerCase().includes(destination.toLowerCase()));
    }

    // 3. In-memory sorting
    switch (sort) {
        case 'price-asc':
            rides.sort((a, b) => a.cost - b.cost);
            break;
        case 'price-desc':
            rides.sort((a, b) => b.cost - a.cost);
            break;
        case 'departure-asc':
        default:
            // Already sorted by departure time from the initial query.
            break;
    }

    return NextResponse.json({ rides });
  } catch (error: any) {
    console.error('Error fetching rides:', error);
    // Ensure a generic error response to avoid leaking implementation details.
    return NextResponse.json({ message: 'An error occurred while searching for rides.' }, { status: 500 });
  }
}
