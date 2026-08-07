import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { 
  collection, query, orderBy, getDocs, doc, 
  updateDoc, deleteDoc, arrayUnion, arrayRemove 
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, LogOut, User, Edit2, Check, X, AlertCircle, Trash2, Plus, 
  Heart, MessageSquare, Bookmark, Send, Copy, ShieldCheck, FileCode2 
} from "lucide-react";

export default function Profile() {
  const { currentUser, userProfile, logout } = useAuth();
  const [allSnippets, setAllSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("mySnippets"); // "mySnippets" | "liked" | "commented" | "saved" | "privacy"

  // Interaction States
  const [copiedId, setCopiedId] = useState(null);
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [commentText, setCommentText] = useState("");

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
  const userId = currentUser?.uid || "anonymous_user";
  const userDisplayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split("@")[0] || "";

  useEffect(() => {
    const fetchSnippets = async () => {
      try {
        const q = query(collection(db, "snippets"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const list = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAllSnippets(list);
      } catch (error) {
        console.error("Error fetching snippets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSnippets();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // --- Interaction Handlers ---
  const handleCopy = (id, codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleLike = async (snippet) => {
    const likesList = snippet.likes || [];
    const isLiked = likesList.includes(userId);

    const updatedLikes = isLiked
      ? likesList.filter((id) => id !== userId)
      : [...likesList, userId];

    setAllSnippets((prev) =>
      prev.map((s) => (s.id === snippet.id ? { ...s, likes: updatedLikes } : s))
    );

    try {
      const snippetRef = doc(db, "snippets", snippet.id);
      await updateDoc(snippetRef, {
        likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
      });
    } catch (error) {
      console.error("Error updating likes:", error);
    }
  };

  const handleToggleSave = async (snippet) => {
    const savedByList = snippet.savedBy || [];
    const isSaved = savedByList.includes(userId);

    const updatedSavedBy = isSaved
      ? savedByList.filter((id) => id !== userId)
      : [...savedByList, userId];

    setAllSnippets((prev) =>
      prev.map((s) => (s.id === snippet.id ? { ...s, savedBy: updatedSavedBy } : s))
    );

    try {
      const snippetRef = doc(db, "snippets", snippet.id);
      await updateDoc(snippetRef, {
        savedBy: isSaved ? arrayRemove(userId) : arrayUnion(userId)
      });
    } catch (error) {
      console.error("Error updating saved status:", error);
    }
  };

  const handleAddComment = async (snippetId) => {
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      authorName: userDisplayName || "Guest",
      text: commentText.trim(),
      createdAt: new Date().toISOString()
    };

    setAllSnippets((prev) =>
      prev.map((s) =>
        s.id === snippetId
          ? { ...s, comments: [...(s.comments || []), newComment] }
          : s
      )
    );

    setCommentText("");

    try {
      const snippetRef = doc(db, "snippets", snippetId);
      await updateDoc(snippetRef, {
        comments: arrayUnion(newComment)
      });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
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

  // --- Snippet Edit / Delete Handlers ---
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

      setAllSnippets((prev) =>
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
      setAllSnippets((prev) => prev.filter((item) => item.id !== snippetId));
    } catch (error) {
      console.error("Error deleting snippet:", error);
      alert("Failed to delete snippet. Please try again.");
    }
  };

  // Filter snippets based on current Tab selection
  const filteredSnippets = allSnippets.filter((s) => {
    if (activeTab === "mySnippets") return s.userId === userId;
    if (activeTab === "liked") return (s.likes || []).includes(userId);
    if (activeTab === "commented") {
      return (s.comments || []).some((c) => c.authorName?.toLowerCase() === userDisplayName.toLowerCase());
    }
    if (activeTab === "saved") return (s.savedBy || []).includes(userId);
    return false;
  });

  const getSectionTitle = () => {
    switch (activeTab) {
      case "mySnippets": return `My Snippets (${filteredSnippets.length})`;
      case "liked": return `Liked Posts (${filteredSnippets.length})`;
      case "commented": return `Commented Posts (${filteredSnippets.length})`;
      case "saved": return `Saved Posts (${filteredSnippets.length})`;
      case "privacy": return "Privacy Policy";
      default: return "";
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "1280px", margin: "0 auto", padding: "30px 20px", boxSizing: "border-box" }}>
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

      {/* Profile Header Card */}
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
          /* READ-ONLY PROFILE HEADER */
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
            </div>
            
            <p style={{ color: "#9ca3af", marginTop: "16px", marginBottom: 0, fontSize: "15px" }}>
              {userProfile?.bio || "No bio added yet."}
            </p>
          </>
        )}
      </div>

      {/* Two-Column Layout: Main Content + Right Navigation Sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: "24px", alignItems: "start" }}>
        
        {/* Main Section */}
        <main style={{ minWidth: 0, textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, fontSize: "20px", color: "#f3f4f6" }}>
              {getSectionTitle()}
            </h3>
            {activeTab === "mySnippets" && (
              <button
                onClick={() => navigate("/create-snippet")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  backgroundColor: "#646cff",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px"
                }}
              >
                <Plus size={16} /> Create Post
              </button>
            )}
          </div>

          {activeTab === "privacy" ? (
            /* PRIVACY POLICY VIEW */
            <div style={{ backgroundColor: "#1b1c22", border: "1px solid #2e303a", borderRadius: "12px", padding: "28px", color: "#d1d5db", lineHeight: "1.6" }}>
              <h2 style={{ color: "#f3f4f6", marginTop: 0 }}>Privacy Policy</h2>
              <p>At DevSnippet, we prioritize developer privacy and data control.</p>
              
              <strong style={{ color: "#646cff", display: "block", marginTop: "16px" }}>1. Information We Collect</strong>
              <p style={{ margin: "4px 0" }}>We collect your email address, chosen username, and code snippets uploaded to our platform.</p>

              <strong style={{ color: "#646cff", display: "block", marginTop: "16px" }}>2. How Information Is Used</strong>
              <p style={{ margin: "4px 0" }}>Your public profile and code snippets are visible to other developers for sharing, saving, and collaboration purposes.</p>

              <strong style={{ color: "#646cff", display: "block", marginTop: "16px" }}>3. Data Control & Security</strong>
              <p style={{ margin: "4px 0" }}>You retain full rights to edit or delete your posted snippets at any time from your profile page.</p>
            </div>
          ) : loading ? (
            <p style={{ textAlign: "left", color: "#aaa" }}>Loading snippets...</p>
          ) : filteredSnippets.length === 0 ? (
            /* EMPTY STATE */
            <div 
              style={{ 
                backgroundColor: "#1b1c22", 
                border: "1px solid #2e303a", 
                borderRadius: "12px", 
                padding: "40px", 
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px"
              }}
            >
              <p style={{ color: "#aaa", fontSize: "16px", margin: 0 }}>
                {activeTab === "mySnippets" && "You haven't created any code snippets yet."}
                {activeTab === "liked" && "You haven't liked any code snippets yet."}
                {activeTab === "commented" && "You haven't commented on any posts yet."}
                {activeTab === "saved" && "You haven't saved any code snippets yet."}
              </p>
              {activeTab === "mySnippets" && (
                <button
                  onClick={() => navigate("/create-snippet")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 18px",
                    backgroundColor: "#646cff",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "15px"
                  }}
                >
                  <Plus size={18} /> Create Post
                </button>
              )}
            </div>
          ) : (
            /* SNIPPETS FEED */
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {filteredSnippets.map((s) => {
                const isLiked = (s.likes || []).includes(userId);
                const isSaved = (s.savedBy || []).includes(userId);
                const comments = s.comments || [];
                const isOwner = s.userId === userId;

                return (
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
                      /* READ-ONLY DISPLAY */
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <h3 style={{ margin: 0, fontSize: "20px", color: "#f3f4f6" }}>{s.title}</h3>
                              {s.language && (
                                <span style={{ backgroundColor: "#2e303a", color: "#646cff", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                                  {s.language}
                                </span>
                              )}
                            </div>
                            <span style={{ color: "#888", fontSize: "13px", display: "block", marginTop: "4px" }}>
                              by <strong style={{ color: "#aaa" }}>{s.authorName}</strong>
                            </span>
                          </div>

                          {isOwner && (
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
                          )}
                        </div>

                        {s.description && (
                          <p style={{ margin: "8px 0 12px 0", color: "#9ca3af", fontSize: "15px" }}>{s.description}</p>
                        )}

                        {s.problem && (
                          <div style={{ backgroundColor: "#121212", border: "1px solid #2e303a", padding: "10px 14px", borderRadius: "6px", marginBottom: "12px", fontSize: "14px", color: "#d1d5db" }}>
                            <strong style={{ color: "#646cff" }}>Problem:</strong> {s.problem}
                          </div>
                        )}

                        {/* Code Box with Copy Button */}
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={() => handleCopy(s.id, s.code)}
                            style={{
                              position: "absolute",
                              top: "10px",
                              right: "10px",
                              backgroundColor: "#2e303a",
                              border: "none",
                              borderRadius: "6px",
                              padding: "6px 12px",
                              color: "#ffffff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "13px",
                              fontWeight: "500",
                              zIndex: 10
                            }}
                            title="Copy code to clipboard"
                          >
                            {copiedId === s.id ? (
                              <>
                                <Check size={14} color="#4ade80" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={14} /> Copy
                              </>
                            )}
                          </button>

                          <pre style={{ backgroundColor: "#121212", border: "1px solid #2e303a", padding: "16px", paddingRight: "90px", borderRadius: "6px", overflowX: "auto", fontFamily: "ui-monospace, Consolas, monospace", margin: 0, fontSize: "14px", color: "#e5e7eb" }}>
                            <code>{s.code}</code>
                          </pre>
                        </div>

                        {/* Interaction Bar (Like, Comment, Save) */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #2e303a" }}>
                          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                            {/* Like Button */}
                            <button
                              onClick={() => handleToggleLike(s)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "none",
                                border: "none",
                                color: isLiked ? "#ef4444" : "#9ca3af",
                                cursor: "pointer",
                                fontSize: "14px",
                                padding: 0
                              }}
                            >
                              <Heart size={18} fill={isLiked ? "#ef4444" : "none"} color={isLiked ? "#ef4444" : "#9ca3af"} />
                              <span>{(s.likes || []).length}</span>
                            </button>

                            {/* Comment Button */}
                            <button
                              onClick={() => setActiveCommentId(activeCommentId === s.id ? null : s.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "none",
                                border: "none",
                                color: activeCommentId === s.id ? "#646cff" : "#9ca3af",
                                cursor: "pointer",
                                fontSize: "14px",
                                padding: 0
                              }}
                            >
                              <MessageSquare size={18} />
                              <span>{comments.length}</span>
                            </button>
                          </div>

                          {/* Save Button */}
                          <button
                            onClick={() => handleToggleSave(s)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              background: "none",
                              border: "none",
                              color: isSaved ? "#646cff" : "#9ca3af",
                              cursor: "pointer",
                              fontSize: "14px",
                              padding: 0
                            }}
                          >
                            <Bookmark size={18} fill={isSaved ? "#646cff" : "none"} color={isSaved ? "#646cff" : "#9ca3af"} />
                            <span>{isSaved ? "Saved" : "Save"}</span>
                          </button>
                        </div>

                        {/* Expandable Comments Section */}
                        {activeCommentId === s.id && (
                          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #2e303a" }}>
                            {comments.length > 0 && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                                {comments.map((c) => (
                                  <div key={c.id} style={{ backgroundColor: "#121212", border: "1px solid #2e303a", borderRadius: "6px", padding: "10px 12px" }}>
                                    <div style={{ fontSize: "12px", color: "#646cff", fontWeight: "600", marginBottom: "4px" }}>
                                      {c.authorName}
                                    </div>
                                    <div style={{ fontSize: "14px", color: "#d1d5db" }}>
                                      {c.text}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* New Comment Input */}
                            <div style={{ display: "flex", gap: "8px" }}>
                              <input
                                type="text"
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddComment(s.id)}
                                style={{
                                  flex: 1,
                                  backgroundColor: "#121212",
                                  border: "1px solid #2e303a",
                                  borderRadius: "6px",
                                  padding: "8px 12px",
                                  color: "#ffffff",
                                  fontSize: "14px",
                                  outline: "none"
                                }}
                              />
                              <button
                                onClick={() => handleAddComment(s.id)}
                                style={{
                                  backgroundColor: "#646cff",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "6px",
                                  padding: "8px 14px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                <Send size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Right Navigation Sidebar */}
        <aside 
          style={{ 
            backgroundColor: "#1b1c22", 
            border: "1px solid #2e303a", 
            borderRadius: "12px", 
            padding: "16px",
            position: "sticky",
            top: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}
        >
          <button
            onClick={() => setActiveTab("mySnippets")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "10px 14px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: activeTab === "mySnippets" ? "#646cff" : "transparent",
              color: activeTab === "mySnippets" ? "#ffffff" : "#9ca3af",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: activeTab === "mySnippets" ? "600" : "400",
              textAlign: "left",
              transition: "all 0.15s ease"
            }}
          >
            <FileCode2 size={18} />
            <span>My Snippets</span>
          </button>

          <button
            onClick={() => setActiveTab("liked")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "10px 14px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: activeTab === "liked" ? "#646cff" : "transparent",
              color: activeTab === "liked" ? "#ffffff" : "#9ca3af",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: activeTab === "liked" ? "600" : "400",
              textAlign: "left",
              transition: "all 0.15s ease"
            }}
          >
            <Heart size={18} />
            <span>Liked Posts</span>
          </button>

          <button
            onClick={() => setActiveTab("commented")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "10px 14px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: activeTab === "commented" ? "#646cff" : "transparent",
              color: activeTab === "commented" ? "#ffffff" : "#9ca3af",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: activeTab === "commented" ? "600" : "400",
              textAlign: "left",
              transition: "all 0.15s ease"
            }}
          >
            <MessageSquare size={18} />
            <span>Commented Posts</span>
          </button>

          <button
            onClick={() => setActiveTab("saved")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "10px 14px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: activeTab === "saved" ? "#646cff" : "transparent",
              color: activeTab === "saved" ? "#ffffff" : "#9ca3af",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: activeTab === "saved" ? "600" : "400",
              textAlign: "left",
              transition: "all 0.15s ease"
            }}
          >
            <Bookmark size={18} />
            <span>Saved Posts</span>
          </button>

          <button
            onClick={() => setActiveTab("privacy")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "10px 14px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: activeTab === "privacy" ? "#646cff" : "transparent",
              color: activeTab === "privacy" ? "#ffffff" : "#9ca3af",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: activeTab === "privacy" ? "600" : "400",
              textAlign: "left",
              transition: "all 0.15s ease"
            }}
          >
            <ShieldCheck size={18} />
            <span>Privacy Policy</span>
          </button>

          <div style={{ height: "1px", backgroundColor: "#2e303a", margin: "10px 0" }} />

          {/* Logout Option at the End */}
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "10px 14px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "rgba(230, 57, 70, 0.1)",
              color: "#ff6b6b",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              textAlign: "left",
              transition: "all 0.15s ease"
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </aside>

      </div>
    </div>
  );
}