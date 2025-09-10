// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import type { PavoData, PortfolioItem, Product, Property, Order, SiteSettings, Booking, BookingSite } from '@/lib/types';
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
  addOrUpdateBookingSite: (site: Omit<BookingSite, 'imageUrl'> & { id: string }, imageFile?: File | null, onProgress?: (percent: number) => void) => Promise<any>;
  deleteBookingSite: (id: string) => Promise<void>;
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
            const value = data[key];
            if (value !== null && value !== undefined) {
                 // Handle nested objects by stringifying them
                if (typeof value === 'object' && !Array.isArray(value)) {
                    formData.append(key, JSON.stringify(value));
                } else if (Array.isArray(value)) {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, String(value));
                }
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

  // Live queries from Dexie.js for Supabase-backed data
  const portfolioItems = useLiveQuery(() => dexieDB.portfolioItems.toArray(), []);
  const decorProducts = useLiveQuery(() => dexieDB.decorProducts.toArray(), []);
  const bookingSites = useLiveQuery(() => dexieDB.bookingSites.toArray(), []);
  const siteSettings = useLiveQuery(() => dexieDB.siteSettings.get('default'), []);

  // State for localStorage-backed data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Effect for initializing localStorage data
  useEffect(() => {
    try {
        const storedBookings = localStorage.getItem('pavo-bookings');
        if (storedBookings) setBookings(JSON.parse(storedBookings));
    } catch (e) { console.error("Failed to parse bookings from localStorage", e); }
    try {
        const storedOrders = localStorage.getItem('pavo-orders');
        if (storedOrders) setOrders(JSON.parse(storedOrders));
    } catch (e) { console.error("Failed to parse orders from localStorage", e); }
  }, []);


  // This effect syncs Supabase to Dexie on initial load
  useEffect(() => {
    const syncFromSupabase = async () => {
        console.log("Setting up Supabase real-time listeners and initial data fetch...");
        setLoading(true);

        try {
            const [
                { data: productsData, error: productsError },
                { data: portfolioData, error: portfolioError },
                { data: settingsData, error: settingsError },
                { data: bookingSitesData, error: bookingSitesError },
            ] = await Promise.all([
                supabase.from('products').select('*'),
                supabase.from('portfolioItems').select('*'),
                supabase.from('siteSettings').select('*'),
                supabase.from('bookingSites').select('*'),
            ]);

            // Consolidate error checking
            const errors = { productsError, portfolioError, settingsError, bookingSitesError };
            for (const [key, error] of Object.entries(errors)) {
                if (error) throw error;
            }
            
            await dexieDB.transaction('rw', dexieDB.tables, async () => {
                await dexieDB.portfolioItems.bulkPut(portfolioData || []);
                await dexieDB.decorProducts.bulkPut(productsData || []);
                await dexieDB.bookingSites.bulkPut(bookingSitesData || []);
                if (settingsData && settingsData.length > 0) {
                    await dexieDB.siteSettings.bulkPut(settingsData);
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
                if(payload.eventType === 'DELETE') dexieDB.decorProducts.delete(payload.old.id);
                else dexieDB.decorProducts.put(payload.new as Product);
            })
             .on('postgres_changes', { event: '*', schema: 'public', table: 'siteSettings' }, (payload) => {
                if(payload.eventType === 'DELETE') dexieDB.siteSettings.delete(payload.old.id);
                else dexieDB.siteSettings.put(payload.new as SiteSettings);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookingSites' }, (payload) => {
              if (payload.eventType === 'DELETE') dexieDB.bookingSites.delete(payload.old.id);
              else dexieDB.bookingSites.put(payload.new as BookingSite);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channels);
        };
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
    return saveDataWithFiles('products', product, { imageUrl: imageFile }, onProgress);
  };
  
  const addOrUpdatePortfolioItem = (item: PortfolioItem, beforeImageFile?: File | null, afterImageFile?: File | null, onProgress?: (percent: number) => void) => {
      return saveDataWithFiles('portfolioItems', item, { beforeImageUrl: beforeImageFile, imageUrl: afterImageFile }, onProgress);
  };

  const addOrUpdateBookingSite = (site: Omit<BookingSite, 'imageUrl'> & { id: string }, imageFile?: File | null, onProgress?: (percent: number) => void) => {
    return saveDataWithFiles('bookingSites', site, { imageUrl: imageFile }, onProgress);
  };

  const updateSiteSettings = async (settings: SiteSettings, files: { [key: string]: File | null }) => {
    return saveDataWithFiles('siteSettings', settings, files);
  };
  
  const deleteDecorProduct = async (id: string) => {
    const item = await dexieDB.decorProducts.get(id);
    if(item && item.image_url) await deleteFromSupabaseStorage(item.image_url);
    await supabase.from('products').delete().eq('id', id);
  };

  const deletePortfolioItem = async (id: string) => {
    const item = await dexieDB.portfolioItems.get(id);
    if (!item) return;
    if(item.imageUrl) await deleteFromSupabaseStorage(item.imageUrl);
    if(item.beforeImageUrl) await deleteFromSupabaseStorage(item.beforeImageUrl);
    await supabase.from('portfolioItems').delete().eq('id', id);
  };

  const deleteBookingSite = async (id: string) => {
    const item = await dexieDB.bookingSites.get(id);
    if (item && item.imageUrl) await deleteFromSupabaseStorage(item.imageUrl);
    await supabase.from('bookingSites').delete().eq('id', id);
  };

  // --- LocalStorage based functions ---
  const addOrder = async (order: Order) => {
    const updatedOrders = [...orders, order];
    setOrders(updatedOrders);
    localStorage.setItem('pavo-orders', JSON.stringify(updatedOrders));
  };
  
  const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => {
     const newBooking: Booking = { 
        ...booking,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        isRead: false
     }
     const updatedBookings = [...bookings, newBooking];
     setBookings(updatedBookings);
     localStorage.setItem('pavo-bookings', JSON.stringify(updatedBookings));
  };
  
  const markBookingAsRead = async (id: string) => {
      const updatedBookings = bookings.map(b => b.id === id ? { ...b, isRead: true } : b);
      setBookings(updatedBookings);
      localStorage.setItem('pavo-bookings', JSON.stringify(updatedBookings));
  };

  const markAllBookingsAsRead = async () => {
    const updatedBookings = bookings.map(b => ({ ...b, isRead: true }));
    setBookings(updatedBookings);
    localStorage.setItem('pavo-bookings', JSON.stringify(updatedBookings));
  };

  // ---- Cart functionality (purely client-side with Dexie) ----
  const cart = useLiveQuery(() => dexieDB.cart.toArray(), []);
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

  const providerValue: DataContextType = {
    portfolioItems: portfolioItems || [],
    decorProducts: decorProducts || [],
    bookingSites: bookingSites || [],
    orders: (orders || []).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    bookings: bookings.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    siteSettings: siteSettings || initialSiteSettings,
    testimonials: testimonials,
    loading: loading || portfolioItems === undefined || decorProducts === undefined || bookingSites === undefined || siteSettings === undefined,
    addOrUpdatePortfolioItem,
    deletePortfolioItem,
    addOrUpdateDecorProduct,
    deleteDecorProduct,
    addOrUpdateBookingSite,
    deleteBookingSite,
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