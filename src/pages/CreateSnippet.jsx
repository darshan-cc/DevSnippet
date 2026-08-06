import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Code2 } from "lucide-react";

export default function CreateSnippet() {
  const { currentUser, userProfile } = useAuth();
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("");
  const [description, setDescription] = useState("");
  const [problem, setProblem] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !code.trim() || !currentUser) return;

    setSaving(true);
    try {
      await addDoc(collection(db, "snippets"), {
        title: title.trim(),
        language: language.trim() || "Plain Text",
        description: description.trim(),
        problem: problem.trim(),
        code: code,
        userId: currentUser.uid,
        authorName: userProfile?.displayName || currentUser.displayName || "Developer",
        createdAt: new Date().toISOString()
      });
      navigate("/");
    } catch (error) {
      console.error("Error saving snippet:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "30px 20px", boxSizing: "border-box" }}>
      {/* Back to Home Button - Aligned to the Left */}
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

      <div 
        style={{ 
          backgroundColor: "#1b1c22", 
          border: "1px solid #2e303a", 
          borderRadius: "12px", 
          padding: "32px", 
          textAlign: "left" 
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
          <Code2 size={28} color="#646cff" />
          <h2 style={{ margin: 0, fontSize: "24px", color: "#f3f4f6" }}>Add New Code Snippet</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Title and Language Input Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#f3f4f6", fontSize: "14px" }}>
                Title *
              </label>
              <input 
                type="text" 
                required 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g., Quick Sort in JS" 
                style={{ 
                  width: "100%", 
                  padding: "12px 14px", 
                  borderRadius: "6px",
                  border: "1px solid #2e303a",
                  backgroundColor: "#121212",
                  color: "#ffffff",
                  fontSize: "15px",
                  outline: "none",
                  boxSizing: "border-box" 
                }} 
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#f3f4f6", fontSize: "14px" }}>
                Language
              </label>
              <input 
                type="text" 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)} 
                placeholder="e.g., JavaScript, Python, C++" 
                style={{ 
                  width: "100%", 
                  padding: "12px 14px", 
                  borderRadius: "6px",
                  border: "1px solid #2e303a",
                  backgroundColor: "#121212",
                  color: "#ffffff",
                  fontSize: "15px",
                  outline: "none",
                  boxSizing: "border-box" 
                }} 
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#f3f4f6", fontSize: "14px" }}>
              Description
            </label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Brief explanation of the snippet" 
              style={{ 
                width: "100%", 
                padding: "12px 14px", 
                borderRadius: "6px",
                border: "1px solid #2e303a",
                backgroundColor: "#121212",
                color: "#ffffff",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box" 
              }} 
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#f3f4f6", fontSize: "14px" }}>
              Problem Statement (Optional)
            </label>
            <textarea 
              value={problem} 
              onChange={(e) => setProblem(e.target.value)} 
              placeholder="What problem does this snippet solve?" 
              style={{ 
                width: "100%", 
                padding: "12px 14px", 
                height: "90px", 
                borderRadius: "6px",
                border: "1px solid #2e303a",
                backgroundColor: "#121212",
                color: "#ffffff",
                fontSize: "15px",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box" 
              }} 
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#f3f4f6", fontSize: "14px" }}>
              Code *
            </label>
            <textarea 
              required 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              placeholder="Paste or write your code solution here..." 
              style={{ 
                width: "100%", 
                padding: "14px", 
                height: "240px", 
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

          <button 
            type="submit" 
            disabled={saving} 
            style={{ 
              marginTop: "8px",
              padding: "12px", 
              fontSize: "16px", 
              fontWeight: "600", 
              cursor: saving ? "not-allowed" : "pointer", 
              backgroundColor: "#646cff", 
              color: "#ffffff", 
              border: "none", 
              borderRadius: "6px",
              opacity: saving ? 0.7 : 1,
              transition: "background-color 0.2s ease"
            }}
          >
            {saving ? "Saving..." : "Save Snippet"}
          </button>
        </form>
      </div>
    </div>
  );
}