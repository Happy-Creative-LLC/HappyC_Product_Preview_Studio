import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { Loader2, ChevronRight, Search } from 'lucide-react';
import SidebarLayout from '../components/shared/SidebarLayout';

const PROJECT_COLORS = [
  {
    bar:    'linear-gradient(90deg, #1d4ed8, #3b82f6)',
    iconBg: '#dbeafe', iconColor: '#2563eb',
  },
  {
    bar:    'linear-gradient(90deg, #7c3aed, #a78bfa)',
    iconBg: '#ede9fe', iconColor: '#7c3aed',
  },
  {
    bar:    'linear-gradient(90deg, #059669, #34d399)',
    iconBg: '#d1fae5', iconColor: '#059669',
  },
  {
    bar:    'linear-gradient(90deg, #f59e0b, #fbbf24)',
    iconBg: '#fef3c7', iconColor: '#f59e0b',
  },
];

const FolderIcon = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { user, projects, fetchProjects } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!user) { navigate('/'); return; }

    fetchProjects()
      .then(() => {
        if (user.role === 'PRODUCT_DESIGN') {
          const state = useAppStore.getState();
          const project = state.projects.find(p => p.key === user.projectKey);
          if (project) navigate(`/projects/${project.id}/tasks`, { replace: true });
        }
      })
      .catch(() => setError('Không thể tải danh sách project. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <Loader2 size={40} className="animate-spin text-blue-600" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Projects</h1>
        <p className="text-[13px] text-slate-400 mt-1">
          {projects.length} project{projects.length !== 1 ? 's' : ''} · Chọn để xem danh sách task
        </p>
      </div>

      {/* Content */}
      <div className="px-8 py-7">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-[13px]">
            {error}
          </div>
        )}

        {projects.length === 0 && !error && (
          <div className="text-center text-slate-500 py-16 bg-white rounded-2xl border border-slate-200 text-[14px]">
            Bạn không có quyền truy cập project nào.
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {projects.map((project, idx) => {
            const palette = PROJECT_COLORS[idx % PROJECT_COLORS.length];
            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}/tasks`)}
                className="relative bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-0.5 group"
                style={{ '--shadow-color': 'rgba(37,99,235,0.12)' }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.12)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: palette.bar }} />

                <div className="flex items-start justify-between mt-1">
                  <div className="flex gap-4 items-start">
                    {/* Icon */}
                    <div className="w-13 h-13 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: palette.iconBg, width: 52, height: 52 }}>
                      <FolderIcon color={palette.iconColor} />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-bold text-slate-900">{project.name}</h3>
                      <p className="text-[13px] text-slate-400 mt-0.5 line-clamp-1">
                        {project.description || `Team ${project.key} · Amazon & Etsy`}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {project.pendingTaskCount > 0 && (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700">
                      {project.pendingTaskCount} chờ upload
                    </span>
                  )}
                  {project.inReviewCount > 0 && (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700">
                      {project.inReviewCount} đang review
                    </span>
                  )}
                  {project.approvedCount > 0 && (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-green-100 text-green-700">
                      {project.approvedCount} đã duyệt
                    </span>
                  )}
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500">
                    {project.taskCount ?? '—'} tasks
                  </span>
                </div>
              </div>
            );
          })}

          {/* Amazon Search shortcut */}
          {(user.role === 'SELLER' || user.role === 'ADMIN' || user.role === 'MARVEL') && (
            <div
              onClick={() => navigate('/search')}
              className="xl:col-span-2 bg-white rounded-2xl border border-dashed border-slate-300 p-5 cursor-pointer flex items-center gap-4 transition-all hover:border-blue-500 hover:bg-slate-50"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#dbeafe' }}>
                <Search size={20} color="#2563eb" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-bold text-slate-900">Amazon Search Preview</h3>
                <p className="text-[13px] text-slate-400 mt-0.5">Tìm kiếm và import sản phẩm từ Amazon</p>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ProjectsPage;
