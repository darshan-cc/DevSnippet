import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => signOut(auth);

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const userRef = doc(db, "users", user.uid);

        try {
          const userSnap = await getDoc(userRef);

          // Populate standard defaults from Google Account info if new
          if (!userSnap.exists()) {
            const newUserData = {
              uid: user.uid,
              displayName: user.displayName || user.email?.split("@")[0] || "Developer",
              email: user.email,
              photoURL: user.photoURL || "",
              bio: "",
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newUserData);
          }
        } catch (error) {
          console.error("Error initializing user document:", error);
        }

        // Keep profile data synchronized in real-time
        unsubscribeProfile = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data());
            } else {
              setUserProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Profile snapshot error:", error);
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        if (unsubscribeProfile) unsubscribeProfile();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, setUserProfile, logout }}>
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