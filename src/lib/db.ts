
// src/lib/db.ts
import Dexie, { type Table } from 'dexie';
import type { PortfolioItem, Product, Property, Order, Booking, SiteSettings } from './types';

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
  rentalProperties!: Table<Property, string>;
  // orders, bookings and siteSettings are now managed by localStorage/Supabase, so they are removed from Dexie.
  cart!: Table<CartItem, string>;

  constructor() {
    // Renaming the database to force a fresh start and bypass upgrade errors.
    super('pavoDB_v4'); 
    this.version(1).stores({
      portfolioItems: 'id, title', 
      decorProducts: 'id, category, name', // This table stores `Product` type
      rentalProperties: 'id, location',
      cart: 'id',
    });
  }
}

export const db = new PavoDexie();
