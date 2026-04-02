
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJilyabVnr5lDQy9R_njAqrkfcwdoUfJ8",
  authDomain: "job-scout-80698.firebaseapp.com",
  projectId: "job-scout-80698",
  storageBucket: "job-scout-80698.firebasestorage.app",
  messagingSenderId: "1027048552676",
  appId: "1:1027048552676:web:7c1c8d4bd71fa3918514f1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
