
// src/lib/db.ts
import Dexie, { type Table } from 'dexie';
import type { PortfolioItem, Product, Property, BookingSite } from './types';

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
  bookingSites!: Table<BookingSite, string>;
  cart!: Table<CartItem, string>;

  constructor() {
    super('pavoDB_v4'); 
    this.version(2).stores({ // Bump version for schema change
      portfolioItems: 'id, title', 
      decorProducts: 'id, category, name',
      rentalProperties: 'id, location',
      bookingSites: 'id, type, name', // Add new table
      cart: 'id',
    }).upgrade(tx => {
      // The old tables will be kept, and the new one will be added.
      // No data migration needed if just adding a table.
    });

    // Handle initial schema creation for users who don't have v1
    this.version(1).stores({
      portfolioItems: 'id, title',
      decorProducts: 'id, category, name',
      rentalProperties: 'id, location',
      cart: 'id',
    });
  }
}

export const db = new PavoDexie();
