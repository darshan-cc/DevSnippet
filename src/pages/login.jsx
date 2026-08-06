import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Code2, AlertCircle } from "lucide-react";

export default function SetupProfile() {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Instagram Username Validation Rules
  const validateUsername = (value) => {
    const val = value.trim();
    if (!val) return "Username is required.";
    if (val.length < 3 || val.length > 30) {
      return "Username must be between 3 and 30 characters long.";
    }
    if (!/^[a-zA-Z0-9._]+$/.test(val)) {
      return "Only letters, numbers, underscores (_), and periods (.) are allowed.";
    }
    if (val.startsWith(".") || val.endsWith(".")) {
      return "Username cannot start or end with a period.";
    }
    if (/\.\./.test(val)) {
      return "Username cannot contain consecutive periods (..).";
    }
    return "";
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase();
    setUsername(value);
    
    // Clear or update error message in real time
    if (value) {
      setError(validateUsername(value));
    } else {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!currentUser) return;

    setError("");
    setLoading(true);

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(
        userRef,
        {
          displayName: username.toLowerCase().trim(),
          bio: bio.trim(),
          isProfileComplete: true,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      navigate("/");
    } catch (err) {
      console.error("Error setting up profile:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
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
          maxWidth: "440px", 
          backgroundColor: "#1b1c22", 
          border: "1px solid #2e303a", 
          borderRadius: "12px", 
          padding: "36px 32px", 
          boxSizing: "border-box",
          textAlign: "left"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <Code2 size={32} color="#646cff" />
          <h2 style={{ margin: 0, fontSize: "24px", color: "#f3f4f6" }}>Setup Profile</h2>
        </div>

        <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "24px", marginTop: 0 }}>
          Choose a unique username and tell the community a bit about yourself.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#f3f4f6", fontSize: "14px" }}>
              Username *
            </label>
            <input 
              type="text" 
              required 
              value={username} 
              onChange={handleUsernameChange} 
              placeholder="e.g. dev_alex.99" 
              maxLength={30}
              style={{ 
                width: "100%", 
                padding: "10px 14px", 
                borderRadius: "6px",
                border: error ? "1px solid #e63946" : "1px solid #2e303a",
                backgroundColor: "#121212",
                color: "#ffffff",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box" 
              }} 
            />
            <small style={{ color: "#888", display: "block", marginTop: "6px", fontSize: "12px" }}>
              3–30 characters. Letters, numbers, underscores, and periods only.
            </small>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#f3f4f6", fontSize: "14px" }}>
              Bio
            </label>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder="Full-stack engineer building cool web apps..." 
              style={{ 
                width: "100%", 
                padding: "10px 14px", 
                height: "80px", 
                borderRadius: "6px",
                border: "1px solid #2e303a",
                backgroundColor: "#121212",
                color: "#ffffff",
                fontSize: "14px",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box" 
              }} 
            />
          </div>

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
                fontSize: "13px" 
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !!error} 
            style={{ 
              marginTop: "8px",
              padding: "12px", 
              fontSize: "16px", 
              fontWeight: "600", 
              cursor: (loading || !!error) ? "not-allowed" : "pointer", 
              backgroundColor: "#646cff", 
              color: "#ffffff", 
              border: "none", 
              borderRadius: "6px",
              opacity: (loading || !!error) ? 0.6 : 1,
              transition: "all 0.2s ease"
            }}
          >
            {loading ? "Saving Profile..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}