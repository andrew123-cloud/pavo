
// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { PortfolioItem, Product, Order, Booking, BookingSite, SiteSettings, CartItem } from '@/lib/types';
import { useAuth } from './auth-context';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { siteSettings as defaultSiteSettings } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import imageCompression from 'browser-image-compression';

interface PavoDataContextType {
  portfolioItems: PortfolioItem[];
  decorProducts: Product[];
  bookingSites: BookingSite[];
  orders: Order[];
  bookings: Booking[];
  siteSettings: SiteSettings;
  loading: boolean;
  error: string | null;
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addOrUpdatePortfolioItem: (item: Partial<PortfolioItem>, beforeImageFile?: File | null, afterImageFile?: File | null, onProgress?: (p: number) => void) => Promise<void>;
  deletePortfolioItem: (id: number) => Promise<void>;
  addOrUpdateDecorProduct: (product: Partial<Product>, imageFile?: File | null, onProgress?: (p: number) => void) => Promise<void>;
  deleteDecorProduct: (id: number) => Promise<void>;
  addOrUpdateBookingSite: (site: Partial<BookingSite>, imageFile?: File | null, onProgress?: (p: number) => void) => Promise<void>;
  deleteBookingSite: (id: number) => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  markBookingAsRead: (id: number) => void;
  markAllBookingsAsRead: () => void;
  updateSiteSettings: (settings: SiteSettings, files: {[key: string]: File | null}) => Promise<void>;
  addOrder: (order: Order) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  decreaseStock: (productId: number, quantity: number) => Promise<void>;
}

const DataContext = createContext<PavoDataContextType | undefined>(undefined);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { toast } = useToast();

  // Re-initialize Supabase client when auth session changes.
  const supabase = new SupabaseClient(supabaseUrl, supabaseAnonKey, {
      global: {
          headers: {
              Authorization: `Bearer ${session?.access_token}`,
          },
      },
  });

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Application data states
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [decorProducts, setDecorProducts] = useState<Product[]>([]);
  const [bookingSites, setBookingSites] = useState<BookingSite[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Memoized derived state for cart
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);


  // Generic upload function
  const uploadFile = async (file: File, collectionName: string, onProgress?: (p: number) => void): Promise<string> => {
        const compressedFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            onProgress: onProgress,
        });

        const formData = new FormData();
        formData.append('collectionName', collectionName);
        formData.append('imageFile', compressedFile, compressedFile.name);

        const response = await axios.post('/api/saveData', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
             onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    if(onProgress) onProgress(percentCompleted);
                }
            }
        });

        if (response.data.error || !response.data.image_url) {
            throw new Error(response.data.error || 'File upload failed, URL not returned.');
        }
        return response.data.image_url;
  };

  const saveDataWithFiles = async (
    collectionName: string,
    data: any,
    files?: { [key: string]: File | null },
    onProgress?: (percentage: number) => void
  ) => {
    const formData = new FormData();
    formData.append('collectionName', collectionName);

    // Append all data fields to FormData
    for (const key in data) {
        if (data[key] !== null && data[key] !== undefined) {
          const value = data[key];
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
    }
    
    // Append all file fields to FormData
    if (files) {
      for(const key in files) {
        if(files[key]){
           const compressedFile = await imageCompression(files[key]!, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
           });
           formData.append(key, compressedFile, compressedFile.name);
        }
      }
    }

    try {
        const response = await axios.post('/api/saveData', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            },
        });
        
        if (response.data.error) throw new Error(response.data.error);

        return response.data;
    } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred during save.';
        console.error(`Error saving to ${collectionName}:`, errorMessage);
        toast({ variant: 'destructive', title: 'Save Failed', description: errorMessage });
        throw new Error(errorMessage);
    }
  };


  // Stable CRUD function handlers
  const addOrUpdatePortfolioItem = useCallback(async (item: Partial<PortfolioItem>, beforeImageFile?: File | null, afterImageFile?: File | null, onProgress?: (p: number) => void) => {
      const files: { [key: string]: File | null } = {};
      if(beforeImageFile) files['beforeImageFile'] = beforeImageFile;
      if(afterImageFile) files['imageFile'] = afterImageFile;
      await saveDataWithFiles('portfolioItems', item, files, onProgress);
  }, [toast]);

  const deletePortfolioItem = useCallback(async (id: number) => {
    const { error } = await supabase.from('portfolioItems').delete().match({ id });
    if (error) {
        toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
        throw error;
    }
  }, [toast, supabase]);

  const addOrUpdateDecorProduct = useCallback(async (product: Partial<Product>, imageFile?: File | null, onProgress?: (p: number) => void) => {
      const files = imageFile ? { imageFile } : undefined;
      await saveDataWithFiles('products', product, files, onProgress);
  }, [toast]);

  const deleteDecorProduct = useCallback(async (id: number) => {
    const { error } = await supabase.from('products').delete().match({ id });
    if (error) {
        toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
        throw error;
    }
  }, [toast, supabase]);

  const addOrUpdateBookingSite = useCallback(async (site: Partial<BookingSite>, imageFile?: File | null, onProgress?: (p: number) => void) => {
    const files = imageFile ? { imageFile } : undefined;
    await saveDataWithFiles('bookingSites', site, files, onProgress);
  }, [toast]);

  const deleteBookingSite = useCallback(async (id: number) => {
    const { error } = await supabase.from('bookingSites').delete().match({ id });
    if (error) {
        toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
        throw error;
    }
  }, [toast, supabase]);
  
  const updateSiteSettings = useCallback(async (settings: SiteSettings, files: {[key: string]: File | null}) => {
     await saveDataWithFiles('siteSettings', settings, files);
  }, [toast]);

  const addBooking = useCallback(async (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => {
      const newBooking = { ...booking, isRead: false, createdAt: new Date().toISOString() };
      const { error } = await supabase.from('bookings').insert(newBooking);
      if (error) {
          toast({ variant: 'destructive', title: 'Booking failed', description: error.message });
          throw error;
      }
  }, [toast, supabase]);

  const markBookingAsRead = useCallback(async (id: number) => {
      await supabase.from('bookings').update({ isRead: true }).match({ id });
  }, [supabase]);
  
  const markAllBookingsAsRead = useCallback(async () => {
    const unreadIds = bookings.filter(b => !b.isRead).map(b => b.id);
    if(unreadIds.length > 0) {
      await supabase.from('bookings').update({ isRead: true }).in('id', unreadIds);
    }
  }, [supabase, bookings]);

  const addOrder = useCallback((order: Order) => {
    // This is primarily for the client-side flow after payment.
    // The source of truth for orders should ideally be a secure backend that verifies payment.
    setOrders(prev => [order, ...prev]);
    // In a real app, you'd also save this to Supabase from a secure server-side function.
  }, []);
  
  const decreaseStock = useCallback(async (productId: number, quantity: number) => {
    const { error } = await supabase.rpc('decrease_stock', { p_id: productId, p_quantity: quantity });
    if (error) {
       toast({ variant: "destructive", title: "Stock Update Failed", description: error.message });
       console.error("Stock update error:", error);
    }
  }, [supabase, toast]);


  // --- Cart Logic ---
  useEffect(() => {
    const savedCart = localStorage.getItem('pavo-cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('pavo-cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('pavo-cart');
    }
  }, [cart]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, item.stock) }
            : item
        );
      }
      const cartItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        imageUrl: product.image_url,
        aiHint: product.aiHint,
        stock: product.stock,
        quantity: quantity,
      };
      return [...prevCart, cartItem];
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity: Math.min(quantity, item.stock) } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);


  // --- Initial Data Load ---
  useEffect(() => {
    const syncFromSupabase = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          productsRes,
          portfolioRes,
          bookingsRes,
          bookingSitesRes,
          settingsRes,
          ordersRes
        ] = await Promise.all([
          supabase.from('products').select('*').order('name'),
          supabase.from('portfolioItems').select('*').order('id'),
          supabase.from('bookings').select('*').order('createdAt', { ascending: false }),
          supabase.from('bookingSites').select('*').order('name'),
          supabase.from('siteSettings').select('*').eq('id', 'default').single(),
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
        ]);

        if (productsRes.error) throw new Error(`Products fetch failed: ${productsRes.error.message}`);
        if (portfolioRes.error) throw new Error(`Portfolio fetch failed: ${portfolioRes.error.message}`);
        if (bookingsRes.error) throw new Error(`Bookings fetch failed: ${bookingsRes.error.message}`);
        if (bookingSitesRes.error) throw new Error(`Booking Sites fetch failed: ${bookingSitesRes.error.message}`);
        if (settingsRes.error && settingsRes.status !== 406) throw new Error(`Settings fetch failed: ${settingsRes.error.message}`);
        if (ordersRes.error) throw new Error(`Orders fetch failed: ${ordersRes.error.message}`);
        
        setDecorProducts(productsRes.data || []);
        setPortfolioItems(portfolioRes.data || []);
        setBookings(bookingsRes.data || []);
        setBookingSites(bookingSitesRes.data || []);
        setOrders(ordersRes.data || []);
        if(settingsRes.data) setSiteSettings(settingsRes.data);

      } catch (e: any) {
        console.error('[Supabase Sync] Error syncing data:', e);
        setError(e.message);
        toast({ variant: 'destructive', title: 'Data Sync Failed', description: e.message });
      } finally {
        setLoading(false);
      }
    };
    syncFromSupabase();
  }, [supabase]); // Re-sync if the supabase client instance changes (i.e., on login/logout)


  // --- Real-time Subscriptions ---
  useEffect(() => {
    const handlePortfolioChange = (payload: any) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setPortfolioItems(prev => {
                const index = prev.findIndex(item => item.id === payload.new.id);
                if (index > -1) {
                    const newItems = [...prev];
                    newItems[index] = payload.new;
                    return newItems;
                }
                return [...prev, payload.new];
            });
        } else if (payload.eventType === 'DELETE') {
            setPortfolioItems(prev => prev.filter(item => item.id !== payload.old.id));
        }
    };
    const handleProductChange = (payload: any) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setDecorProducts(prev => {
                const index = prev.findIndex(item => item.id === payload.new.id);
                if (index > -1) {
                    const newItems = [...prev];
                    newItems[index] = payload.new;
                    return newItems;
                }
                return [...prev, payload.new];
            });
        } else if (payload.eventType === 'DELETE') {
            setDecorProducts(prev => prev.filter(item => item.id !== payload.old.id));
        }
    };
    const handleBookingChange = (payload: any) => {
         if (payload.eventType === 'INSERT') {
            setBookings(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
             setBookings(prev => prev.map(b => b.id === payload.new.id ? payload.new : b));
        }
    };
     const handleBookingSiteChange = (payload: any) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setBookingSites(prev => {
                const index = prev.findIndex(item => item.id === payload.new.id);
                if (index > -1) {
                    const newItems = [...prev];
                    newItems[index] = payload.new;
                    return newItems;
                }
                return [...prev, payload.new];
            });
        } else if (payload.eventType === 'DELETE') {
            setBookingSites(prev => prev.filter(item => item.id !== payload.old.id));
        }
    };
    const handleSettingsChange = (payload: any) => {
      if(payload.eventType === 'UPDATE' && payload.new.id === 'default') {
        setSiteSettings(payload.new);
      }
    };

    const portfolioChannel = supabase.channel('portfolioItems').on('postgres_changes', { event: '*', schema: 'public', table: 'portfolioItems' }, handlePortfolioChange).subscribe();
    const productsChannel = supabase.channel('products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, handleProductChange).subscribe();
    const bookingsChannel = supabase.channel('bookings').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, handleBookingChange).subscribe();
    const bookingSitesChannel = supabase.channel('bookingSites').on('postgres_changes', { event: '*', schema: 'public', table: 'bookingSites' }, handleBookingSiteChange).subscribe();
    const siteSettingsChannel = supabase.channel('siteSettings').on('postgres_changes', { event: '*', schema: 'public', table: 'siteSettings' }, handleSettingsChange).subscribe();

    return () => {
      supabase.removeChannel(portfolioChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(bookingSitesChannel);
      supabase.removeChannel(siteSettingsChannel);
    };
  }, [supabase]);


  const contextValue: PavoDataContextType = {
    portfolioItems,
    decorProducts,
    bookingSites,
    orders,
    bookings,
    siteSettings,
    loading,
    error,
    addOrUpdatePortfolioItem,
    deletePortfolioItem,
    addOrUpdateDecorProduct,
    deleteDecorProduct,
    addOrUpdateBookingSite,
    deleteBookingSite,
    addBooking,
    markBookingAsRead,
    markAllBookingsAsRead,
    updateSiteSettings,
    addOrder,
    cart,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    decreaseStock,
  };

  return (
    <DataContext.Provider value={contextValue}>
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
