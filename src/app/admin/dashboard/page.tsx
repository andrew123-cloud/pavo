// src/app/admin/dashboard/page.tsx
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DollarSign,
  Eye,
  Home,
  ShoppingCart,
  UserPlus,
  ArrowUp,
  CreditCard,
  Users,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePavoData } from '@/context/data-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

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


export default function Dashboard() {
  const { orders } = usePavoData();
  const recentOrders = orders.slice(0, 5);
  
  const totalRevenue = orders.reduce((sum, order) => order.status_code === 1 ? sum + order.amount : sum, 0);
  const totalSales = orders.filter(order => order.status_code === 1).length;


  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} TZS</div>
            <p className="text-xs text-muted-foreground">
              From all completed sales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Total successful transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Homes Bookings</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+23</div>
            <p className="text-xs text-muted-foreground">
              +18.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +201 since last month
            </p>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              Your most recent sales from Pavo Decors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentOrders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell>
                            <div className="font-medium">{order.customer_name}</div>
                            <div className="text-sm text-muted-foreground">
                                {order.payment_method}
                            </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status_code)}</TableCell>
                            <TableCell className="text-right">{order.amount.toLocaleString()} TZS</TableCell>
                            <TableCell>
                            {new Date(order.created_at).toLocaleDateString()}
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">No sales have been recorded yet.</p>
                </div>
            )}
          </CardContent>
          <CardFooter>
            <div className="w-full text-right">
              <Button asChild>
                <Link href="/admin/orders">
                  View All Orders <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
