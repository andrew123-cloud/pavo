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
import { collection, doc, getDocs, onSnapshot, writeBatch, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import imageCompression from 'browser-image-compression';


interface DataContextType extends PavoData {
  loading: boolean;
  addOrUpdatePortfolioItem: (item: Omit<PortfolioItem, 'id'>, id?: string, imageFile?: File, beforeImageFile?: File, onProgress?: (progress: number) => void) => Promise<void>;
  deletePortfolioItem: (id: string) => Promise<void>;
  addOrUpdateDecorProduct: (product: Omit<Product, 'id'>, id?: string, imageFile?: File, onProgress?: (progress: number) => void) => Promise<void>;
  deleteDecorProduct: (id: string) => Promise<void>;
  addOrUpdateRentalProperty: (property: Omit<Property, 'id'>, id?: string, imageFile?: File, onProgress?: (progress: number) => void) => Promise<void>;
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

const collectionsToSync = ['portfolioItems', 'decorProducts', 'rentalProperties', 'orders', 'bookings'] as const;
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
        const dexieTable = dexieDB[collectionName as keyof typeof dexieDB] as Dexie.Table<any,any>;
        try {
            await dexieDB.transaction('rw', dexieTable, async () => {
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
             console.log(`[Firestore Sync] Successfully synced ${collectionName}`);
        } catch (error) {
             console.error(`[Dexie Error] Failed to transact for ${collectionName}:`, error);
        }
      }, (error) => {
        console.error(`[Firestore Sync] Error listening to ${collectionName}:`, error);
        toast({ variant: 'destructive', title: 'Network Error', description: `Could not sync ${collectionName}. Using local data.`});
      });
    });

    const settingsDocRef = doc(firestoreDB, 'siteSettings', 'default');
    const settingsUnsubscriber = onSnapshot(settingsDocRef, async (doc) => {
      if (doc.exists()) {
        const settingsData = { ...doc.data(), id: 'default' } as SiteSettings;
        await dexieDB.siteSettings.put(settingsData);
        console.log("[Firestore Sync] Successfully synced siteSettings");
      }
    });

    setLoading(false);
    // Unsubscribe from listeners on cleanup
    return () => {
        console.log("Cleaning up Firestore listeners.");
        unsubscribers.forEach(unsub => unsub());
        settingsUnsubscriber();
    }
  }, [toast]);


 const uploadImage = (path: string, file: File, id: string, onProgress: (progress: number) => void): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      if (!file) {
        return reject("No file provided for upload.");
      }

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      try {
        console.log(`Original file size: ${file.size / 1024 / 1024} MB`);
        const compressedFile = await imageCompression(file, options);
        console.log(`Compressed file size: ${compressedFile.size / 1024 / 1024} MB`);

        const storageRef = ref(storage, `${path}/${id}/${compressedFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, compressedFile);

        uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(progress); // Direct progress reporting
            },
            (error) => {
              console.error("Error uploading image:", error);
              toast({
                  variant: 'destructive',
                  title: 'Image Upload Failed',
                  description: `There was a problem uploading your image. Please try again.`,
              });
              reject(error);
            },
            () => {
              getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                  resolve(downloadURL);
              }).catch(reject);
            }
        );
      } catch (error) {
         console.error('Image compression failed:', error);
         reject(error);
      }
    });
  };
  
  const deleteImage = async (imageUrl: string) => {
    try {
        if (imageUrl && imageUrl.includes('firebasestorage.googleapis.com')) {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        }
    } catch(error: any) {
        if(error.code !== 'storage/object-not-found') {
            console.error("Error deleting image from storage:", error);
            throw error; // re-throw if it's not a 'not found' error
        }
        console.warn(`Image at ${imageUrl} not found in storage, skipping deletion.`);
    }
  }


  const addOrUpdatePortfolioItem = async (item: Omit<PortfolioItem, 'id'>, id?: string, imageFile?: File, beforeImageFile?: File, onProgress?: (p:number) => void) => {
    const docId = id || uuidv4();
    const docRef = doc(firestoreDB, 'portfolioItems', docId);

    let finalItem = { ...item };
    if (imageFile) finalItem.imageUrl = await uploadImage('portfolioItems', imageFile, docId, onProgress || (() => {}));
    if (beforeImageFile) finalItem.beforeImageUrl = await uploadImage('portfolioItems', beforeImageFile, docId, onProgress || (() => {}));

    await setDoc(docRef, finalItem, { merge: true });
  };

  const deletePortfolioItem = async (id: string) => {
    const docRef = doc(firestoreDB, 'portfolioItems', id);
    const docSnap = await getDoc(docRef);
    const item = docSnap.data() as PortfolioItem | undefined;

    if (!item) return;

    if(item.imageUrl) await deleteImage(item.imageUrl);
    if(item.beforeImageUrl) await deleteImage(item.beforeImageUrl);

    await deleteDoc(docRef);
  };
  

  const addOrUpdateDecorProduct = async (product: Omit<Product, 'id'>, id?: string, imageFile?: File, onProgress?: (p:number) => void) => {
     const docId = id || uuidv4();
     const docRef = doc(firestoreDB, 'decorProducts', docId);
     
     let finalProduct = { ...product };
     if (imageFile) {
        finalProduct.imageUrl = await uploadImage('decorProducts', imageFile, docId, onProgress || (() => {}));
     }

     await setDoc(docRef, finalProduct, { merge: true });
  };

  const deleteDecorProduct = async (id: string) => {
    const docRef = doc(firestoreDB, 'decorProducts', id);
    const docSnap = await getDoc(docRef);
    const item = docSnap.data() as Product | undefined;
    
    if(item && item.imageUrl) await deleteImage(item.imageUrl);

    await deleteDoc(docRef);
  };
  
  const addOrUpdateRentalProperty = async (property: Omit<Property, 'id'>, id?: string, imageFile?: File, onProgress?: (p:number) => void) => {
     const docId = id || uuidv4();
     const docRef = doc(firestoreDB, 'rentalProperties', docId);
     
     let finalProperty = { ...property };
     if (imageFile) finalProperty.imageUrl = await uploadImage('rentalProperties', imageFile, docId, onProgress || (() => {}));

     await setDoc(docRef, finalProperty, { merge: true });
  };

  const deleteRentalProperty = async (id: string) => {
    const docRef = doc(firestoreDB, 'rentalProperties', id);
    const docSnap = await getDoc(docRef);
    const item = docSnap.data() as Property | undefined;
    if(item && item.imageUrl) await deleteImage(item.imageUrl);
    await deleteDoc(docRef);
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
    await setDoc(doc(firestoreDB, 'siteSettings', 'default'), settings, { merge: true });
  };

  // ---- Cart functionality (purely client-side with Dexie) ----
  const addToCart = async (product: Product) => {
    const existingItem = await dexieDB.cart.get(product.id);
    if (existingItem) {
      await dexieDB.cart.update(product.id, { quantity: existingItem.quantity + 1 });
    } else {
      await dexieDB.cart.add({ ...product, quantity: 1 });
    }
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
    const productRef = doc(firestoreDB, 'decorProducts', productId);
    try {
        const productSnap = await getDoc(productRef);
        if(productSnap.exists()) {
            const product = productSnap.data() as Product;
            const newStock = Math.max(0, product.stock - amount);
            await setDoc(productRef, { stock: newStock }, { merge: true });
        }
    } catch (e) {
        console.error("Failed to decrease stock", e);
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
    orders: (orders || []).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    bookings: (bookings || []).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
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
