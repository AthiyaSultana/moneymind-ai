import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../config/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        console.log('currentuserr', currentUser)
        if (currentUser) {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnapshot = await getDoc(userRef);
          console.log('ususerSnapshoteREF', userSnapshot);
          if (!userSnapshot.exists()) {
            console.log("Creating Firestore user document...");
            await setDoc(userRef, {
              email: currentUser.email,
              createdAt: serverTimestamp(),
            });
            console.log("Firestore user document created successfully!");
          }
        }

        setUser(currentUser);
      } catch (error) {
        console.error("Failed to initialize user profile:", error);
        setUser(currentUser);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const register = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const firebaseUser = userCredential.user;

    await setDoc(doc(db, "users", firebaseUser.uid), {
      email: firebaseUser.email,
      createdAt: serverTimestamp(),
    });

    return userCredential;
  };

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  const value = {
    user,
    loading,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}