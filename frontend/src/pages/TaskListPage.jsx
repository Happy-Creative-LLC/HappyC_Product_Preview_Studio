import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { Plus, ChevronRight, Loader2, X } from 'lucide-react';
import SidebarLayout from '../components/shared/SidebarLayout';

const STATUS_DOT = {
  PENDING_UPLOADS: '#eab308',
  IN_REVIEW:       '#3b82f6',
  APPROVED:        '#22c55e',
  REJECTED:        '#ef4444',
};

const STATUS_BADGE = {
  PENDING_UPLOADS: 'bg-amber-100 text-amber-700',
  IN_REVIEW:       'bg-blue-100 text-blue-700',
  APPROVED:        'bg-green-100 text-green-700',
  REJECTED:        'bg-red-100 text-red-600',
};

const STATUS_LABELS = {
  PENDING_UPLOADS: 'Chờ upload',
  IN_REVIEW:       'Đang review',
  APPROVED:        'Đã duyệt',
  REJECTED:        'Từ chối',
};

const CATEGORY_LABELS = {
  1: 'Clothing',
  2: 'H&K Vertical',
  3: 'H&K Horizontal',
};

const PLATFORM_BADGE = {
  AMAZON: 'bg-orange-50 text-orange-600 border border-orange-200',
  ETSY:   'bg-rose-50 text-rose-600 border border-rose-200',
};

const FILTER_TABS = [
  { key: null,              label: 'Tất cả' },
  { key: 'PENDING_UPLOADS', label: 'Chờ upload' },
  { key: 'IN_REVIEW',       label: 'Đang review' },
  { key: 'APPROVED',        label: 'Đã duyệt' },
  { key: 'REJECTED',        label: 'Từ chối' },
];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const TaskListPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, projects, tasks, fetchTasks, createTask } = useAppStore();

  const [activeFilter, setActiveFilter] = useState(null);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [newTitle, setNewTitle]         = useState('');
  const [newPlatform, setNewPlatform]   = useState('AMAZON');
  const [newCategory, setNewCategory]   = useState(1);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    fetchTasks(projectId)
      .catch(() => setError('Không thể tải danh sách task.'))
      .finally(() => setLoading(false));
  }, [projectId, user]);

  const project = projects.find(p => p.id === projectId);
  const allTasks = tasks[projectId] || [];

  const statusCounts = allTasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const filtered = activeFilter ? allTasks.filter(t => t.status === activeFilter) : allTasks;

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      await createTask(projectId, { title: newTitle, platform: newPlatform, category: newCategory });
      setNewTitle('');
      setNewCategory(1);
      setIsModalOpen(false);
    } catch {
      setError('Tạo task thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate = user?.role === 'SELLER' || user?.role === 'ADMIN' || user?.role === 'MARVEL';

  if (!user) return null;

  return (
    <SidebarLayout>
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] text-slate-400 mb-1">
            <span
              className="hover:text-blue-600 cursor-pointer transition-colors"
              onClick={() => navigate('/projects')}
            >
              Projects
            </span>
            <ChevronRight size={12} />
            <span className="text-slate-600 font-medium">{project?.name || 'Tasks'}</span>
          </div>
          <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Tasks</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">
            {allTasks.length} task trong {project?.name || 'project này'}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl transition-colors"
            style={{ background: '#1d4ed8', boxShadow: '0 2px 8px rgba(29,78,216,0.3)' }}
            onMouseOver={e => e.currentTarget.style.background = '#1e40af'}
            onMouseOut={e => e.currentTarget.style.background = '#1d4ed8'}
          >
            <Plus size={16} strokeWidth={2.5} />
            Tạo Task
          </button>
        )}
      </div>

      <div className="px-8 py-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-[13px]">
            {error}
          </div>
        )}

        {/* Filter pills */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {FILTER_TABS.map(tab => {
            const count = tab.key ? (statusCounts[tab.key] || 0) : allTasks.length;
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key ?? 'all'}
                onClick={() => setActiveFilter(tab.key)}
                className={`text-[12px] font-semibold px-3.5 py-1.5 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-blue-500 hover:text-blue-600'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-[14px]">
              {activeFilter ? 'Không có task nào ở trạng thái này.' : 'Chưa có task nào.'}
            </p>
            {canCreate && !activeFilter && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-3 text-blue-600 hover:underline text-[13px] font-semibold"
              >
                Tạo task đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(task => (
              <div
                key={task.id}
                onClick={() => navigate(`/projects/${projectId}/tasks/${task.id}`)}
                className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex items-center gap-4 cursor-pointer transition-all group"
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.08)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Status dot */}
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: STATUS_DOT[task.status] || '#94a3b8' }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                    {task.title}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${PLATFORM_BADGE[task.platform] || 'bg-gray-100 text-gray-600'}`}>
                      {task.platform || 'AMAZON'}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                      {CATEGORY_LABELS[task.category] || `Case ${task.category}`}
                    </span>
                    {task.createdByName && (
                      <span className="text-[10px] text-slate-400">
                        bởi {task.createdByName} · {formatDate(task.createdAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg flex-shrink-0 ${STATUS_BADGE[task.status] || 'bg-slate-100 text-slate-500'}`}>
                  {STATUS_LABELS[task.status] || task.status}
                </span>

                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-2xl w-full max-w-md"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)', padding: 32 }}
          >
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-[20px] font-extrabold text-slate-900">Tạo Task Mới</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors rounded-lg">
                <X size={18} />
              </button>
            </div>
            <p className="text-[13px] text-slate-400 mb-6">Điền thông tin để bắt đầu preview sản phẩm</p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Tên Task</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="VD: Summer T-Shirt Preview"
                  className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl outline-none bg-slate-50 text-slate-900 transition-all"
                  onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = 'white'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Nền tảng</label>
                  <select
                    value={newPlatform}
                    onChange={e => setNewPlatform(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl outline-none bg-slate-50 text-slate-900"
                  >
                    <option value="AMAZON">Amazon</option>
                    <option value="ETSY">Etsy</option>
                  </select>
                </div>
                {newPlatform === 'AMAZON' && (
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Category</label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl outline-none bg-slate-50 text-slate-900"
                    >
                      <option value={1}>Clothing &amp; Jewelry</option>
                      <option value={2}>H&amp;K — Vertical</option>
                      <option value={3}>H&amp;K — Horizontal</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-[13px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-[13px] font-bold text-white rounded-xl disabled:opacity-60 flex items-center gap-2 transition-colors"
                  style={{ background: '#1d4ed8', boxShadow: '0 2px 8px rgba(29,78,216,0.3)' }}
                  onMouseOver={e => e.currentTarget.style.background = '#1e40af'}
                  onMouseOut={e => e.currentTarget.style.background = '#1d4ed8'}
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Tạo Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};

export default TaskListPage;
