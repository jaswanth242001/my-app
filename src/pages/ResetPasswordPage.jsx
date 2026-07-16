import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import AuthIllustration from "../components/AuthIllustration";

function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-illustration">
        <AuthIllustration />
      </div>
      <div className="auth-card">
        <div className="auth-card-logo">
          <Logo size={40} />
        </div>
        <h1>Reset password</h1>
        <p className="auth-subtitle">Enter your email and a new password.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          {success && (
            <p className="form-success">Password reset! You can now log in.</p>
          )}
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
