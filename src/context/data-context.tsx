// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { PavoData, PortfolioItem, Product, Property, Order, SiteSettings, Booking } from '@/lib/types';
import { siteSettings as initialSiteSettings } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, writeBatch, getDoc, orderBy, query, onSnapshot, addDoc, serverTimestamp, Timestamp, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface CartItem extends Product {
  quantity: number;
}

interface DataContextType extends PavoData {
  loading: boolean;
  // This context will no longer handle direct mutations for products/properties/portfolio
  // It will only be responsible for reading data and optimistic UI updates for deletes.
  // Adds/Updates are now handled by the serverless function.
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
  const [data, setData] = useState<PavoData>({
    portfolioItems: [],
    decorProducts: [],
    rentalProperties: [],
    orders: [],
    bookings: [],
    siteSettings: initialSiteSettings,
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('pavo-cart');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
    }
    setIsCartLoaded(true);
  }, []);

  useEffect(() => {
    if (isCartLoaded) {
      localStorage.setItem('pavo-cart', JSON.stringify(cart));
    }
  }, [cart, isCartLoaded]);
  
  useEffect(() => {
    setLoading(true);
    const collections = {
        portfolioItems: 'portfolioItems',
        decorProducts: 'decorProducts',
        rentalProperties: 'rentalProperties',
        orders: 'orders',
        bookings: 'bookings',
    };

    const unsubs: (() => void)[] = [];

    const fetchInitialDataAndListen = async () => {
        try {
            for (const [key, collectionName] of Object.entries(collections)) {
                let q = query(collection(db, collectionName));
                if (collectionName === 'orders') {
                    q = query(collection(db, collectionName), orderBy('created_at', 'desc'));
                } else if (collectionName === 'bookings') {
                    q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
                }
                
                const unsub = onSnapshot(q, (snapshot) => {
                    const items = snapshot.docs.map(doc => {
                        const docData = doc.data();
                        const id = doc.id;
                        // Handle date serialization properly
                        if (docData.createdAt && docData.createdAt instanceof Timestamp) {
                            return { id, ...docData, createdAt: docData.createdAt.toDate().toISOString() };
                        }
                        if (docData.created_at && typeof docData.created_at === 'string') {
                           return { id, ...docData };
                        }
                         if (docData.created_at) { // Assume it could be a Timestamp from older data
                            return { id, ...docData, created_at: new Date(docData.created_at).toISOString() };
                        }
                        return { id, ...docData };
                    });
                    setData(prev => ({ ...prev, [key]: items as any }));
                }, (error) => console.error(`Error listening to ${collectionName}:`, error));
                unsubs.push(unsub);
            }

            const settingsDocRef = doc(db, 'settings', 'site');
            const settingsUnsub = onSnapshot(settingsDocRef, (doc) => {
                if (doc.exists()) {
                    setData(prev => ({ ...prev, siteSettings: doc.data() as SiteSettings }));
                }
            }, (error) => console.error("Error listening to site settings:", error));
            unsubs.push(settingsUnsub);

        } catch (error) {
            console.error("Failed to set up listeners:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
        } finally {
            setLoading(false);
        }
    };
    
    fetchInitialDataAndListen();

    return () => {
        unsubs.forEach(unsub => unsub());
    };
  }, [toast]);

  const addOperation = async (collectionName: string, data: any, successMsg: string) => {
    try {
      await addDoc(collection(db, collectionName), data);
      toast({ title: 'Success', description: successMsg });
    } catch (error) {
      console.error(`Error adding to ${collectionName}:`, error);
      toast({ variant: 'destructive', title: 'Error', description: `Could not save the item. Please check your connection and try again.` });
      throw error;
    }
  };

  const updateOperation = async (collectionName: string, id: string, data: any, successMsg: string) => {
    try {
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, data, { merge: true });
      toast({ title: 'Success', description: successMsg });
    } catch (error) {
      console.error(`Error updating ${collectionName}:`, error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update the item. Please try again.' });
      throw error;
    }
  };

  const deleteOperation = async (collectionName: string, id: string, successMsg: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast({ title: 'Success', description: successMsg });
    } catch (error) {
      console.error(`Error deleting from ${collectionName}:`, error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the item. Please try again.' });
      throw error;
    }
  };

  const deletePortfolioItem = async (id: string) => deleteOperation('portfolioItems', id, 'Portfolio item deleted.');
  const deleteDecorProduct = async (id: string) => deleteOperation('decorProducts', id, 'Product deleted.');
  const deleteRentalProperty = async (id: string) => deleteOperation('rentalProperties', id, 'Property deleted.');

  const decreaseStock = async (productId: string, amount: number) => {
    const product = data.decorProducts.find(p => p.id === productId);
    if(product) {
      const newStock = Math.max(0, product.stock - amount);
      await updateOperation('decorProducts', productId, { stock: newStock }, 'Stock updated.');
    }
  };

  const addOrder = async (order: Order) => {
    await updateOperation('orders', order.id, order, 'Order added.');
  };
  const updateOrder = async (order: Order) => {
    await updateOperation('orders', order.id, order, 'Order updated.');
  };
  
  const updateSiteSettings = async (settings: SiteSettings) => {
    await updateOperation('settings', 'site', settings, 'Site settings updated.');
  };

  const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => {
    const newBooking = { ...booking, createdAt: serverTimestamp(), isRead: false };
    await addOperation('bookings', newBooking, 'Your booking request has been sent.');
  };

  const markBookingAsRead = async (id: string) => {
    await updateOperation('bookings', id, { isRead: true }, 'Booking marked as read.');
  };

  const markAllBookingsAsRead = async () => {
    try {
      const batch = writeBatch(db);
      const unreadBookings = data.bookings.filter(b => !b.isRead);
      unreadBookings.forEach(booking => {
        const docRef = doc(db, 'bookings', booking.id);
        batch.update(docRef, { isRead: true });
      });
      await batch.commit();
    } catch(error) {
       console.error(`Error marking all as read:`, error);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart(prevCart => {
      if (quantity <= 0) {
        return prevCart.filter(item => item.id !== productId);
      }
      return prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };
  
  const clearCart = () => {
    setCart([]);
  }

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const providerValue = { 
      ...data,
      loading,
      deletePortfolioItem,
      deleteDecorProduct,
      deleteRentalProperty,
      addOrder, updateOrder, decreaseStock,
      addBooking, markBookingAsRead, markAllBookingsAsRead,
      updateSiteSettings,
      cart, addToCart, updateCartQuantity, removeFromCart, clearCart,
      cartTotal, cartCount
    };
    
  if (loading && !Object.values(data).some(arr => Array.isArray(arr) && arr.length > 0)) {
    return null; // Render nothing until initial data is loaded
  }

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
