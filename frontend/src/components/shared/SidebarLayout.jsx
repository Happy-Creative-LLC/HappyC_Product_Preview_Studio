import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { LogOut } from 'lucide-react';

const ROLE_LABELS = {
  ADMIN:          'Admin',
  MARVEL:         'Marvel',
  SELLER:         'Seller',
  PRODUCT_DESIGN: 'Product Design',
};

const ROLE_AVATAR_BG = {
  ADMIN:          'from-blue-700 to-blue-500',
  MARVEL:         'from-indigo-700 to-indigo-500',
  SELLER:         'from-emerald-600 to-emerald-400',
  PRODUCT_DESIGN: 'from-red-600 to-red-400',
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const NavItem = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
      active
        ? 'bg-blue-700/25 text-blue-300'
        : 'text-white/40 hover:text-white/70 hover:bg-white/5'
    }`}
  >
    {icon}
    {label}
  </Link>
);

const SidebarLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAppStore();

  const handleLogout = () => { logout(); navigate('/'); };
  const initials = getInitials(user?.fullName || user?.username);
  const avatarBg = ROLE_AVATAR_BG[user?.role] || 'from-slate-600 to-slate-400';

  const isProjects = location.pathname === '/projects' || location.pathname.startsWith('/projects/');
  const isSearch   = location.pathname === '/search';

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ background: '#0f172a' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#f59e0b' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-white font-extrabold text-[15px] tracking-tight">Happy Creative</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem
            to="/projects"
            active={isProjects}
            label="Projects"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            }
          />
          {(user?.role === 'SELLER' || user?.role === 'ADMIN' || user?.role === 'MARVEL') && (
            <NavItem
              to="/search"
              active={isSearch}
              label="Amazon Search"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              }
            />
          )}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors group">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarBg} flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0`}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-white truncate">{user?.fullName || user?.username}</div>
              <div className="text-[11px] text-white/40">{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-1 rounded-lg text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen bg-slate-100 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;
