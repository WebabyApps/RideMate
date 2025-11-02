/**
 * @fileOverview A server-side flow to handle the booking of a ride.
 * This flow runs with admin privileges and is responsible for atomically
 * creating a booking document and updating the ride's seat count.
 */

import {ai} from '@/ai/getAI';
import {
  BookRideInputSchema,
  type BookRideInput,
  type UserProfile,
} from '@/lib/types';
import {getDb} from '@/lib/admin';
import {z} from 'genkit';
import {FieldValue} from 'firebase-admin/firestore';

export const bookRide = ai.defineFlow(
  {
    name: 'bookRideFlow',
    inputSchema: BookRideInputSchema,
    outputSchema: z.object({success: z.boolean()}),
  },
  async (input: BookRideInput) => {
    const db = await getDb();
    const {rideId, userId, userProfile} = input;

    const rideRef = db.doc(`rides/${rideId}`);
    const bookingRef = db.collection(`rides/${rideId}/bookings`).doc(); // Auto-generate ID

    try {
      await db.runTransaction(async transaction => {
        const rideDoc = await transaction.get(rideRef);
        if (!rideDoc.exists) {
          throw new Error('Ride not found or does not exist.');
        }

        const rideData = rideDoc.data();
        if (rideData?.availableSeats <= 0) {
          throw new Error('No available seats on this ride.');
        }

        // Check if user has already booked this ride by querying the bookings subcollection
        const existingBookingsQuery = db
          .collectionGroup('bookings')
          .where('rideId', '==', rideId)
          .where('userId', '==', userId)
          .limit(1);
          
        const existingBookingsSnapshot = await transaction.get(existingBookingsQuery);
        if (!existingBookingsSnapshot.empty) {
            throw new Error('You have already booked a seat on this ride.');
        }

        // Perform the writes
        transaction.set(bookingRef, {
          rideId: rideId,
          userId: userId,
          passengerInfo: {
            id: userId,
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            avatarUrl: userProfile.avatarUrl,
          },
        });

        transaction.update(rideRef, {
          availableSeats: FieldValue.increment(-1),
        });
      });

      return {success: true};
    } catch (error: any) {
      console.error('Transaction failed: ', error);
      // Re-throw the error to be caught by the API route
      throw new Error(error.message || 'Failed to book ride.');
    }
  }
);
