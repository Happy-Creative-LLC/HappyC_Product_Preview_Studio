import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Image,
  ListTodo,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import SidebarLayout from '../components/shared/SidebarLayout';
import { useAppStore } from '../stores/appStore';
import { canCreateTask, isSingleProjectRole } from '../utils/permissions';

const STATUS_LABELS = {
  PENDING_UPLOADS: 'Chờ upload',
  IN_REVIEW: 'Đang review',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const STATUS_CLASSES = {
  PENDING_UPLOADS: 'hc-status--pending',
  IN_REVIEW: 'hc-status--review',
  APPROVED: 'hc-status--approved',
  REJECTED: 'hc-status--rejected',
};

const PLATFORM_CLASSES = {
  AMAZON: 'hc-platform--amazon',
  ETSY: 'hc-platform--etsy',
};

const CATEGORY_LABELS = {
  1: 'Case 1 · Clothing',
  2: 'Case 2 · H&K ảnh dọc',
  3: 'Case 3 · H&K ảnh ngang',
};

const FILTER_TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING_UPLOADS', label: STATUS_LABELS.PENDING_UPLOADS },
  { key: 'IN_REVIEW', label: STATUS_LABELS.IN_REVIEW },
  { key: 'APPROVED', label: STATUS_LABELS.APPROVED },
  { key: 'REJECTED', label: STATUS_LABELS.REJECTED },
];

const TASK_ICON_TONES = [
  'bg-[var(--hc-orange-50)] text-[var(--hc-orange-600)]',
  'bg-[var(--hc-blue-50)] text-[var(--hc-blue-700)]',
  'bg-[var(--hc-red-50)] text-[var(--hc-red-700)]',
  'bg-[var(--hc-purple-50)] text-[var(--hc-purple-700)]',
];

const VALID_STATUSES = new Set(Object.keys(STATUS_LABELS));
const numberFormatter = new Intl.NumberFormat('vi-VN');
const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
};

const getInitials = (name) => {
  if (!name?.trim()) return '?';
  const words = name.trim().split(/\s+/);
  return words.length === 1
    ? words[0].slice(0, 2).toLocaleUpperCase('vi-VN')
    : `${words[0][0]}${words.at(-1)[0]}`.toLocaleUpperCase('vi-VN');
};

const getCategoryLabel = (task) => {
  if (task.platform === 'ETSY') return 'Etsy listing';
  return CATEGORY_LABELS[task.category] || `Case ${task.category}`;
};

const getUpdatedTime = (task) => {
  const value = task.updatedAt || task.createdAt;
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const TaskListPage = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    user,
    projects,
    tasks,
    fetchProjects,
    fetchTasks,
    createTask,
  } = useAppStore();

  const dialogRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [projectWarning, setProjectWarning] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newPlatform, setNewPlatform] = useState('AMAZON');
  const [newCategory, setNewCategory] = useState(1);

  const canCreate = canCreateTask(user?.role);
  const requestedStatus = searchParams.get('status');
  const activeStatus = requestedStatus && VALID_STATUSES.has(requestedStatus)
    ? requestedStatus
    : 'ALL';
  const searchQuery = searchParams.get('q') || '';
  const createRequested = searchParams.get('create') === '1';

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
      return undefined;
    }

    let isCurrent = true;

    const loadTasks = async () => {
      setLoading(true);
      setLoadError('');
      setProjectWarning('');

      const [taskResult, projectResult] = await Promise.allSettled([
        fetchTasks(projectId),
        fetchProjects(),
      ]);

      if (!isCurrent) return;

      if (taskResult.status === 'rejected') {
        setLoadError('Không thể tải danh sách task. Vui lòng kiểm tra kết nối và thử lại.');
      }
      if (projectResult.status === 'rejected') {
        setProjectWarning('Không thể tải thông tin project. Danh sách task vẫn được hiển thị nếu đã tải thành công.');
      }
      setLoading(false);
    };

    loadTasks();
    return () => {
      isCurrent = false;
    };
  }, [fetchProjects, fetchTasks, navigate, projectId, reloadKey, user]);

  useEffect(() => {
    if (createRequested && !canCreate) {
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) return;

    if (createRequested && canCreate && !dialog.open) {
      dialog.showModal();
    } else if ((!createRequested || !canCreate) && dialog.open) {
      dialog.close();
    }

  }, [canCreate, createRequested, searchParams, setSearchParams]);

  const projectTasks = useMemo(() => tasks[projectId] || [], [projectId, tasks]);
  const project = projects.find((item) => item.id === projectId);
  const projectName = project?.name || projectTasks[0]?.projectName || 'Project';

  const sortedTasks = useMemo(
    () => [...projectTasks].sort((a, b) => getUpdatedTime(b) - getUpdatedTime(a)),
    [projectTasks]
  );

  const statusCounts = useMemo(() => sortedTasks.reduce(
    (counts, task) => {
      counts.ALL += 1;
      if (Object.hasOwn(counts, task.status)) counts[task.status] += 1;
      return counts;
    },
    {
      ALL: 0,
      PENDING_UPLOADS: 0,
      IN_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
    }
  ), [sortedTasks]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('vi-VN');
    return sortedTasks.filter((task) => {
      const matchesStatus = activeStatus === 'ALL' || task.status === activeStatus;
      const matchesQuery = !normalizedQuery
        || task.title?.toLocaleLowerCase('vi-VN').includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [activeStatus, searchQuery, sortedTasks]);

  const updateQuery = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '' || value === 'ALL') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    setSearchParams(next, { replace: true });
  };

  const openCreateDialog = () => updateQuery({ create: '1' });

  const handleDialogClose = () => {
    setFormError('');
    if (searchParams.has('create')) updateQuery({ create: null });
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    const title = newTitle.trim();

    if (!title) {
      setFormError('Vui lòng nhập tên task.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      await createTask(projectId, {
        title,
        platform: newPlatform,
        category: newPlatform === 'AMAZON' ? newCategory : 1,
      });
      setNewTitle('');
      setNewPlatform('AMAZON');
      setNewCategory(1);
      dialogRef.current?.close();
    } catch {
      setFormError('Không thể tạo task. Vui lòng kiểm tra thông tin và thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const openTask = (taskId) => {
    navigate(`/projects/${projectId}/tasks/${taskId}${location.search}`);
  };

  if (!user) return null;

  return (
    <SidebarLayout>
      <section className="hc-page" aria-labelledby="tasks-title">
        <header className="hc-page-heading">
          <div>
            {!isSingleProjectRole(user?.role) && (
              <button
                type="button"
                className="mb-2 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[var(--hc-gray-500)] transition-colors hover:text-[var(--hc-orange-600)]"
                onClick={() => navigate('/projects')}
              >
                <ArrowLeft size={15} aria-hidden="true" />
                Projects
              </button>
            )}
            <span className="hc-eyebrow block">{projectName}</span>
            <h1 id="tasks-title">Tasks</h1>
            <p>Quản lý listing đang chuẩn bị cho Amazon và Etsy.</p>
          </div>

          {canCreate && (
            <button type="button" className="hc-button hc-button--primary" onClick={openCreateDialog}>
              <Plus size={17} aria-hidden="true" />
              Tạo task mới
            </button>
          )}
        </header>

        {loading ? (
          <div className="hc-loading-page" role="status" aria-live="polite">
            <Loader2 className="animate-spin" size={30} aria-hidden="true" />
            <span>Đang tải danh sách task…</span>
          </div>
        ) : (
          <>
            {(loadError || projectWarning) && (
              <div className={`hc-alert mb-5 ${loadError ? 'hc-alert--error' : 'hc-alert--info'}`} role={loadError ? 'alert' : 'status'}>
                <AlertTriangle size={18} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <strong className="block">{loadError ? 'Không tải được task' : 'Thiếu thông tin project'}</strong>
                  <span>{loadError || projectWarning}</span>
                </div>
                <button
                  type="button"
                  className="hc-button hc-button--secondary min-h-11 shrink-0"
                  onClick={() => setReloadKey((value) => value + 1)}
                >
                  <RefreshCw size={15} aria-hidden="true" />
                  Thử lại
                </button>
              </div>
            )}

            <section
              className="hc-card mb-5 grid grid-cols-5 overflow-x-auto"
              aria-label="Tổng quan trạng thái task"
            >
              {FILTER_TABS.map((item) => (
                <div
                  key={item.key}
                  className="flex min-w-[6.5rem] flex-col gap-0.5 border-r border-[var(--hc-gray-200)] px-4 py-4 last:border-r-0 sm:flex-row sm:items-baseline sm:gap-2 sm:px-5"
                >
                  <strong className="text-xl font-bold tabular-nums tracking-tight text-[var(--hc-navy-900)]">
                    {numberFormatter.format(statusCounts[item.key])}
                  </strong>
                  <span className="whitespace-nowrap text-[0.6875rem] text-[var(--hc-gray-500)]">{item.label}</span>
                </div>
              ))}
            </section>

            <section className="hc-card overflow-hidden" aria-labelledby="task-table-title">
              <h2 id="task-table-title" className="sr-only">Danh sách task</h2>

              <div className="flex flex-col gap-3 border-b border-[var(--hc-gray-200)] p-4 lg:flex-row lg:items-center lg:justify-between">
                <label className="relative block w-full lg:max-w-sm">
                  <span className="sr-only">Tìm theo tên task</span>
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--hc-gray-400)]"
                    size={17}
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => updateQuery({ q: event.target.value })}
                    className="hc-input pl-10 text-base md:text-sm"
                    placeholder="Tìm theo tên task…"
                    autoComplete="off"
                  />
                </label>

                <div
                  className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[var(--hc-gray-100)] p-1"
                  role="group"
                  aria-label="Lọc task theo trạng thái"
                >
                  {FILTER_TABS.map((item) => {
                    const isActive = activeStatus === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`min-h-11 shrink-0 rounded-lg px-3 text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-white text-[var(--hc-navy-900)] shadow-[var(--hc-shadow-xs)]'
                            : 'text-[var(--hc-gray-500)] hover:text-[var(--hc-navy-900)]'
                        }`}
                        onClick={() => updateQuery({ status: item.key })}
                        aria-pressed={isActive}
                      >
                        {item.label} ({numberFormatter.format(statusCounts[item.key])})
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="hc-empty-state">
                  {projectTasks.length === 0 && !searchQuery && activeStatus === 'ALL'
                    ? <ListTodo size={38} aria-hidden="true" />
                    : <Search size={38} aria-hidden="true" />}
                  <strong>
                    {projectTasks.length === 0 && !searchQuery && activeStatus === 'ALL'
                      ? 'Chưa có task nào'
                      : 'Không tìm thấy task'}
                  </strong>
                  <p>
                    {projectTasks.length === 0 && !searchQuery && activeStatus === 'ALL'
                      ? 'Task mới của project sẽ xuất hiện tại đây.'
                      : 'Thử từ khóa khác hoặc xóa bộ lọc trạng thái.'}
                  </p>
                  {projectTasks.length === 0 && !searchQuery && activeStatus === 'ALL' && canCreate ? (
                    <button type="button" className="hc-button hc-button--primary mt-5" onClick={openCreateDialog}>
                      <Plus size={16} aria-hidden="true" />
                      Tạo task đầu tiên
                    </button>
                  ) : (searchQuery || activeStatus !== 'ALL') ? (
                    <button
                      type="button"
                      className="hc-button hc-button--secondary mt-5"
                      onClick={() => updateQuery({ q: null, status: null })}
                    >
                      Xóa bộ lọc
                    </button>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full border-collapse text-left text-xs text-[var(--hc-gray-600)]">
                      <caption className="sr-only">
                        Danh sách task của {projectName}, gồm {filteredTasks.length} kết quả
                      </caption>
                      <thead>
                        <tr className="bg-[var(--hc-gray-25)] text-[0.625rem] uppercase tracking-wider text-[var(--hc-gray-500)]">
                          <th scope="col" className="px-4 py-3 font-bold">Task</th>
                          <th scope="col" className="px-4 py-3 font-bold">Nền tảng</th>
                          <th scope="col" className="px-4 py-3 font-bold">Case / Category</th>
                          <th scope="col" className="px-4 py-3 font-bold">Người tạo</th>
                          <th scope="col" className="px-4 py-3 font-bold">Cập nhật</th>
                          <th scope="col" className="px-4 py-3 font-bold">Trạng thái</th>
                          <th scope="col" className="w-14 px-2 py-3"><span className="sr-only">Mở task</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTasks.map((task, index) => (
                          <tr key={task.id} className="border-t border-[var(--hc-gray-200)] transition-colors hover:bg-[var(--hc-orange-50)]">
                            <td className="px-4 py-3.5">
                              <button
                                type="button"
                                className="group flex min-h-11 items-center gap-3 text-left"
                                onClick={() => openTask(task.id)}
                              >
                                <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${TASK_ICON_TONES[index % TASK_ICON_TONES.length]}`}>
                                  <Image size={18} aria-hidden="true" />
                                </span>
                                <span className="min-w-0">
                                  <strong className="block max-w-[17rem] truncate text-xs text-[var(--hc-navy-900)] group-hover:text-[var(--hc-blue-700)]">
                                    {task.title}
                                  </strong>
                                  <span className="mt-0.5 block text-[0.625rem] text-[var(--hc-gray-400)]">
                                    Tạo ngày {formatDate(task.createdAt)}
                                  </span>
                                </span>
                              </button>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`hc-platform ${PLATFORM_CLASSES[task.platform] || ''}`}>
                                {task.platform || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">{getCategoryLabel(task)}</td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                                <span className="grid size-7 place-items-center rounded-full bg-[var(--hc-green-50)] text-[0.625rem] font-bold text-[var(--hc-green-700)]">
                                  {getInitials(task.createdByName)}
                                </span>
                                {task.createdByName || 'Chưa có tên'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3.5">{formatDate(task.updatedAt || task.createdAt)}</td>
                            <td className="px-4 py-3.5">
                              <span className={`hc-status ${STATUS_CLASSES[task.status] || ''}`}>
                                {STATUS_LABELS[task.status] || task.status}
                              </span>
                            </td>
                            <td className="px-2 py-3.5">
                              <button
                                type="button"
                                className="hc-icon-button"
                                onClick={() => openTask(task.id)}
                                aria-label={`Mở task ${task.title}`}
                              >
                                <ChevronRight size={17} aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-[var(--hc-gray-200)] md:hidden">
                    {filteredTasks.map((task, index) => (
                      <button
                        key={task.id}
                        type="button"
                        className="group block min-h-40 w-full p-4 text-left transition-colors hover:bg-[var(--hc-orange-50)]"
                        onClick={() => openTask(task.id)}
                        aria-label={`Mở task ${task.title}`}
                      >
                        <span className="flex items-start gap-3">
                          <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${TASK_ICON_TONES[index % TASK_ICON_TONES.length]}`}>
                            <Image size={19} aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <strong className="block truncate text-sm text-[var(--hc-navy-900)] group-hover:text-[var(--hc-blue-700)]">
                              {task.title}
                            </strong>
                            <span className="mt-1 block text-xs text-[var(--hc-gray-500)]">{getCategoryLabel(task)}</span>
                          </span>
                          <ChevronRight className="mt-1 shrink-0 text-[var(--hc-gray-400)]" size={18} aria-hidden="true" />
                        </span>

                        <span className="mt-4 flex flex-wrap items-center gap-2">
                          <span className={`hc-platform ${PLATFORM_CLASSES[task.platform] || ''}`}>
                            {task.platform || '—'}
                          </span>
                          <span className={`hc-status ${STATUS_CLASSES[task.status] || ''}`}>
                            {STATUS_LABELS[task.status] || task.status}
                          </span>
                        </span>

                        <span className="mt-4 flex items-center justify-between gap-3 text-xs text-[var(--hc-gray-500)]">
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--hc-green-50)] text-[0.625rem] font-bold text-[var(--hc-green-700)]">
                              {getInitials(task.createdByName)}
                            </span>
                            <span className="truncate">{task.createdByName || 'Chưa có tên'}</span>
                          </span>
                          <span className="shrink-0">{formatDate(task.updatedAt || task.createdAt)}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  <footer className="flex min-h-14 items-center border-t border-[var(--hc-gray-200)] px-4 text-xs text-[var(--hc-gray-500)]">
                    Hiển thị {numberFormatter.format(filteredTasks.length)} trong {numberFormatter.format(projectTasks.length)} task
                  </footer>
                </>
              )}
            </section>
          </>
        )}
      </section>

      {canCreate && (
        <dialog
          ref={dialogRef}
          className="hc-dialog"
          aria-labelledby="create-task-title"
          onClose={handleDialogClose}
          onClick={(event) => {
            if (event.target === event.currentTarget) event.currentTarget.close();
          }}
        >
          <div className="hc-dialog__inner">
            <button
              type="button"
              className="hc-icon-button hc-dialog__close"
              onClick={() => dialogRef.current?.close()}
              aria-label="Đóng hộp thoại tạo task"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <span className="hc-eyebrow">Task mới</span>
            <h2 id="create-task-title">Bắt đầu một listing</h2>
            <p className="hc-dialog__intro">
              Chọn đúng nền tảng và case để team có cùng bối cảnh từ đầu.
            </p>

            <form className="hc-dialog__form" onSubmit={handleCreateTask} noValidate>
              <label className="hc-field" htmlFor="task-title">
                <span>Tên task</span>
                <input
                  id="task-title"
                  type="text"
                  className="hc-input text-base md:text-sm"
                  value={newTitle}
                  onChange={(event) => {
                    setNewTitle(event.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="Ví dụ: Summer Family Shirt"
                  maxLength={200}
                  autoFocus
                  aria-invalid={Boolean(formError)}
                  aria-describedby={formError ? 'task-form-error' : undefined}
                />
              </label>

              <label className="hc-field" htmlFor="task-platform">
                <span>Nền tảng</span>
                <select
                  id="task-platform"
                  className="hc-select text-base md:text-sm"
                  value={newPlatform}
                  onChange={(event) => setNewPlatform(event.target.value)}
                >
                  <option value="AMAZON">Amazon</option>
                  <option value="ETSY">Etsy</option>
                </select>
              </label>

              {newPlatform === 'AMAZON' && (
                <label className="hc-field" htmlFor="task-category">
                  <span>Category / Layout</span>
                  <select
                    id="task-category"
                    className="hc-select text-base md:text-sm"
                    value={newCategory}
                    onChange={(event) => setNewCategory(Number(event.target.value))}
                  >
                    <option value={1}>Case 1 — Clothing, Shoes &amp; Jewelry</option>
                    <option value={2}>Case 2 — Home &amp; Kitchen (ảnh dọc)</option>
                    <option value={3}>Case 3 — Home &amp; Kitchen (ảnh ngang)</option>
                  </select>
                </label>
              )}

              {formError && (
                <div id="task-form-error" className="hc-alert hc-alert--error" role="alert">
                  <AlertTriangle size={17} aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="hc-dialog__actions">
                <button
                  type="button"
                  className="hc-button hc-button--secondary"
                  onClick={() => dialogRef.current?.close()}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="hc-button hc-button--primary"
                  disabled={submitting || !newTitle.trim()}
                >
                  {submitting
                    ? <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                    : <Plus size={16} aria-hidden="true" />}
                  {submitting ? 'Đang tạo…' : 'Tạo task'}
                  {!submitting && <ArrowRight size={15} aria-hidden="true" />}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </SidebarLayout>
  );
};

export default TaskListPage;
