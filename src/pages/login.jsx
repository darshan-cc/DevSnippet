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
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
        backgroundColor: "#050507",
        boxSizing: "border-box"
      }}
    >
      <div 
        style={{ 
          width: "100%", 
          maxWidth: "400px", 
           background: "#000000",
          border: "1px solid #ffffff",
           borderRadius: "16px",
           padding: "40px 32px",
           boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
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
    marginBottom: "16px"
  }}
>
  <div
    style={{
      width: "40px",
      height: "40px",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#000000",
      border: "1px solid #ffffff"
    }}
  >
    <Code2 size={22} color="#ffffff" />
  </div>

  <h1
    style={{
      margin: 0,
      fontSize: "32px",
      fontWeight: "800",
      letterSpacing: "-0.8px",
      color: "#ffffff",
    }}
  >
    DevSnippet
  </h1>
</div>

<p
  style={{
    color: "#d1d1d1",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 28px",
    maxWidth: "320px",
    marginLeft: "auto",
    marginRight: "auto"
  }}
>
  Sign in to access, save, and share your developer snippets.
</p>

        {error && (
          <div 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              backgroundColor: "#000000",
              border: "1px solid #ffffff", 
              borderRadius: "6px", 
              padding: "10px 12px", 
              color: "#ffffff", 
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
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)} 
          style={{ 
            width: "100%",
            padding: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            fontSize: "15px", 
            fontWeight: "600", 
            cursor: loading ? "not-allowed" : "pointer", 
            background: "#ffffff",
            color: "#000000",
            borderRadius: "10px",
            boxShadow: isHovered
           ? "0 8px 20px rgba(255, 255, 255, 0.2)"
           : "0 4px 12px rgba(255, 255, 255, 0.1)",
            transform: isHovered ? "translateY(-2px)" : "translateY(0)",
            opacity: loading ? 0.7 : 1,
            transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease"
          }}
        >
         {loading ? (
  "Connecting..."
) : (
  <>
    <FcGoogle size={20} />
    <span>Sign in with Google</span>
  </>
)}
        </button>
      </div>
    </div>
  );
}