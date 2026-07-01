import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { Folder, ArrowRight, Search, Loader2 } from 'lucide-react';
import AppHeader from '../components/shared/AppHeader';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { user, projects, fetchProjects } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    fetchProjects()
      .then(() => {
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

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader breadcrumbs={[{ label: 'Projects' }]} />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Chọn project</h1>
          <p className="text-gray-500 mt-1 text-sm">Click vào project để xem danh sách task</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.length === 0 && (
            <div className="col-span-2 text-center text-gray-500 py-16 bg-white rounded-xl border border-gray-100">
              Bạn không có quyền truy cập project nào.
            </div>
          )}

          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}/tasks`)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-orange-200 hover:-translate-y-0.5 transition-all group"
            >
              <div className="flex items-center gap-5">
                <div className="p-3 bg-orange-50 text-orange-500 rounded-xl group-hover:bg-orange-100 transition-colors flex-shrink-0">
                  <Folder size={32} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                    {project.name}
                  </h2>
                  {project.description && (
                    <p className="text-gray-400 text-sm mt-0.5 line-clamp-1">{project.description}</p>
                  )}
                  {project.pendingTaskCount > 0 && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      {project.pendingTaskCount} task chờ upload
                    </span>
                  )}
                </div>
              </div>
              <div className="text-gray-300 group-hover:text-orange-400 transition-colors flex-shrink-0 ml-4">
                <ArrowRight size={22} />
              </div>
            </div>
          ))}

          {(user.role === 'SELLER' || user.role === 'ADMIN' || user.role === 'MARVEL') && (
            <div
              onClick={() => navigate('/search')}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all group"
            >
              <div className="flex items-center gap-5">
                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl group-hover:bg-blue-100 transition-colors flex-shrink-0">
                  <Search size={32} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    Amazon Search
                  </h2>
                  <p className="text-gray-400 text-sm mt-0.5">Tìm kiếm và import sản phẩm từ Amazon</p>
                </div>
              </div>
              <div className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0 ml-4">
                <ArrowRight size={22} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
