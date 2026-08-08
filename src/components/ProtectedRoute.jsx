import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

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

  // Send unauthenticated users to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isSetupPage = location.pathname === "/setup-profile";

  // Force users without a completed profile document to /setup-profile
  if ((!userProfile || !userProfile.isProfileComplete) && !isSetupPage) {
    return <Navigate to="/setup-profile" replace />;
  }

  return children;
}