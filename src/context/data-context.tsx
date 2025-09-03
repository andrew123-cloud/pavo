
// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, ReactNode, useEffect, useMemo } from 'react';
import type { PavoData, PortfolioItem, Product, Property, Order, SiteSettings, Booking } from '@/lib/types';
import { siteSettings as initialSiteSettings } from '@/lib/data';
import { db as firestoreDB } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, writeBatch, getDoc, orderBy, query, onSnapshot, addDoc, serverTimestamp, Timestamp, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as dexieDB, CartItem } from '@/lib/db';

interface DataContextType extends PavoData {
  loading: boolean;
  deletePortfolioItem: (id: string) => Promise<void>;
  deleteDecorProduct: (id: string) => Promise<void>;
  deleteRentalProperty: (id: string) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  updateOrder: (order: Order) => Promise<void>;
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

  // Use Dexie's useLiveQuery for reactive data
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


  // Effect to sync Firestore with Dexie
  useEffect(() => {
    const syncFirestoreToDexie = <T extends {id: string}>(collectionName: string, table: Dexie.Table<T, any>) => {
      const q = query(collection(firestoreDB, collectionName), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, async (snapshot) => {
        const firestoreData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        try {
          await table.bulkPut(firestoreData);
          console.log(`Synced ${collectionName} to Dexie.`);
        } catch (error) {
          console.error(`Failed to sync ${collectionName} to Dexie:`, error);
        }
      }, error => {
        console.error(`Error listening to Firestore collection ${collectionName}:`, error);
      });
      return unsub;
    };
    
    // Sync for collections with a 'createdAt' field
    const unsubs = [
      syncFirestoreToDexie('bookings', dexieDB.bookings),
    ];
    
     // Custom sync for collections without 'createdAt' or with different sorting
    const syncCollection = (name:string, table: Dexie.Table<any,any>, sortField?:string) => {
        const q = sortField 
            ? query(collection(firestoreDB, name), orderBy(sortField, 'desc'))
            : query(collection(firestoreDB, name));
        return onSnapshot(q, (snapshot) => table.bulkPut(snapshot.docs.map(d => ({id:d.id, ...d.data()}))));
    };

    unsubs.push(syncCollection('portfolioItems', dexieDB.portfolioItems));
    unsubs.push(syncCollection('decorProducts', dexieDB.decorProducts));
    unsubs.push(syncCollection('rentalProperties', dexieDB.rentalProperties));
    unsubs.push(syncCollection('orders', dexieDB.orders, 'created_at'));
    
    // Sync for site settings (single document)
    const settingsUnsub = onSnapshot(doc(firestoreDB, 'settings', 'site'), (doc) => {
      if (doc.exists()) {
        dexieDB.siteSettings.put({ ...doc.data() as SiteSettings, id: 'default' });
      }
    });
    unsubs.push(settingsUnsub);

    return () => unsubs.forEach(unsub => unsub());
  }, []);


  const deleteOperation = async (table: Dexie.Table, collectionName: string, id: string, successMsg: string) => {
    try {
      // Optimistic UI update
      await table.delete(id);
      await deleteDoc(doc(firestoreDB, collectionName, id));
      toast({ title: 'Success', description: successMsg });
    } catch (error) {
      console.error(`Error deleting from ${collectionName}:`, error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the item. Please try again.' });
      // Re-fetch from firestore to revert optimistic update if needed, though Dexie sync should handle it
      throw error;
    }
  };

  const deletePortfolioItem = async (id: string) => deleteOperation(dexieDB.portfolioItems, 'portfolioItems', id, 'Portfolio item deleted.');
  const deleteDecorProduct = async (id: string) => deleteOperation(dexieDB.decorProducts, 'decorProducts', id, 'Product deleted.');
  const deleteRentalProperty = async (id: string) => deleteOperation(dexieDB.rentalProperties, 'rentalProperties', id, 'Property deleted.');

  const updateOperation = async (table: Dexie.Table, collectionName: string, id: string, data: any, successMsg: string) => {
      try {
        await table.put({...data, id});
        await setDoc(doc(firestoreDB, collectionName, id), data, { merge: true });
        toast({ title: 'Success', description: successMsg });
      } catch (error) {
         console.error(`Error updating ${collectionName}:`, error);
         toast({ variant: 'destructive', title: 'Error', description: 'Could not update the item. Please try again.' });
         throw error;
      }
  };
  
  const decreaseStock = async (productId: string, amount: number) => {
    const product = await dexieDB.decorProducts.get(productId);
    if(product) {
      const newStock = Math.max(0, product.stock - amount);
      await updateOperation(dexieDB.decorProducts, 'decorProducts', productId, { stock: newStock }, 'Stock updated.');
    }
  };
  
  const addOrder = async (order: Order) => updateOperation(dexieDB.orders, 'orders', order.id, order, 'Order added.');
  const updateOrder = async (order: Order) => updateOperation(dexieDB.orders, 'orders', order.id, order, 'Order updated.');
  const updateSiteSettings = async (settings: SiteSettings) => updateOperation(dexieDB.siteSettings, 'settings', 'site', settings, 'Site settings updated.');

  const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => {
    try {
      const newBooking = { ...booking, createdAt: serverTimestamp(), isRead: false };
      const docRef = await addDoc(collection(firestoreDB, 'bookings'), newBooking);
      // Dexie will be updated by the onSnapshot listener, no need for manual put
      toast({ title: 'Success', description: 'Your booking request has been sent.' });
    } catch (error) {
      console.error(`Error adding booking:`, error);
      toast({ variant: 'destructive', title: 'Error', description: `Could not save the booking. Please check your connection and try again.` });
      throw error;
    }
  };

  const markBookingAsRead = async (id: string) => updateOperation(dexieDB.bookings, 'bookings', id, { isRead: true }, 'Booking marked as read.');

  const markAllBookingsAsRead = async () => {
    try {
      const unread = (bookings || []).filter(b => !b.isRead);
      if (unread.length === 0) return;
      
      const batch = writeBatch(firestoreDB);
      unread.forEach(booking => {
        const docRef = doc(firestoreDB, 'bookings', booking.id);
        batch.update(docRef, { isRead: true });
      });
      await batch.commit();
      // Dexie updates via listener
    } catch(error) {
       console.error(`Error marking all as read:`, error);
    }
  };
  
  // Cart Logic using Dexie
  const addToCart = async (product: Product) => {
    const existingItem = await dexieDB.cart.where({ id: product.id }).first();
    if (existingItem) {
      await dexieDB.cart.update(existingItem.id, { quantity: existingItem.quantity + 1 });
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

  const removeFromCart = async (productId: string) => {
    await dexieDB.cart.delete(productId);
  };
  
  const clearCart = async () => {
    await dexieDB.cart.clear();
  };
  
  const cartTotal = (cart || []).reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = (cart || []).reduce((count, item) => count + item.quantity, 0);


  const providerValue: DataContextType = {
    portfolioItems: portfolioItems || [],
    decorProducts: decorProducts || [],
    rentalProperties: rentalProperties || [],
    orders: orders || [],
    bookings: bookings || [],
    siteSettings: siteSettings || initialSiteSettings,
    loading,
    deletePortfolioItem,
    deleteDecorProduct,
    deleteRentalProperty,
    addOrder,
    updateOrder,
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


  return (
    <DataContext.Provider value={providerValue}>
      {children}
    </DataContext.Provider>
  );
}

export function usePavoData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('usePavoData must be used within a DataProvider');
  }
  return context;
}
