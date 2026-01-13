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

export const bookRideFlow = ai.defineFlow(
  {
    name: 'bookRideFlow',
    inputSchema: BookRideInputSchema,
    outputSchema: z.object({success: z.boolean()}),
  },
  async (input: BookRideInput) => {
    const db = await getDb();
    const {rideId, userId} = input;

    const rideRef = db.doc(`rides/${rideId}`);
    const bookingRef = db.collection(`rides/${rideId}/bookings`).doc(userId); // Use user ID for booking ID to prevent duplicates
    const userRef = db.doc(`users/${userId}`);

    try {
      await db.runTransaction(async transaction => {
        const rideDoc = await transaction.get(rideRef);
        const userDoc = await transaction.get(userRef);

        if (!rideDoc.exists) {
          throw new Error('Ride not found or does not exist.');
        }

        if (!userDoc.exists) {
            throw new Error('Could not find user profile to complete booking.');
        }

        const userProfile = userDoc.data() as UserProfile;
        const rideData = rideDoc.data();

        if (!rideData || rideData.availableSeats <= 0) {
          throw new Error('No available seats on this ride.');
        }

        // Check if user has already booked this ride
        const existingBookingDoc = await transaction.get(bookingRef);
        if (existingBookingDoc.exists) {
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
          createdAt: FieldValue.serverTimestamp(),
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


export async function bookRide(input: BookRideInput): Promise<{success: boolean}> {
    return bookRideFlow(input);
}
