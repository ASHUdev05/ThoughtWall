import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./App.css";
import ThemeToggle from "./components/ThemeWidget";
import Toast from "./components/Toast";
import AuthForm from "./components/AuthForm";
import UserProfileView from "./components/UserProfile";
import Dashboard from "./components/Dashboard";

interface ToastData {
  msg: string;
  type: "success" | "error";
}

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [toast, setToast] = useState<ToastData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) document.body.classList.add("dark-mode");
    else document.body.classList.remove("dark-mode");
  }, [isDarkMode]);

  const showToast = (msg: string, type: "success" | "error") =>
    setToast({ msg, type });

  const handleLogin = (newToken: string) => {
    setToken(newToken);
    showToast("Welcome back!", "success");
    navigate("/"); // Redirect to dashboard on login
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    showToast("Logged out.", "success");
    navigate("/login");
  };

  return (
    <div className="app-container">
      {/* Global Header */}
      {token && (
        <div className="header-container">
          <h1 style={{ margin: 0, fontSize: "1.8rem" }}>The Thought Wall</h1>
          <div className="header-actions">
            <ThemeToggle
              isDark={isDarkMode}
              toggleTheme={() => setIsDarkMode(!isDarkMode)}
            />
            <button
              className="icon-btn"
              onClick={() => navigate("/profile")}
              title="My Profile"
            >
              👤
            </button>
            <button className="icon-btn" onClick={handleLogout} title="Logout">
              🚪
            </button>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toast && (
        <div className="toast-container">
          <Toast
            message={toast.msg}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Route Definitions */}
      <Routes>
        <Route
          path="/login"
          element={
            !token ? (
              <div style={{ marginTop: "2rem" }}>
                <ThemeToggle
                  isDark={isDarkMode}
                  toggleTheme={() => setIsDarkMode(!isDarkMode)}
                />
                <h1 style={{ textAlign: "center", marginTop: "1rem" }}>
                  The Thought Wall
                </h1>
                <AuthForm onLogin={handleLogin} />
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/profile"
          element={
            token ? (
              <UserProfileView onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/"
          element={
            token ? (
              <Dashboard showToast={showToast} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
