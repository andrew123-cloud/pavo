
// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import type { PavoData, PortfolioItem, Product, Property, Order, SiteSettings, Booking } from '@/lib/types';
import { siteSettings as initialSiteSettings, testimonials } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as dexieDB, CartItem } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { rtdb, storage } from '@/lib/firebase';
import { ref as dbRef, onValue, set, update, remove } from 'firebase/database';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import axios from 'axios';
import imageCompression from 'browser-image-compression';


interface DataContextType extends PavoData {
  loading: boolean;
  addOrUpdatePortfolioItem: (item: PortfolioItem, beforeImageFile?: File | null, afterImageFile?: File | null, onProgress?: (percent: number) => void) => Promise<any>;
  deletePortfolioItem: (id: string) => Promise<void>;
  addOrUpdateDecorProduct: (product: Product, imageFile?: File | null, onProgress?: (percent: number) => void) => Promise<any>;
  deleteDecorProduct: (id: string) => Promise<void>;
  addOrUpdateRentalProperty: (property: Property, imageFile?: File | null, onProgress?: (percent: number) => void) => Promise<any>;
  deleteRentalProperty: (id: string) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  decreaseStock: (productId: string, amount: number) => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  markBookingAsRead: (id: string) => Promise<void>;
  markAllBookingsAsRead: () => Promise<void>;
  updateSiteSettings: (settings: SiteSettings, files: { [key: string]: File | null }) => Promise<void>;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const collectionsToSync = ['portfolioItems', 'decorProducts', 'rentalProperties', 'orders', 'bookings'] as const;
type CollectionName = typeof collectionsToSync[number];


// This helper function handles the entire client-side process:
// compressing, creating form data, and posting to the Next.js API proxy.
const saveDataWithFiles = async (collectionName: string, data: any, files: { [key: string]: File | null | undefined }, onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('collectionName', collectionName);
    formData.append('id', data.id);

    // Append all data fields to formData
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            // Ensure we don't send undefined or null values that FormData might stringify
            if (data[key] !== null && data[key] !== undefined) {
                 formData.append(key, String(data[key]));
            }
        }
    }

    const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        onProgress: (p: number) => {
            if (onProgress) onProgress(p * 0.5); // Compression is first 50%
        },
    };

    // Compress and append each file
    for (const key in files) {
        const file = files[key];
        if (file) {
            try {
                const compressedFile = await imageCompression(file, compressionOptions);
                formData.append(key, compressedFile, compressedFile.name);
            } catch (error) {
                console.error("Compression Error:", error);
                formData.append(key, file, file.name); // Fallback to original file
            }
        }
    }

    // Use the local Next.js API route as a proxy
    const response = await axios.post('/api/save-data', formData, {
        headers: {
            // Let the browser set the Content-Type header for FormData
        },
         onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                // Upload is the second 50% of the total progress
                onProgress(50 + percentCompleted * 0.5);
            }
        }
    });

    return response.data;
};


export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Live queries from Dexie.js - UI reads from here.
  const portfolioItems = useLiveQuery(() => dexieDB.portfolioItems.toArray(), []);
  const decorProducts = useLiveQuery(() => dexieDB.decorProducts.toArray(), []);
  const rentalProperties = useLiveQuery(() => dexieDB.rentalProperties.toArray(), []);
  const orders = useLiveQuery(() => dexieDB.orders.toArray(), []);
  const bookings = useLiveQuery(() => dexieDB.bookings.toArray(), []);
  const siteSettings = useLiveQuery(() => dexieDB.siteSettings.get('default'), undefined);
  const cart = useLiveQuery(() => dexieDB.cart.toArray(), []);

  // This effect syncs RTDB to Dexie in real-time
  useEffect(() => {
    console.log("Setting up RTDB real-time listeners...");
    setLoading(true);

    const unsubscribers = collectionsToSync.map((collectionName: CollectionName) => {
      const collectionRef = dbRef(rtdb, collectionName);
      return onValue(collectionRef, async (snapshot) => {
        console.log(`[RTDB Sync] Received update for ${collectionName}`);
        const data = snapshot.val();
        const itemsArray = data ? Object.values(data) : [];

        const dexieTable = dexieDB[collectionName as keyof typeof dexieDB] as Dexie.Table<any,any>;
        try {
            await dexieDB.transaction('rw', dexieTable, async () => {
              const allKeys = await dexieTable.toCollection().keys();
              const rtdbIds = new Set(Object.keys(data || {}));

              const keysToDelete = (allKeys as string[]).filter(k => !rtdbIds.has(k) && k !== 'default');
              if (keysToDelete.length > 0) {
                await dexieTable.bulkDelete(keysToDelete);
              }

              if (itemsArray.length > 0) {
                await dexieTable.bulkPut(itemsArray);
              }
            });
             console.log(`[RTDB Sync] Successfully synced ${collectionName}`);
        } catch (error) {
             console.error(`[Dexie Error] Failed to transact for ${collectionName}:`, error);
        }
      }, (error) => {
        console.error(`[RTDB Sync] Error listening to ${collectionName}:`, error);
        toast({ variant: 'destructive', title: 'Network Error', description: `Could not sync ${collectionName}. Using local data.`});
      });
    });

    const settingsRef = dbRef(rtdb, 'siteSettings/default');
    const settingsUnsubscriber = onValue(settingsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const settingsData = { ...snapshot.val(), id: 'default' } as SiteSettings;
        await dexieDB.siteSettings.put(settingsData);
        console.log("[RTDB Sync] Successfully synced siteSettings");
      }
    });

    setLoading(false);
    return () => {
        console.log("Cleaning up RTDB listeners.");
        unsubscribers.forEach(unsub => unsub());
        settingsUnsubscriber();
    }
  }, [toast]);
  
  const deleteImage = async (imageUrl: string) => {
    try {
        if (imageUrl && imageUrl.includes('firebasestorage.googleapis.com')) {
            const imageRef = storageRef(storage, imageUrl);
            await deleteObject(imageRef);
        }
    } catch(error: any) {
        if(error.code !== 'storage/object-not-found') {
            console.error("Error deleting image from storage:", error);
            throw error;
        }
        console.warn(`Image at ${imageUrl} not found in storage, skipping deletion.`);
    }
  }

  const addOrUpdateDecorProduct = (product: Product, imageFile?: File | null, onProgress?: (percent: number) => void) => {
    return saveDataWithFiles('decorProducts', product, { imageUrl: imageFile }, onProgress);
  };
  
  const addOrUpdateRentalProperty = (property: Property, imageFile?: File | null, onProgress?: (percent: number) => void) => {
      return saveDataWithFiles('rentalProperties', property, { imageUrl: imageFile }, onProgress);
  };
  
  const addOrUpdatePortfolioItem = (item: PortfolioItem, beforeImageFile?: File | null, afterImageFile?: File | null, onProgress?: (percent: number) => void) => {
      return saveDataWithFiles('portfolioItems', item, { beforeImageUrl: beforeImageFile, imageUrl: afterImageFile }, onProgress);
  };

  const deleteFromRtdb = async (path: string) => await remove(dbRef(rtdb, path));

  const deleteDecorProduct = async (id: string) => {
    const item = await dexieDB.decorProducts.get(id);
    if(item && item.imageUrl) await deleteImage(item.imageUrl);
    await deleteFromRtdb(`decorProducts/${id}`);
  };
  
  const deleteRentalProperty = async (id: string) => {
    const item = await dexieDB.rentalProperties.get(id);
    if(item && item.imageUrl) await deleteImage(item.imageUrl);
    await deleteFromRtdb(`rentalProperties/${id}`);
  };

  const deletePortfolioItem = async (id: string) => {
    const item = await dexieDB.portfolioItems.get(id);
    if (!item) return;
    if(item.imageUrl) await deleteImage(item.imageUrl);
    if(item.beforeImageUrl) await deleteImage(item.beforeImageUrl);
    await deleteFromRtdb(`portfolioItems/${id}`);
  };

  const addOrder = async (order: Order) => {
    await set(dbRef(rtdb, `orders/${order.id}`), order);
  };
  
  const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => {
     const docId = uuidv4();
     const newBooking = { 
        ...booking,
        id: docId,
        createdAt: new Date().toISOString(),
        isRead: false
     }
     await set(dbRef(rtdb, `bookings/${docId}`), newBooking);
  };
  
  const updateSiteSettings = async (settings: SiteSettings, files: { [key: string]: File | null }) => {
     const dataToSave = {
        ...settings,
        id: 'default'
     };
     await saveDataWithFiles('siteSettings', dataToSave, files);
  };

  // ---- Cart functionality (purely client-side with Dexie) ----
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

  const decreaseStock = async (productId: string, amount: number) => {
    const product = await dexieDB.decorProducts.get(productId);
    if(product) {
        const newStock = Math.max(0, product.stock - amount);
        await update(dbRef(rtdb, `decorProducts/${productId}`), { stock: newStock });
    }
  };

  const markBookingAsRead = async (id: string) => {
      await update(dbRef(rtdb, `bookings/${id}`), { isRead: true });
  };
  const markAllBookingsAsRead = async () => {
    const unread = (bookings || []).filter(b => !b.isRead);
    if (unread.length === 0) return;
    const updates: {[key: string]: any} = {};
    unread.forEach(b => {
        updates[`/bookings/${b.id}/isRead`] = true;
    });
    await update(dbRef(rtdb), updates);
  };

  const providerValue: DataContextType = {
    portfolioItems: portfolioItems || [],
    decorProducts: decorProducts || [],
    rentalProperties: rentalProperties || [],
    orders: (orders || []).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    bookings: (bookings || []).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    siteSettings: siteSettings || initialSiteSettings,
    testimonials: testimonials,
    loading: loading || portfolioItems === undefined || decorProducts === undefined || rentalProperties === undefined,
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
