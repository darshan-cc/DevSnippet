import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Settings, Plus, Code2, Copy, Check, Terminal, FileCode, Layers, User, Users } from "lucide-react";

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
  const navigate = useNavigate();

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

  // Extract unique authors from fetched snippets
  const uniqueUsers = Array.from(
    snippets.reduce((map, snippet) => {
      const key = snippet.userId || snippet.authorName;
      if (key && !map.has(key)) {
        map.set(key, snippet.authorName || "Anonymous");
      }
      return map;
    }, new Map())
  );

  // Filter snippets based on chosen language AND chosen user
  const filteredSnippets = snippets.filter((s) => {
    const matchesLanguage =
      selectedLanguage === "All" ||
      s.language?.toLowerCase() === selectedLanguage.toLowerCase();

    const snippetUserKey = s.userId || s.authorName;
    const matchesUser =
      selectedUser === "All" || snippetUserKey === selectedUser;

    return matchesLanguage && matchesUser;
  });

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
              {filteredSnippets.map((s) => (
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
                </div>
              ))}
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
            <h3 style={{ margin: 0, fontSize: "16px", color: "#f3f4f6" }}>Users</h3>
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