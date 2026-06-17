import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MovieCatalog from "./pages/MovieCatalog";
import Booking from "./pages/Booking";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("cineverse_user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("cineverse_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("cineverse_user");
  };

  // Helper component to enforce authentication
  const ProtectedLayout = ({ children, requireAdmin }) => {
    if (!user) {
      return <Navigate to={requireAdmin ? "/admin-login" : "/login"} replace />;
    }
    if (requireAdmin && user.role !== "ADMIN") {
      return <Navigate to="/admin-login" replace />;
    }
    return (
      <>
        <Navbar user={user} onLogout={handleLogout} />
        <main style={{ flexGrow: 1 }}>
          {children}
        </main>
      </>
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            <>
              <Navbar user={user} onLogout={handleLogout} />
              <Landing user={user} />
            </>
          } 
        />
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} isAdmin={false} />} 
        />
        <Route 
          path="/admin-login" 
          element={user && user.role === "ADMIN" ? <Navigate to="/admin" replace /> : <Login onLogin={handleLogin} isAdmin={true} />} 
        />
        <Route 
          path="/verify-email" 
          element={<VerifyEmail />} 
        />
        <Route 
          path="/reset-password" 
          element={<ResetPassword />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedLayout>
              <Dashboard user={user} />
            </ProtectedLayout>
          } 
        />
        <Route 
          path="/movies" 
          element={
            <ProtectedLayout>
              <MovieCatalog user={user} />
            </ProtectedLayout>
          } 
        />
        <Route 
          path="/booking" 
          element={
            <ProtectedLayout>
              <Booking user={user} />
            </ProtectedLayout>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedLayout requireAdmin={true}>
              <AdminDashboard user={user} />
            </ProtectedLayout>
          } 
        />
        {/* Fallback redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;