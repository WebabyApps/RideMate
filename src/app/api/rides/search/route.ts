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
    const db = getAdminDb();

    let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('rides');
    
    // Firestore Admin SDK queries are more flexible.
    // We can chain multiple orderBy clauses if needed, but the first orderBy
    // must match the first range inequality filter if one exists.
    
    if (origin) {
        q = q.where('origin', '>=', origin).where('origin', '<=', origin + '\uf8ff');
    }
     if (destination) {
        // Note: Firestore is limited to one range filter per query.
        // A more complex search would need a different approach (e.g., Algolia).
        // For now, we filter destination on the server after the initial query.
    }


    switch (sort) {
        case 'price-asc':
            q = q.orderBy('origin').orderBy('cost', 'asc');
            break;
        case 'price-desc':
            q = q.orderBy('origin').orderBy('cost', 'desc');
            break;
        case 'departure-asc':
        default:
            // If origin is part of the query, it must be the first orderBy
            if (origin) {
                q = q.orderBy('origin').orderBy('departureTime', 'asc');
            } else {
                q = q.orderBy('departureTime', 'asc');
            }
            break;
    }

    const snap = await q.limit(50).get();

    let rides = snap.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamps to serializable strings
        const departureTime = data.departureTime ? data.departureTime.toDate().toISOString() : null;
        return { id: doc.id, ...data, departureTime };
    });

    if (destination) {
        rides = rides.filter(ride => ride.destination.toLowerCase().includes(destination.toLowerCase()));
    }


    return NextResponse.json({ rides });
  } catch (error: any) {
    console.error('Error fetching rides:', error);
    return NextResponse.json({ message: error.message || 'An internal error occurred.' }, { status: 500 });
  }
}
