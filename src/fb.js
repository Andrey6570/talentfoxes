import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { firebaseConfig } from "./config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });

export async function googleSignIn() {
  if (Capacitor.isNativePlatform()) {
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
    const res = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
    const cred = GoogleAuthProvider.credential(res.credential && res.credential.idToken, res.credential && res.credential.accessToken);
    return signInWithCredential(auth, cred);
  }
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function appSignOut() {
  if (Capacitor.isNativePlatform()) {
    try { const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication"); await FirebaseAuthentication.signOut(); } catch (e) {}
  }
  await signOut(auth);
}

export const passwordSignIn = (email, pw) => signInWithEmailAndPassword(auth, email, pw);

// A child account is created through a second app instance so the parent stays signed in.
export async function createChildAuthUser(email, pw) {
  const sec = initializeApp(firebaseConfig, "secondary-" + Date.now());
  const secAuth = getAuth(sec);
  try {
    const cred = await createUserWithEmailAndPassword(secAuth, email, pw);
    return cred.user.uid;
  } finally {
    try { await signOut(secAuth); } catch (e) {}
  }
}

// Removes a child's sign-in record. Needs the child's password; the parent stays signed in.
export async function deleteChildAuthUser(email, pw) {
  const sec = initializeApp(firebaseConfig, "secondary-del-" + Date.now());
  const secAuth = getAuth(sec);
  try {
    const cred = await signInWithEmailAndPassword(secAuth, email, pw);
    await deleteUser(cred.user);
  } finally {
    try { await signOut(secAuth); } catch (e) {}
  }
}
// Deletes the signed-in account (call right after a fresh sign-in).
export async function deleteCurrentUser() { if (auth.currentUser) await deleteUser(auth.currentUser); }
