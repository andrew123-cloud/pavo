
// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { PavoData, PortfolioItem, Product, Property, Order, SiteSettings, Booking } from '@/lib/types';
import { siteSettings as initialSiteSettings } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, writeBatch, getDoc, orderBy, query, onSnapshot, addDoc, serverTimestamp, Timestamp, getDocs } from 'firebase/firestore';

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
  
  // This effect now correctly uses onSnapshot for real-time updates after an initial fetch.
  useEffect(() => {
    const collections = {
        portfolioItems: 'portfolioItems',
        decorProducts: 'decorProducts',
        rentalProperties: 'rentalProperties',
        orders: 'orders',
        bookings: 'bookings',
    };

    const unsubs: (() => void)[] = [];

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
    
    // Initial fetch to combat cold start loading issues.
    const fetchInitialData = async () => {
        try {
            const portfolioSnapshot = await getDocs(query(collection(db, 'portfolioItems'), orderBy('title')));
            const decorSnapshot = await getDocs(query(collection(db, 'decorProducts'), orderBy('name')));
            const homesSnapshot = await getDocs(query(collection(db, 'rentalProperties'), orderBy('title')));
            const settingsSnapshot = await getDoc(doc(db, 'settings', 'site'));

            setData(prev => ({
                ...prev,
                portfolioItems: portfolioSnapshot.docs.map(d => ({id: d.id, ...d.data()}) as PortfolioItem),
                decorProducts: decorSnapshot.docs.map(d => ({id: d.id, ...d.data()}) as Product),
                rentalProperties: homesSnapshot.docs.map(d => ({id: d.id, ...d.data()}) as Property),
                siteSettings: settingsSnapshot.exists() ? settingsSnapshot.data() as SiteSettings : initialSiteSettings,
            }));

        } catch (error) {
            console.error("Failed to fetch initial data:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchInitialData();

    // Unsubscribe from all listeners on cleanup
    return () => {
        unsubs.forEach(unsub => unsub());
    };
  }, []);

  // Firestore operations
  const addPortfolioItem = async (item: Omit<PortfolioItem, 'id'>) => {
    await addDoc(collection(db, 'portfolioItems'), item);
  };

  const updatePortfolioItem = async (updatedItem: PortfolioItem) => {
    const docRef = doc(db, 'portfolioItems', updatedItem.id);
    const { id, ...itemData } = updatedItem;
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
    const { id, ...productData } = updatedProduct;
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
    const { id, ...propertyData } = updatedProperty;
    await setDoc(docRef, propertyData, { merge: true });
  };

  const deleteRentalProperty = async (id: string) => {
    await deleteDoc(doc(db, 'rentalProperties', id));
  };

  const addOrder = async (order: Order) => {
    const docRef = doc(db, 'orders', order.id);
    await setDoc(docRef, order);
  };

  const updateOrder = async (updatedOrder: Order) => {
    const docRef = doc(db, 'orders', updatedOrder.id);
    const { id, ...orderData } = updatedOrder;
    await setDoc(docRef, orderData, { merge: true });
  };
  
  const updateSiteSettings = async (settings: SiteSettings) => {
    const docRef = doc(db, 'settings', 'site');
    await setDoc(docRef, settings, { merge: true });
  };

  const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => {
    const newBooking = {
      ...booking,
      createdAt: serverTimestamp(),
      isRead: false,
    };
    await addDoc(collection(db, 'bookings'), newBooking);
  };

  const markBookingAsRead = async (id: string) => {
    const docRef = doc(db, 'bookings', id);
    await setDoc(docRef, { isRead: true }, { merge: true });
  };

  const markAllBookingsAsRead = async () => {
    const batch = writeBatch(db);
    const unreadBookings = data.bookings.filter(b => !b.isRead);
    unreadBookings.forEach(booking => {
      const docRef = doc(db, 'bookings', booking.id);
      batch.update(docRef, { isRead: true });
    });
    await batch.commit();
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
    };
    
  if (loading && !Object.values(data).flat().length) {
    return null;
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
