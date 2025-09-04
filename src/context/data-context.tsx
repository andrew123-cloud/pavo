
// src/context/data-context.tsx
'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import type { PavoData, PortfolioItem, Product, Property, Order, SiteSettings, Booking } from '@/lib/types';
import { siteSettings as initialSiteSettings, testimonials } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as dexieDB, CartItem } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { db as firestoreDB, storage } from '@/lib/firebase';
import { collection, doc, getDocs, onSnapshot, writeBatch, deleteDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface DataContextType extends PavoData {
  loading: boolean;
  addOrUpdatePortfolioItem: (item: Omit<PortfolioItem, 'id'>, id?: string, imageFile?: File, beforeImageFile?: File) => Promise<void>;
  deletePortfolioItem: (id: string) => Promise<void>;
  addOrUpdateDecorProduct: (product: Omit<Product, 'id'>, id?: string, imageFile?: File) => Promise<void>;
  deleteDecorProduct: (id: string) => Promise<void>;
  addOrUpdateRentalProperty: (property: Omit<Property, 'id'>, id?: string, imageFile?: File) => Promise<void>;
  deleteRentalProperty: (id: string) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
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

const collectionsToSync = ['portfolioItems', 'decorProducts', 'rentalProperties', 'orders', 'bookings', 'siteSettings'] as const;
type CollectionName = typeof collectionsToSync[number];

export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Live queries from Dexie.js - UI reads from here.
  const portfolioItems = useLiveQuery(() => dexieDB.portfolioItems.toArray(), []);
  const decorProducts = useLiveQuery(() => dexieDB.decorProducts.toArray(), []);
  const rentalProperties = useLiveQuery(() => dexieDB.rentalProperties.toArray(), []);
  const orders = useLiveQuery(() => dexieDB.orders.toArray(), []);
  const bookings = useLiveQuery(() => dexieDB.bookings.toArray(), []);
  const siteSettings = useLiveQuery(() => dexieDB.siteSettings.get('default'), undefined);
  const cart = useLiveQuery(() => dexieDB.cart.toArray(), []);


  // This effect syncs Firestore to Dexie in real-time
  useEffect(() => {
    console.log("Setting up Firestore real-time listeners...");
    setLoading(true);
    const unsubscribers = collectionsToSync.map((collectionName: CollectionName) => {
      const collRef = collection(firestoreDB, collectionName);
      return onSnapshot(collRef, async (querySnapshot) => {
        console.log(`[Firestore Sync] Received update for ${collectionName}`);
        const dexieTable = dexieDB[collectionName as keyof typeof dexieDB] as Dexie.Table;
        const batch = dexieDB.transaction('rw', dexieTable, async () => {
          const allKeys = await dexieTable.toCollection().keys();
          const firestoreIds = new Set(querySnapshot.docs.map(d => d.id));
          
          // Delete local items no longer in Firestore
          const keysToDelete = (allKeys as string[]).filter(k => !firestoreIds.has(k) && k !== 'default');
          if (keysToDelete.length > 0) {
            await dexieTable.bulkDelete(keysToDelete);
          }
          
          // Add/update items from Firestore
          if (!querySnapshot.empty) {
            const itemsToAdd = querySnapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            await dexieTable.bulkPut(itemsToAdd);
          }
        });
        await batch;
        console.log(`[Firestore Sync] Successfully synced ${collectionName}`);
      }, (error) => {
        console.error(`[Firestore Sync] Error listening to ${collectionName}:`, error);
        toast({ variant: 'destructive', title: 'Network Error', description: `Could not sync ${collectionName}. Using local data.`});
      });
    });

    setLoading(false);
    // Unsubscribe from listeners on cleanup
    return () => {
        console.log("Cleaning up Firestore listeners.");
        unsubscribers.forEach(unsub => unsub());
    }
  }, [toast]);


  const uploadImage = async (path: string, file: File, id: string): Promise<string> => {
    const storageRef = ref(storage, `${path}/${id}/${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };
  
  const deleteImage = async (imageUrl: string) => {
    try {
        if (imageUrl) {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        }
    } catch(error: any) {
        if(error.code !== 'storage/object-not-found') {
            console.error("Error deleting image from storage:", error);
            throw error; // re-throw if it's not a 'not found' error
        }
    }
  }


  const addOrUpdatePortfolioItem = async (item: Omit<PortfolioItem, 'id'>, id?: string, imageFile?: File, beforeImageFile?: File) => {
    const docId = id || uuidv4();
    const docRef = doc(firestoreDB, 'portfolioItems', docId);

    let finalItem = { ...item };
    if (imageFile) finalItem.imageUrl = await uploadImage('portfolioItems', imageFile, docId);
    if (beforeImageFile) finalItem.beforeImageUrl = await uploadImage('portfolioItems', beforeImageFile, docId);

    await setDoc(docRef, finalItem);
    toast({ title: 'Success', description: 'Portfolio item saved.' });
  };

  const deletePortfolioItem = async (id: string) => {
    const item = await dexieDB.portfolioItems.get(id);
    if (!item) return;
    await deleteImage(item.imageUrl);
    if(item.beforeImageUrl) await deleteImage(item.beforeImageUrl);
    await deleteDoc(doc(firestoreDB, 'portfolioItems', id));
    toast({ title: 'Success', description: 'Portfolio item deleted.' });
  };
  

  const addOrUpdateDecorProduct = async (product: Omit<Product, 'id'>, id?: string, imageFile?: File) => {
     const docId = id || uuidv4();
     const docRef = doc(firestoreDB, 'decorProducts', docId);
     
     let finalProduct = { ...product };
     if (imageFile) finalProduct.imageUrl = await uploadImage('decorProducts', imageFile, docId);

     await setDoc(docRef, finalProduct);
     toast({ title: 'Success', description: 'Product saved.' });
  };

  const deleteDecorProduct = async (id: string) => {
    const item = await dexieDB.decorProducts.get(id);
    if(item) await deleteImage(item.imageUrl);
    await deleteDoc(doc(firestoreDB, 'decorProducts', id));
    toast({ title: 'Success', description: 'Product deleted.' });
  };
  
  const addOrUpdateRentalProperty = async (property: Omit<Property, 'id'>, id?: string, imageFile?: File) => {
     const docId = id || uuidv4();
     const docRef = doc(firestoreDB, 'rentalProperties', docId);
     
     let finalProperty = { ...property };
     if (imageFile) finalProperty.imageUrl = await uploadImage('rentalProperties', imageFile, docId);

     await setDoc(docRef, finalProperty);
     toast({ title: 'Success', description: 'Property saved.' });
  };

  const deleteRentalProperty = async (id: string) => {
    const item = await dexieDB.rentalProperties.get(id);
    if(item) await deleteImage(item.imageUrl);
    await deleteDoc(doc(firestoreDB, 'rentalProperties', id));
    toast({ title: 'Success', description: 'Property deleted.' });
  };

  const addOrder = async (order: Order) => {
    await setDoc(doc(firestoreDB, 'orders', order.id), order);
  };
  
  const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'isRead'>) => {
     const docId = uuidv4();
     const newBooking = { 
        ...booking,
        id: docId,
        createdAt: new Date().toISOString(),
        isRead: false
     }
     await setDoc(doc(firestoreDB, 'bookings', docId), newBooking);
  };
  
  const updateSiteSettings = async (settings: SiteSettings) => {
    await setDoc(doc(firestoreDB, 'siteSettings', 'default'), settings);
    toast({ title: 'Success', description: 'Site settings updated.' });
  };

  // ---- Cart functionality (purely client-side with Dexie) ----
  const addToCart = async (product: Product) => {
    const existingItem = await dexieDB.cart.get(product.id);
    if (existingItem) {
      await dexieDB.cart.update(product.id, { quantity: existingItem.quantity + 1 });
    } else {
      await dexieDB.cart.add({ ...product, quantity: 1 });
    }
    toast({ title: 'Added to Cart', description: `${product.name} is in your cart.` });
  };
  const updateCartQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await dexieDB.cart.delete(productId);
    } else {
      await dexieDB.cart.update(productId, { quantity });
    }
  };
  const removeFromCart = (productId: string) => dexieDB.cart.delete(productId);
  const clearCart = () => dexieDB.cart.clear();
  const cartTotal = (cart || []).reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = (cart || []).reduce((count, item) => count + item.quantity, 0);
  const decreaseStock = async (productId: string, amount: number) => {
    const product = await dexieDB.decorProducts.get(productId);
    if(product) {
        const newStock = Math.max(0, product.stock - amount);
        await setDoc(doc(firestoreDB, 'decorProducts', productId), { stock: newStock }, { merge: true });
    }
  };
  const markBookingAsRead = async (id: string) => {
      await setDoc(doc(firestoreDB, 'bookings', id), { isRead: true }, { merge: true });
  };
  const markAllBookingsAsRead = async () => {
    const unread = (bookings || []).filter(b => !b.isRead);
    if (unread.length === 0) return;
    const batch = writeBatch(firestoreDB);
    unread.forEach(b => {
        const docRef = doc(firestoreDB, 'bookings', b.id);
        batch.update(docRef, { isRead: true });
    });
    await batch.commit();
  };

  const providerValue: DataContextType = {
    portfolioItems: portfolioItems || [],
    decorProducts: decorProducts || [],
    rentalProperties: rentalProperties || [],
    orders: orders || [],
    bookings: bookings || [],
    siteSettings: siteSettings || initialSiteSettings,
    testimonials: testimonials,
    loading: loading || portfolioItems === undefined || decorProducts === undefined || rentalProperties === undefined,
    addOrUpdatePortfolioItem,
    deletePortfolioItem,
    addOrUpdateDecorProduct,
    deleteDecorProduct,
    addOrUpdateRentalProperty,
    deleteRentalProperty,
    addOrder,
    decreaseStock,
    addBooking,
    markBookingAsRead,
    markAllBookingsAsRead,
    updateSiteSettings,
    cart: cart || [],
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,
  };

  return <DataContext.Provider value={providerValue}>{children}</DataContext.Provider>;
}

export function usePavoData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('usePavoData must be used within a DataProvider');
  }
  return context;
}
