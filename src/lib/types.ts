export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  rating: number;
  memberSince: Date;
};

export type Ride = {
  id: string;
  offererId: string;
  origin: string;
  destination: string;
  departureTime: Date;
  availableSeats: number;
  totalSeats: number;
  price: number;
  passengers: User[];
};
