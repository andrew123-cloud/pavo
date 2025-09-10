import type { Testimonial, SiteSettings } from './types';


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


export const siteSettings: SiteSettings = {
  id: 'default',
  brandDescriptions: {
    interiors: 'Bespoke design services that transform spaces into personalized works of art.',
    decors: 'A curated collection of handcrafted accessories to add warmth and character to your home.',
    homes: 'Discover and book unique, aesthetic rental homes for your perfect getaway in Tanzania.'
  },
  founder: {
    mainDescription: `The heart and soul behind the Pavo brand is Palvin Atugonza, a Tanzanian entrepreneur whose journey is a testament to the power of passion and perseverance. Her story isn't just about building a business; it's about creating a legacy of beauty and inspiration.
    
Pavo is the culmination of Palvin's diverse experiences and her unwavering belief in the transformative power of one's environment. Whether through bespoke interiors, curated decor, or unique hospitality, her vision is singular: to inspire a life lived beautifully.`,
    philosophy: "To blend modern innovation with timeless elegance, creating spaces and experiences that are not just seen, but felt.",
    imageUrls: [
      '/palvin-portrait.jpg'
    ]
  },
  heroImages: {
    suite: [],
    interiors: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2158&auto=format&fit=crop'],
    decors: ['https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=2832&auto=format&fit=crop'],
    homes: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2940&auto=format&fit=crop'],
  }
};
