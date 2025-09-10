
// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import type { PavoData, PortfolioItem, Product, Order, SiteSettings, Booking, BookingSite } from '@/lib/types';
import { siteSettings as initialSiteSettings, testimonials } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as dexieDB, CartItem } from '@/lib/db';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';


interface DataContextType extends PavoData {
  loading: boolean;
  addOrUpdatePortfolioItem: (item: Partial<PortfolioItem>, beforeImageFile?: File | null, afterImageFile?: File | null, onProgress?: (percent: number) => void) => Promise<any>;
  deletePortfolioItem: (id: number) => Promise<void>;
  addOrUpdateDecorProduct: (product: Partial<Product>, imageFile?: File | null, onProgress?: (percent: number) => void) => Promise<any>;
  deleteDecorProduct: (id: number) => Promise<void>;
  addOrUpdateBookingSite: (site: Partial<BookingSite>, imageFile?: File | null, onProgress?: (percent: number) => void) => Promise<any>;
  deleteBookingSite: (id: number) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  decreaseStock: (productId: number, amount: number) => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  markBookingAsRead: (id: number) => Promise<void>;
  markAllBookingsAsRead: () => Promise<void>;
  updateSiteSettings: (settings: SiteSettings, files: { [key: string]: File | null }) => Promise<void>;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateCartQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper for compressing and uploading a single file to Supabase Storage
const uploadFile = async (file: File, bucketPath: string, onProgress?: (percent: number) => void) => {
    const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        onProgress: (p: number) => {
            if (onProgress) onProgress(p * 0.5); // Compression is first 50%
        },
    };
    
    const compressedFile = await imageCompression(file, compressionOptions);
    const { error: uploadError } = await supabase.storage
        .from('pavo-assets')
        .upload(bucketPath, compressedFile, {
            upsert: true,
            contentType: compressedFile.type,
        });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from('pavo-assets')
        .getPublicUrl(bucketPath);
    
    return publicUrl;
};


export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Dexie live queries for Supabase-backed data
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

  // Sync Supabase to Dexie on initial load
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

            const errors = { productsError, portfolioError, settingsError, bookingSitesError };
            for (const [key, error] of Object.entries(errors)) {
                if (error) throw error;
            }
            
            await dexieDB.transaction('rw', dexieDB.tables, async () => {
                if (portfolioData) await dexieDB.portfolioItems.bulkPut(portfolioData);
                if (productsData) await dexieDB.decorProducts.bulkPut(productsData);
                if (bookingSitesData) await dexieDB.bookingSites.bulkPut(bookingSitesData);
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
        const urlObj = new URL(imageUrl);
        const path = urlObj.pathname.split('/pavo-assets/')[1];
        if (path) {
            await supabase.storage.from('pavo-assets').remove([path]);
        }
    } catch(error: any) {
        console.error("Error deleting image from Supabase storage:", error);
        // Do not re-throw, allow the database record deletion to proceed
    }
  };

  const addOrUpdateDecorProduct = (product: Partial<Product>, imageFile?: File | null, onProgress?: (percent: number) => void) => {
    return new Promise(async (resolve, reject) => {
        try {
            const dataToSave: any = { ...product };
            if (dataToSave.id) { // This is an update
                delete dataToSave.id;
            }

            if (imageFile) {
                const filePath = `products/${Date.now()}-${imageFile.name}`;
                const imageUrl = await uploadFile(imageFile, filePath, onProgress);
                dataToSave.image_url = imageUrl;
            }

            const { data, error } = await supabase.from('products').upsert(dataToSave).select();
            if (error) throw error;
            resolve(data);
        } catch (error) {
            reject(error);
        }
    });
  };
  
  const addOrUpdatePortfolioItem = (item: Partial<PortfolioItem>, beforeImageFile?: File | null, afterImageFile?: File | null, onProgress?: (percent: number) => void) => {
    return new Promise(async (resolve, reject) => {
        try {
            const dataToSave: any = { ...item };
            if (dataToSave.id) {
                delete dataToSave.id;
            }

            if (beforeImageFile) {
                const filePath = `portfolioItems/${Date.now()}-before-${beforeImageFile.name}`;
                dataToSave.beforeImageUrl = await uploadFile(beforeImageFile, filePath);
            }
            if (afterImageFile) {
                const filePath = `portfolioItems/${Date.now()}-after-${afterImageFile.name}`;
                dataToSave.imageUrl = await uploadFile(afterImageFile, filePath);
            }
            const { data, error } = await supabase.from('portfolioItems').upsert(dataToSave).select();
            if (error) throw error;
            resolve(data);
        } catch (error) {
            reject(error);
        }
    });
  };

  const addOrUpdateBookingSite = (site: Partial<BookingSite>, imageFile?: File | null, onProgress?: (percent: number) => void) => {
    return new Promise(async (resolve, reject) => {
        try {
            const dataToSave: any = { ...site };
            if (dataToSave.id) {
                delete dataToSave.id;
            }
            if (imageFile) {
                const filePath = `bookingSites/${Date.now()}-${imageFile.name}`;
                const imageUrl = await uploadFile(imageFile, filePath, onProgress);
                dataToSave.imageUrl = imageUrl;
            }
            const { data, error } = await supabase.from('bookingSites').upsert(dataToSave).select();
            if (error) throw error;
            resolve(data);
        } catch (error) {
            reject(error);
        }
    });
  };

  const updateSiteSettings = (settings: SiteSettings, files: { [key: string]: File | null }) => {
     return new Promise(async (resolve, reject) => {
        try {
        const dataToSave = JSON.parse(JSON.stringify(settings)); // Deep copy

        for (const key in files) {
            const file = files[key];
            if (file) {
                const filePath = `siteSettings/${Date.now()}-${file.name}`;
                const publicUrl = await uploadFile(file, filePath);
                
                const parts = key.split('.');
                let current = dataToSave;
                for (let i = 0; i < parts.length - 1; i++) {
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = publicUrl;
            }
        }
        
        const { data, error } = await supabase.from('siteSettings').upsert(dataToSave).select();
        if (error) throw error;
        resolve(data);
        } catch (error) {
            reject(error);
        }
    });
  };
  
  const deleteDecorProduct = async (id: number) => {
    try {
        const item = await dexieDB.decorProducts.get(id);
        if(item && item.image_url) await deleteFromSupabaseStorage(item.image_url);
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
    } catch (e: any) {
         toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
         throw e;
    }
  };

  const deletePortfolioItem = async (id: number) => {
    try {
        const item = await dexieDB.portfolioItems.get(id);
        if (!item) return;
        if(item.imageUrl) await deleteFromSupabaseStorage(item.imageUrl);
        if(item.beforeImageUrl) await deleteFromSupabaseStorage(item.beforeImageUrl);
        const { error } = await supabase.from('portfolioItems').delete().eq('id', id);
        if (error) throw error;
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        throw e;
    }
  };

  const deleteBookingSite = async (id: number) => {
     try {
        const item = await dexieDB.bookingSites.get(id);
        if (item && item.imageUrl) await deleteFromSupabaseStorage(item.imageUrl);
        const { error } = await supabase.from('bookingSites').delete().eq('id', id);
        if (error) throw error;
     } catch (e: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        throw e;
     }
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
        id: Math.floor(Math.random() * 1000000), // temp id
        createdAt: new Date().toISOString(),
        isRead: false
     }
     const updatedBookings = [...bookings, newBooking];
     setBookings(updatedBookings);
     localStorage.setItem('pavo-bookings', JSON.stringify(updatedBookings));
  };
  
  const markBookingAsRead = async (id: number) => {
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
  const updateCartQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      await dexieDB.cart.delete(productId);
    } else {
      await dexieDB.cart.update(productId, { quantity });
    }
  };
  const removeFromCart = (productId: number) => dexieDB.cart.delete(productId);
  const clearCart = () => dexieDB.cart.clear();
  const cartTotal = (cart || []).reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = (cart || []).reduce((count, item) => count + item.quantity, 0);

  const decreaseStock = async (productId: number, amount: number) => {
    const { error } = await supabase.rpc('decrease_stock', { p_product_id: productId, p_decrease_amount: amount });
    if(error) console.error("Error decreasing stock:", error);
  };

  const providerValue: DataContextType = {
    portfolioItems: portfolioItems || [],
    decorProducts: decorProducts || [],
    bookingSites: bookingSites || [],
    orders: (orders || []).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    bookings: (bookings || []).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
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
