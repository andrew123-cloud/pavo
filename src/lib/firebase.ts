
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "pavo-suite",
  appId: "1:438755561945:web:ffbb6403d9876c7bbd49c8",
  storageBucket: "pavo-suite.appspot.com",
  apiKey: "AIzaSyDOjOXedObPM5h77TZb8KRg0yAyq_O61oA",
  authDomain: "pavo-suite.firebaseapp.com",
  messagingSenderId: "438755561945",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence
try {
    enableIndexedDbPersistence(db);
    console.log("Firebase offline persistence enabled.");
} catch (err: any) {
    if (err.code === 'failed-precondition') {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === 'unimplemented') {
        console.warn("The current browser does not support all of the features required to enable persistence.");
    }
}


export { app, db, storage };
