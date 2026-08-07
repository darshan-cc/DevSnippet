import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { 
  Settings, Plus, Code2, Copy, Check, Terminal, FileCode, 
  Layers, User, Users, Heart, MessageSquare, Bookmark, Send 
} from "lucide-react";

const LANGUAGES = [
  "All",
  "C++",
  "C#",
  "CSS",
  "Dart",
  "Dockerfile",
  "F#",
  "Go",
  "HTML",
  "Java",
  "JavaScript",
  "JSON",
  "Julia",
  "Less",
  "Markdown",
  "PHP",
  "PowerShell",
  "Python",
  "R",
  "Ruby",
  "Rust",
  "SCSS",
  "Swift",
  "T-SQL",
  "TypeScript"
];

export default function Home() {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [selectedUser, setSelectedUser] = useState("All");
  
  // Interaction States
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [commentText, setCommentText] = useState("");

  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchSnippets = async () => {
      try {
        const q = query(collection(db, "snippets"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const list = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSnippets(list);
      } catch (error) {
        console.error("Error fetching snippets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSnippets();
  }, []);

  const handleCopy = (id, codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Like / Unlike Handler
  const handleToggleLike = async (snippet) => {
    const userId = currentUser?.uid || "anonymous_user";
    const likesList = snippet.likes || [];
    const isLiked = likesList.includes(userId);

    const updatedLikes = isLiked
      ? likesList.filter((id) => id !== userId)
      : [...likesList, userId];

    // Optimistic UI update
    setSnippets((prev) =>
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

  // Save / Bookmark Handler
  const handleToggleSave = async (snippet) => {
    const userId = currentUser?.uid || "anonymous_user";
    const savedByList = snippet.savedBy || [];
    const isSaved = savedByList.includes(userId);

    const updatedSavedBy = isSaved
      ? savedByList.filter((id) => id !== userId)
      : [...savedByList, userId];

    // Optimistic UI update
    setSnippets((prev) =>
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

  // Add Comment Handler
  const handleAddComment = async (snippetId) => {
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      authorName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Guest",
      text: commentText.trim(),
      createdAt: new Date().toISOString()
    };

    // Optimistic UI update
    setSnippets((prev) =>
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

  // Extract unique authors
  const uniqueUsers = Array.from(
    snippets.reduce((map, snippet) => {
      const key = snippet.userId || snippet.authorName;
      if (key && !map.has(key)) {
        map.set(key, snippet.authorName || "Anonymous");
      }
      return map;
    }, new Map())
  );

  // Filter snippets based on language and user selection
  const filteredSnippets = snippets.filter((s) => {
    const matchesLanguage =
      selectedLanguage === "All" ||
      s.language?.toLowerCase() === selectedLanguage.toLowerCase();

    const snippetUserKey = s.userId || s.authorName;
    const matchesUser =
      selectedUser === "All" || snippetUserKey === selectedUser;

    return matchesLanguage && matchesUser;
  });

  const userId = currentUser?.uid || "anonymous_user";

  return (
    <div style={{ width: "100%", maxWidth: "1280px", margin: "0 auto", padding: "30px 20px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Code2 size={32} color="#646cff" />
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "700" }}>DevSnippet</h1>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button 
            onClick={() => navigate("/create-snippet")} 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "6px", 
              padding: "10px 18px", 
              cursor: "pointer", 
              backgroundColor: "#646cff", 
              color: "#ffffff", 
              border: "none", 
              borderRadius: "6px", 
              fontSize: "15px",
              fontWeight: "600"
            }}
          >
            <Plus size={18} /> Code
          </button>
          <button 
            onClick={() => navigate("/profile")} 
            style={{ 
              background: "none", 
              border: "1px solid #2e303a", 
              borderRadius: "6px",
              padding: "8px",
              cursor: "pointer", 
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }} 
            title="Profile & Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Main Layout Grid (Left Sidebar + Feed + Right Sidebar) */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 220px", gap: "20px", alignItems: "start" }}>
        
        {/* Left Sidebar - Language Filter */}
        <aside 
          style={{ 
            backgroundColor: "#1b1c22", 
            border: "1px solid #2e303a", 
            borderRadius: "12px", 
            padding: "16px",
            position: "sticky",
            top: "20px",
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
            textAlign: "left"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid #2e303a" }}>
            <Layers size={18} color="#646cff" />
            <h3 style={{ margin: 0, fontSize: "16px", color: "#f3f4f6" }}>Languages</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {LANGUAGES.map((lang) => {
              const isActive = selectedLanguage.toLowerCase() === lang.toLowerCase();
              return (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: isActive ? "#646cff" : "transparent",
                    color: isActive ? "#ffffff" : "#9ca3af",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: isActive ? "600" : "400",
                    textAlign: "left",
                    transition: "all 0.15s ease"
                  }}
                >
                  {lang === "All" ? (
                    <Layers size={15} />
                  ) : lang === "Dockerfile" || lang === "PowerShell" || lang === "T-SQL" ? (
                    <Terminal size={15} />
                  ) : (
                    <FileCode size={15} />
                  )}
                  <span>{lang}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center - Feed */}
        <main style={{ minWidth: 0 }}>
          {loading ? (
            <p style={{ textAlign: "left", color: "#aaa" }}>Loading snippets...</p>
          ) : filteredSnippets.length === 0 ? (
            <div style={{ backgroundColor: "#1b1c22", border: "1px solid #2e303a", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
              <p style={{ color: "#aaa", fontSize: "16px" }}>
                No snippets found matching your current filter criteria.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {filteredSnippets.map((s) => {
                const isLiked = (s.likes || []).includes(userId);
                const isSaved = (s.savedBy || []).includes(userId);
                const comments = s.comments || [];

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
                    {/* Snippet Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <h3 style={{ margin: 0, fontSize: "20px", color: "#f3f4f6" }}>{s.title}</h3>
                        {s.language && (
                          <span style={{ backgroundColor: "#2e303a", color: "#646cff", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                            {s.language}
                          </span>
                        )}
                      </div>
                      <span style={{ color: "#888", fontSize: "14px" }}>by <strong style={{ color: "#aaa" }}>{s.authorName}</strong></span>
                    </div>

                    {s.description && (
                      <p style={{ margin: "0 0 12px 0", color: "#9ca3af", fontSize: "15px" }}>{s.description}</p>
                    )}

                    {s.problem && (
                      <div style={{ backgroundColor: "#121212", border: "1px solid #2e303a", padding: "10px 14px", borderRadius: "6px", marginBottom: "12px", fontSize: "14px", color: "#d1d5db" }}>
                        <strong style={{ color: "#646cff" }}>Problem:</strong> {s.problem}
                      </div>
                    )}

                    {/* Code Container */}
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

                    {/* Expandable Comments Drawer */}
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
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Right Sidebar - Read-Only Users List */}
        <aside 
          style={{ 
            backgroundColor: "#1b1c22", 
            border: "1px solid #2e303a", 
            borderRadius: "12px", 
            padding: "16px",
            position: "sticky",
            top: "20px",
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
            textAlign: "left"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid #2e303a" }}>
            <Users size={18} color="#646cff" />
            <h3 style={{ margin: 0, fontSize: "16px", color="#f3f4f6" }}>Users</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button
              onClick={() => setSelectedUser("All")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: selectedUser === "All" ? "#646cff" : "transparent",
                color: selectedUser === "All" ? "#ffffff" : "#9ca3af",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: selectedUser === "All" ? "600" : "400",
                textAlign: "left",
                transition: "all 0.15s ease"
              }}
            >
              <Users size={15} />
              <span>All Users</span>
            </button>

            {uniqueUsers.map(([userKey, userName]) => {
              const isActive = selectedUser === userKey;
              return (
                <button
                  key={userKey}
                  onClick={() => setSelectedUser(userKey)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: isActive ? "#646cff" : "transparent",
                    color: isActive ? "#ffffff" : "#9ca3af",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: isActive ? "600" : "400",
                    textAlign: "left",
                    transition: "all 0.15s ease"
                  }}
                  title={`View posts by ${userName}`}
                >
                  <User size={15} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {userName}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

      </div>
    </div>
  );
}