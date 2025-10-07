import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Car, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from '@/lib/placeholder-images';

const heroImage = PlaceHolderImages.find(p => p.id === 'hero-1');

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center text-center text-white">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 p-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight mb-4">
            Share the Journey, Split the Cost
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            RideMate is the easiest way to find and offer carpools. Save money, reduce traffic, and make new friends.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg">
              <Link href="/rides">
                Find a Ride <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="font-bold text-lg">
              <Link href="/offer-ride">
                Offer a Ride
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="w-full py-12 md:py-20 bg-card">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">Why Choose RideMate?</h2>
            <p className="text-muted-foreground mt-2 text-lg">Everything you need for a smooth and safe carpool experience.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center bg-background border-none shadow-lg">
              <CardHeader>
                <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit">
                  <Car className="w-8 h-8" />
                </div>
                <CardTitle className="font-headline mt-4">Easy Ride Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Quickly find rides that match your destination and schedule, or offer your empty seats to others.</p>
              </CardContent>
            </Card>
            <Card className="text-center bg-background border-none shadow-lg">
              <CardHeader>
                <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit">
                  <Users className="w-8 h-8" />
                </div>
                <CardTitle className="font-headline mt-4">Community Driven</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Join a community of verified users. Read reviews and ratings to travel with people you can trust.</p>
              </CardContent>
            </Card>
            <Card className="text-center bg-background border-none shadow-lg">
              <CardHeader>
                <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <CardTitle className="font-headline mt-4">Safe & Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Your safety is our priority. We offer in-app messaging and profile verification to ensure a secure journey.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-headline font-bold">Ready to Get Started?</h2>
          <p className="text-muted-foreground mt-2 mb-8 text-lg">Join thousands of users who are saving time and money on their commute.</p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg">
            <Link href="/signup">
              Sign Up for Free <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
