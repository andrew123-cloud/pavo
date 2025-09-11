export interface CartItem {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUrl: string; 
  aiHint: string;
  stock: number;
  quantity: number;
}


export interface PortfolioItem {
  id: number;
  title: string;
  location: string;
  imageUrl: string;
  aiHint: string;
  beforeImageUrl?: string;
  description: string;
}

export interface Testimonial {
  id: string;
  name: string;
  projectType: string;
  quote: string;
  avatarUrl: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url: string;
  aiHint: string;
  stock: number;
}

export interface OrderItem { 
  id: number;
  name: string; 
  quantity: number; 
  price: number;
}

export interface Order {
    id: string; // Our internal order ID
    pesapal_order_tracking_id: string;
    status_code: number;
    payment_method: string;
    payment_account: string;
    merchant_reference: string;
    confirmation_code: string;
    amount: number;
    currency: string;
    created_at: string;
    customer_name: string;
    items: OrderItem[];
}

export interface Booking {
  id: number;
  createdAt: string;
  isRead: boolean;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  propertyType: string;
  spaceToBeDesigned: string;
  size: string;
  status: string;
  style: string;
  budget: string;
  servicesRequired: string;
  preferredDate: string; // Storing as formatted string
  completionDate?: string; // Storing as formatted string
}

export interface BookingSite {
  id: number;
  name: string;
  type: 'home' | 'restaurant' | 'caterer';
  description: string;
  imageUrl: string;
  location?: string;
  priceInfo?: string;
  aiHint?: string;
  created_at?: string;
}


export interface SiteSettings {
  id: number; // 'default'
  brandDescriptions: {
    interiors: string;
    decors: string;
    homes: string;
  };
  founder: {
    mainDescription: string;
    philosophy: string;
    imageUrls: string[];
  };
  heroImages: {
    suite: string[];
    interiors: string[];
    decors: string[];
    homes: string[];
  };
}


export interface PavoData {
  portfolioItems: PortfolioItem[];
  decorProducts: Product[];
  bookingSites: BookingSite[];
  orders: Order[];
  bookings: Booking[];
  siteSettings: SiteSettings;
  testimonials: Testimonial[];
}
