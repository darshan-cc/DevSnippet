import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Settings, Plus, Code2, Copy, Check } from "lucide-react";

export default function Home() {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
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

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "30px 20px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
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
              fontWeight: "600",
              transition: "opacity 0.2s ease"
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

      {/* Public Feed */}
      {loading ? (
        <p style={{ textAlign: "left", color: "#aaa" }}>Loading snippets...</p>
      ) : snippets.length === 0 ? (
        <div style={{ backgroundColor: "#1b1c22", border: "1px solid #2e303a", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
          <p style={{ color: "#aaa", fontSize: "16px" }}>No snippets posted yet. Click "+ Code" to share the first one!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {snippets.map((s) => (
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
                <h3 style={{ margin: 0, fontSize: "20px", color: "#f3f4f6" }}>{s.title}</h3>
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

              {/* Code Box with Top-Right Copy Button */}
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
                    zIndex: 10,
                    transition: "background-color 0.2s ease"
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
    </div>
  );
}