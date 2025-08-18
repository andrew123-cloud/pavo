// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { PavoData, PortfolioItem, Product, Property } from '@/lib/types';
import { 
  portfolioItems as initialPortfolioItems, 
  decorProducts as initialDecorProducts, 
  rentalProperties as initialRentalProperties 
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
        setData(JSON.parse(storedData));
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
