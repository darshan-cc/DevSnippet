import { useState, useEffect } from "react";
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider 
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Code2, AlertCircle, LogIn } from "lucide-react";

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        await signInWithRedirect(auth, provider);
      } else {
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
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh", 
        width: "100%", 
        padding: "20px", 
        backgroundColor: "var(--bg)", 
        color: "var(--text)", 
        boxSizing: "border-box" 
      }}
    >
      <div 
        style={{ 
          width: "100%", 
          maxWidth: "420px", 
          border: "2px solid var(--border)", 
          backgroundColor: "var(--bg)", 
          padding: "36px 28px", 
          display: "flex", 
          flexDirection: "column", 
          gap: "20px", 
          boxSizing: "border-box", 
          textAlign: "center" 
        }}
      >
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "10px", 
            borderBottom: "2px solid var(--border)", 
            paddingBottom: "16px" 
          }}
        >
          <Code2 size={32} color="var(--text-h)" />
          <h1 style={{ fontSize: "22px", fontWeight: "800", margin: 0, color: "var(--text-h)", letterSpacing: "-0.5px" }}>
            DEVSNIPPET
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "12px", fontWeight: "800", color: "var(--text-h)", letterSpacing: "0.5px" }}>
            // AUTHENTICATION_REQUIRED
          </span>
          <p style={{ fontSize: "14px", color: "var(--text)", lineHeight: "1.5", margin: 0, opacity: 0.85 }}>
            Sign in with Google to create, save, and manage developer code snippets.
          </p>
        </div>

        {error && (
          <div 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              border: "2px solid #ff3333", 
              color: "#ff3333", 
              padding: "10px 12px", 
              fontSize: "13px", 
              fontWeight: "700", 
              backgroundColor: "rgba(255, 51, 51, 0.05)", 
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
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "8px", 
            width: "100%", 
            padding: "12px 16px", 
            fontSize: "13px", 
            fontWeight: "700", 
            cursor: loading ? "not-allowed" : "pointer", 
            backgroundColor: "var(--text-h)", 
            color: "var(--bg)", 
            border: "2px solid var(--border)", 
            letterSpacing: "0.5px", 
            opacity: loading ? 0.7 : 1, 
            transition: "all 0.15s ease" 
          }}
        >
          <LogIn size={16} />
          {loading ? "CONNECTING..." : "SIGN_IN_WITH_GOOGLE"}
        </button>
      </div>
    </div>
  );
}