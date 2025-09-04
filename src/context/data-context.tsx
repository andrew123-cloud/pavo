// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, ReactNode, useEffect, useMemo } from 'react';
import type { PavoData, PortfolioItem, Product, Property, Order, SiteSettings, Booking } from '@/lib/types';
import { siteSettings as initialSiteSettings, testimonials } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as dexieDB, CartItem } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';


interface DataContextType extends PavoData {
  loading: boolean;
  addOrUpdatePortfolioItem: (item: Omit<PortfolioItem, 'id'>, id?: string) => Promise<void>;
  deletePortfolioItem: (id: string) => Promise<void>;
  addOrUpdateDecorProduct: (product: Omit<Product, 'id'>, id?: string) => Promise<void>;
  deleteDecorProduct: (id: string) => Promise<void>;
  addOrUpdateRentalProperty: (property: Omit<Property, 'id'>, id?: string) => Promise<void>;
  deleteRentalProperty: (id: string) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  decreaseStock: (productId: string, amount: number) => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  markBookingAsRead: (id: string) => Promise<void>;
  markAllBookingsAsRead: () => Promise<void>;
  updateSiteSettings: (settings: SiteSettings) => Promise<void>;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const portfolioItems = useLiveQuery(() => dexieDB.portfolioItems.toArray(), []);
  const decorProducts = useLiveQuery(() => dexieDB.decorProducts.toArray(), []);
  const rentalProperties = useLiveQuery(() => dexieDB.rentalProperties.toArray(), []);
  const orders = useLiveQuery(() => dexieDB.orders.toArray(), []);
  const bookings = useLiveQuery(() => dexieDB.bookings.toArray(), []);
  const siteSettings = useLiveQuery(() => dexieDB.siteSettings.get('default'), undefined);
  const cart = useLiveQuery(() => dexieDB.cart.toArray(), []);

  const loading = useMemo(() => (
    [portfolioItems, decorProducts, rentalProperties, orders, bookings, siteSettings, cart].some(data => data === undefined)
  ), [portfolioItems, decorProducts, rentalProperties, orders, bookings, siteSettings, cart]);

  useEffect(() => {
    const seedInitialData = async () => {
        const settingsCount = await dexieDB.siteSettings.count();
        if (settingsCount === 0) {
            console.log("Seeding initial site settings to Dexie.");
            await dexieDB.siteSettings.put({ ...initialSiteSettings, id: 'default' });
        }
    };
    seedInitialData();
  }, []);

  const addOrUpdate = async (table: Dexie.Table, data: any, id?: string) => {
    try {
      const payload = { ...data, id: id || uuidv4() };
      await table.put(payload);
      toast({ title: 'Success', description: 'Your data has been saved locally.' });
    } catch (error) {
      console.error('Dexie save error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save data to the local database.' });
      throw error;
    }
  };

  const deleteOperation = async (table: Dexie.Table, id: string) => {
    try {
      await table.delete(id);
      toast({ title: 'Success', description: 'Item deleted from the local database.' });
    } catch (error) {
      console.error('Dexie delete error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the item.' });
      throw error;
    }
  };

  const addOrUpdatePortfolioItem = async (item: Omit<PortfolioItem, 'id'>, id?: string) => addOrUpdate(dexieDB.portfolioItems, item, id);
  const deletePortfolioItem = async (id: string) => deleteOperation(dexieDB.portfolioItems, id);

  const addOrUpdateDecorProduct = async (product: Omit<Product, 'id'>, id?: string) => addOrUpdate(dexieDB.decorProducts, product, id);
  const deleteDecorProduct = async (id: string) => deleteOperation(dexieDB.decorProducts, id);
  
  const addOrUpdateRentalProperty = async (property: Omit<Property, 'id'>, id?: string) => addOrUpdate(dexieDB.rentalProperties, property, id);
  const deleteRentalProperty = async (id: string) => deleteOperation(dexieDB.rentalProperties, id);

  const addOrder = async (order: Order) => addOrUpdate(dexieDB.orders, order, order.id);

  const decreaseStock = async (productId: string, amount: number) => {
    const product = await dexieDB.decorProducts.get(productId);
    if(product) {
      const newStock = Math.max(0, product.stock - amount);
      await dexieDB.decorProducts.update(productId, { stock: newStock });
    }
  };

  const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => {
     await addOrUpdate(dexieDB.bookings, {
       ...booking,
       createdAt: new Date().toISOString(),
       isRead: false
     });
  };

  const markBookingAsRead = async (id: string) => {
    await dexieDB.bookings.update(id, { isRead: true });
  };
  
  const markAllBookingsAsRead = async () => {
     const unread = (bookings || []).filter(b => !b.isRead);
     if (unread.length === 0) return;
     const unreadIds = unread.map(b => b.id);
     await dexieDB.bookings.where('id').anyOf(unreadIds).modify({ isRead: true });
  };

  const updateSiteSettings = async (settings: SiteSettings) => {
     await addOrUpdate(dexieDB.siteSettings, settings, 'default');
  };

  const addToCart = async (product: Product) => {
    const existingItem = await dexieDB.cart.get(product.id);
    if (existingItem) {
      await dexieDB.cart.update(product.id, { quantity: existingItem.quantity + 1 });
    } else {
      await dexieDB.cart.add({ ...product, quantity: 1 });
    }
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await dexieDB.cart.delete(productId);
    } else {
      await dexieDB.cart.update(productId, { quantity });
    }
  };

  const removeFromCart = (productId: string) => dexieDB.cart.delete(productId);
  const clearCart = () => dexieDB.cart.clear();

  const cartTotal = (cart || []).reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = (cart || []).reduce((count, item) => count + item.quantity, 0);

  const providerValue: DataContextType = {
    portfolioItems: portfolioItems || [],
    decorProducts: decorProducts || [],
    rentalProperties: rentalProperties || [],
    orders: orders || [],
    bookings: bookings || [],
    siteSettings: siteSettings || initialSiteSettings,
    testimonials: testimonials,
    loading,
    addOrUpdatePortfolioItem,
    deletePortfolioItem,
    addOrUpdateDecorProduct,
    deleteDecorProduct,
    addOrUpdateRentalProperty,
    deleteRentalProperty,
    addOrder,
    decreaseStock,
    addBooking,
    markBookingAsRead,
    markAllBookingsAsRead,
    updateSiteSettings,
    cart: cart || [],
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,
  };

  return <DataContext.Provider value={providerValue}>{children}</DataContext.Provider>;
}

export function usePavoData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('usePavoData must be used within a DataProvider');
  }
  return context;
}
