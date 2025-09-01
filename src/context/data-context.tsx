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
  addPortfolioItem: (item: Omit<PortfolioItem, 'id'>) => Promise<void>;
  updatePortfolioItem: (item: PortfolioItem) => Promise<void>;
  deletePortfolioItem: (id: string) => Promise<void>;
  addDecorProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateDecorProduct: (product: Product) => Promise<void>;
  deleteDecorProduct: (id: string) => Promise<void>;
  addRentalProperty: (property: Omit<Property, 'id'>) => Promise<void>;
  updateRentalProperty: (property: Property) => Promise<void>;
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

  // Load cart from localStorage on initial render
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

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isCartLoaded) {
      localStorage.setItem('pavo-cart', JSON.stringify(cart));
    }
  }, [cart, isCartLoaded]);
  
  // Real-time data fetching from Firestore
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
            // Set up real-time listeners for all collections
            for (const [key, collectionName] of Object.entries(collections)) {
                let q;
                if (collectionName === 'orders') {
                    q = query(collection(db, collectionName), orderBy('created_at', 'desc'));
                } else if (collectionName === 'bookings') {
                    q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
                } else if (collectionName === 'decorProducts') {
                    q = query(collection(db, collectionName), orderBy('name'));
                } else {
                    q = query(collection(db, collectionName), orderBy('title'));
                }
                
                const unsub = onSnapshot(q, (snapshot) => {
                    const items = snapshot.docs.map(doc => {
                        const docData = doc.data();
                        if (collectionName === 'bookings') {
                            return { 
                                id: doc.id, 
                                ...docData,
                                createdAt: (docData.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString()
                            }
                        }
                        return { id: doc.id, ...docData };
                    });
                    setData(prev => ({ ...prev, [key]: items as any }));
                }, (error) => console.error(`Error listening to ${collectionName}:`, error));
                unsubs.push(unsub);
            }

            // Listener for site settings
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
            // Set loading to false only after listeners are attached
            setLoading(false);
        }
    };
    
    fetchInitialDataAndListen();

    // Unsubscribe from all listeners on cleanup
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
      throw error; // Re-throw to be caught by the form handler
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

  // Firestore operations using helpers
  const addPortfolioItem = async (item: Omit<PortfolioItem, 'id'>) => addOperation('portfolioItems', item, 'Portfolio item added successfully.');
  const updatePortfolioItem = async (item: PortfolioItem) => updateOperation('portfolioItems', item.id, item, 'Portfolio item updated successfully.');
  const deletePortfolioItem = async (id: string) => deleteOperation('portfolioItems', id, 'Portfolio item deleted.');

  const addDecorProduct = async (product: Omit<Product, 'id'>) => addOperation('decorProducts', product, 'Product added successfully.');
  const updateDecorProduct = async (product: Product) => updateOperation('decorProducts', product.id, product, 'Product updated successfully.');
  const deleteDecorProduct = async (id: string) => deleteOperation('decorProducts', id, 'Product deleted.');
  
  const addRentalProperty = async (property: Omit<Property, 'id'>) => addOperation('rentalProperties', property, 'Property added successfully.');
  const updateRentalProperty = async (property: Property) => updateOperation('rentalProperties', property.id, property, 'Property updated successfully.');
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

  // Cart logic
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
      addPortfolioItem, updatePortfolioItem, deletePortfolioItem,
      addDecorProduct, updateDecorProduct, deleteDecorProduct,
      addRentalProperty, updateRentalProperty, deleteRentalProperty,
      addOrder, updateOrder, decreaseStock,
      addBooking, markBookingAsRead, markAllBookingsAsRead,
      updateSiteSettings,
      cart, addToCart, updateCartQuantity, removeFromCart, clearCart,
      cartTotal, cartCount
    };
    
  if (loading) {
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
