import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAzpV3FnPvOXrukgPZHo8JObUNeI_Ex2p8",
  authDomain: "lifelink-ih11.firebaseapp.com",
  projectId: "lifelink-ih11",
  storageBucket: "lifelink-ih11.firebasestorage.app",
  messagingSenderId: "589553796637",
  appId: "1:589553796637:web:bde1d61f67fe60bbf3e8f4",
  measurementId: "G-YGPEVZ7JJP"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
