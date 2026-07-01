import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { Eye, CheckCircle, Clock, XCircle, Search, Loader2 } from 'lucide-react';
import AppHeader from '../components/shared/AppHeader';
import AmazonUploadForm from '../components/upload/AmazonUploadForm';

const STATUS_CONFIG = {
  PENDING_UPLOADS: { label: 'Chờ upload', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
  IN_REVIEW:       { label: 'Đang review', icon: Search, color: 'bg-blue-100 text-blue-700' },
  APPROVED:        { label: 'Đã duyệt', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  REJECTED:        { label: 'Từ chối', icon: XCircle, color: 'bg-red-100 text-red-700' },
};

const CATEGORY_LABELS = {
  1: 'Clothing, Shoes & Jewelry',
  2: 'Home & Kitchen — Thumbnail Dọc + Zoom',
  3: 'Home & Kitchen — Thumbnail Ngang + Zoom',
};

const TaskDetailPage = () => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { user, projects, tasks, fetchTask, updateTaskStatus } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (!user) { navigate('/'); return; }

    const projectTasks = tasks[projectId] || [];
    const found = projectTasks.find(t => t.id === taskId);
    if (!found) {
      setLoading(true);
      fetchTask(projectId, taskId)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, projectId, taskId]);

  const project = projects.find(p => p.id === projectId);
  const task = (tasks[projectId] || []).find(t => t.id === taskId);

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    setStatusMsg('');
    try {
      await updateTaskStatus(taskId, 'IN_REVIEW');
      await fetchTask(projectId, taskId);
      setStatusMsg('Đã gửi để review!');
    } catch {
      setStatusMsg('Gửi thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Projects', href: '/projects' },
    { label: project?.name || 'Project', href: `/projects/${projectId}/tasks` },
    { label: task?.title || 'Task' },
  ];

  if (!user) return null;

  if (loading) {
    return (
      <>
        <AppHeader breadcrumbs={breadcrumbs} />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 size={40} className="animate-spin text-orange-500" />
        </div>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <AppHeader breadcrumbs={[{ label: 'Projects', href: '/projects' }]} />
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          Task không tìm thấy.{' '}
          <Link to={`/projects/${projectId}/tasks`} className="text-orange-500 hover:underline ml-1">
            Quay lại
          </Link>
        </div>
      </>
    );
  }

  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING_UPLOADS;
  const StatusIcon = statusCfg.icon;
  const canEdit = user.role === 'MARVEL' || user.role === 'PRODUCT_DESIGN'
                  || user.role === 'SELLER' || user.role === 'ADMIN';
  const canSubmit = canEdit && task.status === 'PENDING_UPLOADS';
  const previewPath = task.platform === 'ETSY'
    ? `/etsy?taskId=${taskId}&projectId=${projectId}`
    : `/amazon?taskId=${taskId}&projectId=${projectId}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader breadcrumbs={breadcrumbs} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Task Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${statusCfg.color}`}>
                  <StatusIcon size={14} />
                  {statusCfg.label}
                </span>
                <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {task.platform || 'AMAZON'}
                </span>
                {task.category && (
                  <span className="text-sm bg-orange-50 text-orange-600 px-3 py-1 rounded-full">
                    {CATEGORY_LABELS[task.category] || `Case ${task.category}`}
                  </span>
                )}
              </div>
              {task.createdByName && (
                <p className="text-sm text-gray-400 mt-2">
                  Tạo bởi <span className="font-medium text-gray-600">{task.createdByName}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <Link
                to={previewPath}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Eye size={18} />
                Preview Product
              </Link>

              {canSubmit && (
                <button
                  onClick={handleSubmitForReview}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Gửi để Review
                </button>
              )}

              {statusMsg && (
                <p className="text-sm text-green-600 font-medium">{statusMsg}</p>
              )}
            </div>
          </div>
        </div>

        {/* Upload Form */}
        {canEdit ? (
          <AmazonUploadForm
            projectId={projectId}
            taskId={taskId}
            platform={task.platform}
            category={task.category}
          />
        ) : (
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <p className="text-yellow-800">
              Bạn đang ở chế độ xem. Nhấn <strong>Preview Product</strong> để xem kết quả.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailPage;
