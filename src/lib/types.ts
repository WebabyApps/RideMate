import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  rating: number;
};

export type Passenger = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

export type Ride = {
  id: string;
  offererId: string;
  offererName: string;
  offererAvatarUrl: string;
  offererRating: number;
  origin: string;
  destination: string;
  departureTime: Timestamp;
  availableSeats: number;
  totalSeats: number;
  cost: number;
  petsAllowed: boolean;
  largeBagsAllowed: boolean;
  createdAt: Timestamp;
};

export type Booking = {
    id: string;
    rideId: string;
    userId: string;
    passengerInfo: Passenger;
};

export type Message = {
  id: string;
  rideId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: Timestamp;
};


// --- AI Flow Schemas ---
export const OptimizeCarpoolRouteInputSchema = z.object({
  currentRoute: z
    .string()
    .describe(
      'A general text description of the carpool plan or goal (e.g., "morning commute to work").'
    ),
  trafficConditions: z
    .string()
    .describe(
      'Real-time traffic conditions along the general route area (e.g., "heavy congestion on the main highway").'
    ),
  waypoints: z
    .array(z.string())
    .describe(
      'An ordered list of waypoints. Each waypoint is a string containing latitude,longitude coordinates (e.g., ["37.7749,-122.4194", "37.3861,-122.0839"]). The first waypoint is the origin, the last is the final destination.'
    ),
  arrivalTimePreferences: z
    .string()
    .describe(
      'Text description of preferred arrival times for each participant (e.g., "Alice needs to be at work by 8:45 AM, Bob is flexible but prefers before 9:15 AM").'
    ),
});

export const OptimizeCarpoolRouteOutputSchema = z.object({
  optimizedRoute: z
    .string()
    .describe(
      'The optimized carpool route, describing the sequence of pickups and drop-offs. Refer to waypoints by their order (e.g., "Start at Waypoint 1, pick up passenger at Waypoint 2, then proceed to destination at Waypoint 3.").'
    ),
  estimatedTravelTime: z
    .string()
    .describe(
      'The estimated total travel time for the optimized route in minutes or hours.'
    ),
  suggestedDepartureTime: z
    .string()
    .describe(
      'The single suggested departure time from the origin (Waypoint 1) to meet all arrival preferences, formatted as HH:MM AM/PM.'
    ),
  costEstimate: z
    .string()
    .describe(
      'The estimated cost, considering fuel and tolls. Provide a monetary value (e.g., "$15.50").'
    ),
});

export const UserProfileSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().url(),
  rating: z.number(),
});

export const BookRideInputSchema = z.object({
  rideId: z.string(),
  userId: z.string(),
  userProfile: UserProfileSchema,
});

export type BookRideInput = z.infer<typeof BookRideInputSchema>;


export type OptimizeCarpoolRouteInput = z.infer<
  typeof OptimizeCarpoolRouteInputSchema
>;
export type OptimizeCarpoolRouteOutput = z.infer<
  typeof OptimizeCarpoolRouteOutputSchema
>;
