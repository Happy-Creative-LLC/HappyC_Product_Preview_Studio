import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronRight,
  Eye,
  LayoutGrid,
  ListTodo,
  LogOut,
  Search,
  User,
  Users,
} from 'lucide-react';
import BrandMark from './BrandMark';
import { useAppStore } from '../../stores/appStore';
import { canUseAmazonSearch, getRoleLabel, isSingleProjectRole } from '../../utils/permissions';

const ROLE_COLORS = {
  ADMIN: 'var(--hc-navy-700)',
  MARVEL: 'var(--hc-role-marvel)',
  SELLER: 'var(--hc-role-seller)',
  PRODUCT_DESIGN: 'var(--hc-role-design)',
};

const getInitials = (name) => {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts.at(-1)[0]}`.toUpperCase();
};

const NavItem = ({ to, icon: Icon, label, active, badge }) => (
  <Link className="hc-nav-item" to={to} aria-current={active ? 'page' : undefined}>
    <Icon size={17} aria-hidden="true" />
    <span>{label}</span>
    {badge > 0 && <span className="hc-nav-item__badge">{badge}</span>}
  </Link>
);

const SidebarLayout = ({ children, breadcrumbs, previewPath = null }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId, taskId } = useParams();
  const { user, projects, tasks, logout } = useAppStore();

  const project = projects.find((item) => item.id === projectId);
  const projectTasks = projectId ? tasks[projectId] || [] : [];
  const task = taskId ? projectTasks.find((item) => item.id === taskId) : null;
  const canUseSearch = canUseAmazonSearch(user?.role);
  const isProjectsPage = location.pathname === '/projects';
  const isTasksPage = Boolean(projectId && location.pathname.includes('/tasks'));
  const displayName = user?.fullName || user?.username || user?.email || 'Thành viên';
  const roleLabel = getRoleLabel(user?.role);

  // Seller / Product Design chỉ có 1 project nên bỏ hẳn cấp điều hướng "Projects".
  const singleProject = isSingleProjectRole(user?.role);
  const homeProjectId = singleProject ? (projectId || projects[0]?.id) : null;
  const homePath = homeProjectId ? `/projects/${homeProjectId}/tasks` : '/projects';

  const derivedBreadcrumbs = [
    ...(singleProject ? [] : [{ label: 'Projects', to: '/projects' }]),
    ...(projectId
      ? [{ label: project?.name || task?.projectName || 'Project', to: `/projects/${projectId}/tasks` }]
      : []),
    ...(taskId ? [{ label: task?.title || 'Chi tiết task' }] : []),
  ];
  const visibleBreadcrumbs = breadcrumbs?.length ? breadcrumbs : derivedBreadcrumbs;

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="hc-app hc-shell" data-ui="app-shell">
      <a className="hc-skip-link" href="#main-content">Bỏ qua điều hướng</a>

      <aside className="hc-sidebar" aria-label="Điều hướng ứng dụng">
        <Link className="hc-sidebar__brand" to={homePath} aria-label="Về trang chính">
          <BrandMark inverse />
        </Link>

        <nav className="hc-sidebar__nav">
          <span className="hc-sidebar__label">WORKSPACE</span>
          {!singleProject && (
            <NavItem
              to="/projects"
              icon={LayoutGrid}
              label="Projects"
              active={isProjectsPage}
            />
          )}
          {(projectId || homeProjectId) && (
            <NavItem
              to={homeProjectId ? homePath : `/projects/${projectId}/tasks`}
              icon={ListTodo}
              label="Tasks"
              active={isTasksPage}
              badge={projectTasks.length}
            />
          )}
          {canUseSearch && (
            <NavItem
              to="/search"
              icon={Search}
              label="Amazon Search"
              active={location.pathname === '/search'}
            />
          )}
          {user?.role === 'ADMIN' && (
            <NavItem
              to="/admin/users"
              icon={Users}
              label="Quản lý nhân sự"
              active={location.pathname === '/admin/users'}
            />
          )}

          {previewPath && (
            <>
              <span className="hc-sidebar__label">BẢN PREVIEW</span>
              <NavItem to={previewPath} icon={Eye} label="Mở preview đã lưu" active={false} />
            </>
          )}
        </nav>

        <div className="hc-sidebar__user">
          <span
            className="hc-avatar"
            style={{ background: ROLE_COLORS[user?.role] || 'var(--hc-gray-500)' }}
            aria-hidden="true"
          >
            {getInitials(displayName)}
          </span>
          <div className="hc-sidebar__user-copy">
            <strong>{displayName}</strong>
            <span>{roleLabel}</span>
          </div>
        </div>
      </aside>

      <div className="hc-shell__body">
        <header className="hc-topbar">
          <Link className="hc-mobile-brand" to={homePath} aria-label="Về trang chính">
            <BrandMark compact />
          </Link>

          <nav className="hc-topbar__crumbs" aria-label="Breadcrumb">
            <span>Workspace</span>
            {visibleBreadcrumbs.map((crumb, index) => (
              <span className="hc-topbar__crumb" key={`${crumb.label}-${index}`}>
                <ChevronRight size={13} aria-hidden="true" />
                {crumb.to && index < visibleBreadcrumbs.length - 1 ? (
                  <Link to={crumb.to}>{crumb.label}</Link>
                ) : (
                  <strong>{crumb.label}</strong>
                )}
              </span>
            ))}
          </nav>

          <div className="hc-topbar__actions">
            <div className="hc-topbar__user">
              <span>{roleLabel}</span>
              <strong>{displayName}</strong>
            </div>
            <span
              className="hc-avatar"
              style={{ background: ROLE_COLORS[user?.role] || 'var(--hc-gray-500)' }}
              aria-hidden="true"
            >
              {getInitials(displayName)}
            </span>
            <button
              className="hc-icon-button hc-topbar__logout"
              type="button"
              aria-label="Đăng xuất"
              title="Đăng xuất"
              onClick={handleLogout}
            >
              <LogOut size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="hc-shell__main" id="main-content">
          {children}
        </main>

        <nav className="hc-mobile-nav" aria-label="Điều hướng mobile">
          {!singleProject && (
            <Link to="/projects" aria-current={isProjectsPage ? 'page' : undefined}>
              <LayoutGrid size={19} aria-hidden="true" />
              <span>Projects</span>
            </Link>
          )}
          {(projectId || homeProjectId) ? (
            <Link
              to={homeProjectId ? homePath : `/projects/${projectId}/tasks`}
              aria-current={isTasksPage ? 'page' : undefined}
            >
              <ListTodo size={19} aria-hidden="true" />
              <span>Tasks</span>
            </Link>
          ) : (
            <button type="button" disabled title="Chọn một project để xem task">
              <ListTodo size={19} aria-hidden="true" />
              <span>Tasks</span>
            </button>
          )}
          {previewPath ? (
            <Link to={previewPath}>
              <Eye size={19} aria-hidden="true" />
              <span>Preview</span>
            </Link>
          ) : (
            <button type="button" disabled title="Hãy lưu bản preview trong task trước">
              <Eye size={19} aria-hidden="true" />
              <span>Preview</span>
            </button>
          )}
          {canUseSearch ? (
            <Link to="/search">
              <Search size={19} aria-hidden="true" />
              <span>Tìm kiếm</span>
            </Link>
          ) : (
            <button type="button" onClick={handleLogout}>
              <User size={19} aria-hidden="true" />
              <span>Đăng xuất</span>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
};

export default SidebarLayout;
