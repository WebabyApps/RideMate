import Image from "next/image";
import { users, rides } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/star-rating";
import { Calendar, Mail, Edit } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { RideCard } from "@/components/ride-card";

export default function ProfilePage() {
  const user = users[0]; // Mock user data
  const userRides = rides.filter(ride => ride.driver.id === user.id);

  return (
    <div className="container mx-auto max-w-5xl px-4 md:px-6 py-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="text-center sticky top-24">
            <CardHeader>
                <Avatar className="w-32 h-32 mx-auto border-4 border-primary shadow-lg">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                  <CardTitle className="font-headline text-3xl">{user.name}</CardTitle>
                  <StarRating rating={user.rating} className="justify-center mt-2" starClassName="w-5 h-5" />
              </div>
              <Separator />
              <div className="text-left space-y-2 text-muted-foreground">
                  <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4" />
                      <span>Member since {format(user.memberSince, 'MMMM yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4" />
                      <span>{user.name.toLowerCase()}@example.com</span>
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
              {userRides.length > 0 ? (
                <div className="space-y-4">
                  {userRides.map(ride => (
                    <RideCard key={ride.id} ride={ride} />
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
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Reviews</CardTitle>
              <CardDescription>What others are saying about you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-4">
                    <Avatar>
                        <AvatarImage src={users[1].avatarUrl} alt={users[1].name} />
                        <AvatarFallback>{users[1].name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                           <p className="font-semibold">{users[1].name}</p>
                           <StarRating rating={5} />
                        </div>
                        <p className="text-sm text-muted-foreground">"Sarah was an amazing driver! Very friendly and the ride was super comfortable. Highly recommend!"</p>
                    </div>
                </div>
                 <Separator />
                 <div className="flex gap-4">
                    <Avatar>
                        <AvatarImage src={users[4].avatarUrl} alt={users[4].name} />
                        <AvatarFallback>{users[4].name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                           <p className="font-semibold">{users[4].name}</p>
                           <StarRating rating={4.8} />
                        </div>
                        <p className="text-sm text-muted-foreground">"Great trip, on time and very professional. Would ride again."</p>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
