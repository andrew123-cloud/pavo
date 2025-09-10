
// src/app/admin/bookings-management/page.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookingsManagementAdminPage() {

  return (
    <div>
        <div className="flex items-center">
            <h1 className="font-headline text-3xl font-bold">Service Bookings</h1>
        </div>
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Bookings</CardTitle>
                <CardDescription>Manage your home, restaurant, and catering bookings. This feature is under construction.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center items-center h-64">
                    <p className="text-muted-foreground">Booking management interface will be here.</p>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
