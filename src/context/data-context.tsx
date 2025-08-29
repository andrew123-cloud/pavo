
// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { PavoData, PortfolioItem, Product, Property, Order, SiteSettings, Booking } from '@/lib/types';
import { siteSettings as initialSiteSettings } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, writeBatch, getDoc, orderBy, query, onSnapshot, addDoc } from 'firebase/firestore';

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

  // Fetch initial data from Firestore using onSnapshot for real-time updates
  useEffect(() => {
    setLoading(true);
    const portfolioQuery = query(collection(db, 'portfolioItems'), orderBy('title'));
    const decorsQuery = query(collection(db, 'decorProducts'), orderBy('name'));
    const homesQuery = query(collection(db, 'rentalProperties'), orderBy('title'));
    const ordersQuery = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
    const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const settingsDoc = doc(db, 'settings', 'site');

    const unsubs: (() => void)[] = [];
    let loadedParts = 0;
    const totalParts = 6; // The number of collections we are loading

    const checkAllLoaded = () => {
        loadedParts++;
        if (loadedParts === totalParts) {
            setLoading(false);
        }
    };
    
    unsubs.push(onSnapshot(portfolioQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioItem));
        setData(prev => ({...prev, portfolioItems: items}));
        checkAllLoaded();
    }, (error) => { console.error("Portfolio listener failed: ", error); checkAllLoaded(); }));

    unsubs.push(onSnapshot(decorsQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setData(prev => ({...prev, decorProducts: items}));
        checkAllLoaded();
    }, (error) => { console.error("Decor listener failed: ", error); checkAllLoaded(); }));

    unsubs.push(onSnapshot(homesQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        setData(prev => ({...prev, rentalProperties: items}));
        checkAllLoaded();
    }, (error) => { console.error("Homes listener failed: ", error); checkAllLoaded(); }));

    unsubs.push(onSnapshot(ordersQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setData(prev => ({...prev, orders: items}));
        checkAllLoaded();
    }, (error) => { console.error("Orders listener failed: ", error); checkAllLoaded(); }));
    
    unsubs.push(onSnapshot(bookingsQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        setData(prev => ({...prev, bookings: items}));
        checkAllLoaded();
    }, (error) => { console.error("Bookings listener failed: ", error); checkAllLoaded(); }));

    unsubs.push(onSnapshot(settingsDoc, async (doc) => {
        if (doc.exists()) {
            setData(prev => ({...prev, siteSettings: doc.data() as SiteSettings}));
        } else {
            // If settings don't exist, create them with initial data
            await setDoc(settingsDoc, initialSiteSettings).catch(e => console.error("Failed to set initial site settings", e));
        }
        checkAllLoaded();
    }, (error) => { console.error("Settings listener failed: ", error); checkAllLoaded(); }));

    // Unsubscribe from listeners on cleanup
    return () => {
        unsubs.forEach(unsub => unsub());
    };

  }, []);

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

  // Firestore operations
  const addPortfolioItem = async (item: Omit<PortfolioItem, 'id'>) => {
    await addDoc(collection(db, 'portfolioItems'), item);
  };

  const updatePortfolioItem = async (updatedItem: PortfolioItem) => {
    const docRef = doc(db, 'portfolioItems', updatedItem.id);
    const { id, ...itemData } = updatedItem; // Omit id from data
    await setDoc(docRef, itemData, { merge: true });
  };

  const deletePortfolioItem = async (id: string) => {
    await deleteDoc(doc(db, 'portfolioItems', id));
  };
  
  const addDecorProduct = async (product: Omit<Product, 'id'>) => {
     await addDoc(collection(db, 'decorProducts'), product);
  };

  const updateDecorProduct = async (updatedProduct: Product) => {
    const docRef = doc(db, 'decorProducts', updatedProduct.id);
    const { id, ...productData } = updatedProduct; // Omit id
    await setDoc(docRef, productData, { merge: true });
  };

  const deleteDecorProduct = async (id: string) => {
    await deleteDoc(doc(db, 'decorProducts', id));
  };
  
  const decreaseStock = async (productId: string, amount: number) => {
    const productRef = doc(db, 'decorProducts', productId);
    const product = data.decorProducts.find(p => p.id === productId);
    if(product) {
      const newStock = Math.max(0, product.stock - amount);
      await setDoc(productRef, { stock: newStock }, { merge: true });
    }
  };

  const addRentalProperty = async (property: Omit<Property, 'id'>) => {
    await addDoc(collection(db, 'rentalProperties'), property);
  };

  const updateRentalProperty = async (updatedProperty: Property) => {
    const docRef = doc(db, 'rentalProperties', updatedProperty.id);
    const { id, ...propertyData } = updatedProperty; // Omit id
    await setDoc(docRef, propertyData, { merge: true });
  };

  const deleteRentalProperty = async (id: string) => {
    await deleteDoc(doc(db, 'rentalProperties', id));
  };

  const addOrder = async (order: Order) => {
    const docRef = doc(db, 'orders', order.id);
    await setDoc(docRef, order);
    // Realtime listener will update state
  };

  const updateOrder = async (updatedOrder: Order) => {
    const docRef = doc(db, 'orders', updatedOrder.id);
    const { id, ...orderData } = updatedOrder; // Omit id
    await setDoc(docRef, orderData, { merge: true });
    // Realtime listener will update state
  };
  
  const updateSiteSettings = async (settings: SiteSettings) => {
    const docRef = doc(db, 'settings', 'site');
    await setDoc(docRef, settings);
    // Realtime listener will update state
  };

  const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => {
    const newBooking: Omit<Booking, 'id'> = {
      ...booking,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    await addDoc(collection(db, 'bookings'), newBooking);
    // Realtime listener will update state
  };

  const markBookingAsRead = async (id: string) => {
    const docRef = doc(db, 'bookings', id);
    await setDoc(docRef, { isRead: true }, { merge: true });
    // Realtime listener will update state
  };

  const markAllBookingsAsRead = async () => {
    const batch = writeBatch(db);
    const unreadBookings = data.bookings.filter(b => !b.isRead);
    unreadBookings.forEach(booking => {
      const docRef = doc(db, 'bookings', booking.id);
      batch.update(docRef, { isRead: true });
    });
    await batch.commit();
    // Realtime listener will update state
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

  if (loading || !isCartLoaded) {
    return null; // Return null or a loading spinner while data is loading
  }

  return (
    <DataContext.Provider value={{ 
      ...data,
      loading,
      addPortfolioItem, 
      updatePortfolioItem, 
      deletePortfolioItem,
      addDecorProduct,
      updateDecorProduct,
      deleteDecorProduct,
      addRentalProperty,
      updateRentalProperty,
      deleteRentalProperty,
      addOrder,
      updateOrder,
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
      cartCount
    }}>
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
