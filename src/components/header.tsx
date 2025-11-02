'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Menu, Car, User as UserIcon, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth, useUser } from '@/firebase';
import { ModeToggle } from './mode-toggle';

const navLinks = [
  { href: '/rides', label: 'Find a Ride' },
  { href: '/offer-ride', label: 'Offer a Ride' },
  { href: '/optimize-route', label: 'Optimize Route' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleLogout = async () => {
    await auth.signOut();
    setSheetOpen(false);
  };

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
          <ModeToggle />
          {isUserLoading ? (
            <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/profile">
                  <UserIcon className="mr-2 h-4 w-4" /> Profile
                </Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Log Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          <ModeToggle />
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs">
              <SheetHeader>
                <SheetTitle className="sr-only">Menu</SheetTitle>
              </SheetHeader>
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
                 {isUserLoading ? null : user ? (
                    <>
                      <Button variant="ghost" asChild>
                        <Link href="/profile" onClick={() => setSheetOpen(false)}>
                           <UserIcon className="mr-2 h-4 w-4" /> Profile
                        </Link>
                      </Button>
                      <Button variant="outline" onClick={handleLogout}>
                         <LogOut className="mr-2 h-4 w-4" /> Log Out
                      </Button>
                    </>
                  ) : (
                    <>
                       <Button variant="ghost" asChild>
                        <Link href="/login" onClick={() => setSheetOpen(false)}>Log In</Link>
                      </Button>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                        <Link href="/signup" onClick={() => setSheetOpen(false)}>Sign Up</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
