
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
import { v4 as uuidv4 } from 'uuid';

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
  cartId: string | null;
  addOrUpdatePortfolioItem: (item: Partial<PortfolioItem>, beforeImageFile?: File | null, afterImageFile?: File | null, onProgress?: (p: number) => void) => Promise<void>;
  deletePortfolioItem: (id: number) => Promise<void>;
  addOrUpdateDecorProduct: (product: Partial<Product>, imageFile?: File | null, onProgress?: (p: number) => void) => Promise<void>;
  deleteDecorProduct: (id: number) => Promise<void>;
  addOrUpdateBookingSite: (site: Partial<BookingSite>, imageFile?: File | null, onProgress?: (p: number) => void) => Promise<void>;
  deleteBookingSite: (id: number) => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  markBookingAsRead: (id: number) => Promise<void>;
  markAllBookingsAsRead: () => Promise<void>;
  updateSiteSettings: (settings: SiteSettings, files: {[key: string]: File | null}) => Promise<void>;
  addOrder: (order: Order) => void;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateCartQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  decreaseStock: (productId: number, quantity: number) => Promise<void>;
}

const DataContext = createContext<PavoDataContextType | undefined>(undefined);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { session, user } = useAuth();
  const { toast } = useToast();

  const [supabase, setSupabase] = useState(() => createClient(supabaseUrl, supabaseAnonKey));

  useEffect(() => {
    if (session) {
      const newSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      });
      setSupabase(newSupabaseClient);
    } else {
      setSupabase(createClient(supabaseUrl, supabaseAnonKey));
    }
  }, [session]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [decorProducts, setDecorProducts] = useState<Product[]>([]);
  const [bookingSites, setBookingSites] = useState<BookingSite[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  
  const getCartId = useCallback(() => {
    let id = localStorage.getItem('pavo-cart-id');
    if (!id) {
        id = uuidv4();
        localStorage.setItem('pavo-cart-id', id);
    }
    setCartId(id);
    return id;
  }, []);

  const fetchCart = useCallback(async () => {
    if (!cartId) return;
    try {
      const response = await axios.get(`/api/cart?cartId=${cartId}`);
      if (response.data) {
        setCart(response.data.cart_items || []);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    }
  }, [cartId]);

  useEffect(() => {
    const id = getCartId();
    if(id) {
      setCartId(id);
    }
  }, [getCartId]);

  useEffect(() => {
    if(cartId) {
        fetchCart();
    }
  }, [cartId, fetchCart]);


  const saveDataWithFiles = useCallback(async (
    collectionName: string,
    data: any,
    files?: { [key: string]: File | null },
    onProgress?: (percentage: number) => void
  ) => {
    const formData = new FormData();
    formData.append('collectionName', collectionName);

    for (const key in data) {
        if (data[key] !== null && data[key] !== undefined) {
          const value = data[key];
          if (typeof value === 'object' && !Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
    }
    
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
  }, [toast]);
  
  const addOrUpdatePortfolioItem = useCallback(async (item: Partial<PortfolioItem>, beforeImageFile?: File | null, afterImageFile?: File | null, onProgress?: (p: number) => void) => {
      const files: { [key: string]: File | null } = {};
      if(beforeImageFile) files['beforeImageFile'] = beforeImageFile;
      if(afterImageFile) files['imageFile'] = afterImageFile;
      await saveDataWithFiles('portfolioItems', item, files, onProgress);
  }, [saveDataWithFiles]);

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
  }, [saveDataWithFiles]);

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
  }, [saveDataWithFiles]);

  const deleteBookingSite = useCallback(async (id: number) => {
    const { error } = await supabase.from('bookingSites').delete().match({ id });
    if (error) {
        toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
        throw error;
    }
  }, [toast, supabase]);
  
  const updateSiteSettings = useCallback(async (settings: SiteSettings, files: {[key: string]: File | null}) => {
     await saveDataWithFiles('siteSettings', settings, files);
  }, [saveDataWithFiles]);

  const addBooking = useCallback(async (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => {
      const newBooking = { ...booking, isRead: false };
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
    setOrders(prev => [order, ...prev]);
  }, []);
  
  const decreaseStock = useCallback(async (productId: number, quantity: number) => {
    const { error } = await supabase.rpc('decrease_stock', { p_id: productId, p_quantity: quantity });
    if (error) {
       toast({ variant: "destructive", title: "Stock Update Failed", description: error.message });
       console.error("Stock update error:", error);
    }
  }, [supabase, toast]);

  // --- CART FUNCTIONS ---
  const addToCart = useCallback(async (product: Product, quantity = 1) => {
    if(!cartId) return;
    try {
        const response = await axios.post('/api/cart', {
            cartId,
            productId: product.id,
            quantity
        });
        setCart(response.data.cart_items);
    } catch(err) {
        console.error("Error adding to cart:", err);
        toast({ variant: "destructive", title: "Could not add item", description: "Failed to update your cart. Please try again." });
    }
  }, [cartId, toast]);

  const removeFromCart = useCallback(async (productId: number) => {
    if(!cartId) return;
    try {
      const response = await axios.delete(`/api/cart?cartId=${cartId}&productId=${productId}`);
      setCart(response.data.cart_items);
    } catch(err) {
      console.error("Error removing from cart:", err);
      toast({ variant: "destructive", title: "Could not remove item", description: "Failed to update your cart. Please try again." });
    }
  }, [cartId, toast]);

  const updateCartQuantity = useCallback(async (productId: number, quantity: number) => {
    if (quantity <= 0) {
        await removeFromCart(productId);
        return;
    }
    if(!cartId) return;
    try {
        const response = await axios.put('/api/cart', { cartId, productId, quantity });
        setCart(response.data.cart_items);
    } catch(err) {
        console.error("Error updating cart quantity:", err);
        toast({ variant: "destructive", title: "Update failed", description: "Failed to update your cart quantity. Please try again." });
    }
  }, [cartId, removeFromCart, toast]);

  const clearCart = useCallback(async () => {
    if(!cartId) return;
     try {
        await axios.delete(`/api/cart?cartId=${cartId}&clear=true`);
        setCart([]);
    } catch(err) {
        console.error("Error clearing cart:", err);
        toast({ variant: "destructive", title: "Clear cart failed", description: "Could not clear your cart. Please try again." });
    }
  }, [cartId, toast]);
  

  useEffect(() => {
    let isCancelled = false;

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
        
        if (isCancelled) return;

        if (productsRes.error) throw productsRes.error;
        if (portfolioRes.error) throw portfolioRes.error;
        if (bookingsRes.error) throw bookingsRes.error;
        if (bookingSitesRes.error) throw bookingSitesRes.error;
        if (settingsRes.error && settingsRes.status !== 406) throw settingsRes.error; // 406 = no rows, which is ok on first run
        if (ordersRes.error) throw ordersRes.error;
        
        setDecorProducts(productsRes.data || []);
        setPortfolioItems(portfolioRes.data || []);
        setBookings(bookingsRes.data || []);
        setBookingSites(bookingSitesRes.data || []);
        setOrders(ordersRes.data || []);
        if(settingsRes.data) setSiteSettings(settingsRes.data);

      } catch (e: any) {
        const errorMessage = e.message || 'An unknown error occurred during data sync.';
        console.error('[Supabase Sync] Error syncing data:', errorMessage);
        setError(errorMessage);
        toast({ variant: 'destructive', title: 'Data Sync Failed', description: errorMessage });
      } finally {
        if (!isCancelled) {
            setLoading(false);
        }
      }
    };
    
    syncFromSupabase();

    return () => {
        isCancelled = true;
    }
  }, [supabase, toast]);


  useEffect(() => {
    const handlePortfolioChange = (payload: any) => {
      if (payload.eventType === 'INSERT') setPortfolioItems(prev => [...prev, payload.new]);
      if (payload.eventType === 'UPDATE') setPortfolioItems(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
      if (payload.eventType === 'DELETE') setPortfolioItems(prev => prev.filter(item => item.id !== payload.old.id));
    };
    const handleProductChange = (payload: any) => {
      if (payload.eventType === 'INSERT') setDecorProducts(prev => [...prev, payload.new]);
      if (payload.eventType === 'UPDATE') setDecorProducts(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
      if (payload.eventType === 'DELETE') setDecorProducts(prev => prev.filter(item => item.id !== payload.old.id));
    };
    const handleBookingChange = (payload: any) => {
      if (payload.eventType === 'INSERT') setBookings(prev => [payload.new, ...prev]);
      if (payload.eventType === 'UPDATE') setBookings(prev => prev.map(b => b.id === payload.new.id ? payload.new : b));
    };
    const handleBookingSiteChange = (payload: any) => {
      if (payload.eventType === 'INSERT') setBookingSites(prev => [...prev, payload.new]);
      if (payload.eventType === 'UPDATE') setBookingSites(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
      if (payload.eventType === 'DELETE') setBookingSites(prev => prev.filter(item => item.id !== payload.old.id));
    };
    const handleSettingsChange = (payload: any) => {
      if(payload.eventType === 'UPDATE' && payload.new.id === 'default') setSiteSettings(payload.new);
    };

    const portfolioChannel = supabase.channel('portfolioItems').on('postgres_changes', { event: '*', schema: 'public', table: 'portfolioItems' }, handlePortfolioChange).subscribe();
    const productsChannel = supabase.channel('products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, handleProductChange).subscribe();
    const bookingsChannel = supabase.channel('bookings').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, handleBookingChange).subscribe();
    const bookingSitesChannel = supabase.channel('bookingSites').on('postgres_changes', { event: '*', schema: 'public', table: 'bookingSites' }, handleBookingSiteChange).subscribe();
    const settingsChannel = supabase.channel('siteSettings').on('postgres_changes', { event: '*', schema: 'public', table: 'siteSettings' }, handleSettingsChange).subscribe();
    

    return () => {
      supabase.removeChannel(portfolioChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(bookingSitesChannel);
      supabase.removeChannel(settingsChannel);
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
    cartId,
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
