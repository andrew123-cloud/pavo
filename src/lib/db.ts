// src/lib/db.ts
import Dexie, { type Table } from 'dexie';
import type { PortfolioItem, Product, Property, Order, Booking, SiteSettings } from './types';

export interface CartItem extends Product {
  quantity: number;
}

export class PavoDexie extends Dexie {
  portfolioItems!: Table<PortfolioItem, string>;
  decorProducts!: Table<Product, string>;
  rentalProperties!: Table<Property, string>;
  orders!: Table<Order, string>;
  bookings!: Table<Booking, string>;
  siteSettings!: Table<SiteSettings, string>; 
  cart!: Table<CartItem, string>;

  constructor() {
    super('pavoDB');
    // Increment the version number to force a schema upgrade/recreation.
    // This is useful after major changes to ensure a clean state.
    this.version(3).stores({
      portfolioItems: 'id', // Primary key
      decorProducts: 'id, category, name', // Primary key and indexes
      rentalProperties: 'id, location', // Primary key and indexes
      orders: 'id, pesapal_order_tracking_id, created_at', // Primary key and indexes
      bookings: 'id, createdAt, isRead', // Primary key and indexes
      siteSettings: 'id', // Primary key (will only have 'default')
      cart: 'id', // Primary key for cart items
    });
  }
}

export const db = new PavoDexie();
