import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { to: "/", icon: "🏠", label: "داشبورد", end: true },
  { to: "/programs", icon: "📅", label: "برنامه‌ها" },
  { to: "/people", icon: "👥", label: "افراد" },
  { to: "/stats", icon: "📊", label: "نمایش آمار" },
  { to: "/reports", icon: "📋", label: "گزارش‌ها" },
];

export default function Layout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <>
      <header className="top-bar">
        <div className="brand">
          📋 سامانه سازماندهی
          <small>پنل مدیریت ادمین</small>
        </div>
        <div className="top-actions">
          <div className="avatar">A</div>
          <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
            خروج
          </button>
        </div>
      </header>

      <div className="app-layout">
        <aside className="sidebar">
          <nav className="nav-group">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  "nav-item" + (isActive ? " active" : "")
                }
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
