// src/app/admin/bookings-management/page.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal, Mail, Phone, MessageSquare, Loader2 } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { usePavoData } from '@/context/data-context';
import type { ServiceBooking } from '@/lib/types';
import { format } from 'date-fns';

export default function BookingsManagementAdminPage() {
  const { serviceBookings, markServiceBookingAsRead, loading } = usePavoData();
  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null);

  const handleViewDetails = (booking: ServiceBooking) => {
    markServiceBookingAsRead(booking.id);
    setSelectedBooking(booking);
  };
  
  const renderBookingsTable = (bookingList: ServiceBooking[]) => (
     <CardContent>
          {loading ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
             </div>
          ) : bookingList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="hidden md:table-cell">Request Date</TableHead>
                  <TableHead>Status</TableHead>
                   <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingList.map((booking) => (
                  <TableRow key={booking.id} className={!booking.is_read ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <div className="font-medium">{booking.customer_name}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {booking.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{booking.site_name}</Badge>
                      <div className="text-sm text-muted-foreground">{booking.booking_type}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        {format(new Date(booking.created_at), 'PP')}
                    </TableCell>
                    <TableCell>
                        {!booking.is_read && <Badge>New</Badge>}
                    </TableCell>
                     <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                                onClick={() => !booking.is_read && markServiceBookingAsRead(booking.id)}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(booking)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.location.href = `mailto:${booking.email}`}>
                                <Mail className="mr-2 h-4 w-4"/> Email
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => window.location.href = `tel:${booking.phone}`}>
                                <Phone className="mr-2 h-4 w-4"/> Call
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="text-center py-16">
                <p className="text-muted-foreground">No bookings in this category.</p>
             </div>
          )}
        </CardContent>
  );

  const allBookings = serviceBookings;
  const newBookings = serviceBookings.filter(b => !b.is_read);
  const homeBookings = serviceBookings.filter(b => b.booking_type === 'Home');
  const restaurantBookings = serviceBookings.filter(b => b.booking_type === 'Restaurant');
  const catererBookings = serviceBookings.filter(b => b.booking_type === 'Caterer');

  return (
    <div>
      <h1 className="font-headline text-3xl font-bold">Service Bookings</h1>
      <Tabs defaultValue="all" className="mt-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="all">All ({allBookings.length})</TabsTrigger>
          <TabsTrigger value="new">New ({newBookings.length})</TabsTrigger>
          <TabsTrigger value="homes">Homes ({homeBookings.length})</TabsTrigger>
          <TabsTrigger value="restaurants">Restaurants ({restaurantBookings.length})</TabsTrigger>
          <TabsTrigger value="caterers">Catering ({catererBookings.length})</TabsTrigger>
        </TabsList>
        <Card className="mt-4">
          <TabsContent value="all">{renderBookingsTable(allBookings)}</TabsContent>
          <TabsContent value="new">{renderBookingsTable(newBookings)}</TabsContent>
          <TabsContent value="homes">{renderBookingsTable(homeBookings)}</TabsContent>
          <TabsContent value="restaurants">{renderBookingsTable(restaurantBookings)}</TabsContent>
          <TabsContent value="caterers">{renderBookingsTable(catererBookings)}</TabsContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>{serviceBookings.length}</strong> bookings.
            </div>
          </CardFooter>
        </Card>
      </Tabs>

      {selectedBooking && (
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">{selectedBooking.booking_type} Booking: {selectedBooking.site_name}</DialogTitle>
            <DialogDescription>
              From: {selectedBooking.customer_name} ({selectedBooking.email})
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-4 max-h-[70vh] overflow-y-auto pr-4">
             <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="font-semibold text-muted-foreground">Full Name:</div>
                <div>{selectedBooking.customer_name}</div>

                <div className="font-semibold text-muted-foreground">Email:</div>
                <div>{selectedBooking.email}</div>
                
                <div className="font-semibold text-muted-foreground">Phone:</div>
                <div>{selectedBooking.phone}</div>
             </div>
             <hr/>
              <div>
                <h4 className="font-semibold mb-2">Booking Details</h4>
                <div className="text-sm text-muted-foreground bg-secondary p-3 rounded-md space-y-2">
                  {Object.entries(selectedBooking.details).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2 gap-2">
                        <strong className="font-medium text-foreground">{key}:</strong>
                        <span>{String(value) || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        </DialogContent>
      </Dialog>
    )}
    </div>
  )
}
