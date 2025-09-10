
// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import type { PavoData, PortfolioItem, Product, Property, Order, SiteSettings, Booking } from '@/lib/types';
import { siteSettings as initialSiteSettings, testimonials } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as dexieDB, CartItem } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';


interface DataContextType extends PavoData {
  loading: boolean;
  addOrUpdatePortfolioItem: (item: PortfolioItem, beforeImageFile?: File | null, afterImageFile?: File | null, onProgress?: (percent: number) => void) => Promise<any>;
  deletePortfolioItem: (id: string) => Promise<void>;
  addOrUpdateDecorProduct: (product: Omit<Product, 'image_url'> & { id: string }, imageFile?: File | null, onProgress?: (percent: number) => void) => Promise<any>;
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

// This helper function handles the entire client-side process:
// compressing, creating form data, and posting to the Next.js API proxy.
const saveDataWithFiles = async (collectionName: string, data: any, files: { [key: string]: File | null | undefined }, onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('collectionName', collectionName);
    
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

  // Live queries from Dexie.js - UI reads from here for instant updates.
  const portfolioItems = useLiveQuery(() => dexieDB.portfolioItems.toArray(), []);
  const decorProducts = useLiveQuery(() => dexieDB.decorProducts.toArray(), []);
  const rentalProperties = useLiveQuery(() => dexieDB.rentalProperties.toArray(), []);
  const orders = useLiveQuery(() => dexieDB.orders.toArray(), []);
  const bookings = useLiveQuery(() => dexieDB.bookings.toArray(), []);
  const siteSettings = useLiveQuery(() => dexieDB.siteSettings.get('default'), undefined);
  const cart = useLiveQuery(() => dexieDB.cart.toArray(), []);

  // This effect syncs Supabase to Dexie on initial load
  useEffect(() => {
    const syncFromSupabase = async () => {
        console.log("Setting up Supabase real-time listeners and initial data fetch...");
        setLoading(true);

        try {
            // Fetch initial data
            const [
                { data: portfolioData, error: portfolioError },
                { data: decorData, error: decorError },
                { data: rentalData, error: rentalError },
                { data: ordersData, error: ordersError },
                { data: bookingsData, error: bookingsError },
                { data: settingsData, error: settingsError },
            ] = await Promise.all([
                supabase.from('portfolioItems').select('*'),
                supabase.from('products').select('*'), // Corrected table name
                supabase.from('rentalProperties').select('*'),
                supabase.from('orders').select('*'),
                supabase.from('bookings').select('*'),
                supabase.from('siteSettings').select('*').eq('id', 'default').single(),
            ]);

            if(portfolioError) throw portfolioError;
            if(decorError) throw decorError;
            if(rentalError) throw rentalError;
            if(ordersError) throw ordersError;
            if(bookingsError) throw bookingsError;
            if(settingsError && settingsError.code !== 'PGRST116') throw settingsError; // Ignore "exact one row" error for settings if not found

            await dexieDB.transaction('rw', dexieDB.tables, async () => {
                await dexieDB.portfolioItems.bulkPut(portfolioData || []);
                await dexieDB.decorProducts.bulkPut(decorData || []);
                await dexieDB.rentalProperties.bulkPut(rentalData || []);
                await dexieDB.orders.bulkPut(ordersData || []);
                await dexieDB.bookings.bulkPut(bookingsData || []);
                if (settingsData) {
                    await dexieDB.siteSettings.put(settingsData);
                } else {
                    await dexieDB.siteSettings.put(initialSiteSettings);
                }
            });
            
             console.log("Initial data sync from Supabase successful.");

        } catch (error: any) {
            console.error("[Supabase Sync] Error syncing data:", error);
            toast({ variant: 'destructive', title: 'Network Error', description: `Could not sync data from server. Using local data.`});
        } finally {
            setLoading(false);
        }

        // Set up real-time subscriptions
        const channels = supabase.channel('pavo-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolioItems' }, (payload) => {
                if(payload.eventType === 'DELETE') dexieDB.portfolioItems.delete(payload.old.id);
                else dexieDB.portfolioItems.put(payload.new as PortfolioItem);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => { // Corrected table name
                if(payload.eventType === 'DELETE') dexieDB.decorProducts.delete(payload.old.id);
                else dexieDB.decorProducts.put(payload.new as Product);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rentalProperties' }, (payload) => {
                if(payload.eventType === 'DELETE') dexieDB.rentalProperties.delete(payload.old.id);
                else dexieDB.rentalProperties.put(payload.new as Property);
            })
             .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                if(payload.eventType === 'DELETE') dexieDB.orders.delete(payload.old.id);
                else dexieDB.orders.put(payload.new as Order);
            })
             .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
                if(payload.eventType === 'DELETE') dexieDB.bookings.delete(payload.old.id);
                else dexieDB.bookings.put(payload.new as Booking);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'siteSettings' }, (payload) => {
                dexieDB.siteSettings.put(payload.new as SiteSettings);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channels);
        };
    };
    
    syncFromSupabase();

  }, [toast]);
  
  const deleteFromSupabaseStorage = async (imageUrl: string) => {
    try {
        if (imageUrl && imageUrl.includes('supabase.co')) {
            const path = imageUrl.substring(imageUrl.indexOf('/pavo-assets/') + '/pavo-assets/'.length);
            await supabase.storage.from('pavo-assets').remove([path]);
        }
    } catch(error: any) {
        console.error("Error deleting image from Supabase storage:", error);
    }
  }

  const addOrUpdateDecorProduct = (product: Omit<Product, 'image_url'> & { id: string }, imageFile?: File | null, onProgress?: (percent: number) => void) => {
    // The backend expects the file field to be 'imageUrl', which it will then map to 'image_url' in the database.
    return saveDataWithFiles('products', product, { imageUrl: imageFile }, onProgress);
  };
  
  const addOrUpdateRentalProperty = (property: Property, imageFile?: File | null, onProgress?: (percent: number) => void) => {
      return saveDataWithFiles('rentalProperties', property, { imageUrl: imageFile }, onProgress);
  };
  
  const addOrUpdatePortfolioItem = (item: PortfolioItem, beforeImageFile?: File | null, afterImageFile?: File | null, onProgress?: (percent: number) => void) => {
      return saveDataWithFiles('portfolioItems', item, { beforeImageUrl: beforeImageFile, imageUrl: afterImageFile }, onProgress);
  };
  
  const deleteDecorProduct = async (id: string) => {
    const item = await dexieDB.decorProducts.get(id);
    if(item && item.image_url) await deleteFromSupabaseStorage(item.image_url);
    await supabase.from('products').delete().eq('id', id);
  };
  
  const deleteRentalProperty = async (id: string) => {
    const item = await dexieDB.rentalProperties.get(id);
    if(item && item.imageUrl) await deleteFromSupabaseStorage(item.imageUrl);
    await supabase.from('rentalProperties').delete().eq('id', id);
  };

  const deletePortfolioItem = async (id: string) => {
    const item = await dexieDB.portfolioItems.get(id);
    if (!item) return;
    if(item.imageUrl) await deleteFromSupabaseStorage(item.imageUrl);
    if(item.beforeImageUrl) await deleteFromSupabaseStorage(item.beforeImageUrl);
    await supabase.from('portfolioItems').delete().eq('id', id);
  };

  const addOrder = async (order: Order) => {
    await supabase.from('orders').upsert(order);
  };
  
  const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => {
     const docId = uuidv4();
     const newBooking: Booking = { 
        ...booking,
        id: docId,
        createdAt: new Date().toISOString(),
        isRead: false
     }
     await supabase.from('bookings').insert(newBooking);
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
      const cartProduct: CartItem = {
          ...product,
          imageUrl: product.image_url,
          quantity: 1,
      };
      await dexieDB.cart.add(cartProduct);
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
    const { error } = await supabase.rpc('decrease_stock', { product_id: productId, decrease_amount: amount });
    if(error) console.error("Error decreasing stock:", error);
  };

  const markBookingAsRead = async (id: string) => {
      await supabase.from('bookings').update({ isRead: true }).eq('id', id);
  };
  const markAllBookingsAsRead = async () => {
    const unread = (bookings || []).filter(b => !b.isRead);
    if (unread.length === 0) return;
    const idsToUpdate = unread.map(b => b.id);
    await supabase.from('bookings').update({ isRead: true }).in('id', idsToUpdate);
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
