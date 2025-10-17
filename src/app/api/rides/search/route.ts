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
    
    // Firestore Admin SDK queries are more flexible.
    // We can chain multiple orderBy clauses if needed, but the first orderBy
    // must match the first range inequality filter if one exists.
    
    if (origin) {
        q = q.where('origin', '>=', origin).where('origin', '<=', origin + '\uf8ff');
    }

    switch (sort) {
        case 'price-asc':
            // If origin is part of the query, it must be the first orderBy
            if (origin) {
                q = q.orderBy('origin').orderBy('cost', 'asc');
            } else {
                q = q.orderBy('cost', 'asc');
            }
            break;
        case 'price-desc':
            if (origin) {
                q = q.orderBy('origin').orderBy('cost', 'desc');
            } else {
                q = q.orderBy('cost', 'desc');
            }
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
        const createdAt = data.createdAt ? data.createdAt.toDate().toISOString() : null;
        return { id: doc.id, ...data, departureTime, createdAt };
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
