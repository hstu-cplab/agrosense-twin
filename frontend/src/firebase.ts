import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

/**
 * Firebase web config.
 *
 * The project ships with a working demo Firebase project baked in as the
 * fallback, so `npm run build` / a fresh Vercel deploy works with no setup.
 * To point at your OWN Firebase project, set the `VITE_FIREBASE_*` env vars
 * (locally in `.env`, or in Vercel → Settings → Environment Variables) and
 * add your deployed domain to Firebase Auth → Authorized domains.
 *
 * Web API keys are not secrets — access is enforced by Firestore rules
 * (`firestore.rules`) and the Auth authorized-domain list.
 */
const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyBDiQfML1Vk4_zOzQHQZBi-LJvKIlMHwtI",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "brac-e7b1f.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "brac-e7b1f",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "brac-e7b1f.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "521109723172",
  appId: env.VITE_FIREBASE_APP_ID || "1:521109723172:web:c122b4baccebdae7b120b1",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-37MSVVW05Z",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { onAuthStateChanged };
export default app;
