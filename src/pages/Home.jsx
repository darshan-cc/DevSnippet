import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { 
  Settings, Plus, Code2, Copy, Check, Terminal, FileCode, 
  Layers, User, Users, Heart, MessageSquare, Bookmark, Send, Sun, Moon 
} from "lucide-react";
import "./Home.css";

const LANGUAGES = [
  "All", "C++", "C#", "CSS", "Dart", "Dockerfile", "F#", "Go", "HTML", 
  "Java", "JavaScript", "JSON", "Julia", "Less", "Markdown", "PHP", 
  "PowerShell", "Python", "R", "Ruby", "Rust", "SCSS", "Swift", "T-SQL", "TypeScript"
];

export default function Home() {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [selectedUser, setSelectedUser] = useState("All");
  const [theme, setTheme] = useState("dark");
  
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [commentText, setCommentText] = useState("");

  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const isDark = theme === "dark";

  const handleCopy = (id, codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleLike = async (snippet) => {
    const userId = currentUser?.uid || "anonymous_user";
    const likesList = snippet.likes || [];
    const isLiked = likesList.includes(userId);

    const updatedLikes = isLiked
      ? likesList.filter((id) => id !== userId)
      : [...likesList, userId];

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

  const handleToggleSave = async (snippet) => {
    const userId = currentUser?.uid || "anonymous_user";
    const savedByList = snippet.savedBy || [];
    const isSaved = savedByList.includes(userId);

    const updatedSavedBy = isSaved
      ? savedByList.filter((id) => id !== userId)
      : [...savedByList, userId];

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

  const handleAddComment = async (snippetId) => {
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      authorName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Guest",
      text: commentText.trim(),
      createdAt: new Date().toISOString()
    };

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

  const uniqueUsers = Array.from(
    snippets.reduce((map, snippet) => {
      const key = snippet.userId || snippet.authorName;
      if (key && !map.has(key)) {
        map.set(key, snippet.authorName || "Anonymous");
      }
      return map;
    }, new Map())
  );

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
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="logo-group">
          <Code2 size={36} />
          <h1 className="logo-title">DevSnippet</h1>
        </div>

        <div className="header-actions">
          <button onClick={toggleTheme} className="btn-brutal">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span>[THEME: {theme.toUpperCase()}]</span>
          </button>

          <button onClick={() => navigate("/create-snippet")} className="btn-brutal btn-brutal-primary">
            <Plus size={18} /> Create Post
          </button>

          <button onClick={() => navigate("/profile")} className="btn-brutal btn-brutal-icon" title="Profile & Settings">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="main-grid">
        {/* Left Sidebar - Languages */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <Layers size={18} />
            <h3 className="sidebar-title">Languages</h3>
          </div>

          <div className="sidebar-list">
            {LANGUAGES.map((lang) => {
              const isActive = selectedLanguage.toLowerCase() === lang.toLowerCase();
              return (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`sidebar-btn ${isActive ? "active" : ""}`}
                >
                  {lang === "All" ? (
                    <Layers size={14} />
                  ) : lang === "Dockerfile" || lang === "PowerShell" || lang === "T-SQL" ? (
                    <Terminal size={14} />
                  ) : (
                    <FileCode size={14} />
                  )}
                  <span>{lang}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center - Feed */}
        <main className="feed-container">
          {loading ? (
            <p className="loading-text">Loading snippets...</p>
          ) : filteredSnippets.length === 0 ? (
            <div className="empty-state">
              <p className="empty-text">NO SNIPPETS FOUND FOR SELECTED CRITERIA.</p>
            </div>
          ) : (
            <div className="snippet-list">
              {filteredSnippets.map((s) => {
                const isLiked = (s.likes || []).includes(userId);
                const isSaved = (s.savedBy || []).includes(userId);
                const comments = s.comments || [];

                return (
                  <div key={s.id} className="snippet-card">
                    {/* Snippet Header */}
                    <div className="snippet-header">
                      <div className="snippet-title-group">
                        <h3 className="snippet-title">{s.title}</h3>
                        {s.language && (
                          <span className="snippet-lang-tag">{s.language}</span>
                        )}
                      </div>
                      <span className="snippet-author">
                        BY <strong>{s.authorName}</strong>
                      </span>
                    </div>

                    {s.description && <p className="snippet-desc">{s.description}</p>}

                    {s.problem && (
                      <div className="snippet-problem">
                        <strong>Problem:</strong> {s.problem}
                      </div>
                    )}

                    {/* Code Container */}
                    <div className="code-container">
                      <button onClick={() => handleCopy(s.id, s.code)} className="btn-copy">
                        {copiedId === s.id ? (
                          <>
                            <Check size={14} /> COPIED!
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> COPY
                          </>
                        )}
                      </button>

                      <pre className="code-block">
                        <code>{s.code}</code>
                      </pre>
                    </div>

                    {/* Interaction Bar */}
                    <div className="interaction-bar">
                      <div className="left-interactions">
                        <button onClick={() => handleToggleLike(s)} className="btn-action">
                          <Heart size={18} fill={isLiked ? "currentColor" : "none"} color="currentColor" />
                          <span>{s.likes?.length || 0}</span>
                        </button>

                        <button onClick={() => setActiveCommentId(activeCommentId === s.id ? null : s.id)} className="btn-action">
                          <MessageSquare size={18} />
                          <span>{comments.length}</span>
                        </button>
                      </div>

                      <button onClick={() => handleToggleSave(s)} className="btn-action">
                        <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} color="currentColor" />
                        <span>{isSaved ? "SAVED" : "SAVE"}</span>
                      </button>
                    </div>

                    {/* Comments Section */}
                    {activeCommentId === s.id && (
                      <div className="comments-section">
                        {comments.length > 0 && (
                          <div className="comments-list">
                            {comments.map((c) => (
                              <div key={c.id} className="comment-card">
                                <div className="comment-author">{c.authorName}</div>
                                <div className="comment-text">{c.text}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="comment-input-group">
                          <input
                            type="text"
                            placeholder="ADD A COMMENT..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddComment(s.id)}
                            className="comment-input"
                          />
                          <button onClick={() => handleAddComment(s.id)} className="btn-brutal btn-brutal-primary">
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

        {/* Right Sidebar - Users List */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <Users size={18} />
            <h3 className="sidebar-title">Users</h3>
          </div>

          <div className="sidebar-list">
            <button
              onClick={() => setSelectedUser("All")}
              className={`sidebar-btn ${selectedUser === "All" ? "active" : ""}`}
            >
              <Users size={14} />
              <span>ALL USERS</span>
            </button>

            {uniqueUsers.map(([userKey, userName]) => {
              const isActive = selectedUser === userKey;
              return (
                <button
                  key={userKey}
                  onClick={() => setSelectedUser(userKey)}
                  className={`sidebar-btn ${isActive ? "active" : ""}`}
                >
                  <User size={14} />
                  <span className="sidebar-user-name">{userName}</span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}