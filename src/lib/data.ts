import type { PortfolioItem, Testimonial, Product, Property } from './types';

export const portfolioItems: PortfolioItem[] = [
  {
    id: '1',
    title: 'Modern Oasis',
    location: 'Masaki, Dar es Salaam',
    imageUrl: 'https://images.unsplash.com/photo-1615875605825-5eb9bb5c3926?q=80&w=2154&auto=format&fit=crop',
    aiHint: 'modern living room'
  },
  {
    id: '2',
    title: 'Coastal Charm',
    location: 'Nungwi, Zanzibar',
    imageUrl: 'https://images.unsplash.com/photo-1594401951338-79b8c19b3879?q=80&w=2680&auto=format&fit=crop',
    aiHint: 'coastal interior'
  },
  {
    id: '3',
    title: 'Urban Retreat',
    location: 'Oyster Bay, Dar es Salaam',
    imageUrl: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=2940&auto=format&fit=crop',
    aiHint: 'urban apartment'
  },
];

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Amina Juma',
    projectType: 'Full Home Styling',
    quote:
      'Pavo Interiors transformed our house into a home. Every detail was perfect, and the team was an absolute pleasure to work with. Highly recommended!',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=250&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'John Davis',
    projectType: 'Living Room Consultation',
    quote:
      "The virtual design service was so convenient. They understood my vision perfectly and gave me a plan that was easy to follow. I'm thrilled with the results.",
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'Fatima Al-Marzooqi',
    projectType: 'Commercial Space Design',
    quote:
      'Our new office space is both beautiful and functional, thanks to Pavo. It has completely boosted our team\'s morale and productivity.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250&auto=format&fit=crop',
  },
];

export const decorProducts: Product[] = [
  {
    id: '1',
    name: 'Terracotta Vase',
    price: 75000,
    category: 'Vases',
    imageUrl: '/photos/terracotta-vase.jpg',
    aiHint: 'terracotta vase',
    stock: 12,
  },
  {
    id: '2',
    name: 'Linen Throw Pillow',
    price: 55000,
    category: 'Pillows',
    imageUrl: '/photos/linen-pillow.jpg',
    aiHint: 'linen pillow',
    stock: 3,
  },
  {
    id: '3',
    name: 'Handwoven Wall Hanging',
    price: 120000,
    category: 'Wall Art',
    imageUrl: '/photos/wall-hanging.jpg',
    aiHint: 'wall hanging',
    stock: 8,
  },
  {
    id: '4',
    name: 'Acacia Wood Bowl',
    price: 90000,
    category: 'Tableware',
    imageUrl: '/photos/wood-bowl.jpg',
    aiHint: 'wood bowl',
    stock: 0,
  },
];

export const rentalProperties: Property[] = [
  {
    id: '1',
    title: 'Serene Beachfront Villa',
    location: 'Zanzibar, Tanzania',
    pricePerNight: 450000,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?q=80&w=2940&auto=format&fit=crop',
    aiHint: 'beachfront villa'
  },
  {
    id: '2',
    title: 'Lush Garden Apartment',
    location: 'Arusha, Tanzania',
    pricePerNight: 250000,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=2940&auto=format&fit=crop',
    aiHint: 'garden apartment'
  },
  {
    id: '3',
    title: 'City-View Penthouse',
    location: 'Dar es Salaam, Tanzania',
    pricePerNight: 350000,
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2940&auto=format&fit=crop',
    aiHint: 'city penthouse'
  },
];
