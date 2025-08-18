// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { PavoData, PortfolioItem, Product, Property } from '@/lib/types';
import { 
  portfolioItems as initialPortfolioItems, 
  decorProducts as initialDecorProducts, 
  rentalProperties as initialRentalProperties 
} from '@/lib/data';

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialData: PavoData = {
  portfolioItems: initialPortfolioItems,
  decorProducts: initialDecorProducts,
  rentalProperties: initialRentalProperties,
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PavoData>(initialData);

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
