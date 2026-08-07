import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, User, Edit2, Check, X, AlertCircle, Trash2 } from "lucide-react";

export default function Profile() {
  const { currentUser, userProfile, logout } = useAuth();
  const [mySnippets, setMySnippets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileUpdating, setProfileUpdating] = useState(false);

  // Snippet Edit State
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLanguage, setEditLanguage] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editProblem, setEditProblem] = useState("");
  const [editCode, setEditCode] = useState("");
  const [updating, setUpdating] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchMySnippets = async () => {
      if (!currentUser) return;
      try {
        const q = query(
          collection(db, "snippets"),
          where("userId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const list = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMySnippets(list);
      } catch (error) {
        console.error("Error fetching my snippets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMySnippets();
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // --- Username Validation ---
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

  // --- Profile Handlers ---
  const startEditingProfile = () => {
    setProfileUsername(userProfile?.displayName || currentUser?.displayName || "");
    setProfileBio(userProfile?.bio || "");
    setProfileError("");
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    const cleanUsername = profileUsername.toLowerCase().trim();
    const validationError = validateUsername(cleanUsername);
    if (validationError) {
      setProfileError(validationError);
      return;
    }

    setProfileUpdating(true);
    setProfileError("");

    try {
      const currentName = (userProfile?.displayName || "").toLowerCase();

      if (cleanUsername !== currentName) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("displayName", "==", cleanUsername));
        const querySnapshot = await getDocs(q);

        const isTaken = querySnapshot.docs.some((d) => d.id !== currentUser.uid);

        if (isTaken) {
          setProfileError("This username is already taken. Please choose another.");
          setProfileUpdating(false);
          return;
        }
      }

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        displayName: cleanUsername,
        bio: profileBio.trim(),
        updatedAt: new Date().toISOString()
      });

      if (userProfile) {
        userProfile.displayName = cleanUsername;
        userProfile.bio = profileBio.trim();
      }

      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileError("Failed to update profile. Please try again.");
    } finally {
      setProfileUpdating(false);
    }
  };

  // --- Snippet Handlers ---
  const startEditingSnippet = (s) => {
    setEditingId(s.id);
    setEditTitle(s.title || "");
    setEditLanguage(s.language || "");
    setEditDescription(s.description || "");
    setEditProblem(s.problem || "");
    setEditCode(s.code || "");
  };

  const handleSaveSnippet = async (snippetId) => {
    if (!editTitle.trim() || !editCode.trim()) return;

    setUpdating(true);
    try {
      const snippetRef = doc(db, "snippets", snippetId);
      const updatedData = {
        title: editTitle.trim(),
        language: editLanguage.trim() || "Plain Text",
        description: editDescription.trim(),
        problem: editProblem.trim(),
        code: editCode,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(snippetRef, updatedData);

      setMySnippets((prev) =>
        prev.map((item) => (item.id === snippetId ? { ...item, ...updatedData } : item))
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error updating snippet:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteSnippet = async (snippetId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this snippet? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "snippets", snippetId));
      setMySnippets((prev) => prev.filter((item) => item.id !== snippetId));
    } catch (error) {
      console.error("Error deleting snippet:", error);
      alert("Failed to delete snippet. Please try again.");
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "30px 20px", boxSizing: "border-box" }}>
      {/* Back Button */}
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "24px" }}>
        <button 
          onClick={() => navigate("/")} 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "8px", 
            cursor: "pointer", 
            background: "none", 
            border: "none", 
            color: "#646cff", 
            fontSize: "16px", 
            fontWeight: "500",
            padding: 0
          }}
        >
          <ArrowLeft size={20} /> Back to Home
        </button>
      </div>

      {/* Profile Card */}
      <div 
        style={{ 
          backgroundColor: "#1b1c22", 
          border: "1px solid #2e303a", 
          borderRadius: "12px", 
          padding: "24px 28px", 
          marginBottom: "32px", 
          textAlign: "left" 
        }}
      >
        {isEditingProfile ? (
          /* EDIT PROFILE FORM */
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#f3f4f6" }}>Edit Profile</h3>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#f3f4f6", fontSize: "13px" }}>
                Username *
              </label>
              <input 
                type="text"
                value={profileUsername}
                onChange={(e) => {
                  setProfileUsername(e.target.value.toLowerCase());
                  setProfileError("");
                }}
                maxLength={30}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: profileError ? "1px solid #e63946" : "1px solid #2e303a",
                  backgroundColor: "#121212",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              <small style={{ color: "#888", display: "block", marginTop: "4px", fontSize: "12px" }}>
                3–30 characters. Letters, numbers, underscores (_), and periods (.) only.
              </small>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#f3f4f6", fontSize: "13px" }}>
                Bio
              </label>
              <textarea 
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                placeholder="Tell the community about yourself..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  height: "70px",
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

            {profileError && (
              <div 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  backgroundColor: "rgba(230, 57, 70, 0.1)", 
                  border: "1px solid #e63946", 
                  borderRadius: "6px", 
                  padding: "8px 12px", 
                  color: "#ff6b6b", 
                  fontSize: "13px" 
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{profileError}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
              <button
                onClick={() => setIsEditingProfile(false)}
                disabled={profileUpdating}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  backgroundColor: "transparent",
                  border: "1px solid #2e303a",
                  color: "#ffffff",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                <X size={16} /> Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={profileUpdating}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  backgroundColor: "#646cff",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  opacity: profileUpdating ? 0.7 : 1
                }}
              >
                <Check size={16} /> {profileUpdating ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        ) : (
          /* READ-ONLY PROFILE */
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ backgroundColor: "#2e303a", padding: "10px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={24} color="#646cff" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "22px", color: "#f3f4f6" }}>
                    {userProfile?.displayName || currentUser?.displayName || "Developer"}
                  </h2>
                  <small style={{ color: "#888" }}>{currentUser?.email}</small>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button 
                  onClick={startEditingProfile}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "6px", 
                    padding: "8px 14px", 
                    backgroundColor: "#2e303a", 
                    color: "#ffffff", 
                    border: "none", 
                    borderRadius: "6px", 
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "14px"
                  }}
                >
                  <Edit2 size={15} /> Edit Profile
                </button>
                <button 
                  onClick={handleLogout} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "6px", 
                    padding: "8px 16px", 
                    backgroundColor: "#e63946", 
                    color: "#ffffff", 
                    border: "none", 
                    borderRadius: "6px", 
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px"
                  }}
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
            
            <p style={{ color: "#9ca3af", marginTop: "16px", marginBottom: 0, fontSize: "15px" }}>
              {userProfile?.bio || "No bio added yet."}
            </p>
          </>
        )}
      </div>

      {/* Snippets List */}
      <h3 style={{ textAlign: "left", marginBottom: "20px", fontSize: "20px", color: "#f3f4f6" }}>
        My Snippets ({mySnippets.length})
      </h3>

      {loading ? (
        <p style={{ textAlign: "left", color: "#aaa" }}>Loading your snippets...</p>
      ) : mySnippets.length === 0 ? (
        <div style={{ backgroundColor: "#1b1c22", border: "1px solid #2e303a", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
          <p style={{ color: "#aaa", fontSize: "16px" }}>You haven't created any code snippets yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {mySnippets.map((s) => (
            <div 
              key={s.id} 
              style={{ 
                backgroundColor: "#1b1c22", 
                border: "1px solid #2e303a", 
                borderRadius: "10px", 
                padding: "20px", 
                textAlign: "left" 
              }}
            >
              {editingId === s.id ? (
                /* EDIT SNIPPET FORM */
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#f3f4f6", fontSize: "13px" }}>
                        Title *
                      </label>
                      <input 
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "6px",
                          border: "1px solid #2e303a",
                          backgroundColor: "#121212",
                          color: "#ffffff",
                          fontSize: "14px",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#f3f4f6", fontSize: "13px" }}>
                        Language
                      </label>
                      <input 
                        type="text"
                        value={editLanguage}
                        onChange={(e) => setEditLanguage(e.target.value)}
                        placeholder="e.g. JavaScript, Python"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "6px",
                          border: "1px solid #2e303a",
                          backgroundColor: "#121212",
                          color: "#ffffff",
                          fontSize: "14px",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#f3f4f6", fontSize: "13px" }}>
                      Description
                    </label>
                    <input 
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #2e303a",
                        backgroundColor: "#121212",
                        color: "#ffffff",
                        fontSize: "14px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#f3f4f6", fontSize: "13px" }}>
                      Problem Statement (Optional)
                    </label>
                    <textarea 
                      value={editProblem}
                      onChange={(e) => setEditProblem(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        height: "70px",
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

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#f3f4f6", fontSize: "13px" }}>
                      Code *
                    </label>
                    <textarea 
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        height: "180px",
                        borderRadius: "6px",
                        border: "1px solid #2e303a",
                        backgroundColor: "#121212",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontFamily: "ui-monospace, Consolas, monospace",
                        resize: "vertical",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
                    <button
                      onClick={() => setEditingId(null)}
                      disabled={updating}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        backgroundColor: "transparent",
                        border: "1px solid #2e303a",
                        color: "#ffffff",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      <X size={16} /> Cancel
                    </button>
                    <button
                      onClick={() => handleSaveSnippet(s.id)}
                      disabled={updating}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        backgroundColor: "#646cff",
                        border: "none",
                        color: "#ffffff",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "14px",
                        opacity: updating ? 0.7 : 1
                      }}
                    >
                      <Check size={16} /> {updating ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                /* READ-ONLY SNIPPET DISPLAY */
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 6px 0", fontSize: "20px", color: "#f3f4f6" }}>{s.title}</h3>
                      {s.language && (
                        <span style={{ backgroundColor: "#2e303a", color: "#646cff", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                          {s.language}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => startEditingSnippet(s)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          backgroundColor: "#2e303a",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          color: "#ffffff",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "500"
                        }}
                        title="Edit snippet"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSnippet(s.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          backgroundColor: "#e63946",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          color: "#ffffff",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "500"
                        }}
                        title="Delete snippet"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>

                  {s.description && (
                    <p style={{ margin: "8px 0 12px 0", color: "#9ca3af", fontSize: "15px" }}>{s.description}</p>
                  )}

                  {s.problem && (
                    <div style={{ backgroundColor: "#121212", border: "1px solid #2e303a", padding: "10px 14px", borderRadius: "6px", marginBottom: "12px", fontSize: "14px", color: "#d1d5db" }}>
                      <strong style={{ color: "#646cff" }}>Problem:</strong> {s.problem}
                    </div>
                  )}

                  <pre style={{ backgroundColor: "#121212", border: "1px solid #2e303a", padding: "14px", borderRadius: "6px", overflowX: "auto", fontFamily: "ui-monospace, Consolas, monospace", margin: 0, fontSize: "14px", color: "#e5e7eb" }}>
                    <code>{s.code}</code>
                  </pre>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}