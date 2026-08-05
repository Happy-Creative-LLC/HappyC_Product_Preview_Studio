import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import BrandMark from './BrandMark';

const ROLE_LABELS = {
  ADMIN: 'Admin',
  MARVEL: 'Marvel',
  SELLER: 'Seller',
  PRODUCT_DESIGN: 'Product Design',
};

const ROLE_COLORS = {
  ADMIN: 'bg-purple-100 text-purple-700',
  MARVEL: 'bg-indigo-100 text-indigo-700',
  SELLER: 'bg-green-100 text-green-700',
  PRODUCT_DESIGN: 'bg-red-100 text-red-700',
};

/**
 * breadcrumbs: [{ label, href }] — href là optional, nếu không có thì render text thuần
 */
const AppHeader = ({ breadcrumbs = [] }) => {
  const navigate = useNavigate();
  const { user, logout } = useAppStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo + Breadcrumbs */}
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/projects" className="flex-shrink-0">
            <BrandMark compact />
          </Link>

          {breadcrumbs.length > 0 && (
            <>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              <nav className="flex items-center gap-1 min-w-0">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={idx}>
                      {isLast ? (
                        <span className="text-gray-700 font-medium truncate max-w-[200px]">
                          {crumb.label}
                        </span>
                      ) : (
                        <>
                          <Link
                            to={crumb.href}
                            className="text-gray-400 hover:text-orange-500 transition-colors truncate max-w-[140px]"
                          >
                            {crumb.label}
                          </Link>
                          <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                        </>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
            </>
          )}
        </div>

        {/* User info + Logout */}
        {user && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 leading-none">
                  {user.fullName || user.username}
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
