
// src/lib/db.ts
import Dexie, { type Table } from 'dexie';
import type { PortfolioItem, Product, BookingSite, SiteSettings } from '@/lib/types';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUrl: string; // The URL for display in cart
  aiHint: string;
  stock: number;
  quantity: number;
}

export class PavoDexie extends Dexie {
  portfolioItems!: Table<PortfolioItem, number>;
  decorProducts!: Table<Product, number>;
  bookingSites!: Table<BookingSite, number>;
  cart!: Table<CartItem, number>;
  siteSettings!: Table<SiteSettings, string>;

  constructor() {
    super('pavoDB_v6'); 
    
    this.version(6).stores({
      portfolioItems: '++id, title', 
      decorProducts: '++id, category, name',
      bookingSites: '++id, type, name',
      cart: 'id',
      siteSettings: 'id', 
    });
  }
}

export const db = new PavoDexie();
