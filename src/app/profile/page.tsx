'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc } from 'firebase/firestore';
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
import { Calendar, Mail, Edit, Trash2 } from "lucide-react";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Skeleton } from "@/components/ui/skeleton";
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

const profileSchema = z.object({
  avatarUrl: z.string().url("Please enter a valid URL.").min(1, "URL is required."),
});

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
    // Redirect if auth is done and there's no user
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user, isUserLoading]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const userRidesQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user) return null;
    return query(collection(firestore, 'rides'), where('offererId', '==', user.uid));
  }, [firestore, user, isUserLoading]);

  const { data: userRides, isLoading: areRidesLoading } = useCollection(userRidesQuery);

  useEffect(() => {
    if (userProfile) {
      form.setValue('avatarUrl', userProfile.avatarUrl || '');
    }
  }, [userProfile, form]);

  const handleCancelRide = (rideId: string) => {
    if (!firestore) return;
    const rideDocRef = doc(firestore, 'rides', rideId);
    deleteDocumentNonBlocking(rideDocRef);
    toast({
      title: "Ride Cancelled",
      description: "You have successfully cancelled the ride.",
    });
  };

  function onProfileSubmit(data: z.infer<typeof profileSchema>) {
    if (!userDocRef) return;
    setDocumentNonBlocking(userDocRef, { avatarUrl: data.avatarUrl }, { merge: true });
    toast({
      title: "Profile Updated",
      description: "Your profile picture has been updated.",
    });
    setProfileDialogOpen(false);
  }

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading || !userProfile) {
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Your Rides</CardTitle>
                            <CardDescription>Rides you are currently offering.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
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
                  <AvatarImage src={userProfile?.avatarUrl} alt={`${userProfile?.firstName} ${userProfile?.lastName}`} />
                  <AvatarFallback>{userProfile?.firstName?.charAt(0)}</AvatarFallback>
                </Avatar>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div>
                  <CardTitle className="font-headline text-3xl">{`${userProfile?.firstName} ${userProfile?.lastName}`}</CardTitle>
                  <StarRating rating={userProfile?.rating || 0} className="justify-center mt-2" starClassName="w-5 h-5" />
              </div>
              <Separator />
              <div className="text-left space-y-2 text-muted-foreground">
                  <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4" />
                      <span>Member since {user?.metadata.creationTime ? format(new Date(user.metadata.creationTime), 'MMMM yyyy') : ''}</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4" />
                      <span>{userProfile?.email}</span>
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
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Your Rides</CardTitle>
              <CardDescription>Rides you are currently offering.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {areRidesLoading ? (
                 <Skeleton className="h-24 w-full" />
              ) : userRides && userRides.length > 0 ? (
                <div className="space-y-4">
                  {userRides.map(ride => (
                    <Card key={ride.id} className="p-4 flex justify-between items-center">
                        <div>
                            <p className="font-bold">{ride.origin} to {ride.destination}</p>
                            <p className="text-sm text-muted-foreground">{format(ride.departureTime.toDate(), 'PPpp')}</p>
                            <p className="text-sm">${ride.cost} per seat - {ride.availableSeats} seats left</p>
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
                    </Card>
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
