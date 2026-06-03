import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RoleSelectionPage from './pages/RoleSelectionPage';
import ProjectsPage from './pages/ProjectsPage';
import TaskListPage from './pages/TaskListPage';
import TaskDetailPage from './pages/TaskDetailPage';
import AmazonPreviewPage from './pages/AmazonPreviewPage';
import EtsyPreviewPage from './pages/EtsyPreviewPage';
import AmazonSearchPage from './pages/AmazonSearchPage';
import ControlPanel from './components/shared/ControlPanel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelectionPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId/tasks" element={<TaskListPage />} />
        <Route path="/projects/:projectId/tasks/:taskId" element={<TaskDetailPage />} />
        
        <Route path="/amazon" element={<AmazonPreviewPage />} />
        <Route path="/search" element={<AmazonSearchPage />} />
        <Route path="/etsy" element={<EtsyPreviewPage />} />
        
        {/* Redirect old upload route to home */}
        <Route path="/upload" element={<Navigate to="/" replace />} />
      </Routes>
      <ControlPanel />
    </Router>
  );
}

export default App;
