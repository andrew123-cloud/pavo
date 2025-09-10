

export interface PortfolioItem {
  id: string;
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
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string; // Corrected field name
  aiHint: string;
  stock: number;
}

export interface Property {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  rating: number;
  imageUrl: string;
  aiHint: string;
}

export interface OrderItem { 
  id: string;
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
  id: string;
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


export interface SiteSettings {
  id: string; // 'default'
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
  rentalProperties: Property[];
  orders: Order[];
  bookings: Booking[];
  siteSettings: SiteSettings;
}
