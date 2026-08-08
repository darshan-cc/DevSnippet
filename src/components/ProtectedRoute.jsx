import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  // Prevent premature redirection while Firebase restores auth state
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

  // Redirect unauthenticated users to login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Redirect users with incomplete profiles to setup profile
  const isSetupPage = location.pathname === "/setup-profile";
  if (userProfile && !userProfile.isProfileComplete && !isSetupPage) {
    return <Navigate to="/setup-profile" replace />;
  }

  return children;
}