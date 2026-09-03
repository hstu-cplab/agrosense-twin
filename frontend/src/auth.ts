import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { describeFirestoreError } from "./firestore";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "That email address is not valid.",
  "auth/invalid-credential": "Incorrect email or access code.",
  "auth/wrong-password": "Incorrect email or access code.",
  "auth/user-not-found": "No operator credential exists for that email.",
  "auth/user-disabled": "This operator credential has been disabled.",
  "auth/email-already-in-use": "An operator credential already exists for that email.",
  "auth/weak-password": "Access code must be at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Wait a moment, then try again.",
  "auth/network-request-failed": "Network unreachable. Check the connection and retry.",
  "auth/operation-not-allowed": "Email/password sign-in is disabled for this Firebase project.",
  "auth/unauthorized-domain": "This domain is not in the Firebase Auth authorized domains list.",
  "auth/configuration-not-found": "Firebase Auth is not configured for this project.",
};

                                                                        
export function describeAuthError(err: unknown): string {
  const code = (err as { code?: string } | null)?.code ?? "";
  if (code in AUTH_ERROR_MESSAGES) return AUTH_ERROR_MESSAGES[code];
  if (code.startsWith("auth/")) {
    return `Authentication failed (${code.slice("auth/".length)}).`;
  }
  return describeFirestoreError(err);
}

export interface UserProfileData {
  name: string;
  phone: string;
  email: string;
  address: string;
  role?: string;
  upazilla?: string;
  zila?: string;
  avatar?: string;
}

export async function signUpWithEmailAndPassword(data: UserProfileData & { password: string }) {
  const { password, email, ...profileData } = data;
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;
  if (user) {
    try {
      await setDoc(doc(db, "users", user.uid), {
        ...profileData,
        email: user.email,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
                                                                             
                                                                             
                                                               
      console.error("Account created, but the profile document could not be written", err);
    }
  }
  return user;
}

export async function loginWithEmailAndPassword(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logout() {
  await signOut(auth);
}

export async function fetchUserProfile(uid: string): Promise<UserProfileData | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    name: data.name ?? "",
    phone: data.phone ?? "",
    email: data.email ?? "",
    address: data.address ?? "",
    role: data.role ?? "",
    upazilla: data.upazilla ?? "",
    zila: data.zila ?? "",
    avatar: data.avatar ?? "",
  };
}

export async function updateUserProfile(uid: string, data: Partial<UserProfileData>) {
  const ref = doc(db, "users", uid);
                                                                               
                                                                               
  await setDoc(ref, data, { merge: true });
}
