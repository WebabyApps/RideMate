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
      return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
    }

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(id).get();

    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const userData = userDoc.data();
    
    // We can select which fields to return to avoid exposing sensitive data
    const publicProfile = {
        id: userDoc.id,
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        avatarUrl: userData?.avatarUrl,
        rating: userData?.rating,
    };


    return NextResponse.json({ user: publicProfile });
  } catch (error: any) {
    console.error(`Error fetching user ${params.id}:`, error);
    return NextResponse.json({ message: error.message || 'An internal error occurred.' }, { status: 500 });
  }
}
