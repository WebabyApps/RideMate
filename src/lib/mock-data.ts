import type { User, Ride } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getUserImage = (id: string) => PlaceHolderImages.find(p => p.id === id)?.imageUrl || '';

// This mock data is now deprecated and will be replaced by Firestore data.
// It's kept here for reference but is no longer used in the main application flow.

export const users: User[] = [
  { id: 'u1', name: 'Sarah', avatarUrl: getUserImage('user-1'), rating: 4.9, memberSince: new Date('2022-01-15') },
  { id: 'u2', name: 'Mike', avatarUrl: getUserImage('user-2'), rating: 4.7, memberSince: new Date('2021-11-20') },
  { id: 'u3', name: 'Jessica', avatarUrl: getUserImage('user-3'), rating: 5.0, memberSince: new Date('2023-03-10') },
  { id: 'u4', name: 'David', avatarUrl: getUserImage('user-4'), rating: 4.6, memberSince: new Date('2022-08-05') },
  { id: 'u5', name: 'Emily', avatarUrl: getUserImage('user-5'), rating: 4.8, memberSince: new Date('2023-05-25') },
];

export const rides: Ride[] = [
  {
    id: 'r1',
    driver: users[0],
    origin: 'Downtown, San Francisco',
    destination: 'Mountain View, CA',
    departureTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
    availableSeats: 2,
    totalSeats: 3,
    price: 15,
    passengers: [users[4]],
  },
  {
    id: 'r2',
    driver: users[1],
    origin: 'Berkeley, CA',
    destination: 'San Jose, CA',
    departureTime: new Date(new Date().getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
    availableSeats: 3,
    totalSeats: 4,
    price: 20,
    passengers: [],
  },
  {
    id: 'r3',
    driver: users[2],
    origin: 'Oakland, CA',
    destination: 'Sacramento, CA',
    departureTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Tomorrow
    availableSeats: 1,
    totalSeats: 2,
    price: 30,
    passengers: [users[3]],
  },
  {
    id: 'r4',
    driver: users[3],
    origin: 'Palo Alto, CA',
    destination: 'San Francisco International Airport',
    departureTime: new Date(new Date().getTime() + 5 * 60 * 60 * 1000), // 5 hours from now
    availableSeats: 2,
    totalSeats: 3,
    price: 12,
    passengers: [],
  },
];
