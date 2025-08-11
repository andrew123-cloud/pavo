import type { PortfolioItem, Testimonial, Product, Property } from './types';

export const portfolioItems: PortfolioItem[] = [
  {
    id: '1',
    title: 'Modern Oasis',
    location: 'Masaki, Dar es Salaam',
    imageUrl: 'https://placehold.co/600x400',
    aiHint: 'modern living room'
  },
  {
    id: '2',
    title: 'Coastal Charm',
    location: 'Nungwi, Zanzibar',
    imageUrl: 'https://placehold.co/600x400',
    aiHint: 'coastal interior'
  },
  {
    id: '3',
    title: 'Urban Retreat',
    location: 'Oyster Bay, Dar es Salaam',
    imageUrl: 'https://placehold.co/600x400',
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
    avatarUrl: 'https://placehold.co/100x100',
  },
  {
    id: '2',
    name: 'John Davis',
    projectType: 'Living Room Consultation',
    quote:
      "The virtual design service was so convenient. They understood my vision perfectly and gave me a plan that was easy to follow. I'm thrilled with the results.",
    avatarUrl: 'https://placehold.co/100x100',
  },
  {
    id: '3',
    name: 'Fatima Al-Marzooqi',
    projectType: 'Commercial Space Design',
    quote:
      'Our new office space is both beautiful and functional, thanks to Pavo. It has completely boosted our team\'s morale and productivity.',
    avatarUrl: 'https://placehold.co/100x100',
  },
];

export const decorProducts: Product[] = [
  {
    id: '1',
    name: 'Terracotta Vase',
    price: 75000,
    category: 'Vases',
    imageUrl: 'https://placehold.co/400x400',
    aiHint: 'terracotta vase'
  },
  {
    id: '2',
    name: 'Linen Throw Pillow',
    price: 55000,
    category: 'Pillows',
    imageUrl: 'https://placehold.co/400x400',
    aiHint: 'linen pillow'
  },
  {
    id: '3',
    name: 'Handwoven Wall Hanging',
    price: 120000,
    category: 'Wall Art',
    imageUrl: 'https://placehold.co/400x400',
    aiHint: 'wall hanging'
  },
  {
    id: '4',
    name: 'Acacia Wood Bowl',
    price: 90000,
    category: 'Tableware',
    imageUrl: 'https://placehold.co/400x400',
    aiHint: 'wood bowl'
  },
];

export const rentalProperties: Property[] = [
  {
    id: '1',
    title: 'Serene Beachfront Villa',
    location: 'Zanzibar, Tanzania',
    pricePerNight: 450000,
    rating: 4.9,
    imageUrl: 'https://placehold.co/600x400',
    aiHint: 'beachfront villa'
  },
  {
    id: '2',
    title: 'Lush Garden Apartment',
    location: 'Arusha, Tanzania',
    pricePerNight: 250000,
    rating: 4.8,
    imageUrl: 'https://placehold.co/600x400',
    aiHint: 'garden apartment'
  },
  {
    id: '3',
    title: 'City-View Penthouse',
    location: 'Dar es Salaam, Tanzania',
    pricePerNight: 350000,
    rating: 4.7,
    imageUrl: 'https://placehold.co/600x400',
    aiHint: 'city penthouse'
  },
];
