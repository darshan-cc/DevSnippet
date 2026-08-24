import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ArrowLeft, Send } from "lucide-react";
import "./CreateSnippet.css";

export default function CreateSnippet() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [repoLink, setRepoLink] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle local image file upload & convert to Base64 with 5MB limit
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 5MB limit check (5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      setError("IMAGE_MUST_BE_LESS_THAN_5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentUser) {
      setError("YOU_MUST_BE_LOGGED_IN");
      return;
    }

    if (!title.trim()) {
      setError("TITLE_IS_REQUIRED");
      return;
    }
    if (!code.trim()) {
      setError("CODE_CANNOT_BE_EMPTY");
      return;
    }

    setIsSubmitting(true);

    try {
      const userDisplayName =
        userProfile?.displayName ||
        currentUser?.displayName ||
        currentUser?.email?.split("@")[0] ||
        "anonymous";

      // Transform github.com link to github.dev
      let formattedRepoLink = repoLink.trim();
      if (formattedRepoLink) {
        formattedRepoLink = formattedRepoLink.replace(/(www\.)?github\.com/i, "github.dev");
        
        if (!/^https?:\/\//i.test(formattedRepoLink)) {
          formattedRepoLink = `https://${formattedRepoLink}`;
        }
      }

      await addDoc(collection(db, "snippets"), {
        title: title.trim(),
        language: language.trim() || "javascript",
        description: description.trim(),
        code: code,
        imageUrl: imageUrl,
        repoLink: formattedRepoLink,
        userId: currentUser.uid,
        authorName: userDisplayName,
        likes: [],
        savedBy: [],
        comments: [],
        createdAt: serverTimestamp(),
      });

      navigate("/profile");
    } catch (err) {
      console.error("Error creating snippet:", err);
      setError(err.message || "FAILED_TO_PUBLISH_SNIPPET");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-wrapper">
      <header className="create-nav">
        <button onClick={() => navigate(-1)} className="brutalist-btn">
          <ArrowLeft size={16} /> BACK
        </button>
      </header>

      <section className="create-card">
        <h2 className="create-title">PUBLISH_NEW_SNIPPET</h2>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-row">
            <div className="form-group flex-2">
              <label>[ TITLE ]</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="brutalist-input"
                placeholder="e.g. Binary Search Tree Implementation"
                required
              />
            </div>

            <div className="form-group flex-1">
              <label>[ LANGUAGE ]</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="brutalist-input brutalist-select"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="sql">SQL</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>[ DESCRIPTION (OPTIONAL) ]</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="brutalist-input textarea-short"
              placeholder="Briefly explain what this code snippet does..."
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>[ UPLOAD_IMAGE (MAX 5MB) ]</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="brutalist-input file-input"
              />
              {imageUrl && (
                <div style={{ marginTop: "10px" }}>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{ maxHeight: "100px", borderRadius: "4px", border: "1px solid #ccc" }}
                  />
                </div>
              )}
            </div>

            <div className="form-group flex-1">
              <label>[ REPOSITORY_LINK (OPTIONAL) ]</label>
              <input
                type="url"
                value={repoLink}
                onChange={(e) => setRepoLink(e.target.value)}
                className="brutalist-input"
                placeholder="https://github.com/user/project"
              />
            </div>
          </div>

          <div className="form-group">
            <label>[ CODE_BLOCK ]</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="brutalist-input code-area"
              placeholder="Paste or write your code here..."
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="brutalist-btn"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="brutalist-btn primary"
            >
              <Send size={16} /> {isSubmitting ? "PUBLISHING..." : "PUBLISH_SNIPPET"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}