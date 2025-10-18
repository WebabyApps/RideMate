'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useUser, useFirestore, deleteDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, useCollection } from "@/firebase";
import { collection, query, where, doc, arrayRemove, increment, getDocs, orderBy, writeBatch, deleteDoc } from 'firebase/firestore';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/star-rating";
import { Calendar, Mail, Edit, Trash2, Users } from "lucide-react";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { Ride, UserProfile, Passenger, Booking } from "@/lib/types";
import { useMemoFirebase } from "@/firebase/provider";


function PassengerList({ rideId }: { rideId: string }) {
    const firestore = useFirestore();
    const bookingsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'bookings'), where('rideId', '==', rideId));
    }, [firestore, rideId]);

    const { data: bookings, isLoading } = useCollection<Booking>(bookingsQuery);

    if (isLoading) return <Skeleton className="h-8 w-full" />;

    const passengers = bookings?.map(b => b.passengerInfo) || [];

    if (!passengers || passengers.length === 0) {
        return <p className="text-sm text-muted-foreground mt-2">No passengers yet.</p>;
    }

    return (
        <div className="flex flex-wrap gap-4 mt-2">
            {passengers.map(p => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={p.avatarUrl} alt={p.firstName} />
                        <AvatarFallback>{p.firstName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{p.firstName}</span>
                </div>
            ))}
        </div>
    );
}

function OfferedRidesList({ userId }: { userId: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [userRides, setUserRides] = useState<Ride[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchRides = useCallback(async () => {
        if (!firestore) return;
        setIsLoading(true);
        const ridesQuery = query(
          collection(firestore, 'rides'), 
          where('offererId', '==', userId)
        );
        const snapshot = await getDocs(ridesQuery);
        const rides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));
        
        rides.sort((a, b) => {
          const timeA = a.departureTime?.toDate?.().getTime() || 0;
          const timeB = b.departureTime?.toDate?.().getTime() || 0;
          return timeB - timeA;
        });

        setUserRides(rides);
        setIsLoading(false);
    }, [firestore, userId]);
    
    useEffect(() => {
        fetchRides();
    }, [fetchRides]);


    const handleCancelRide = async (rideId: string) => {
        if (!firestore) return;

        const batch = writeBatch(firestore);
        
        // 1. Delete the ride document
        const rideDocRef = doc(firestore, 'rides', rideId);
        batch.delete(rideDocRef);

        // 2. Find and delete all associated bookings
        const bookingsQuery = query(collection(firestore, 'bookings'), where('rideId', '==', rideId));
        const bookingsSnapshot = await getDocs(bookingsQuery);
        bookingsSnapshot.forEach(bookingDoc => {
            batch.delete(bookingDoc.ref);
        });

        try {
            await batch.commit();
            setUserRides(prevRides => prevRides?.filter(ride => ride.id !== rideId) || null);
            toast({
                title: "Ride Cancelled",
                description: "You have successfully cancelled the ride and all its bookings.",
            });
        } catch (error) {
            console.error("Error cancelling ride:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not cancel the ride. Please try again.",
            });
        }
    };

    if (isLoading) {
        return <Skeleton className="h-40 w-full" />;
    }

    if (!userRides || userRides.length === 0) {
        return (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">You haven't offered any rides yet.</p>
                <Button asChild variant="link" className="mt-2 text-primary">
                    <Link href="/offer-ride">Offer a ride now</Link>
                </Button>
            </div>
        );
    }
  
    return (
        <div className="space-y-4">
        {userRides.map(ride => (
            <Card key={ride.id} className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold">{ride.origin} to {ride.destination}</p>
                        <p className="text-sm text-muted-foreground">{ride.departureTime ? format(ride.departureTime.toDate(), 'PPpp') : ''}</p>
                        <p className="text-sm">${ride.cost} per seat</p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This action cannot be undone. This will permanently cancel your ride and notify any booked passengers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Back</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleCancelRide(ride.id)}>
                            Yes, Cancel Ride
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <Separator className="my-3"/>
                <div>
                    <h4 className="font-semibold text-sm flex items-center gap-2"><Users className="h-4 w-4"/>Passengers</h4>
                    <PassengerList rideId={ride.id} />
                </div>
            </Card>
        ))}
        </div>
    );
}

function BookedRidesList({ userId }: { userId: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    // Use a specific query for the user's bookings
    const userBookingsQuery = useMemoFirebase(() => {
        if (!firestore || !userId) return null;
        return query(collection(firestore, 'bookings'), where('userId', '==', userId));
    }, [firestore, userId]);
    
    const { data: userBookings, isLoading: isLoadingBookings } = useCollection<Booking>(userBookingsQuery);

    // This state will hold the merged ride and booking data
    const [bookedRides, setBookedRides] = useState<{ride: Ride, bookingId: string}[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRideDetails = useCallback(async () => {
        if (!userBookings || !firestore) return;

        setIsLoading(true);

        if (userBookings.length === 0) {
            setBookedRides([]);
            setIsLoading(false);
            return;
        }

        const ridePromises = userBookings.map(async (booking) => {
            const rideDocRef = doc(firestore, 'rides', booking.rideId);
            const rideDocSnapshot = await getDocs(query(collection(firestore, 'rides'), where('__name__', '==', rideDocRef.id)));
            if (!rideDocSnapshot.empty) {
                const rideData = { id: rideDocSnapshot.docs[0].id, ...rideDocSnapshot.docs[0].data() } as Ride;
                return { ride: rideData, bookingId: booking.id };
            }
            return null;
        });

        const rideResults = (await Promise.all(ridePromises)).filter(r => r !== null) as {ride: Ride, bookingId: string}[];
        
        setBookedRides(rideResults);
        setIsLoading(false);

    }, [userBookings, firestore]);
    
    useEffect(() => {
        fetchRideDetails();
    }, [fetchRideDetails]);


    const handleCancelBooking = (bookingId: string) => {
        if (!firestore) return;
        const bookingDocRef = doc(firestore, 'bookings', bookingId);
        deleteDocumentNonBlocking(bookingDocRef);
        // The list will automatically update because we're subscribed to userBookings
        toast({
            title: "Booking Cancelled",
            description: "You have successfully cancelled your booking.",
        });
    };
    
    if (isLoadingBookings || isLoading) {
        return <Skeleton className="h-40 w-full" />;
    }

    if (!bookedRides || bookedRides.length === 0) {
        return (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">You haven't booked any rides.</p>
                <Button asChild variant="link" className="mt-2 text-primary">
                    <Link href="/rides">Find a ride now</Link>
                </Button>
            </div>
        );
    }
  
    return (
        <div className="space-y-4">
        {bookedRides.map(({ride, bookingId}) => (
            <Card key={ride.id} className="p-4 flex justify-between items-center">
                <div>
                    <p className="font-bold">{ride.origin} to {ride.destination}</p>
                    <p className="text-sm text-muted-foreground">{ride.departureTime ? format(ride.departureTime.toDate(), 'PPpp') : ''}</p>
                    <p className="text-sm">${ride.cost} per seat</p>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <Button variant="outline">Cancel Booking</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel your booking?</AlertDialogTitle>
                        <AlertDialogDescription>
                        This will remove you from the ride and free up your seat. Are you sure?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleCancelBooking(bookingId)}>
                        Yes, Cancel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </Card>
        ))}
        </div>
    );
}


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      avatarUrl: "",
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);
  
  useEffect(() => {
    if (userProfile && user) {
      form.setValue('avatarUrl', userProfile.avatarUrl || '');
    }
  }, [userProfile, user, form]);

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!userDocRef || !firestore || !user) return;
  
    const batch = writeBatch(firestore);
  
    // 1. Update the user's profile
    batch.set(userDocRef, { avatarUrl: data.avatarUrl }, { merge: true });
  
    // 2. Find all rides where the user is the offerer and update offererAvatarUrl
    const offeredRidesQuery = query(collection(firestore, "rides"), where("offererId", "==", user.uid));
    const offeredRidesSnapshot = await getDocs(offeredRidesQuery);
    offeredRidesSnapshot.forEach(rideDoc => {
      batch.update(rideDoc.ref, { offererAvatarUrl: data.avatarUrl });
    });
  
    // 3. Find all bookings by the user and update the passengerInfo
    const userBookingsQuery = query(collection(firestore, "bookings"), where("userId", "==", user.uid));
    const userBookingsSnapshot = await getDocs(userBookingsQuery);
    userBookingsSnapshot.forEach(bookingDoc => {
        const bookingData = bookingDoc.data() as Booking;
        const updatedPassengerInfo = { ...bookingData.passengerInfo, avatarUrl: data.avatarUrl };
        batch.update(bookingDoc.ref, { passengerInfo: updatedPassengerInfo });
    });
  
    try {
      await batch.commit();
      toast({
        title: "Profile Updated",
        description: "Your profile picture has been updated across all your rides and bookings.",
      });
      setProfileDialogOpen(false);
    } catch (error) {
      console.error("Error updating profile in batch:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update your profile picture everywhere.",
      });
    }
  }

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading || !user || !userProfile) {
    return (
        <div className="container mx-auto max-w-5xl px-4 md:px-6 py-8">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                    <Card className="text-center sticky top-24">
                        <CardHeader>
                            <Skeleton className="w-32 h-32 rounded-full mx-auto" />
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                            <Skeleton className="h-8 w-48 mx-auto" />
                            <Skeleton className="h-5 w-24 mx-auto" />
                            <Separator />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-full" />
                            </div>
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2 space-y-8">
                     <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-5xl px-4 md:px-6 py-8">
      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-1 space-y-6">
          <Card className="text-center sticky top-24">
            <CardHeader>
                <Avatar className="w-32 h-32 mx-auto border-4 border-primary shadow-lg">
                  <AvatarImage src={userProfile.avatarUrl} alt={`${userProfile.firstName} ${userProfile.lastName}`} />
                  <AvatarFallback>{userProfile.firstName?.charAt(0)}</AvatarFallback>
                </Avatar>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div>
                  <CardTitle className="font-headline text-3xl">{`${userProfile.firstName} ${userProfile.lastName}`}</CardTitle>
                  <StarRating rating={userProfile.rating || 0} className="justify-center mt-2" starClassName="w-5 h-5" />
              </div>
              <Separator />
              <div className="text-left space-y-2 text-muted-foreground">
                  <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4" />
                      <span>Member since {user.metadata.creationTime ? format(new Date(user.metadata.creationTime), 'MMMM yyyy') : ''}</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4" />
                      <span>{userProfile.email}</span>
                  </div>
              </div>
                <Dialog open={isProfileDialogOpen} onOpenChange={setProfileDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Edit className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your profile picture.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="avatarUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Avatar URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com/image.png" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                          </DialogClose>
                          <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2 space-y-8">
            <Tabs defaultValue="offered">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="offered">Rides You're Offering</TabsTrigger>
                    <TabsTrigger value="booked">Rides You've Booked</TabsTrigger>
                </TabsList>
                <TabsContent value="offered" className="mt-4">
                    <OfferedRidesList userId={user.uid} />
                </TabsContent>
                <TabsContent value="booked" className="mt-4">
                    <BookedRidesList userId={user.uid} />
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}

const profileSchema = z.object({
    avatarUrl: z.string().url("Please enter a valid URL.").min(1, "URL is required."),
  });
