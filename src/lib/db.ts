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
    // Incrementing version number to fix the upgrade error
    // Re-stabilizing the schema to use 'id' as the primary key consistently
    // and adding other fields as indexes.
    this.version(7).stores({
      portfolioItems: 'id, title', 
      decorProducts: 'id, category, name',
      rentalProperties: 'id, location',
      orders: 'id, pesapal_order_tracking_id, created_at',
      bookings: 'id, createdAt, isRead',
      siteSettings: 'id',
      cart: 'id',
    });
  }
}

export const db = new PavoDexie();
