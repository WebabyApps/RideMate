
'use server';

import { getDb } from '@/lib/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { UserProfile } from '@/lib/types';
import { z } from 'zod';

const BookRideInputSchema = z.object({
    rideId: z.string(),
    userId: z.string(),
});

type BookRideInput = z.infer<typeof BookRideInputSchema>;

/**
 * A server-side action to handle the booking of a ride.
 * This runs with admin privileges and is responsible for atomically
 * creating a booking document and updating the ride's seat count.
 */
export async function bookRideAction(input: BookRideInput): Promise<{ success: boolean }> {
  const validatedInput = BookRideInputSchema.safeParse(input);
  if (!validatedInput.success) {
    throw new Error('Invalid input for booking a ride.');
  }
  
  const { rideId, userId } = validatedInput.data;
  const db = getDb();

  const rideRef = db.doc(`rides/${rideId}`);
  const userRef = db.doc(`users/${userId}`);
  // This collection reference will be used to create a new doc inside the transaction
  const bookingsColRef = db.collection(`rides/${rideId}/bookings`); 

  try {
    await db.runTransaction(async (transaction) => {
      const rideDoc = await transaction.get(rideRef);
      const userDoc = await transaction.get(userRef);

      if (!rideDoc.exists) {
        throw new Error('Ride not found or does not exist.');
      }

      if (!userDoc.exists) {
        throw new Error('Could not find user profile to complete booking.');
      }

      const rideData = rideDoc.data();
      const userProfile = userDoc.data() as UserProfile;

      if (!rideData || rideData.availableSeats <= 0) {
        throw new Error('No available seats on this ride.');
      }
      
      // Check if user has already booked this ride
      const existingBookingQuery = bookingsColRef.where('userId', '==', userId).limit(1);
      const existingBookingSnapshot = await transaction.get(existingBookingQuery);
      if (!existingBookingSnapshot.empty) {
        throw new Error('You have already booked a seat on this ride.');
      }

      // Generate a new document reference *within* the transaction for the new booking
      const newBookingRef = bookingsColRef.doc();

      // Perform the writes
      transaction.set(newBookingRef, {
        rideId: rideId,
        userId: userId,
        passengerInfo: {
          id: userId,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          avatarUrl: userProfile.avatarUrl,
        },
        createdAt: FieldValue.serverTimestamp(),
      });

      transaction.update(rideRef, {
        availableSeats: FieldValue.increment(-1),
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error('Transaction failed: ', error);
    // Re-throw the error to be caught by the API route and sent to the client
    throw new Error(error.message || 'Failed to book ride due to a server error.');
  }
}
