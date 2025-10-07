'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Menu, Car } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navLinks = [
  { href: '/rides', label: 'Find a Ride' },
  { href: '/offer-ride', label: 'Offer a Ride' },
  { href: '/optimize-route', label: 'Optimize Route' },
];

export function Header() {
  const pathname = usePathname();
  const [isSheetOpen, setSheetOpen] = useState(false);

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link href={href} passHref>
      <Button
        variant="ghost"
        onClick={() => setSheetOpen(false)}
        className={cn(
          'text-base font-medium transition-colors hover:text-primary',
          pathname === href ? 'text-primary' : 'text-foreground/60'
        )}
      >
        {label}
      </Button>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" passHref className="flex items-center gap-2">
          <Logo />
        </Link>
        
        <nav className="hidden md:flex items-center gap-4">
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>

        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs">
              <div className="flex flex-col h-full">
                <div className="border-b pb-4">
                    <Link href="/" onClick={() => setSheetOpen(false)} className="flex items-center gap-2">
                        <Logo />
                    </Link>
                </div>
                <nav className="flex flex-col gap-4 py-6">
                  {navLinks.map((link) => (
                    <NavLink key={link.href} {...link} />
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-2 border-t pt-6">
                  <Button variant="ghost" asChild>
                    <Link href="/login" onClick={() => setSheetOpen(false)}>Log In</Link>
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                    <Link href="/signup" onClick={() => setSheetOpen(false)}>Sign Up</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
