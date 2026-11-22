import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const Login = () => {
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("pixelproof-theme") === "dark",
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleThemeToggle = () => {
    const nextTheme = !darkMode;

    setDarkMode(nextTheme);
    localStorage.setItem("pixelproof-theme", nextTheme ? "dark" : "light");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save login information for this browser session
      sessionStorage.setItem("pixelproof-token", data.token);
      sessionStorage.setItem("pixelproof-user", JSON.stringify(data.user));
      sessionStorage.setItem(
        "pixelproof-login-message",
        "Login successful! Welcome back.",
      );

      // Redirect to Dashboard
      navigate("/");
    } catch (error) {
      setError(error.message || "Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-page ${darkMode ? "dark-mode" : ""}`}>
      <div className="auth-card">
        <div className="auth-logo">
          <span className="brand-icon">P</span>
          <span>
            PixelProof <span className="brand-badge">AI</span>
          </span>
        </div>

        <span className="eyebrow">WELCOME BACK</span>

        <h1>Welcome back</h1>

        <p className="auth-subtitle">
          Log in to continue to your image authenticity workspace.
        </p>

        <form onSubmit={handleLogin} className="auth-form">
          <label>
            Email address
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <p style={{ color: "#ef4444", fontSize: "14px" }}>{error}</p>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in →"}
          </button>
        </form>

        <p className="auth-switch">
          New to PixelProof? <Link to="/signup">Create an account</Link>
        </p>

        <Link to="/" className="back-home">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
};

export default Login;
