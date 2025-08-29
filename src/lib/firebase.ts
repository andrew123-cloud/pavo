// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "pavo-suite",
  appId: "1:438755561945:web:ffbb6403d9876c7bbd49c8",
  storageBucket: "pavo-suite.firebasestorage.app",
  apiKey: "AIzaSyDOjOXedObPM5h77TZb8KRg0yAyq_O61oA",
  authDomain: "pavo-suite.firebaseapp.com",
  messagingSenderId: "438755561945",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
