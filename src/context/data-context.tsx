// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { PavoData, PortfolioItem, Product, Property, Order, SiteSettings, Booking } from '@/lib/types';
import { siteSettings as initialSiteSettings } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, getDoc, orderBy, query } from 'firebase/firestore';

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch initial data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all collections
        const portfolioItemsQuery = query(collection(db, 'portfolioItems'), orderBy('title'));
        const decorProductsQuery = query(collection(db, 'decorProducts'), orderBy('name'));
        const rentalPropertiesQuery = query(collection(db, 'rentalProperties'), orderBy('title'));
        const ordersQuery = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
        const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
        const siteSettingsDoc = doc(db, 'settings', 'site');

        const [
          portfolioItemsSnap,
          decorProductsSnap,
          rentalPropertiesSnap,
          ordersSnap,
          bookingsSnap,
          siteSettingsSnap,
        ] = await Promise.all([
          getDocs(portfolioItemsQuery),
          getDocs(decorProductsQuery),
          getDocs(rentalPropertiesQuery),
          getDocs(ordersQuery),
          getDocs(bookingsQuery),
          getDoc(siteSettingsDoc),
        ]);

        const portfolioItems = portfolioItemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioItem));
        const decorProducts = decorProductsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        const rentalProperties = rentalPropertiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        const bookings = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        const siteSettings = siteSettingsSnap.exists() ? siteSettingsSnap.data() as SiteSettings : initialSiteSettings;
        
        setData({ portfolioItems, decorProducts, rentalProperties, orders, bookings, siteSettings });

      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
      }
      setLoading(false);
    };

    fetchData();
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
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('pavo-cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  // Firestore operations
  const addPortfolioItem = async (item: Omit<PortfolioItem, 'id'>) => {
    const newDocRef = doc(collection(db, 'portfolioItems'));
    const newItem = { ...item, id: newDocRef.id };
    await setDoc(newDocRef, item);
    setData(prev => ({ ...prev, portfolioItems: [...prev.portfolioItems, newItem].sort((a,b) => a.title.localeCompare(b.title)) }));
  };

  const updatePortfolioItem = async (updatedItem: PortfolioItem) => {
    const docRef = doc(db, 'portfolioItems', updatedItem.id);
    await setDoc(docRef, updatedItem, { merge: true });
    setData(prev => ({ ...prev, portfolioItems: prev.portfolioItems.map(item => item.id === updatedItem.id ? updatedItem : item).sort((a,b) => a.title.localeCompare(b.title)) }));
  };

  const deletePortfolioItem = async (id: string) => {
    await deleteDoc(doc(db, 'portfolioItems', id));
    setData(prev => ({ ...prev, portfolioItems: prev.portfolioItems.filter(item => item.id !== id) }));
  };
  
  const addDecorProduct = async (product: Omit<Product, 'id'>) => {
    const newDocRef = doc(collection(db, 'decorProducts'));
    const newProduct = { ...product, id: newDocRef.id };
    await setDoc(newDocRef, product);
    setData(prev => ({ ...prev, decorProducts: [...prev.decorProducts, newProduct].sort((a,b) => a.name.localeCompare(b.name)) }));
  };

  const updateDecorProduct = async (updatedProduct: Product) => {
    const docRef = doc(db, 'decorProducts', updatedProduct.id);
    await setDoc(docRef, updatedProduct, { merge: true });
    setData(prev => ({ ...prev, decorProducts: prev.decorProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p).sort((a,b) => a.name.localeCompare(b.name)) }));
  };

  const deleteDecorProduct = async (id: string) => {
    await deleteDoc(doc(db, 'decorProducts', id));
    setData(prev => ({ ...prev, decorProducts: prev.decorProducts.filter(p => p.id !== id) }));
  };
  
  const decreaseStock = async (productId: string, amount: number) => {
    const productRef = doc(db, 'decorProducts', productId);
    const product = data.decorProducts.find(p => p.id === productId);
    if(product) {
      const newStock = Math.max(0, product.stock - amount);
      await setDoc(productRef, { stock: newStock }, { merge: true });
      setData(prev => ({ ...prev, decorProducts: prev.decorProducts.map(p => p.id === productId ? {...p, stock: newStock} : p) }));
    }
  };

  const addRentalProperty = async (property: Omit<Property, 'id'>) => {
    const newDocRef = doc(collection(db, 'rentalProperties'));
    const newProperty = { ...property, id: newDocRef.id };
    await setDoc(newDocRef, property);
    setData(prev => ({ ...prev, rentalProperties: [...prev.rentalProperties, newProperty].sort((a,b) => a.title.localeCompare(b.title)) }));
  };

  const updateRentalProperty = async (updatedProperty: Property) => {
    const docRef = doc(db, 'rentalProperties', updatedProperty.id);
    await setDoc(docRef, updatedProperty, { merge: true });
    setData(prev => ({ ...prev, rentalProperties: prev.rentalProperties.map(p => p.id === updatedProperty.id ? updatedProperty : p).sort((a,b) => a.title.localeCompare(b.title)) }));
  };

  const deleteRentalProperty = async (id: string) => {
    await deleteDoc(doc(db, 'rentalProperties', id));
    setData(prev => ({ ...prev, rentalProperties: prev.rentalProperties.filter(p => p.id !== id) }));
  };

  const addOrder = async (order: Order) => {
    const docRef = doc(db, 'orders', order.id);
    await setDoc(docRef, order);
    setData(prev => ({ ...prev, orders: [order, ...prev.orders] }));
  };

  const updateOrder = async (updatedOrder: Order) => {
    const docRef = doc(db, 'orders', updatedOrder.id);
    await setDoc(docRef, updatedOrder, { merge: true });
    setData(prev => ({ ...prev, orders: prev.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o) }));
  };
  
  const updateSiteSettings = async (settings: SiteSettings) => {
    const docRef = doc(db, 'settings', 'site');
    await setDoc(docRef, settings);
    setData(prev => ({ ...prev, siteSettings: settings }));
  };

  const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => {
    const newBooking: Omit<Booking, 'id'> = {
      ...booking,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    const newDocRef = doc(collection(db, 'bookings'));
    await setDoc(newDocRef, newBooking);
    const fullBooking = { ...newBooking, id: newDocRef.id };
    setData(prev => ({ ...prev, bookings: [fullBooking, ...prev.bookings] }));
  };

  const markBookingAsRead = async (id: string) => {
    const docRef = doc(db, 'bookings', id);
    await setDoc(docRef, { isRead: true }, { merge: true });
    setData(prev => ({ ...prev, bookings: prev.bookings.map(b => b.id === id ? { ...b, isRead: true } : b) }));
  };

  const markAllBookingsAsRead = async () => {
    const batch = writeBatch(db);
    const unreadBookings = data.bookings.filter(b => !b.isRead);
    unreadBookings.forEach(booking => {
      const docRef = doc(db, 'bookings', booking.id);
      batch.update(docRef, { isRead: true });
    });
    await batch.commit();
    setData(prev => ({ ...prev, bookings: prev.bookings.map(b => ({ ...b, isRead: true })) }));
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

  if (!isLoaded) {
    return null; // or a loading spinner
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
