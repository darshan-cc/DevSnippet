import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div 
        style={{ 
          display: "grid", 
          placeItems: "center", 
          minHeight: "100vh", 
          color: "#ffffff", 
          backgroundColor: "#000000" 
        }}
      >
        Loading DevSnippet...
      </div>
    );
  }

  // Redirect to login if unauthenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}