import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import AmazonPreviewPage from './pages/AmazonPreviewPage';
import AmazonSearchPage from './pages/AmazonSearchPage';
import EtsyPreviewPage from './pages/EtsyPreviewPage';
import AdminUsersPage from './pages/AdminUsersPage';
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import TaskDetailPage from './pages/TaskDetailPage';
import TaskListPage from './pages/TaskListPage';
import ControlPanel from './components/shared/ControlPanel';
import { useAppStore } from './stores/appStore';

const RequireAuth = ({ children, roles }) => {
  const { user, token } = useAppStore();

  if (!user || !token) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/projects" replace />;
  return children;
};

const PreviewRoute = ({ children }) => (
  <>
    {children}
    <ControlPanel />
  </>
);

const FallbackRoute = () => {
  const { user, token } = useAppStore();
  return <Navigate to={user && token ? '/projects' : '/'} replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/projects"
          element={<RequireAuth><ProjectsPage /></RequireAuth>}
        />
        <Route
          path="/projects/:projectId/tasks"
          element={<RequireAuth><TaskListPage /></RequireAuth>}
        />
        <Route
          path="/projects/:projectId/tasks/:taskId"
          element={<RequireAuth><TaskDetailPage /></RequireAuth>}
        />

        <Route
          path="/amazon"
          element={(
            <RequireAuth>
              <PreviewRoute><AmazonPreviewPage /></PreviewRoute>
            </RequireAuth>
          )}
        />
        <Route
          path="/etsy"
          element={(
            <RequireAuth>
              <PreviewRoute><EtsyPreviewPage /></PreviewRoute>
            </RequireAuth>
          )}
        />
        <Route
          path="/search"
          element={(
            <RequireAuth roles={['ADMIN', 'SELLER']}>
              <AmazonSearchPage />
            </RequireAuth>
          )}
        />
        <Route
          path="/admin/users"
          element={(
            <RequireAuth roles={['ADMIN']}>
              <AdminUsersPage />
            </RequireAuth>
          )}
        />

        <Route path="/upload" element={<Navigate to="/projects" replace />} />
        <Route path="*" element={<FallbackRoute />} />
      </Routes>
    </Router>
  );
}

export default App;
