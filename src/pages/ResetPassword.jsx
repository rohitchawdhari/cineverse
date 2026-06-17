import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:8000/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(data.message || "Password reset successful!");
      } else {
        setMessage(data.message || "Failed to reset password. Token may be expired.");
      }
    } catch (err) {
      setMessage("Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page-container">
      <div className="background-glow-1"></div>
      <div className="background-glow-2"></div>
      
      <div className="glass-panel reset-card animate-fade-in">
        <div className="reset-header">
          <span className="logo-icon">🔑</span>
          <h2>Reset Password</h2>
          <p>Enter your new password below</p>
        </div>

        {isSuccess ? (
          <div className="success-container">
            <div className="status-message success">{message}</div>
            <button onClick={() => navigate("/login")} className="btn btn-primary reset-btn">
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="reset-form">
            <div className="form-group">
              <label htmlFor="password">New Password</label>
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

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {message && (
              <div className="status-message error">
                {message}
              </div>
            )}

            <button type="submit" className="btn btn-primary reset-btn" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>

      <style>{`
        .reset-page-container {
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

        .reset-card {
          width: 100%;
          max-width: 420px;
          padding: 40px 32px;
          z-index: 10;
          position: relative;
        }

        .reset-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo-icon {
          font-size: 2.5rem;
          display: inline-block;
          margin-bottom: 12px;
        }

        .reset-header h2 {
          font-size: 1.75rem;
          margin-bottom: 8px;
          color: var(--text-white);
        }

        .reset-form {
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

        .status-message {
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 0.9rem;
          text-align: center;
          font-weight: 500;
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
          margin-bottom: 20px;
        }

        .reset-btn {
          width: 100%;
          padding: 12px;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}

export default ResetPassword;
