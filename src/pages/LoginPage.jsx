import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import AuthIllustration from "../components/AuthIllustration";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/notes", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid email or password.");
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
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Log in to keep tracking your notes.</p>
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
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/reset-password">Forgot password?</Link>
          <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
