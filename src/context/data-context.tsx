
// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { PavoData, PortfolioItem, Product, Property, Order, SiteSettings, Booking } from '@/lib/types';
import { 
  portfolioItems as initialPortfolioItems, 
  decorProducts as initialDecorProducts, 
  rentalProperties as initialRentalProperties,
  siteSettings as initialSiteSettings
} from '@/lib/data';

interface CartItem extends Product {
  quantity: number;
}

interface DataContextType extends PavoData {
  addPortfolioItem: (item: PortfolioItem) => void;
  updatePortfolioItem: (item: PortfolioItem) => void;
  deletePortfolioItem: (id: string) => void;
  addDecorProduct: (product: Product) => void;
  updateDecorProduct: (product: Product) => void;
  deleteDecorProduct: (id: string) => void;
  addRentalProperty: (property: Property) => void;
  updateRentalProperty: (property: Property) => void;
  deleteRentalProperty: (id: string) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  decreaseStock: (productId: string, amount: number) => void;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => void;
  markBookingAsRead: (id: string) => void;
  markAllBookingsAsRead: () => void;
  updateSiteSettings: (settings: SiteSettings) => void;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialData: PavoData = {
  portfolioItems: initialPortfolioItems,
  decorProducts: initialDecorProducts,
  rentalProperties: initialRentalProperties,
  orders: [],
  bookings: [],
  siteSettings: initialSiteSettings,
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [data, setData] = useState<PavoData>(initialData);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('pavo-data');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Ensure all top-level keys exist
        if (!parsedData.orders) parsedData.orders = [];
        if (!parsedData.bookings) parsedData.bookings = [];
        if (!parsedData.siteSettings) parsedData.siteSettings = initialSiteSettings;
        if (!parsedData.siteSettings.founder.imageUrls) parsedData.siteSettings.founder.imageUrls = ['/palvin-portrait.jpg'];
        setData(parsedData);
      }
      const storedCart = localStorage.getItem('pavo-cart');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('pavo-data', JSON.stringify(data));
    }
  }, [data, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
        localStorage.setItem('pavo-cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);


  const addPortfolioItem = (item: PortfolioItem) => {
    setData(prevData => ({ ...prevData, portfolioItems: [...prevData.portfolioItems, item] }));
  };

  const updatePortfolioItem = (updatedItem: PortfolioItem) => {
    setData(prevData => ({
      ...prevData,
      portfolioItems: prevData.portfolioItems.map(item => item.id === updatedItem.id ? updatedItem : item),
    }));
  };

  const deletePortfolioItem = (id: string) => {
    setData(prevData => ({
      ...prevData,
      portfolioItems: prevData.portfolioItems.filter(item => item.id !== id),
    }));
  };

  const addDecorProduct = (product: Product) => {
    setData(prevData => ({ ...prevData, decorProducts: [...prevData.decorProducts, product] }));
  };

  const updateDecorProduct = (updatedProduct: Product) => {
    setData(prevData => ({
      ...prevData,
      decorProducts: prevData.decorProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p),
    }));
  };

  const decreaseStock = (productId: string, amount: number) => {
    setData(prevData => ({
      ...prevData,
      decorProducts: prevData.decorProducts.map(p => 
        p.id === productId ? { ...p, stock: Math.max(0, p.stock - amount) } : p
      ),
    }));
  };

  const deleteDecorProduct = (id: string) => {
    setData(prevData => ({
      ...prevData,
      decorProducts: prevData.decorProducts.filter(p => p.id !== id),
    }));
  };

  const addRentalProperty = (property: Property) => {
    setData(prevData => ({ ...prevData, rentalProperties: [...prevData.rentalProperties, property] }));
  };

  const updateRentalProperty = (updatedProperty: Property) => {
    setData(prevData => ({
      ...prevData,
      rentalProperties: prevData.rentalProperties.map(p => p.id === updatedProperty.id ? updatedProperty : p),
    }));
  };

  const deleteRentalProperty = (id: string) => {
    setData(prevData => ({
      ...prevData,
      rentalProperties: prevData.rentalProperties.filter(p => p.id !== id),
    }));
  };
  
  const addOrder = (order: Order) => {
    setData(prevData => ({ ...prevData, orders: [order, ...(prevData.orders || [])] }));
  };
  
  const updateOrder = (updatedOrder: Order) => {
      setData(prevData => ({
        ...prevData,
        orders: (prevData.orders || []).map(o => o.id === updatedOrder.id ? updatedOrder : o)
      }));
  };
  
  const updateSiteSettings = (settings: SiteSettings) => {
    setData(prevData => ({ ...prevData, siteSettings: settings }));
  };

  const addBooking = (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => {
    const newBooking: Booking = {
      ...booking,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setData(prevData => ({
      ...prevData,
      bookings: [newBooking, ...(prevData.bookings || [])]
    }));
  };
  
  const markBookingAsRead = (id: string) => {
    setData(prevData => ({
      ...prevData,
      bookings: (prevData.bookings || []).map(b => b.id === id ? { ...b, isRead: true } : b)
    }));
  };

  const markAllBookingsAsRead = () => {
    setData(prevData => ({
      ...prevData,
      bookings: (prevData.bookings || []).map(b => ({ ...b, isRead: true }))
    }));
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
