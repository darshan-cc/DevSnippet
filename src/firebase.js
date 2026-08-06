import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBw8Bo4fr-M4FdXOJHVvEG9XCMRqfCK4l8",
  authDomain: "devsnippet-a9403.firebaseapp.com",
  projectId: "devsnippet-a9403",
  storageBucket: "devsnippet-a9403.firebasestorage.app",
  messagingSenderId: "84635798754",
  appId: "1:84635798754:web:0a2aff31250d0b578d62bb",
  measurementId: "G-Z3GM0NMD4Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);