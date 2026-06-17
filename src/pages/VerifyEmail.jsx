import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("We are verifying your email address. Please wait...");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing verification token.");
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/auth/verify-email?token=${token}`);
        const data = await response.json();
        
        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.message || "Email verification failed. The link may have expired.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Unable to connect to the server. Please try again later.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="verify-page-container">
      <div className="background-glow-1"></div>
      <div className="background-glow-2"></div>
      
      <div className="glass-panel verify-card animate-fade-in">
        <div className="verify-header">
          {status === "verifying" && <span className="verify-icon spin">⌛</span>}
          {status === "success" && <span className="verify-icon success">✅</span>}
          {status === "error" && <span className="verify-icon error">❌</span>}
          
          <h2>Email Verification</h2>
          <p className="verify-message">{message}</p>
          
          {status !== "verifying" && (
            <button onClick={() => navigate("/login")} className="btn btn-primary verify-btn">
              Go to Login
            </button>
          )}
        </div>
      </div>

      <style>{`
        .verify-page-container {
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

        .verify-card {
          width: 100%;
          max-width: 420px;
          padding: 40px 32px;
          z-index: 10;
          position: relative;
          text-align: center;
        }

        .verify-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .verify-icon {
          font-size: 3rem;
          line-height: 1;
        }

        .verify-icon.spin {
          animation: spin 1.5s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .verify-message {
          color: var(--text-muted);
          font-size: 1.05rem;
          margin-bottom: 8px;
        }

        .verify-btn {
          width: 100%;
          padding: 12px;
          font-size: 1rem;
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
}

export default VerifyEmail;
