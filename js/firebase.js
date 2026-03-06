import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";


// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDEngmNH8ZuGLEFT8EZ-dXL7VCwpF5vDeU",
  authDomain: "accounts-system-47961.firebaseapp.com",
  projectId: "accounts-system-47961",
  storageBucket: "accounts-system-47961.firebasestorage.app",
  messagingSenderId: "164539147206",
  appId: "1:164539147206:web:8b8267577e1af4622948c7",
};

// تشغيل Firebase
const app = initializeApp(firebaseConfig);

// الخدمات
const auth = getAuth(app);
const db = getFirestore(app);

// تصديرهم لباقي الصفحات
export {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  doc,
  setDoc,
  getDoc
};