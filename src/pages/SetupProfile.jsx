import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Code2, User, FileText, ArrowRight } from "lucide-react";

export default function SetupProfile() {
  const { setUserProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const updatedProfile = {
        displayName: cleanUsername,
        bio: bio.trim(),
        isProfileComplete: true,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(userRef, updatedProfile);

      if (setUserProfile) {
        setUserProfile((prev) => ({ ...prev, ...updatedProfile }));
      }

      navigate("/");
    } catch (err) {
      console.error("Error setting up profile:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "450px", backgroundColor: "#1b1c22", border: "1px solid #2e303a", borderRadius: "12px", padding: "32px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <Code2 size={32} color="#646cff" />
          <h2 style={{ margin: 0, color: "#f3f4f6" }}>Setup Your Profile</h2>
        </div>
        <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "24px" }}>
          Choose a display username and tell other developers a bit about yourself.
        </p>

        {error && (
          <div style={{ backgroundColor: "rgba(230, 57, 70, 0.1)", border: "1px solid #e63946", color: "#ff6b6b", padding: "10px", borderRadius: "6px", fontSize: "13px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", color: "#d1d5db", fontSize: "14px", marginBottom: "6px" }}>
              <User size={16} color="#646cff" /> Username
            </label>
            <input
              type="text"
              placeholder="e.g. dev_alex"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #2e303a", backgroundColor: "#121212", color: "#ffffff", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", color: "#d1d5db", fontSize: "14px", marginBottom: "6px" }}>
              <FileText size={16} color="#646cff" /> Bio
            </label>
            <textarea
              placeholder="Full-stack developer building cool things..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #2e303a", backgroundColor: "#121212", color: "#ffffff", resize: "none", boxSizing: "border-box" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "12px", backgroundColor: "#646cff", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Saving Profile..." : <>Complete Setup <ArrowRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}