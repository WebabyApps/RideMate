'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc } from 'firebase/firestore';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/star-rating";
import { Calendar, Mail, Edit } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { RideCard } from "@/components/ride-card";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Skeleton } from "@/components/ui/skeleton";


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const userRidesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'rides'), where('offererId', '==', user.uid));
  }, [firestore, user]);
  const { data: userRides, isLoading: areRidesLoading } = useCollection(userRidesQuery);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isProfileLoading || !userProfile) {
    return (
        <div className="container mx-auto max-w-5xl px-4 md:px-6 py-8">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                    <Card className="text-center sticky top-24">
                        <CardHeader>
                            <Skeleton className="w-32 h-32 rounded-full mx-auto" />
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Your Rides</CardTitle>
                            <CardDescription>Rides you are currently offering.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Skeleton className="h-24 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-5xl px-4 md:px-6 py-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="text-center sticky top-24">
            <CardHeader>
                <Avatar className="w-32 h-32 mx-auto border-4 border-primary shadow-lg">
                  <AvatarImage src={userProfile.avatarUrl} alt={`${userProfile.firstName} ${userProfile.lastName}`} />
                  <AvatarFallback>{userProfile.firstName?.charAt(0)}</AvatarFallback>
                </Avatar>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <Button variant="outline" className="w-full">
                <Edit className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Your Rides</CardTitle>
              <CardDescription>Rides you are currently offering.</CardDescription>
            </CardHeader>
            <CardContent>
              {areRidesLoading ? (
                 <Skeleton className="h-24 w-full" />
              ) : userRides && userRides.length > 0 ? (
                <div className="space-y-4">
                  {userRides.map(ride => (
                    // This will cause an error for now as RideCard expects a different data structure
                    // We will fix this in a later step by fetching driver data for each ride.
                    // For now, we'll pass a simplified object.
                    <div key={ride.id} className="border p-4 rounded-lg">
                      <p className="font-bold">{ride.origin} to {ride.destination}</p>
                      <p>{format(ride.departureTime.toDate(), 'PPpp')}</p>
                      <p>${ride.cost}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">You haven't offered any rides yet.</p>
                    <Button asChild variant="link" className="mt-2 text-primary">
                        <Link href="/offer-ride">Offer a ride now</Link>
                    </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
