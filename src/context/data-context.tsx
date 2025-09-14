// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { PortfolioItem, Product, Order, Booking, BookingSite, SiteSettings, CartItem } from '@/lib/types';
import { useAuth } from './auth-context';
import { supabase } from '@/lib/supabase';
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
  addOrUpdatePortfolioItem: (item: Partial<PortfolioItem>, beforeImageFiles: File[], afterImageFiles: File[], onProgress?: (p: number) => void) => Promise<void>;
  deletePortfolioItem: (id: number) => Promise<void>;
  addOrUpdateDecorProduct: (product: Partial<Product>, imageFiles: File[], onProgress?: (p: number) => void) => Promise<void>;
  deleteDecorProduct: (id: number) => Promise<void>;
  addOrUpdateBookingSite: (site: Partial<BookingSite>, imageFiles: File[], onProgress?: (p: number) => void) => Promise<void>;
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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { toast } = useToast();

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
    const localCartId = getCartId();
    if (!localCartId) return;
    try {
      const response = await axios.get(`/api/cart?cartId=${localCartId}`);
      if (response.data) {
        setCart(response.data.cart_items || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch cart:", error.response?.data?.error || error.message);
    }
  }, [getCartId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const uploadFile = useCallback(async (
    collectionName: string,
    file: File,
    onProgress?: (percentage: number) => void
  ) => {
    const UPLOAD_URL = '/api/upload';
    const formData = new FormData();
    
    const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
    });

    formData.append('file', compressedFile, compressedFile.name);
    formData.append('collectionName', collectionName);

    try {
        const response = await axios.post(UPLOAD_URL, formData, {
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            },
        });

        if (response.data.error) {
            throw new Error(response.data.error);
        }
        
        return response.data.publicUrl;

    } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'File upload failed.';
        toast({ variant: 'destructive', title: 'Upload Failed', description: errorMessage });
        throw new Error(errorMessage);
    }
  }, [toast]);
  
  const addOrUpdatePortfolioItem = useCallback(async (item: Partial<PortfolioItem>, beforeImageFiles: File[], afterImageFiles: File[], onProgress?: (p: number) => void) => {
      const itemData = { ...item };
      
      try {
        if (beforeImageFiles?.length > 0) {
          const beforeUrls = await Promise.all(beforeImageFiles.map(file => uploadFile('portfolioItems', file, onProgress)));
          itemData.beforeImageUrls = [...(itemData.beforeImageUrls || []), ...beforeUrls];
        }
        if (afterImageFiles?.length > 0) {
          const afterUrls = await Promise.all(afterImageFiles.map(file => uploadFile('portfolioItems', file, onProgress)));
          itemData.imageUrls = [...(itemData.imageUrls || []), ...afterUrls];
        }

        const { data: savedItem, error } = await supabase
            .from('portfolioItems')
            .upsert(itemData, { onConflict: 'id' })
            .select()
            .single();
        
        if (error) throw error;

        setPortfolioItems(prev => {
            const itemExists = prev.some(p => p.id === savedItem.id);
            if (itemExists) {
                return prev.map(p => p.id === savedItem.id ? savedItem : p);
            } else {
                return [...prev, savedItem];
            }
        });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
          throw error;
      }
  }, [uploadFile, toast]);

  const deletePortfolioItem = useCallback(async (id: number) => {
    const { error } = await supabase.from('portfolioItems').delete().match({ id });
    if (error) {
        toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
        throw error;
    }
    setPortfolioItems(prev => prev.filter(item => item.id !== id));
  }, [toast]);

  const addOrUpdateDecorProduct = useCallback(async (product: Partial<Product>, imageFiles: File[], onProgress?: (p: number) => void) => {
      const productData = { ...product };

      try {
        if (imageFiles?.length > 0) {
            const urls = await Promise.all(imageFiles.map(file => uploadFile('products', file, onProgress)));
            productData.image_urls = [...(productData.image_urls || []), ...urls];
        }

        const { data: savedProduct, error } = await supabase
            .from('products')
            .upsert(productData, { onConflict: 'id' })
            .select()
            .single();
        
        if (error) throw error;

        setDecorProducts(prev => {
            const productExists = prev.some(p => p.id === savedProduct.id);
            if (productExists) {
                return prev.map(p => p.id === savedProduct.id ? savedProduct : p).sort((a,b) => a.name.localeCompare(b.name));
            } else {
                return [...prev, savedProduct].sort((a,b) => a.name.localeCompare(b.name));
            }
        });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
          throw error;
      }
  }, [uploadFile, toast]);

  const deleteDecorProduct = useCallback(async (id: number) => {
    const { error } = await supabase.from('products').delete().match({ id });
    if (error) {
        toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
        throw error;
    }
    setDecorProducts(prev => prev.filter(p => p.id !== id));
  }, [toast]);

  const addOrUpdateBookingSite = useCallback(async (site: Partial<BookingSite>, imageFiles: File[], onProgress?: (p: number) => void) => {
    const siteData = { ...site };
    try {
        if (imageFiles?.length > 0) {
            const urls = await Promise.all(imageFiles.map(file => uploadFile('bookingSites', file, onProgress)));
            siteData.imageUrls = [...(siteData.imageUrls || []), ...urls];
        }
        
        const { data: savedSite, error } = await supabase
            .from('bookingSites')
            .upsert(siteData, { onConflict: 'id' })
            .select()
            .single();
        
        if (error) throw error;
        
        setBookingSites(prev => {
            const siteExists = prev.some(s => s.id === savedSite.id);
            if (siteExists) {
                return prev.map(s => s.id === savedSite.id ? savedSite : s).sort((a,b) => a.name.localeCompare(b.name));
            } else {
                return [...prev, savedSite].sort((a,b) => a.name.localeCompare(b.name));
            }
        });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        throw error;
    }
  }, [uploadFile, toast]);

  const deleteBookingSite = useCallback(async (id: number) => {
    const { error } = await supabase.from('bookingSites').delete().match({ id });
    if (error) {
        toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
        throw error;
    }
    setBookingSites(prev => prev.filter(s => s.id !== id));
  }, [toast]);
  
  const updateSiteSettings = useCallback(async (settings: SiteSettings, files: {[key: string]: File | null}) => {
    const settingsData = { ...settings, id: 1 }; // Ensure ID is 1 for upsert

    try {
        // Handle file uploads for hero images and founder images
        for (const key in files) {
            const file = files[key];
            if (file) {
                const parts = key.split('.'); // e.g. ['heroImages', 'interiors', '0']
                const collection = parts[0]; // e.g. 'heroImages'
                const url = await uploadFile(collection, file);
                
                let current = settingsData as any;
                for (let i = 0; i < parts.length - 1; i++) {
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = url;
            }
        }
        
        const { data: savedSettings, error } = await supabase
            .from('siteSettings')
            .upsert(settingsData, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;
        
        setSiteSettings(savedSettings);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Settings Save Failed', description: error.message });
        throw error;
    }
  }, [uploadFile, toast]);


  const addBooking = useCallback(async (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => {
      const newBooking = { ...booking, isRead: false };
      const { data, error } = await supabase.from('bookings').insert(newBooking).select();
      if (error) {
          toast({ variant: 'destructive', title: 'Booking failed', description: error.message });
          throw error;
      }
      if (data) {
        setBookings(prev => [data[0], ...prev]);
      }
  }, [toast]);

  const markBookingAsRead = useCallback(async (id: number) => {
      await supabase.from('bookings').update({ isRead: true }).match({ id });
      setBookings(prev => prev.map(b => b.id === id ? {...b, isRead: true} : b));
  }, []);
  
  const markAllBookingsAsRead = useCallback(async () => {
    const unreadIds = bookings.filter(b => !b.isRead).map(b => b.id);
    if(unreadIds.length > 0) {
      await supabase.from('bookings').update({ isRead: true }).in('id', unreadIds);
      setBookings(prev => prev.map(b => ({...b, isRead: true})));
    }
  }, [bookings]);

  const addOrder = useCallback((order: Order) => {
    setOrders(prev => [order, ...prev]);
  }, []);
  
  const decreaseStock = useCallback(async (productId: number, quantity: number) => {
    const { error } = await supabase.rpc('decrease_stock', { p_id: productId, p_quantity: quantity });
    if (error) {
       toast({ variant: "destructive", title: "Stock Update Failed", description: error.message });
       console.error("Stock update error:", error);
    }
  }, [toast]);

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
          supabase.from('siteSettings').select('*').eq('id', 1).single(),
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
        ]);
        
        if (isCancelled) return;
        
        if (productsRes.error) throw new Error(`Products fetch failed: ${productsRes.error.message}`);
        if (portfolioRes.error) throw new Error(`Portfolio fetch failed: ${portfolioRes.error.message}`);
        if (bookingsRes.error) throw new Error(`Bookings fetch failed: ${bookingsRes.error.message}`);
        if (bookingSites.error) throw new Error(`Booking Sites fetch failed: ${bookingSitesRes.error.message}`);
        if (settingsRes.error && settingsRes.status !== 406) throw new Error(`Settings fetch failed: ${settingsRes.error.message}`); // 406 = no rows, which is ok on first run
        if (ordersRes.error) throw new Error(`Orders fetch failed: ${ordersRes.error.message}`);
        
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
  }, [toast]);


  useEffect(() => {
    // Real-time subscriptions can be complex and are disabled in favor of manual updates
    // for this version of the context to ensure stability.
  }, []);


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
