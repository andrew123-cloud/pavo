// src/app/admin/orders/page.tsx
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
  PlusCircle,
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
import type { Order } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const getStatusBadge = (statusCode: number) => {
  switch (statusCode) {
    case 1:
      return <Badge variant="default" className="bg-green-600 text-white">Completed</Badge>;
    case 2:
      return <Badge variant="destructive">Failed</Badge>;
    case 3:
      return <Badge variant="secondary">Reversed</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
};

export default function OrdersAdminPage() {
  const { orders } = usePavoData();

  const renderOrdersTable = (orderList: Order[]) => (
     <CardContent>
          {orderList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                   <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderList.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {order.payment_method}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status_code)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.amount.toLocaleString()} {order.currency}
                    </TableCell>
                     <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View Order Details</DropdownMenuItem>
                            <DropdownMenuItem>Contact Customer</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="text-center py-16">
                <p className="text-muted-foreground">No orders in this category.</p>
             </div>
          )}
        </CardContent>
  );


  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
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
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            A list of all the sales from your online store.
          </CardDescription>
        </CardHeader>
          <TabsContent value="all">
            {renderOrdersTable(orders)}
          </TabsContent>
          <TabsContent value="completed">
            {renderOrdersTable(orders.filter(o => o.status_code === 1))}
          </TabsContent>
           <TabsContent value="failed">
            {renderOrdersTable(orders.filter(o => o.status_code === 2))}
          </TabsContent>
          <TabsContent value="pending">
            {renderOrdersTable(orders.filter(o => o.status_code !== 1 && o.status_code !== 2))}
          </TabsContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{orders.length}</strong> of <strong>{orders.length}</strong> orders
          </div>
        </CardFooter>
       </Card>
    </Tabs>
  );
}
