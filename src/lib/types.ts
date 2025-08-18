export interface PortfolioItem {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  aiHint: string;
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
  imageUrl: string;
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

export interface PavoData {
  portfolioItems: PortfolioItem[];
  decorProducts: Product[];
  rentalProperties: Property[];
}
