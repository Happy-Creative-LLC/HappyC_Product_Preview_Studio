import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { Folder, LogOut, ArrowRight, Search, Loader2 } from 'lucide-react';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { user, projects, fetchProjects, logout } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    fetchProjects()
      .then(() => {
        // Product Design đi thẳng vào task list của project mình
        if (user.role === 'PRODUCT_DESIGN') {
          const state = useAppStore.getState();
          const project = state.projects.find(p => p.key === user.projectKey);
          if (project) {
            navigate(`/projects/${project.id}/tasks`, { replace: true });
          }
        }
      })
      .catch(() => setError('Không thể tải danh sách project. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="max-w-6xl w-full flex justify-between items-center mb-12 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Chọn project để xem danh sách task</p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium border border-indigo-100 flex items-center space-x-2">
            <span>{user.fullName || user.email}</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm font-normal">{user.role}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-6xl w-full mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full">
        {projects.length === 0 && (
          <div className="col-span-2 text-center text-gray-500 py-12">
            Bạn không có quyền truy cập project nào.
          </div>
        )}

        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}/tasks`)}
            className="bg-white rounded-xl shadow-md p-8 flex items-center justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-gray-100 group"
          >
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-100 transition-colors">
                <Folder size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">{project.name}</h2>
                <p className="text-gray-500 text-sm mt-1">Click để xem tasks</p>
              </div>
            </div>
            <div className="text-gray-300 group-hover:text-orange-500 transition-colors">
              <ArrowRight size={28} />
            </div>
          </div>
        ))}

        {(user.role === 'SELLER' || user.role === 'ADMIN' || user.role === 'MARVEL') && (
          <div
            onClick={() => navigate('/search')}
            className="bg-white rounded-xl shadow-md p-8 flex items-center justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-gray-100 group"
          >
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Search size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">Amazon Search</h2>
                <p className="text-gray-500 text-sm mt-1">Tìm kiếm và import sản phẩm</p>
              </div>
            </div>
            <div className="text-gray-300 group-hover:text-blue-600 transition-colors">
              <ArrowRight size={28} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
