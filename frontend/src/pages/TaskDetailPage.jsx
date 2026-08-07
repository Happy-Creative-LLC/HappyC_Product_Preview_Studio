import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  Loader2,
  Save,
  Search,
  ShieldCheck,
  Video,
  XCircle,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import SidebarLayout from '../components/shared/SidebarLayout';
import AmazonUploadForm from '../components/upload/AmazonUploadForm';
import { canSubmitTaskReview, canUseAmazonSearch, isSingleProjectRole } from '../utils/permissions';

const STATUS_CONFIG = {
  PENDING_UPLOADS: {
    label: 'Chờ upload',
    className: 'hc-status--pending',
    icon: Clock3,
  },
  IN_REVIEW: {
    label: 'Đang review',
    className: 'hc-status--review',
    icon: Search,
  },
  APPROVED: {
    label: 'Đã duyệt',
    className: 'hc-status--approved',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Từ chối',
    className: 'hc-status--rejected',
    icon: XCircle,
  },
};

const CATEGORY_LABELS = {
  1: 'Case 1 · Clothing, Shoes & Jewelry',
  2: 'Case 2 · Home & Kitchen dọc',
  3: 'Case 3 · Home & Kitchen ngang',
};

const EMPTY_READINESS = {
  hasTitle: false,
  imageCount: 0,
  imageLimit: null,
  imageLimitPending: false,
  hasVideo: false,
  videoCount: 0,
  videoLimit: null,
  colorCount: 0,
  sizeCount: 0,
  aPlusCount: 0,
  savedPreviewId: null,
  hasUnsavedChanges: false,
};

const ReadinessItem = ({ icon: Icon, title, detail, pending = false, neutral = false }) => (
  <div className={`hc-readiness__item ${pending ? 'hc-readiness__item--pending' : ''} ${neutral ? '!text-[var(--hc-gray-500)]' : ''}`}>
    <Icon size={20} aria-hidden="true" />
    <div>
      <strong>{title}</strong>
      <small>{detail}</small>
    </div>
  </div>
);

const formatDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TaskDetailPage = () => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const {
    user,
    projects,
    tasks,
    fetchTask,
    updateTaskStatus,
  } = useAppStore();

  const [loadState, setLoadState] = useState({ taskId: null, loading: true, error: '' });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [reviewSubmission, setReviewSubmission] = useState({ taskId: null, submitting: false });
  const [reviewFeedbackState, setReviewFeedbackState] = useState({ taskId: null, feedback: null });
  const [previewState, setPreviewState] = useState({ taskId: null, previewId: null });
  const [statusState, setStatusState] = useState({ taskId: null, status: null });
  const [readinessState, setReadinessState] = useState({ taskId: null, value: EMPTY_READINESS });

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
      return undefined;
    }

    let active = true;
    const cachedTask = (useAppStore.getState().tasks[projectId] || [])
      .find((item) => item.id === taskId);

    fetchTask(projectId, taskId)
      .then(() => {
        if (active) setLoadState({ taskId, loading: false, error: '' });
      })
      .catch(() => {
        if (active) {
          setLoadState({
            taskId,
            loading: false,
            error: cachedTask ? 'STALE_CACHE' : 'Không thể tải chi tiết task. Vui lòng kiểm tra kết nối và thử lại.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [fetchTask, loadAttempt, navigate, projectId, taskId, user]);

  const task = (tasks[projectId] || []).find((item) => item.id === taskId);
  const loading = loadState.taskId === taskId ? loadState.loading : !task;
  const loadError = loadState.taskId === taskId ? loadState.error : '';
  const submittingReview = reviewSubmission.taskId === taskId && reviewSubmission.submitting;
  const reviewFeedback = reviewFeedbackState.taskId === taskId ? reviewFeedbackState.feedback : null;
  const savedPreviewId = previewState.taskId === taskId ? previewState.previewId : null;
  const statusOverride = statusState.taskId === taskId ? statusState.status : null;
  const readiness = readinessState.taskId === taskId ? readinessState.value : EMPTY_READINESS;
  const project = projects.find((item) => item.id === projectId);
  const projectName = project?.name || task?.projectName || 'Project';
  const displayedStatus = statusOverride || task?.status || 'PENDING_UPLOADS';
  const statusConfig = STATUS_CONFIG[displayedStatus] || STATUS_CONFIG.PENDING_UPLOADS;
  const canReview = canSubmitTaskReview(user?.role);
  const canSendCurrentTask = canReview && displayedStatus === 'PENDING_UPLOADS';

  const previewUrl = savedPreviewId
    ? `${task?.platform === 'ETSY' ? '/etsy' : '/amazon'}?${new URLSearchParams({
      taskId,
      projectId,
      previewId: savedPreviewId,
    }).toString()}`
    : null;
  const searchPreviewUrl = savedPreviewId
    && task?.platform === 'AMAZON'
    && canUseAmazonSearch(user?.role)
    ? `/search?${new URLSearchParams({
      taskId,
      projectId,
      previewId: savedPreviewId,
    }).toString()}`
    : null;

  const breadcrumbs = [
    ...(isSingleProjectRole(user?.role) ? [] : [{ label: 'Projects', to: '/projects' }]),
    { label: task?.projectName || projectName, to: `/projects/${projectId}/tasks` },
    { label: task?.title || 'Task' },
  ];

  const handleSaved = useCallback((previewId) => {
    setPreviewState({ taskId, previewId });
    setReviewFeedbackState({ taskId, feedback: null });
  }, [taskId]);

  const handleReadinessChange = useCallback((nextReadiness) => {
    setReadinessState({ taskId, value: nextReadiness });
  }, [taskId]);

  const handleRetry = () => {
    setLoadState({ taskId, loading: true, error: '' });
    setLoadAttempt((value) => value + 1);
  };

  const handleSubmitForReview = async () => {
    if (!canReview) {
      setReviewFeedbackState({
        taskId,
        feedback: { type: 'error', text: 'Chỉ ADMIN hoặc SELLER được gửi task để review.' },
      });
      return;
    }
    if (!savedPreviewId) {
      setReviewFeedbackState({
        taskId,
        feedback: { type: 'error', text: 'Hãy lưu một bản Preview trước khi gửi task để review.' },
      });
      return;
    }
    if (readiness.hasUnsavedChanges) {
      setReviewFeedbackState({
        taskId,
        feedback: { type: 'error', text: 'Hãy lưu thay đổi mới trước khi gửi review.' },
      });
      return;
    }

    setReviewSubmission({ taskId, submitting: true });
    setReviewFeedbackState({ taskId, feedback: null });
    try {
      const updatedTask = await updateTaskStatus(taskId, 'IN_REVIEW');
      setStatusState({ taskId, status: updatedTask?.status || 'IN_REVIEW' });
      setReviewFeedbackState({
        taskId,
        feedback: { type: 'success', text: 'Đã gửi task để review.' },
      });
      fetchTask(projectId, taskId).catch(() => {});
    } catch (requestError) {
      const message = requestError.response?.status === 403
        ? 'Bạn không có quyền gửi task này để review.'
        : 'Không thể gửi task để review. Vui lòng thử lại.';
      setReviewFeedbackState({ taskId, feedback: { type: 'error', text: message } });
    } finally {
      setReviewSubmission({ taskId, submitting: false });
    }
  };

  if (!user) return null;

  if (loading && !task) {
    return (
      <SidebarLayout breadcrumbs={breadcrumbs} previewPath={null}>
        <div className="hc-loading-page" role="status" aria-live="polite">
          <Loader2 size={34} className="animate-spin" aria-hidden="true" />
          <span>Đang tải workspace...</span>
        </div>
      </SidebarLayout>
    );
  }

  if (loadError && !task) {
    return (
      <SidebarLayout breadcrumbs={breadcrumbs} previewPath={null}>
        <div className="hc-card hc-empty-state" role="alert">
          <AlertCircle size={34} aria-hidden="true" />
          <strong>Không thể mở task</strong>
          <p>{loadError}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button className="hc-button hc-button--primary" type="button" onClick={handleRetry}>
              Thử lại
            </button>
            <Link className="hc-button hc-button--secondary" to={`/projects/${projectId}/tasks`}>
              Quay lại danh sách task
            </Link>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!task) {
    return (
      <SidebarLayout breadcrumbs={breadcrumbs} previewPath={null}>
        <div className="hc-card hc-empty-state">
          <FileText size={34} aria-hidden="true" />
          <strong>Không tìm thấy task</strong>
          <p>Task có thể đã bị xóa hoặc bạn không có quyền truy cập project này.</p>
          <Link className="hc-button hc-button--secondary mt-5" to={`/projects/${projectId}/tasks`}>
            Quay lại danh sách task
          </Link>
        </div>
      </SidebarLayout>
    );
  }

  const createdAt = formatDateTime(task.createdAt);
  const imageReadinessText = readiness.imageLimit === null
    ? `${readiness.imageCount} ảnh · giới hạn Case 2/3 đang chờ chốt`
    : `${readiness.imageCount}/${readiness.imageLimit} ảnh trong form`;
  const videoCount = readiness.videoCount ?? (readiness.hasVideo ? 1 : 0);
  const videoReadinessText = videoCount === 0
    ? 'Chưa chọn · trường tùy chọn'
    : (readiness.videoLimit === null
      ? `Đã chọn ${videoCount} video · giới hạn Case 2/3 đang chờ chốt`
      : `Đã chọn ${videoCount}/${readiness.videoLimit} video`);
  const savedPreviewDetail = savedPreviewId
    ? (readiness.hasUnsavedChanges
      ? 'Có thay đổi mới chưa lưu; link mở bản đã lưu gần nhất'
      : `Đã lưu · ${String(savedPreviewId).slice(0, 8)}…`)
    : 'Chưa lưu Preview trong phiên làm việc này';

  return (
    <SidebarLayout breadcrumbs={breadcrumbs} previewPath={previewUrl}>
      <div className="hc-page">
        <header className="hc-page-heading">
          <div className="min-w-0">
            <span className="hc-eyebrow">TASK WORKSPACE</span>
            <h1 className="break-words">{task.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`hc-platform ${task.platform === 'ETSY' ? 'hc-platform--etsy' : 'hc-platform--amazon'}`}>
                {task.platform === 'ETSY' ? 'Etsy' : 'amazon'}
              </span>
              <span className={`hc-status ${statusConfig.className}`}>{statusConfig.label}</span>
              {task.platform !== 'ETSY' && task.category && (
                <span className="rounded-full bg-[var(--hc-gray-100)] px-2.5 py-1 text-[11px] font-bold text-[var(--hc-gray-600)]">
                  {CATEGORY_LABELS[task.category] || `Case ${task.category}`}
                </span>
              )}
            </div>
            <p>
              {projectName}
              {task.createdByName ? ` · Tạo bởi ${task.createdByName}` : ''}
              {createdAt ? ` · ${createdAt}` : ''}
            </p>
          </div>

          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              {searchPreviewUrl && (
                <Link className="hc-button hc-button--secondary" to={searchPreviewUrl}>
                  <Search size={17} aria-hidden="true" />
                  So sánh Search
                </Link>
              )}
              {previewUrl ? (
                <Link className="hc-button hc-button--secondary" to={previewUrl}>
                  <Eye size={17} aria-hidden="true" />
                  Xem Preview đã lưu
                </Link>
              ) : (
                <button className="hc-button hc-button--secondary" type="button" disabled aria-describedby="preview-disabled-help">
                  <Eye size={17} aria-hidden="true" />
                  Xem Preview
                </button>
              )}

              {canSendCurrentTask && (
                <button
                  className="hc-button hc-button--success"
                  type="button"
                  onClick={handleSubmitForReview}
                  disabled={submittingReview || !savedPreviewId || readiness.hasUnsavedChanges}
                  aria-describedby={(!savedPreviewId || readiness.hasUnsavedChanges) ? 'review-disabled-help' : undefined}
                >
                  {submittingReview
                    ? <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                    : <CheckCircle2 size={17} aria-hidden="true" />}
                  {submittingReview ? 'Đang gửi...' : 'Gửi Review'}
                </button>
              )}
            </div>
            {!previewUrl && (
              <p id="preview-disabled-help" className="max-w-sm text-xs text-[var(--hc-gray-500)]">
                Lưu form để tạo previewId trước khi mở Preview.
              </p>
            )}
            {canSendCurrentTask && (!savedPreviewId || readiness.hasUnsavedChanges) && (
              <span id="review-disabled-help" className="text-xs text-[var(--hc-orange-600)]">
                {readiness.hasUnsavedChanges
                  ? 'Hãy lưu thay đổi mới trước khi gửi review.'
                  : 'Cần lưu một bản Preview trước khi gửi Review.'}
              </span>
            )}
          </div>
        </header>

        {loadError && (
          <div className="hc-alert hc-alert--info mb-5" role="status">
            <AlertCircle size={18} aria-hidden="true" />
            <span>Đang hiển thị dữ liệu đã tải trước đó. Không thể làm mới task từ máy chủ.</span>
          </div>
        )}

        {reviewFeedback && (
          <div
            className={`hc-alert mb-5 ${reviewFeedback.type === 'success' ? 'hc-alert--success' : 'hc-alert--error'}`}
            role={reviewFeedback.type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {reviewFeedback.type === 'success'
              ? <CheckCircle2 size={18} aria-hidden="true" />
              : <AlertCircle size={18} aria-hidden="true" />}
            <span>{reviewFeedback.text}</span>
          </div>
        )}

        <div className="hc-workspace-grid">
          <AmazonUploadForm
            key={taskId}
            projectId={projectId}
            taskId={taskId}
            platform={task.platform}
            category={task.category}
            role={user.role}
            initialTitle={task.title}
            onSaved={handleSaved}
            onReadinessChange={handleReadinessChange}
          />

          <aside className="hc-card hc-readiness" aria-labelledby="workspace-readiness-title">
            <div className="hc-readiness__score">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--hc-orange-50)] text-[var(--hc-orange-600)]">
                <FileCheck2 size={25} aria-hidden="true" />
              </span>
              <div>
                <h2 id="workspace-readiness-title">Trạng thái workspace</h2>
                <p>Chỉ hiển thị dữ liệu thật đang có trong form</p>
              </div>
            </div>

            <div className="hc-readiness__list">
              <ReadinessItem
                icon={readiness.hasTitle ? CheckCircle2 : CircleDashed}
                title="Tiêu đề listing"
                detail={readiness.hasTitle ? 'Đã có nội dung' : 'Chưa nhập tiêu đề'}
                pending={!readiness.hasTitle}
              />
              <ReadinessItem
                icon={readiness.imageCount > 0 ? ImageIcon : CircleDashed}
                title="Hình ảnh trong form"
                detail={imageReadinessText}
                pending={readiness.imageCount === 0}
              />
              <ReadinessItem
                icon={Video}
                title="Video trong form"
                detail={videoReadinessText}
                neutral={!readiness.hasVideo}
              />
              <ReadinessItem
                icon={savedPreviewId && !readiness.hasUnsavedChanges ? CheckCircle2 : Save}
                title="Bản Preview"
                detail={savedPreviewDetail}
                pending={!savedPreviewId || readiness.hasUnsavedChanges}
              />
              <ReadinessItem
                icon={statusConfig.icon}
                title="Trạng thái task"
                detail={statusConfig.label}
                neutral={displayedStatus === 'PENDING_UPLOADS'}
              />
            </div>

            {previewUrl ? (
              <Link className="hc-button hc-button--primary hc-button--block" to={previewUrl}>
                <Eye size={17} aria-hidden="true" />
                Mở {task.platform === 'ETSY' ? 'Etsy' : 'Amazon'} Preview
              </Link>
            ) : (
              <button className="hc-button hc-button--primary hc-button--block" type="button" disabled>
                <Eye size={17} aria-hidden="true" />
                Chưa có previewId
              </button>
            )}

            <p className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-[var(--hc-gray-500)]">
              <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              Preview chỉ mở bản đã lưu gần nhất; thay đổi chưa lưu không được đưa vào URL.
            </p>
          </aside>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default TaskDetailPage;
