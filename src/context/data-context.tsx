
// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import type { PavoData, PortfolioItem, Product, Order, SiteSettings, Booking, BookingSite } from '@/lib/types';
import { siteSettings as initialSiteSettings, testimonials } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as dexieDB, CartItem } from '@/lib/db';
import imageCompression from 'browser-image-compression';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from './auth-context';


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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
let supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);


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
  const { session } = useAuth(); // Use the session from AuthContext
  const [loading, setLoading] = useState(true);

  // Re-initialize Supabase client when auth state changes
  useEffect(() => {
    if (session) {
      const newSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${session.access_token}` } },
      });
      supabase = newSupabaseClient;
    } else {
       supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
  }, [session]);


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

  // Sync Supabase to Dexie on initial load and setup real-time listeners
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
    };
    
    syncFromSupabase();

    const handleChanges = (payload: any) => {
        console.log('Realtime Change received!', payload);
        const { eventType, table, new: newRecord, old: oldRecord } = payload;
        
        let targetTable: any;
        switch(table) {
            case 'products': targetTable = dexieDB.decorProducts; break;
            case 'portfolioItems': targetTable = dexieDB.portfolioItems; break;
            case 'bookingSites': targetTable = dexieDB.bookingSites; break;
            case 'siteSettings': targetTable = dexieDB.siteSettings; break;
            default: return;
        }

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
            if (newRecord) {
                targetTable.put(newRecord).catch((err: any) => console.error(`Dexie put error in ${table}:`, err));
            }
        } else if (eventType === 'DELETE') {
            if (oldRecord && oldRecord.id) {
                targetTable.delete(oldRecord.id).catch((err: any) => console.error(`Dexie delete error in ${table}:`, err));
            }
        }
    };

    const channels = supabase.channel('pavo-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, handleChanges)
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log('Connected to Supabase real-time!');
            }
            if (status === 'CHANNEL_ERROR') {
                console.error('Real-time channel error:', err);
            }
        });

    return () => {
        supabase.removeChannel(channels);
    };
   // eslint-disable-next-line react-hooks/exhaustive-deps
   },[session]); // Rerun effect when session changes to get new data for new user
  
  
  const deleteFromSupabaseStorage = async (imageUrl: string) => {
    try {
        // Correctly extract the path from the public URL
        const urlObj = new URL(imageUrl);
        const path = urlObj.pathname.split('/pavo-assets/')[1];
        if (path) {
            console.log(`Attempting to delete from storage: pavo-assets/${path}`);
            const { error } = await supabase.storage.from('pavo-assets').remove([path]);
            if (error) throw error;
        }
    } catch(error: any) {
        console.error("Error deleting image from Supabase storage:", error);
        // Do not re-throw, allow the database record deletion to proceed
    }
  };

  const addOrUpdateDecorProduct = (product: Partial<Product>, imageFile?: File | null, onProgress?: (percent: number) => void): Promise<any> => {
    return new Promise(async (resolve, reject) => {
        try {
            const { id, ...productData } = product;
            const dataToSave: any = { ...productData };

            if (imageFile) {
                const filePath = `products/${Date.now()}-${imageFile.name}`;
                const imageUrl = await uploadFile(imageFile, filePath, onProgress);
                dataToSave.image_url = imageUrl;
            }
            
            const recordToSave = id ? { id, ...dataToSave } : dataToSave;
            const { data, error } = await supabase.from('products').upsert(recordToSave).select();
            
            if (error) throw error;
            resolve(data);
        } catch (error) {
            reject(error);
        }
    });
  };
  
  const addOrUpdatePortfolioItem = (item: Partial<PortfolioItem>, beforeImageFile?: File | null, afterImageFile?: File | null, onProgress?: (percent: number) => void): Promise<any> => {
    return new Promise(async (resolve, reject) => {
        try {
            const { id, ...itemData } = item;
            const dataToSave: any = { ...itemData };

            if (beforeImageFile) {
                const filePath = `portfolioItems/${Date.now()}-before-${beforeImageFile.name}`;
                dataToSave.beforeImageUrl = await uploadFile(beforeImageFile, filePath);
            }
            if (afterImageFile) {
                const filePath = `portfolioItems/${Date.now()}-after-${afterImageFile.name}`;
                dataToSave.imageUrl = await uploadFile(afterImageFile, filePath);
            }

            const recordToSave = id ? { id, ...dataToSave } : dataToSave;
            const { data, error } = await supabase.from('portfolioItems').upsert(recordToSave).select();

            if (error) throw error;
            resolve(data);
        } catch (error) {
            reject(error);
        }
    });
  };

  const addOrUpdateBookingSite = (site: Partial<BookingSite>, imageFile?: File | null, onProgress?: (percent: number) => void): Promise<any> => {
    return new Promise(async (resolve, reject) => {
        try {
            const { id, ...siteData } = site;
            const dataToSave: any = { ...siteData };
            
            if (imageFile) {
                const filePath = `bookingSites/${Date.now()}-${imageFile.name}`;
                const imageUrl = await uploadFile(imageFile, filePath, onProgress);
                dataToSave.imageUrl = imageUrl;
            }

            const recordToSave = id ? { id, ...dataToSave } : dataToSave;
            const { data, error } = await supabase.from('bookingSites').upsert(recordToSave).select();
            
            if (error) throw error;
            resolve(data);
        } catch (error) {
            reject(error);
        }
    });
  };

  const updateSiteSettings = (settings: SiteSettings, files: { [key: string]: File | null }): Promise<any> => {
     return new Promise(async (resolve, reject) => {
        try {
        const dataToSave = JSON.parse(JSON.stringify(settings)); // Deep copy

        for (const key in files) {
            const file = files[key];
            if (file) {
                const filePath = `siteSettings/${Date.now()}-${file.name}`;
                const publicUrl = await uploadFile(file, filePath);
                
                // This logic correctly handles nested paths like "heroImages.suite.0"
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
        const itemToDelete = await dexieDB.decorProducts.get(id);
        if(itemToDelete && itemToDelete.image_url) await deleteFromSupabaseStorage(itemToDelete.image_url);
        
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        
    } catch (e: any) {
         toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
         throw e;
    }
  };

  const deletePortfolioItem = async (id: number) => {
    try {
        const itemToDelete = await dexieDB.portfolioItems.get(id);
        if (!itemToDelete) return;
        
        if(itemToDelete.imageUrl) await deleteFromSupabaseStorage(itemToDelete.imageUrl);
        if(itemToDelete.beforeImageUrl) await deleteFromSupabaseStorage(itemToDelete.beforeImageUrl);
        
        const { error } = await supabase.from('portfolioItems').delete().eq('id', id);
        if (error) throw error;

    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        throw e;
    }
  };

  const deleteBookingSite = async (id: number) => {
     try {
        const itemToDelete = await dexieDB.bookingSites.get(id);
        if (itemToDelete && itemToDelete.imageUrl) await deleteFromSupabaseStorage(itemToDelete.imageUrl);
        
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
        id: Date.now(), // Use timestamp for a simple unique ID
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
