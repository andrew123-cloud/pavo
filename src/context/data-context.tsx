// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import type { PavoData, PortfolioItem, Product, Order, SiteSettings, Booking, BookingSite, CartItem } from '@/lib/types';
import { siteSettings as initialSiteSettings, testimonials } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import imageCompression from 'browser-image-compression';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
let supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

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
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);

  // Data states
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [decorProducts, setDecorProducts] = useState<Product[]>([]);
  const [bookingSites, setBookingSites] = useState<BookingSite[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(initialSiteSettings);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Re-initialize Supabase client when auth state changes
  useEffect(() => {
    if (session) {
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${session.access_token}` } },
      });
    } else {
       supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
  }, [session]);
  
  // Load initial data from localStorage for non-db items
  useEffect(() => {
    try {
        const storedBookings = localStorage.getItem('pavo-bookings');
        if (storedBookings) setBookings(JSON.parse(storedBookings));
        const storedOrders = localStorage.getItem('pavo-orders');
        if (storedOrders) setOrders(JSON.parse(storedOrders));
        const storedCart = localStorage.getItem('pavo-cart');
        if (storedCart) setCart(JSON.parse(storedCart));
    } catch (e) { console.error("Failed to parse from localStorage", e); }
  }, []);

  const handlePortfolioChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
        setPortfolioItems(prev => {
            const index = prev.findIndex(item => item.id === newRecord.id);
            if (index !== -1) {
                const updated = [...prev];
                updated[index] = newRecord;
                return updated;
            }
            return [...prev, newRecord];
        });
    } else if (eventType === 'DELETE') {
        setPortfolioItems(prev => prev.filter(item => item.id !== oldRecord.id));
    }
  }, []);

  const handleProductChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
        setDecorProducts(prev => {
            const index = prev.findIndex(p => p.id === newRecord.id);
            if (index !== -1) {
                const updated = [...prev];
                updated[index] = newRecord;
                return updated;
            }
            return [...prev, newRecord];
        });
    } else if (eventType === 'DELETE') {
        setDecorProducts(prev => prev.filter(p => p.id !== oldRecord.id));
    }
  }, []);
  
  const handleBookingSiteChange = useCallback((payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      if (eventType === 'INSERT' || eventType === 'UPDATE') {
          setBookingSites(prev => {
              const index = prev.findIndex(s => s.id === newRecord.id);
              if (index !== -1) {
                  const updated = [...prev];
                  updated[index] = newRecord;
                  return updated;
              }
              return [...prev, newRecord];
          });
      } else if (eventType === 'DELETE') {
          setBookingSites(prev => prev.filter(s => s.id !== oldRecord.id));
      }
  }, []);

  const handleSettingsChange = useCallback((payload: any) => {
      const { new: newRecord } = payload;
      if (newRecord) {
        setSiteSettings(newRecord);
      }
  }, []);

  // Sync Supabase to state on initial load and setup real-time listeners
  useEffect(() => {
    const syncFromSupabase = async () => {
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

            if (productsError) throw new Error(`Products fetch failed: ${productsError.message}`);
            if (portfolioError) throw new Error(`Portfolio fetch failed: ${portfolioError.message}`);
            if (settingsError) throw new Error(`Settings fetch failed: ${settingsError.message}`);
            if (bookingSitesError) throw new Error(`Booking Sites fetch failed: ${bookingSitesError.message}`);
            
            setDecorProducts(productsData || []);
            setPortfolioItems(portfolioData || []);
            setBookingSites(bookingSitesData || []);
            if (settingsData && settingsData.length > 0) {
                setSiteSettings(settingsData[0]);
            } else {
                setSiteSettings(initialSiteSettings);
                // Optionally push initial settings to DB if they don't exist
                await supabase.from('siteSettings').upsert(initialSiteSettings);
            }

        } catch (error: any) {
            console.error("[Supabase Sync] Error syncing data:", error);
            toast({ variant: 'destructive', title: 'Network Error', description: `Could not sync data from server. Some features might not work.`});
        } finally {
            setLoading(false);
        }
    };
    
    syncFromSupabase();

    const portfolioChannel = supabase.channel('portfolioItems_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'portfolioItems' }, handlePortfolioChange).subscribe();
    const productsChannel = supabase.channel('products_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, handleProductChange).subscribe();
    const bookingSitesChannel = supabase.channel('bookingSites_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'bookingSites' }, handleBookingSiteChange).subscribe();
    const settingsChannel = supabase.channel('siteSettings_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'siteSettings' }, handleSettingsChange).subscribe();
    
    return () => {
        supabase.removeChannel(portfolioChannel);
        supabase.removeChannel(productsChannel);
        supabase.removeChannel(bookingSitesChannel);
        supabase.removeChannel(settingsChannel);
    };
  },[session, toast, handlePortfolioChange, handleProductChange, handleBookingSiteChange, handleSettingsChange]);
  
  const deleteFromSupabaseStorage = async (imageUrl: string) => {
    try {
        const urlObj = new URL(imageUrl);
        const path = urlObj.pathname.split('/pavo-assets/')[1];
        if (path) {
            await supabase.storage.from('pavo-assets').remove([path]);
        }
    } catch(error: any) {
        console.error("Error deleting image from Supabase storage:", error);
    }
  };

  const addOrUpdateDecorProduct = async (product: Partial<Product>, imageFile?: File | null, onProgress?: (percent: number) => void) => {
      const { id, ...productData } = product;
      const dataToSave: any = { ...productData };

      if (imageFile) {
          const filePath = `products/${Date.now()}-${imageFile.name}`;
          dataToSave.image_url = await uploadFile(imageFile, filePath, onProgress);
      }
      
      const { data, error } = await supabase.from('products').upsert({ id, ...dataToSave }).select();
      if (error) { toast({variant: 'destructive', title: 'Save Failed', description: error.message}); throw error; }
      return data;
  };
  
  const addOrUpdatePortfolioItem = async (item: Partial<PortfolioItem>, beforeImageFile?: File | null, afterImageFile?: File | null, onProgress?: (percent: number) => void) => {
      const { id, ...itemData } = item;
      const dataToSave: any = { ...itemData };

      if (beforeImageFile) dataToSave.beforeImageUrl = await uploadFile(beforeImageFile, `portfolioItems/${Date.now()}-before-${beforeImageFile.name}`);
      if (afterImageFile) dataToSave.imageUrl = await uploadFile(afterImageFile, `portfolioItems/${Date.now()}-after-${afterImageFile.name}`);

      const { data, error } = await supabase.from('portfolioItems').upsert({ id, ...dataToSave }).select();
      if (error) { toast({variant: 'destructive', title: 'Save Failed', description: error.message}); throw error; }
      return data;
  };

  const addOrUpdateBookingSite = async (site: Partial<BookingSite>, imageFile?: File | null, onProgress?: (percent: number) => void) => {
      const { id, ...siteData } = site;
      const dataToSave: any = { ...siteData };
      
      if (imageFile) dataToSave.imageUrl = await uploadFile(imageFile, `bookingSites/${Date.now()}-${imageFile.name}`, onProgress);

      const { data, error } = await supabase.from('bookingSites').upsert({ id, ...dataToSave }).select();
      if (error) { toast({variant: 'destructive', title: 'Save Failed', description: error.message}); throw error; }
      return data;
  };

  const updateSiteSettings = async (settings: SiteSettings, files: { [key: string]: File | null }) => {
      const dataToSave = JSON.parse(JSON.stringify(settings)); // Deep copy

      for (const key in files) {
          const file = files[key];
          if (file) {
              const publicUrl = await uploadFile(file, `siteSettings/${Date.now()}-${file.name}`);
              const parts = key.split('.');
              let current = dataToSave;
              for (let i = 0; i < parts.length - 1; i++) {
                  current = current[parts[i]];
              }
              current[parts[parts.length - 1]] = publicUrl;
          }
      }
      
      const { data, error } = await supabase.from('siteSettings').upsert(dataToSave).select();
      if (error) { toast({variant: 'destructive', title: 'Save Failed', description: error.message}); throw error; }
      return data;
  };
  
  const deleteDecorProduct = async (id: number) => {
      const itemToDelete = decorProducts.find(p => p.id === id);
      if(itemToDelete?.image_url) await deleteFromSupabaseStorage(itemToDelete.image_url);
      
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) { toast({ variant: 'destructive', title: 'Delete Failed', description: error.message }); throw error; }
  };

  const deletePortfolioItem = async (id: number) => {
      const itemToDelete = portfolioItems.find(p => p.id === id);
      if(itemToDelete?.imageUrl) await deleteFromSupabaseStorage(itemToDelete.imageUrl);
      if(itemToDelete?.beforeImageUrl) await deleteFromSupabaseStorage(itemToDelete.beforeImageUrl);
      
      const { error } = await supabase.from('portfolioItems').delete().eq('id', id);
      if (error) { toast({ variant: 'destructive', title: 'Delete Failed', description: error.message }); throw error; }
  };

  const deleteBookingSite = async (id: number) => {
      const itemToDelete = bookingSites.find(s => s.id === id);
      if (itemToDelete?.imageUrl) await deleteFromSupabaseStorage(itemToDelete.imageUrl);
      
      const { error } = await supabase.from('bookingSites').delete().eq('id', id);
      if (error) { toast({ variant: 'destructive', title: 'Delete Failed', description: error.message }); throw error; }
  };

  const addOrder = async (order: Order) => {
    const updatedOrders = [...orders, order];
    setOrders(updatedOrders);
    localStorage.setItem('pavo-orders', JSON.stringify(updatedOrders));
  };
  
  const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => {
     const newBooking: Booking = { 
        ...booking,
        id: Date.now(),
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

  // ---- Cart functionality ----
  const updateCartInStorage = (updatedCart: CartItem[]) => {
      setCart(updatedCart);
      localStorage.setItem('pavo-cart', JSON.stringify(updatedCart));
  }

  const addToCart = async (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    let updatedCart;
    if (existingItem) {
      updatedCart = cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
    } else {
      const cartProduct: CartItem = { ...product, imageUrl: product.image_url, quantity: 1 };
      updatedCart = [...cart, cartProduct];
    }
    updateCartInStorage(updatedCart);
  };
  
  const updateCartQuantity = async (productId: number, quantity: number) => {
    let updatedCart;
    if (quantity <= 0) {
      updatedCart = cart.filter(item => item.id !== productId);
    } else {
      updatedCart = cart.map(item => item.id === productId ? { ...item, quantity } : item);
    }
    updateCartInStorage(updatedCart);
  };
  
  const removeFromCart = (productId: number) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    updateCartInStorage(updatedCart);
  };
  
  const clearCart = () => {
    updateCartInStorage([]);
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const decreaseStock = async (productId: number, amount: number) => {
    const { error } = await supabase.rpc('decrease_stock', { p_product_id: productId, p_decrease_amount: amount });
    if(error) console.error("Error decreasing stock:", error);
  };

  const providerValue: DataContextType = {
    portfolioItems,
    decorProducts,
    bookingSites,
    orders: orders.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    bookings: bookings.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    siteSettings,
    testimonials: testimonials,
    loading,
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
    cart,
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
