import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, db } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || "",
        email: user.email,
        photoURL: user.photoURL || "",
        bio: "",
        isProfileComplete: false,
        createdAt: new Date().toISOString()
      });
      return true;
    }

    const data = userSnap.data();
    return !data.isProfileComplete;
  };

  const logout = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        if (user) {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists()) {
            setUserProfile(userSnap.data());
          }
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, setUserProfile, loginWithGoogle, logout }}>
      {loading ? (
        <div style={{ color: "#ffffff", display: "grid", placeItems: "center", minHeight: "100vh", backgroundColor: "#121212" }}>
          Loading DevSnippet...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);