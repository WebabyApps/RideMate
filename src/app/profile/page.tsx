'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, getDocs, writeBatch } from 'firebase/firestore';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/star-rating";
import { Calendar, Mail, Edit } from "lucide-react";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { UserProfile, Booking } from "@/lib/types";
import { OfferedRidesList } from "@/components/profile/offered-rides-list";
import { BookedRidesList } from "@/components/profile/booked-rides-list";

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
  
    batch.set(userDocRef, { avatarUrl: data.avatarUrl }, { merge: true });
  
    const offeredRidesQuery = query(collection(firestore, "rides"), where("offererId", "==", user.uid));
    const offeredRidesSnapshot = await getDocs(offeredRidesQuery);
    offeredRidesSnapshot.forEach(rideDoc => {
      batch.update(rideDoc.ref, { offererAvatarUrl: data.avatarUrl });
    });
  
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
                    <OfferedRidesList />
                </TabsContent>
                <TabsContent value="booked" className="mt-4">
                    <BookedRidesList />
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}