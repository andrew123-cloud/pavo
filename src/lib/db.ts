
// src/lib/db.ts
import Dexie, { type Table } from 'dexie';
import type { PortfolioItem, Product, BookingSite, SiteSettings } from './lib/types';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string; // The URL for display in cart
  aiHint: string;
  stock: number;
  quantity: number;
}

export class PavoDexie extends Dexie {
  portfolioItems!: Table<PortfolioItem, string>;
  decorProducts!: Table<Product, string>;
  bookingSites!: Table<BookingSite, string>;
  cart!: Table<CartItem, string>;
  siteSettings!: Table<SiteSettings, string>;

  constructor() {
    super('pavoDB_v5'); 
    
    // Define all versions from latest to oldest.
    
    // Version 5: Added siteSettings table
    this.version(5).stores({
      portfolioItems: 'id, title', 
      decorProducts: 'id, category, name',
      bookingSites: 'id, type, name',
      cart: 'id',
      siteSettings: 'id', // Added siteSettings table
    });

    // Fallback for older versions if a user is upgrading from a version before 5
    this.version(4).stores({
      portfolioItems: 'id, title', 
      decorProducts: 'id, category, name',
      bookingSites: 'id, type, name', // Add new table
      cart: 'id',
    }).upgrade(tx => {
      // This upgrade path is for users coming from v1, v2, or v3.
      // v4 adds bookingSites. Dexie handles this gracefully.
    });

    // Original schema
    this.version(1).stores({
      portfolioItems: 'id, title',
      decorProducts: 'id, category, name',
      cart: 'id',
    });
  }
}

export const db = new PavoDexie();
