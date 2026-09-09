import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const err = await signIn(email, password);
    setLoading(false);

    if (err) {
      setError("ایمیل یا رمز عبور اشتباه است");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          📋 سامانه سازماندهی
          <small>ورود به پنل مدیریت</small>
        </div>

        {error && <div className="error-box">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field mb-16">
            <label>ایمیل ادمین</label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="field mb-24">
            <label>رمز عبور</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? "در حال ورود..." : "🔑 ورود به سیستم"}
          </button>
        </form>

        <p className="text-xs text-muted mt-16" style={{ textAlign: "center" }}>
          این سیستم فقط برای ادمین است
        </p>
      </div>
    </div>
  );
}
