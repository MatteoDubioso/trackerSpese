// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// Aggiungi questi due import
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyACLRxrhNDo1Gg4nnbnsQj9L0Hmyo9Z6EE",
  authDomain: "gestionespese-1615d.firebaseapp.com",
  projectId: "gestionespese-1615d",
  storageBucket: "gestionespese-1615d.firebasestorage.app",
  messagingSenderId: "857631024090",
  appId: "1:857631024090:web:23117c3e91e7b8f68496e3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Forza la persistenza locale (risolve molti conflitti su mobile)
setPersistence(auth, browserLocalPersistence);

export { db, auth };