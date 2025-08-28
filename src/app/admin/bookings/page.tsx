
// src/app/admin/bookings/page.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  File,
  ListFilter,
  MoreHorizontal,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { usePavoData } from '@/context/data-context';
import type { Booking } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';


export default function BookingsAdminPage() {
  const { bookings, markBookingAsRead } = usePavoData();

  const handleMarkAsRead = (id: string) => {
    markBookingAsRead(id);
  };

  const renderBookingsTable = (bookingList: Booking[]) => (
     <CardContent>
          {bookingList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Request Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Service</TableHead>
                  <TableHead>Status</TableHead>
                   <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingList.map((booking) => (
                  <TableRow key={booking.id} className={!booking.isRead ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <div className="font-medium">{booking.fullName}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {booking.email}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        {format(new Date(booking.createdAt), 'PP')}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline">{booking.servicesRequired}</Badge>
                    </TableCell>
                    <TableCell>
                        {!booking.isRead && <Badge>New</Badge>}
                    </TableCell>
                     <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleMarkAsRead(booking.id)}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => alert(`Details for ${booking.fullName}: \n${booking.style}`)}>View Details</DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => window.location.href = `mailto:${booking.email}`}>
                                <Mail className="mr-2 h-4 w-4"/> Email
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => window.location.href = `tel:${booking.phone}`}>
                                <Phone className="mr-2 h-4 w-4"/> Call
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.location.href = `sms:${booking.phone}`}>
                                <MessageSquare className="mr-2 h-4 w-4"/> SMS
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


  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filter
                </span>
              </Button>
            </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>
                  Last 30 Days
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Last 90 Days</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-7 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
        </div>
      </div>
       <Card className="mt-4">
        <CardHeader>
          <CardTitle>Booking Requests</CardTitle>
          <CardDescription>
            A list of all client requests for Interior Design services.
          </CardDescription>
        </CardHeader>
          <TabsContent value="all">
            {renderBookingsTable(bookings)}
          </TabsContent>
          <TabsContent value="new">
            {renderBookingsTable(bookings.filter(b => !b.isRead))}
          </TabsContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{bookings.length}</strong> of <strong>{bookings.length}</strong> bookings
          </div>
        </CardFooter>
       </Card>
    </Tabs>
  );
}
