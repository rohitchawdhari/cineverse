import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ onLogin, isAdmin }) {
  const [activeTab, setActiveTab] = useState("signin"); // signin, signup, forgot
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage("Please enter both email and password.");
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (isAdmin && data.user.role !== "ADMIN") {
          setMessage("Access Denied: You do not have administrator privileges.");
          setIsSuccess(false);
          setLoading(false);
          return;
        }

        // Save user data (including token)
        onLogin({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          token: data.token
        });
        navigate(data.user.role === "ADMIN" ? "/admin" : "/dashboard");
      } else {
        setMessage(data.message || "Invalid login credentials.");
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage("Failed to connect to backend server.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setMessage("Please fill in all fields.");
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:8000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(data.message || "Registration successful! Please verify your email.");
        // Clear fields
        setName("");
        setPassword("");
      } else {
        setMessage(data.message || "Registration failed.");
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage("Failed to connect to backend server.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage("Please enter your email address.");
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:8000/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(data.message || "If registered, a password reset link has been sent to your email.");
      } else {
        setMessage(data.message || "Failed to submit request.");
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage("Failed to connect to backend server.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setMessage("");
    setIsSuccess(false);
  };

  return (
    <div className="login-page-container">
      <div className="background-glow-1"></div>
      <div className="background-glow-2"></div>
      
      <div className="glass-panel login-card animate-fade-in">
        <div className="login-header">
          <span className="logo-icon">🎬</span>
          <h2>{isAdmin ? "Cineverse Admin Portal" : "Cineverse"}</h2>
          <p>
            {isAdmin ? "Sign in to manage movies, theaters, and schedule shows" : (
              <>
                {activeTab === "signin" && "Sign in to book tickets and explore movies"}
                {activeTab === "signup" && "Create an account to unlock booking features"}
                {activeTab === "forgot" && "Reset your password to recover your account"}
              </>
            )}
          </p>
        </div>

        {activeTab !== "forgot" && !isAdmin && (
          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === "signin" ? "active" : ""}`}
              onClick={() => switchTab("signin")}
            >
              Sign In
            </button>
            <button 
              className={`tab-btn ${activeTab === "signup" ? "active" : ""}`}
              onClick={() => switchTab("signup")}
            >
              Sign Up
            </button>
          </div>
        )}

        {activeTab === "signin" && (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                {!isAdmin && (
                  <button 
                    type="button" 
                    className="forgot-link" 
                    onClick={() => switchTab("forgot")}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {message && (
              <div className={`status-message ${isSuccess ? "success" : "error"}`}>
                {message}
              </div>
            )}

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {activeTab === "signup" && (
          <form onSubmit={handleSignupSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {message && (
              <div className={`status-message ${isSuccess ? "success" : "error"}`}>
                {message}
              </div>
            )}

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? "Registering..." : "Sign Up"}
            </button>
          </form>
        )}

        {activeTab === "forgot" && (
          <form onSubmit={handleForgotSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {message && (
              <div className={`status-message ${isSuccess ? "success" : "error"}`}>
                {message}
              </div>
            )}

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>

            <button 
              type="button" 
              className="btn btn-secondary back-btn"
              onClick={() => switchTab("signin")}
            >
              Back to Sign In
            </button>
          </form>
        )}
      </div>

      <style>{`
        .login-page-container {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 24px;
          background-color: var(--bg-dark);
          overflow: hidden;
        }

        .background-glow-1 {
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(159, 43, 255, 0.2), transparent 70%);
          top: -100px;
          left: -100px;
          z-index: 0;
        }

        .background-glow-2 {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(0, 242, 254, 0.15), transparent 70%);
          bottom: -150px;
          right: -150px;
          z-index: 0;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 40px 32px;
          z-index: 10;
          position: relative;
        }

        .login-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .logo-icon {
          font-size: 2.5rem;
          display: inline-block;
          margin-bottom: 12px;
          filter: drop-shadow(0 0 10px rgba(159, 43, 255, 0.5));
        }

        .login-header h2 {
          font-size: 1.75rem;
          margin-bottom: 8px;
          background: linear-gradient(to right, var(--text-white), #d1d5db);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .tabs-container {
          display: flex;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 24px;
          gap: 16px;
        }

        .tab-btn {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1rem;
          font-weight: 600;
          padding: 10px 0;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .tab-btn:hover {
          color: var(--text-white);
        }

        .tab-btn.active {
          color: var(--text-white);
        }

        .tab-btn.active::after {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(to right, var(--secondary), var(--primary));
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }

        .form-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .forgot-link {
          background: none;
          border: none;
          color: var(--primary);
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0;
          font-weight: 500;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .status-message {
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 0.9rem;
          text-align: center;
          font-weight: 500;
          animation: fadeIn 0.3s ease;
        }

        .status-message.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
        }

        .status-message.success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
        }

        .login-btn {
          width: 100%;
          padding: 12px;
          font-size: 1rem;
          margin-top: 8px;
        }

        .back-btn {
          width: 100%;
          padding: 12px;
          font-size: 1rem;
          background: transparent;
          border: 1px solid var(--border-color);
        }
      `}</style>
    </div>
  );
}

export default Login;