import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCrN1ilCUP_BMPxL9bu03dF7XfZwotA5oo",
  authDomain: "skillbridge-attendance-system.firebaseapp.com",
  projectId: "skillbridge-attendance-system",
  storageBucket: "skillbridge-attendance-system.firebasestorage.app",
  messagingSenderId: "786520759384",
  appId: "1:786520759384:web:7fa266de050d339f587e2d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
