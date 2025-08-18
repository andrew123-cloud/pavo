import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DollarSign, Eye, Home, ShoppingCart, UserPlus, Edit, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const recentActivities = [
    {
      id: 1,
      user: { name: 'Amina Juma', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop' },
      action: 'booked',
      target: 'Serene Beachfront Villa',
      time: '15 minutes ago',
      icon: <Home className="h-4 w-4 text-green-500" />,
    },
    {
      id: 2,
      user: { name: 'Admin', avatar: '' },
      action: 'added a new product',
      target: 'Handwoven Wall Hanging',
      time: '1 hour ago',
      icon: <ShoppingCart className="h-4 w-4 text-blue-500" />,
    },
     {
      id: 3,
      user: { name: 'Admin', avatar: '' },
      action: 'edited the portfolio item',
      target: 'Modern Oasis',
      time: '3 hours ago',
      icon: <Edit className="h-4 w-4 text-yellow-500" />,
    },
    {
      id: 4,
      user: { name: 'John Davis', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop' },
      action: 'left a testimonial',
      target: 'Living Room Consultation',
      time: '1 day ago',
      icon: <UserPlus className="h-4 w-4 text-purple-500" />,
    },
     {
      id: 5,
      user: { name: 'Admin', avatar: '' },
      action: 'deleted the property',
      target: 'Old Listing',
      time: '2 days ago',
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
    },
  ];


  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45,231,890 TZS</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
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
            <CardTitle className="text-sm font-medium">Decor Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12,234</div>
            <p className="text-xs text-muted-foreground">
              +19% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Portfolio Views
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +201 since last hour
            </p>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    {activity.user.avatar && <AvatarImage src={activity.user.avatar} alt={activity.user.name} />}
                    <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{activity.user.name}</span>{' '}
                      {activity.action}{' '}
                      <span className="font-semibold text-primary">{activity.target}</span>.
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                   {activity.icon}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
