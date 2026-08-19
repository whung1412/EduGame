// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAenn5_GwE_t56uwMW2WNH9ZADPT1Vu49M",
  authDomain: "teachgame-b849a.firebaseapp.com",
  projectId: "teachgame-b849a",
  storageBucket: "teachgame-b849a.firebasestorage.app",
  messagingSenderId: "602730080138",
  appId: "1:602730080138:web:1b7b2b2e593adf335b8a73",
  measurementId: "G-9N5GGHRMSX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const realtimeDb = getDatabase(
    app,
    "https://teachgame-b849a-default-rtdb.asia-southeast1.firebasedatabase.app"
);