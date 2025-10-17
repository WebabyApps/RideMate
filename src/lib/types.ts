import { Timestamp } from 'firebase/firestore';

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  rating: number;
};

export type Ride = {
  id: string;
  offererId: string;
  origin: string;
  destination: string;
  departureTime: Timestamp;
  availableSeats: number;
  totalSeats: number;
  cost: number;
  riderIds: string[];
  petsAllowed: boolean;
  largeBagsAllowed: boolean;
  visibility: 'public' | 'private';
};

// Add this to your package.json dependencies
// "firebase-admin": "^12.2.0"
// I will add it for you.
