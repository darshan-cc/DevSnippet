import { useState, useEffect } from "react";
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider 
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Code2, AlertCircle } from "lucide-react";

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle redirect response on mobile after returning from Google
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          navigate("/");
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
        // Mobile browsers block popups; use redirect instead
        await signInWithRedirect(auth, provider);
      } else {
        // Desktop browsers work fine with popup
        await signInWithPopup(auth, provider);
        navigate("/");
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