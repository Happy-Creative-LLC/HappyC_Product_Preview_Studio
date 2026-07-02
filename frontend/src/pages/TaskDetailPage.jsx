import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { Eye, CheckCircle, Clock, XCircle, Search, Loader2, ChevronRight } from 'lucide-react';
import SidebarLayout from '../components/shared/SidebarLayout';
import AmazonUploadForm from '../components/upload/AmazonUploadForm';

const STATUS_CONFIG = {
  PENDING_UPLOADS: { label: 'Chờ upload',  icon: Clock,       cls: 'bg-amber-100 text-amber-700' },
  IN_REVIEW:       { label: 'Đang review', icon: Search,      cls: 'bg-blue-100 text-blue-700' },
  APPROVED:        { label: 'Đã duyệt',    icon: CheckCircle, cls: 'bg-green-100 text-green-700' },
  REJECTED:        { label: 'Từ chối',     icon: XCircle,     cls: 'bg-red-100 text-red-600' },
};

const CATEGORY_LABELS = {
  1: 'Clothing, Shoes & Jewelry',
  2: 'Home & Kitchen — Vertical',
  3: 'Home & Kitchen — Horizontal',
};

const PLATFORM_BADGE = {
  AMAZON: 'bg-orange-50 text-orange-600 border border-orange-200',
  ETSY:   'bg-rose-50 text-rose-600 border border-rose-200',
};

const TaskDetailPage = () => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { user, projects, tasks, fetchTask, updateTaskStatus } = useAppStore();

  const [loading, setLoading]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg]   = useState('');

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    const found = (tasks[projectId] || []).find(t => t.id === taskId);
    if (!found) {
      setLoading(true);
      fetchTask(projectId, taskId).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user, projectId, taskId]);

  const project = projects.find(p => p.id === projectId);
  const task    = (tasks[projectId] || []).find(t => t.id === taskId);

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

  if (!user) return null;

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 size={40} className="animate-spin text-blue-600" />
        </div>
      </SidebarLayout>
    );
  }

  if (!task) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen text-slate-500 text-[14px] gap-2">
          Task không tìm thấy.
          <Link to={`/projects/${projectId}/tasks`} className="text-blue-600 hover:underline">
            Quay lại
          </Link>
        </div>
      </SidebarLayout>
    );
  }

  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING_UPLOADS;
  const StatusIcon = statusCfg.icon;
  const canEdit    = ['ADMIN', 'SELLER', 'MARVEL', 'PRODUCT_DESIGN'].includes(user.role);
  const canSubmit  = canEdit && task.status === 'PENDING_UPLOADS';
  const previewPath = task.platform === 'ETSY'
    ? `/etsy?taskId=${taskId}&projectId=${projectId}`
    : `/amazon?taskId=${taskId}&projectId=${projectId}`;

  return (
    <SidebarLayout>
      {/* Top bar with breadcrumb */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-center gap-1.5 text-[12px] text-slate-400 mb-1">
          <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate('/projects')}>
            Projects
          </span>
          <ChevronRight size={12} />
          <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate(`/projects/${projectId}/tasks`)}>
            {project?.name || 'Project'}
          </span>
          <ChevronRight size={12} />
          <span className="text-slate-600 font-medium truncate max-w-[200px]">{task.title}</span>
        </div>
        <h1 className="text-[18px] font-extrabold text-slate-900 tracking-tight truncate">
          {task.title}
        </h1>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-7">
        {/* Task Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-7 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            <div>
              <h2 className="text-[22px] font-extrabold text-slate-900 tracking-tight mb-3">
                {task.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {/* Status */}
                <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg ${statusCfg.cls}`}>
                  <StatusIcon size={12} />
                  {statusCfg.label}
                </span>
                {/* Platform */}
                <span className={`text-[12px] font-bold px-3 py-1.5 rounded-lg ${PLATFORM_BADGE[task.platform] || 'bg-slate-100 text-slate-600'}`}>
                  {task.platform || 'AMAZON'}
                </span>
                {/* Category */}
                {task.category && (
                  <span className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600">
                    {CATEGORY_LABELS[task.category] || `Case ${task.category}`}
                  </span>
                )}
              </div>
              {task.createdByName && (
                <p className="text-[13px] text-slate-400 mt-3">
                  Tạo bởi <span className="font-semibold text-slate-600">{task.createdByName}</span>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col items-start sm:items-end gap-2.5 flex-shrink-0">
              <Link
                to={previewPath}
                className="inline-flex items-center gap-2 text-white text-[13px] font-bold px-4 py-2.5 rounded-xl transition-colors"
                style={{ background: '#1d4ed8', boxShadow: '0 2px 8px rgba(29,78,216,0.3)' }}
                onMouseOver={e => e.currentTarget.style.background = '#1e40af'}
                onMouseOut={e => e.currentTarget.style.background = '#1d4ed8'}
              >
                <Eye size={16} />
                Preview
              </Link>

              {canSubmit && (
                <button
                  onClick={handleSubmitForReview}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 text-white text-[13px] font-bold px-4 py-2.5 rounded-xl disabled:opacity-60 transition-colors"
                  style={{ background: '#059669', boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }}
                  onMouseOver={e => e.currentTarget.style.background = '#047857'}
                  onMouseOut={e => e.currentTarget.style.background = '#059669'}
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Gửi Review
                </button>
              )}

              {statusMsg && (
                <p className="text-[13px] text-green-600 font-semibold">{statusMsg}</p>
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
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
            <p className="text-amber-800 text-[14px]">
              Bạn đang ở chế độ xem. Nhấn <strong>Preview</strong> để xem kết quả.
            </p>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default TaskDetailPage;
