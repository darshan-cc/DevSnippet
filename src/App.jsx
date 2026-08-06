import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/login";
import SetupProfile from "./pages/SetupProfile";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import CreateSnippet from "./pages/CreateSnippet";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/DevSnippet">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup-profile" element={<ProtectedRoute><SetupProfile /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/create-snippet" element={<ProtectedRoute><CreateSnippet /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}