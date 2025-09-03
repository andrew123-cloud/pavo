
// src/lib/db.ts
import Dexie, { type Table } from 'dexie';
import type { PortfolioItem, Product, Property, Order, Booking, SiteSettings } from './types';

export interface CartItem extends Product {
  quantity: number;
}

export class PavoDexie extends Dexie {
  portfolioItems!: Table<PortfolioItem>;
  decorProducts!: Table<Product>;
  rentalProperties!: Table<Property>;
  orders!: Table<Order>;
  bookings!: Table<Booking>;
  siteSettings!: Table<SiteSettings, string>; // Key is string, 'default'
  cart!: Table<CartItem>;

  constructor() {
    super('pavoDB');
    this.version(2).stores({
      portfolioItems: '++id',
      decorProducts: '++id, category, name',
      rentalProperties: '++id, location',
      orders: '++id, pesapal_order_tracking_id, created_at',
      bookings: '++id, createdAt, isRead',
      siteSettings: 'id', // Simple key-value for single settings object
      cart: '++id',
    });
  }
}

export const db = new PavoDexie();
