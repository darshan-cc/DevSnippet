import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { 
  collection, query, orderBy, getDocs, doc, 
  updateDoc, deleteDoc, arrayUnion, arrayRemove 
} from "firebase/firestore";
import { 
  ArrowLeft, User, Edit2, Check, X, Trash2, Plus, 
  Heart, Bookmark, MessageSquare, Copy, ShieldCheck, Code, LogOut 
} from "lucide-react";
import "./Profile.css";

export default function Profile() {
  const { currentUser, userProfile, logout } = useAuth();
  const [allSnippets, setAllSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("mySnippets");

  // Interaction States
  const [copiedId, setCopiedId] = useState(null);

  // Profile Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileUpdating, setProfileUpdating] = useState(false);

  // Snippet Edit States
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLanguage, setEditLanguage] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCode, setEditCode] = useState("");
  const [updating, setUpdating] = useState(false);

  const navigate = useNavigate();
  const userId = currentUser?.uid || "";
  const userDisplayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split("@")[0] || "Developer";

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

  const handleCopyCode = (id, codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleLike = async (snippet) => {
    const likesList = snippet.likes || [];
    const isLiked = likesList.includes(userId);
    const updatedLikes = isLiked ? likesList.filter((id) => id !== userId) : [...likesList, userId];

    setAllSnippets((prev) => prev.map((s) => (s.id === snippet.id ? { ...s, likes: updatedLikes } : s)));

    try {
      const snippetRef = doc(db, "snippets", snippet.id);
      await updateDoc(snippetRef, {
        likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
      });
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleToggleSave = async (snippet) => {
    const savedList = snippet.savedBy || [];
    const isSaved = savedList.includes(userId);
    const updatedSaved = isSaved ? savedList.filter((id) => id !== userId) : [...savedList, userId];

    setAllSnippets((prev) => prev.map((s) => (s.id === snippet.id ? { ...s, savedBy: updatedSaved } : s)));

    try {
      const snippetRef = doc(db, "snippets", snippet.id);
      await updateDoc(snippetRef, {
        savedBy: isSaved ? arrayRemove(userId) : arrayUnion(userId)
      });
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const startEditingProfile = () => {
    setProfileUsername(userProfile?.displayName || currentUser?.displayName || "");
    setProfileBio(userProfile?.bio || "");
    setProfileError("");
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    const cleanUsername = profileUsername.toLowerCase().trim();
    if (!cleanUsername || cleanUsername.length < 3) {
      setProfileError("Username must be at least 3 characters long.");
      return;
    }

    setProfileUpdating(true);
    setProfileError("");

    try {
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

  const startEditingSnippet = (s) => {
    setEditingId(s.id);
    setEditTitle(s.title || "");
    setEditLanguage(s.language || "");
    setEditDescription(s.description || "");
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
        code: editCode,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(snippetRef, updatedData);
      setAllSnippets((prev) => prev.map((item) => (item.id === snippetId ? { ...item, ...updatedData } : item)));
      setEditingId(null);
    } catch (error) {
      console.error("Error updating snippet:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteSnippet = async (snippetId) => {
    if (!window.confirm("Are you sure you want to delete this snippet?")) return;

    try {
      await deleteDoc(doc(db, "snippets", snippetId));
      setAllSnippets((prev) => prev.filter((item) => item.id !== snippetId));
    } catch (error) {
      console.error("Error deleting snippet:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const filteredSnippets = allSnippets.filter((s) => {
    if (activeTab === "mySnippets") return s.userId === userId;
    if (activeTab === "liked") return (s.likes || []).includes(userId);
    if (activeTab === "commented") return (s.comments || []).some((c) => c.authorName?.toLowerCase() === userDisplayName.toLowerCase());
    if (activeTab === "saved") return (s.savedBy || []).includes(userId);
    return false;
  });

  return (
    <div className="profile-wrapper">
      {/* Top Header */}
      <header className="profile-nav">
        <button onClick={() => navigate("/")} className="brutalist-btn">
          <ArrowLeft size={16} /> BACK_TO_HOME
        </button>
        <button onClick={handleLogout} className="brutalist-btn danger">
          <LogOut size={16} /> LOGOUT
        </button>
      </header>

      {/* User Profile Info Card */}
      <section className="brutalist-card profile-card">
        {isEditingProfile ? (
          <div className="edit-box">
            <h3>// EDIT_PROFILE</h3>
            <div className="form-group">
              <label>[ USERNAME ]</label>
              <input 
                type="text" 
                value={profileUsername} 
                onChange={(e) => setProfileUsername(e.target.value.toLowerCase())} 
                className="brutalist-input"
              />
            </div>
            <div className="form-group">
              <label>[ BIO ]</label>
              <textarea 
                value={profileBio} 
                onChange={(e) => setProfileBio(e.target.value)} 
                className="brutalist-input textarea-short"
                placeholder="Tell us about yourself..."
              />
            </div>
            {profileError && <div className="error-banner">{profileError}</div>}
            <div className="form-actions">
              <button onClick={() => setIsEditingProfile(false)} className="brutalist-btn">
                <X size={16} /> CANCEL
              </button>
              <button onClick={handleSaveProfile} disabled={profileUpdating} className="brutalist-btn primary">
                <Check size={16} /> {profileUpdating ? "SAVING..." : "SAVE_PROFILE"}
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-main-info">
            <div className="profile-avatar">
              <User size={48} />
            </div>
            <div className="profile-details">
              <div className="profile-info-row">
                <div className="text-content">
                  <h2>{userDisplayName}</h2>
                  <span className="user-email">{currentUser?.email}</span>
                  <p className="bio-text">{userProfile?.bio || "No bio added yet."}</p>
                </div>
                <button onClick={startEditingProfile} className="brutalist-btn">
                  <Edit2 size={14} /> EDIT_PROFILE
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Content Layout with Sidebar Tabs */}
      <div className="profile-content-grid">
        {/* Main Content View */}
        <main className="main-content">
          <div className="section-header">
            <h3 className="section-title">
              {activeTab === "mySnippets" && `// MY_SNIPPETS (${filteredSnippets.length})`}
              {activeTab === "liked" && `// LIKED_POSTS (${filteredSnippets.length})`}
              {activeTab === "commented" && `// COMMENTED_POSTS (${filteredSnippets.length})`}
              {activeTab === "saved" && `// SAVED_POSTS (${filteredSnippets.length})`}
              {activeTab === "privacy" && "// PRIVACY_POLICY"}
            </h3>
            {activeTab === "mySnippets" && (
              <button onClick={() => navigate("/create")} className="brutalist-btn primary">
                <Plus size={16} /> CREATE_POST
              </button>
            )}
          </div>

          {activeTab === "privacy" ? (
            <div className="brutalist-card privacy-card">
              <h4>PRIVACY_&_DATA_USAGE</h4>
              <p>DevSnippet stores public posts, comments, and profile details securely.</p>
              <h5>1. PUBLIC_INFORMATION</h5>
              <p>Code snippets and display usernames are visible to registered developers.</p>
              <h5>2. CONTENT_MANAGEMENT</h5>
              <p>You reserve full rights to modify or delete your shared snippets at any time.</p>
            </div>
          ) : loading ? (
            <div className="loading-state">// LOADING_SNIPPETS...</div>
          ) : filteredSnippets.length === 0 ? (
            <div className="brutalist-card empty-state">
              <p>NO_SNIPPETS_FOUND_IN_THIS_CATEGORY</p>
              {activeTab === "mySnippets" && (
                <button onClick={() => navigate("/create")} className="brutalist-btn primary">
                  <Plus size={16} /> CREATE_YOUR_FIRST_SNIPPET
                </button>
              )}
            </div>
          ) : (
            <div className="snippets-stack">
              {filteredSnippets.map((s) => {
                const isOwner = s.userId === userId;
                const isLiked = (s.likes || []).includes(userId);
                const isSaved = (s.savedBy || []).includes(userId);

                return (
                  <div key={s.id} className="brutalist-card snippet-card">
                    {editingId === s.id ? (
                      <div className="edit-snippet-form">
                        <input 
                          type="text" 
                          value={editTitle} 
                          onChange={(e) => setEditTitle(e.target.value)} 
                          className="brutalist-input" 
                          placeholder="TITLE"
                        />
                        <input 
                          type="text" 
                          value={editLanguage} 
                          onChange={(e) => setEditLanguage(e.target.value)} 
                          className="brutalist-input" 
                          placeholder="LANGUAGE"
                        />
                        <textarea 
                          value={editDescription} 
                          onChange={(e) => setEditDescription(e.target.value)} 
                          className="brutalist-input textarea-short" 
                          placeholder="DESCRIPTION"
                        />
                        <textarea 
                          value={editCode} 
                          onChange={(e) => setEditCode(e.target.value)} 
                          className="brutalist-input code-area" 
                        />
                        <div className="form-actions">
                          <button onClick={() => setEditingId(null)} className="brutalist-btn">CANCEL</button>
                          <button onClick={() => handleSaveSnippet(s.id)} disabled={updating} className="brutalist-btn primary">SAVE_CHANGES</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="snippet-top-bar">
                          <div className="snippet-meta">
                            {s.language && <span className="card-lang">[{s.language.toUpperCase()}]</span>}
                            <h4 className="snippet-title">{s.title}</h4>
                            <span className="author-label">by @{s.authorName || "anonymous"}</span>
                          </div>
                          {isOwner && (
                            <div className="owner-actions">
                              <button onClick={() => startEditingSnippet(s)} className="brutalist-action" title="Edit">
                                <Edit2 size={14} /> EDIT
                              </button>
                              <button onClick={() => handleDeleteSnippet(s.id)} className="brutalist-action danger" title="Delete">
                                <Trash2 size={14} /> DELETE
                              </button>
                            </div>
                          )}
                        </div>

                        {s.description && <p className="snippet-desc">{s.description}</p>}

                        <div className="code-block-wrapper">
                          <button onClick={() => handleCopyCode(s.id, s.code)} className="brutalist-action copy-btn">
                            <Copy size={12} /> {copiedId === s.id ? "COPIED" : "COPY"}
                          </button>
                          <pre className="brutalist-code"><code>{s.code}</code></pre>
                        </div>

                        <div className="snippet-footer-actions">
                          <button onClick={() => handleToggleLike(s)} className={`brutalist-action ${isLiked ? "active" : ""}`}>
                            <Heart size={14} /> {(s.likes || []).length}
                          </button>
                          <div className="comment-count">
                            <MessageSquare size={14} /> {(s.comments || []).length} COMMENTS
                          </div>
                          <button onClick={() => handleToggleSave(s)} className={`brutalist-action save-btn ${isSaved ? "active" : ""}`}>
                            <Bookmark size={14} /> {isSaved ? "SAVED" : "SAVE"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Tab Sidebar */}
        <aside className="sidebar-nav">
          <button 
            className={`tab-link ${activeTab === "mySnippets" ? "active" : ""}`}
            onClick={() => setActiveTab("mySnippets")}
          >
            <Code size={16} /> MY_SNIPPETS
          </button>
          <button 
            className={`tab-link ${activeTab === "liked" ? "active" : ""}`}
            onClick={() => setActiveTab("liked")}
          >
            <Heart size={16} /> LIKED_POSTS
          </button>
          <button 
            className={`tab-link ${activeTab === "commented" ? "active" : ""}`}
            onClick={() => setActiveTab("commented")}
          >
            <MessageSquare size={16} /> COMMENTED
          </button>
          <button 
            className={`tab-link ${activeTab === "saved" ? "active" : ""}`}
            onClick={() => setActiveTab("saved")}
          >
            <Bookmark size={16} /> SAVED_POSTS
          </button>
          <button 
            className={`tab-link ${activeTab === "privacy" ? "active" : ""}`}
            onClick={() => setActiveTab("privacy")}
          >
            <ShieldCheck size={16} /> PRIVACY_POLICY
          </button>
        </aside>
      </div>
    </div>
  );
}