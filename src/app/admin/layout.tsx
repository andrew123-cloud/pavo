
// src/app/admin/layout.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Home,
  Palette,
  Sparkles,
  Settings,
  PanelLeft,
  User,
  LogOut,
  ShoppingBag,
  Bell,
  Check,
  BookMarked,
  CalendarCheck
} from 'lucide-react';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import PavoLogo from '@/components/pavo-logo';
import { useAuth } from '@/context/auth-context';
import { ProtectedRoute } from '@/components/shared/protected-route';
import { usePavoData } from '@/context/data-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { bookings, markAllBookingsAsRead } = usePavoData();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };
  
  const unreadBookings = bookings.filter(b => !b.isRead);

  return (
    <ProtectedRoute>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <PavoLogo />
            </div>
            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                <Link
                  href="/admin/dashboard"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                    pathname === '/admin/dashboard'
                      ? 'bg-muted text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                 <Link
                  href="/admin/bookings"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                    pathname.startsWith('/admin/bookings')
                      ? 'bg-muted text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <BookMarked className="h-4 w-4" />
                  Interior Requests
                </Link>
                <Link
                  href="/admin/orders"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                    pathname.startsWith('/admin/orders')
                      ? 'bg-muted text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Orders
                </Link>
                <Link
                  href="/admin/interiors"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                    pathname.startsWith('/admin/interiors')
                      ? 'bg-muted text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Palette className="h-4 w-4" />
                  Interiors
                </Link>
                <Link
                  href="/admin/decors"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                    pathname.startsWith('/admin/decors')
                      ? 'bg-muted text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Decors
                </Link>
                <Link
                  href="/admin/bookings-management"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                    pathname.startsWith('/admin/bookings-management')
                      ? 'bg-muted text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <CalendarCheck className="h-4 w-4" />
                  Bookings
                </Link>
                 <Link
                  href="/admin/settings"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                    pathname.startsWith('/admin/settings')
                      ? 'bg-muted text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </nav>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <nav className="grid gap-2 text-lg font-medium">
                  <PavoLogo />
                  <Link
                    href="/admin/dashboard"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <Home className="h-5 w-5" />
                    Dashboard
                  </Link>
                   <Link
                    href="/admin/bookings"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <BookMarked className="h-5 w-5" />
                    Interior Requests
                  </Link>
                   <Link
                    href="/admin/orders"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Orders
                  </Link>
                  <Link
                    href="/admin/interiors"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <Palette className="h-5 w-5" />
                    Interiors
                  </Link>
                  <Link
                    href="/admin/decors"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <Sparkles className="h-5 w-5" />
                    Decors
                  </Link>
                  <Link
                    href="/admin/bookings-management"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <CalendarCheck className="h-5 w-5" />
                    Bookings
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
              {/* Search can be added here if needed */}
            </div>

             <Popover onOpenChange={(open) => { if(!open) markAllBookingsAsRead() }}>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    size="icon"
                    className="relative rounded-full"
                    >
                    <Bell className="h-5 w-5" />
                    {unreadBookings.length > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0">
                            {unreadBookings.length}
                        </Badge>
                    )}
                    <span className="sr-only">Booking Notifications</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                    <div className="p-4 border-b">
                        <h4 className="font-medium text-sm">Interior Design Requests</h4>
                    </div>
                    <div className="p-2 max-h-80 overflow-y-auto">
                        {bookings.length > 0 ? (
                             bookings.slice(0,5).map(booking => (
                                <Link key={booking.id} href="/admin/bookings" className="block">
                                    <div className={`p-2 rounded-lg hover:bg-muted ${!booking.isRead && 'bg-blue-500/10'}`}>
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{booking.fullName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="text-xs">
                                                <p className="font-medium">{booking.fullName}</p>
                                                <p className="text-muted-foreground">Requested a consultation for {booking.propertyType}.</p>
                                                <p className="text-muted-foreground/80 mt-1">{formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ): (
                            <p className="text-center text-sm text-muted-foreground py-8">No new booking requests.</p>
                        )}
                    </div>
                     {bookings.length > 0 && (
                        <div className="p-2 border-t text-center">
                            <Button variant="link" size="sm" asChild>
                                <Link href="/admin/bookings">View all requests</Link>
                            </Button>
                        </div>
                     )}
                </PopoverContent>
            </Popover>


            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full"
                >
                  <User className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.name || 'My Account'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default AdminLayout;
