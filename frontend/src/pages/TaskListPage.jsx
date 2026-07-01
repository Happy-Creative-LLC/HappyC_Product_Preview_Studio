import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { Plus, ListTodo, Loader2, ChevronRight } from 'lucide-react';
import AppHeader from '../components/shared/AppHeader';

const STATUS_STYLES = {
  PENDING_UPLOADS: 'bg-yellow-50 text-yellow-700',
  IN_REVIEW: 'bg-blue-50 text-blue-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
};

const STATUS_LABELS = {
  PENDING_UPLOADS: 'Chờ upload',
  IN_REVIEW: 'Đang review',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const CATEGORY_LABELS = {
  1: 'Clothing',
  2: 'H&K Vertical',
  3: 'H&K Horizontal',
};

const PLATFORM_STYLES = {
  AMAZON: 'bg-orange-50 text-orange-600 border border-orange-200',
  ETSY:   'bg-rose-50 text-rose-600 border border-rose-200',
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const TaskListPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, projects, tasks, fetchTasks, createTask } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPlatform, setNewTaskPlatform] = useState('AMAZON');
  const [newTaskCategory, setNewTaskCategory] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    fetchTasks(projectId)
      .catch(() => setError('Không thể tải danh sách task.'))
      .finally(() => setLoading(false));
  }, [projectId, user]);

  const project = projects.find(p => p.id === projectId);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setSubmitting(true);
    try {
      await createTask(projectId, {
        title: newTaskTitle,
        platform: newTaskPlatform,
        category: newTaskCategory,
      });
      setNewTaskTitle('');
      setNewTaskCategory(1);
      setIsModalOpen(false);
    } catch {
      setError('Tạo task thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  const projectTasks = tasks[projectId] || [];

  const breadcrumbs = [
    { label: 'Projects', href: '/projects' },
    { label: project?.name || 'Tasks' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader breadcrumbs={breadcrumbs} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex justify-between items-center mb-5 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <ListTodo size={18} />
            <span>{projectTasks.length} Tasks</span>
          </div>

          {(user.role === 'SELLER' || user.role === 'ADMIN' || user.role === 'MARVEL') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Tạo Task
            </button>
          )}
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-orange-500" />
            </div>
          ) : projectTasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500">Chưa có task nào.</p>
              {(user.role === 'SELLER' || user.role === 'ADMIN' || user.role === 'MARVEL') && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 text-orange-500 hover:underline text-sm font-medium"
                >
                  Tạo task đầu tiên
                </button>
              )}
            </div>
          ) : (
            projectTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/projects/${projectId}/tasks/${task.id}`)}
                className="bg-white px-5 py-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:border-orange-200 hover:shadow-md transition-all group"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors truncate">
                    {task.title}
                  </h3>
                  <div className="flex items-center flex-wrap gap-1.5 mt-1.5 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${PLATFORM_STYLES[task.platform] || 'bg-gray-100 text-gray-600'}`}>
                      {task.platform || 'AMAZON'}
                    </span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[task.category] || `Case ${task.category}`}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status] || 'bg-gray-50 text-gray-600'}`}>
                      {STATUS_LABELS[task.status] || task.status}
                    </span>
                    {task.createdByName && (
                      <span className="text-gray-400">bởi {task.createdByName}</span>
                    )}
                    {task.createdAt && (
                      <span className="text-gray-300">· {formatDate(task.createdAt)}</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-orange-400 transition-colors flex-shrink-0 ml-3" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Tạo Task Mới</h2>
            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Tên Task</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="VD: Summer T-Shirt Preview"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Nền tảng</label>
                <select
                  value={newTaskPlatform}
                  onChange={(e) => setNewTaskPlatform(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="AMAZON">Amazon</option>
                  <option value="ETSY">Etsy</option>
                </select>
              </div>
              {newTaskPlatform === 'AMAZON' && (
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Category</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={1}>Clothing, Shoes & Jewelry</option>
                    <option value={2}>Home & Kitchen — Thumbnail Dọc + Zoom</option>
                    <option value={3}>Home & Kitchen — Thumbnail Ngang + Zoom</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center space-x-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>Tạo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskListPage;
