import { useState, useEffect } from "react";
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Code2, AlertCircle } from "lucide-react";

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check or initialize Firestore profile document
  const handleProfileRouting = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // First time login: Create profile document marked as incomplete
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: "",
        bio: "",
        isProfileComplete: false,
        createdAt: new Date().toISOString()
      });
      return false; // Profile incomplete
    }

    return userSnap.data()?.isProfileComplete === true;
  };

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const isComplete = await handleProfileRouting(result.user);
          navigate(isComplete ? "/" : "/setup-profile");
        }
      })
      .catch((err) => {
        console.error("Redirect sign in error:", err);
        setError(err.message || "Failed to sign in. Please try again.");
      });
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    const provider = new GoogleAuthProvider();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    try {
      if (isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        const isComplete = await handleProfileRouting(result.user);
        navigate(isComplete ? "/" : "/setup-profile");
      }
    } catch (err) {
      console.error("Google sign in error:", err);
      setError(err.message || "Failed to sign in with Google.");
      setLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh",
        width: "100%",
        padding: "20px",
        boxSizing: "border-box"
      }}
    >
      <div 
        style={{ 
          width: "100%", 
          maxWidth: "400px", 
          backgroundColor: "#1b1c22", 
          border: "1px solid #2e303a", 
          borderRadius: "12px", 
          padding: "36px 32px", 
          boxSizing: "border-box",
          textAlign: "center"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "16px" }}>
          <Code2 size={36} color="#646cff" />
          <h1 style={{ margin: 0, fontSize: "28px", color: "#f3f4f6" }}>DevSnippet</h1>
        </div>

        <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "28px" }}>
          Welcome! Sign in with Google to access your developer snippets.
        </p>

        {error && (
          <div 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              backgroundColor: "rgba(230, 57, 70, 0.1)", 
              border: "1px solid #e63946", 
              borderRadius: "6px", 
              padding: "10px 12px", 
              color: "#ff6b6b", 
              fontSize: "13px",
              marginBottom: "20px",
              textAlign: "left"
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <button 
          onClick={handleGoogleLogin} 
          disabled={loading} 
          style={{ 
            width: "100%",
            padding: "12px", 
            fontSize: "15px", 
            fontWeight: "600", 
            cursor: loading ? "not-allowed" : "pointer", 
            backgroundColor: "#646cff", 
            color: "#ffffff", 
            border: "none", 
            borderRadius: "6px",
            opacity: loading ? 0.7 : 1,
            transition: "all 0.2s ease"
          }}
        >
          {loading ? "Connecting..." : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
}