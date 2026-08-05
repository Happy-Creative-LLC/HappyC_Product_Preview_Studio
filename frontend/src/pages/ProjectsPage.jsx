import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Clock3,
  FolderKanban,
  ListTodo,
  Loader2,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';
import SidebarLayout from '../components/shared/SidebarLayout';
import { useAppStore } from '../stores/appStore';
import { isSingleProjectRole } from '../utils/permissions';

const PROJECT_THEMES = [
  {
    accent: 'border-t-[var(--hc-orange-500)]',
    symbol: 'bg-[var(--hc-orange-50)] text-[var(--hc-orange-600)]',
  },
  {
    accent: 'border-t-[var(--hc-purple-500)]',
    symbol: 'bg-[var(--hc-purple-50)] text-[var(--hc-purple-700)]',
  },
  {
    accent: 'border-t-[var(--hc-green-500)]',
    symbol: 'bg-[var(--hc-green-50)] text-[var(--hc-green-700)]',
  },
  {
    accent: 'border-t-[var(--hc-blue-500)]',
    symbol: 'bg-[var(--hc-blue-50)] text-[var(--hc-blue-700)]',
  },
];

const PROJECT_THEME_BY_KEY = {
  happy: PROJECT_THEMES[0],
  creative: PROJECT_THEMES[1],
  hapify84: PROJECT_THEMES[2],
  global: PROJECT_THEMES[3],
};

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

const SUMMARY_ITEMS = [
  {
    key: 'total',
    label: 'Tổng số task',
    helper: 'Trong các project bạn được truy cập',
    icon: ListTodo,
    tone: 'bg-[var(--hc-orange-50)] text-[var(--hc-orange-600)]',
  },
  {
    key: 'pending',
    label: 'Chờ upload',
    helper: 'Cần bổ sung nội dung listing',
    icon: UploadCloud,
    tone: 'bg-[var(--hc-orange-50)] text-[var(--hc-orange-600)]',
  },
  {
    key: 'review',
    label: 'Đang review',
    helper: 'Đang chờ team kiểm tra',
    icon: Clock3,
    tone: 'bg-[var(--hc-blue-50)] text-[var(--hc-blue-700)]',
  },
  {
    key: 'approved',
    label: 'Đã duyệt',
    helper: 'Listing đã hoàn tất review',
    icon: BadgeCheck,
    tone: 'bg-[var(--hc-green-50)] text-[var(--hc-green-700)]',
  },
];

const numberFormatter = new Intl.NumberFormat('vi-VN');
const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const getInitials = (name) => {
  if (!name?.trim()) return '?';
  const words = name.trim().split(/\s+/);
  return words.length === 1
    ? words[0].slice(0, 2).toLocaleUpperCase('vi-VN')
    : `${words[0][0]}${words.at(-1)[0]}`.toLocaleUpperCase('vi-VN');
};

const getDisplayName = (user) => {
  const fullName = user?.fullName?.trim() || user?.username?.trim();
  return fullName ? fullName.split(/\s+/).at(-1) : 'bạn';
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

const getProjectSymbol = (project) => {
  const source = project.key || project.name;
  return source?.trim().slice(0, 2).toLocaleUpperCase('vi-VN') || 'PR';
};

const getTaskTime = (task) => {
  const value = task.updatedAt || task.createdAt;
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { user, projects, tasks, fetchProjects, fetchTasks } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [failedProjectIds, setFailedProjectIds] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
      return undefined;
    }

    let isCurrent = true;
    let redirecting = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      setFailedProjectIds([]);

      try {
        const projectData = await fetchProjects();

        // Seller / Product Design chỉ có đúng 1 project — vào thẳng danh sách task,
        // không bắt bấm qua bước chọn project.
        if (isSingleProjectRole(user.role) && projectData.length === 1) {
          if (isCurrent) {
            redirecting = true;
            navigate(`/projects/${projectData[0].id}/tasks`, { replace: true });
          }
          return;
        }

        const taskResults = await Promise.allSettled(
          projectData.map((project) => fetchTasks(project.id))
        );

        if (!isCurrent) return;

        const failedIds = taskResults.flatMap((result, index) =>
          result.status === 'rejected' ? [projectData[index].id] : []
        );
        setFailedProjectIds(failedIds);

        if (failedIds.length > 0) {
          setError(
            `Không thể tải task của ${failedIds.length} project. Các số liệu bên dưới có thể chưa đầy đủ.`
          );
        }
      } catch {
        if (isCurrent) {
          setError('Không thể tải danh sách project. Vui lòng kiểm tra kết nối và thử lại.');
        }
      } finally {
        // Giữ spinner khi đang chuyển trang để không loé danh sách project 1 nhịp.
        if (isCurrent && !redirecting) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      isCurrent = false;
    };
  }, [fetchProjects, fetchTasks, navigate, reloadKey, user]);

  const allTasks = useMemo(
    () => projects.flatMap((project) =>
      (tasks[project.id] || []).map((task) => ({
        ...task,
        projectId: task.projectId || project.id,
        projectName: task.projectName || project.name,
      }))
    ),
    [projects, tasks]
  );

  const summary = useMemo(() => allTasks.reduce(
    (counts, task) => {
      counts.total += 1;
      if (task.status === 'PENDING_UPLOADS') counts.pending += 1;
      if (task.status === 'IN_REVIEW') counts.review += 1;
      if (task.status === 'APPROVED') counts.approved += 1;
      return counts;
    },
    { total: 0, pending: 0, review: 0, approved: 0 }
  ), [allTasks]);

  const recentTasks = useMemo(
    () => [...allTasks].sort((a, b) => getTaskTime(b) - getTaskTime(a)).slice(0, 5),
    [allTasks]
  );

  if (!user) return null;

  const todayLabel = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date()).toLocaleUpperCase('vi-VN');

  return (
    <SidebarLayout>
      <section className="hc-page" aria-labelledby="projects-title">
        <header className="hc-page-heading">
          <div>
            <span className="hc-eyebrow">{todayLabel}</span>
            <h1 id="projects-title">{getGreeting()}, {getDisplayName(user)}.</h1>
            <p>Đây là tình hình listing của các project bạn được truy cập hôm nay.</p>
          </div>
        </header>

        {loading ? (
          <div className="hc-loading-page" role="status" aria-live="polite">
            <Loader2 className="animate-spin" size={30} aria-hidden="true" />
            <span>Đang tổng hợp dữ liệu project và task…</span>
          </div>
        ) : (
          <>
            {error && (
              <div className="hc-alert hc-alert--error mb-5" role="alert">
                <AlertTriangle size={18} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <strong className="block">Dữ liệu chưa tải đầy đủ</strong>
                  <span>{error}</span>
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

            {projects.length === 0 ? (
              <div className="hc-card hc-empty-state">
                <FolderKanban size={38} aria-hidden="true" />
                <strong>Chưa có project để hiển thị</strong>
                <p>Bạn chưa được phân vào project nào hoặc project hiện không hoạt động.</p>
              </div>
            ) : (
              <>
                <section
                  className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
                  aria-label="Tổng quan task"
                >
                  {SUMMARY_ITEMS.map(({ key, label, helper, icon: Icon, tone }) => (
                    <article key={key} className="hc-card flex min-h-28 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`}>
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-[var(--hc-gray-500)]">{label}</span>
                        <strong className="mt-0.5 block text-2xl font-bold tabular-nums tracking-tight text-[var(--hc-navy-900)]">
                          {numberFormatter.format(summary[key])}
                        </strong>
                        <span className="mt-0.5 hidden text-[0.6875rem] text-[var(--hc-gray-500)] sm:block">{helper}</span>
                      </div>
                    </article>
                  ))}
                </section>

                <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
                  <section className="hc-card p-4 sm:p-6" aria-labelledby="project-list-title">
                    <div className="mb-5">
                      <h2 id="project-list-title" className="m-0 text-lg font-bold tracking-tight text-[var(--hc-navy-900)]">
                        Projects
                      </h2>
                      <p className="mt-1 text-xs text-[var(--hc-gray-500)]">
                        Chọn project để xem task và tiến độ listing.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {projects.map((project, index) => {
                        const theme = PROJECT_THEME_BY_KEY[project.key] || PROJECT_THEMES[index % PROJECT_THEMES.length];
                        const projectTasks = tasks[project.id] || [];
                        const taskDataFailed = failedProjectIds.includes(project.id);
                        const pendingCount = taskDataFailed
                          ? Number(project.pendingTaskCount || 0)
                          : projectTasks.filter((task) => task.status === 'PENDING_UPLOADS').length;
                        const reviewCount = projectTasks.filter((task) => task.status === 'IN_REVIEW').length;

                        return (
                          <button
                            key={project.id}
                            type="button"
                            className={`hc-card group min-h-52 border-t-4 p-5 text-left transition duration-150 hover:-translate-y-0.5 hover:shadow-[var(--hc-shadow-sm)] ${theme.accent}`}
                            onClick={() => navigate(`/projects/${project.id}/tasks`)}
                            aria-label={`Mở danh sách task của ${project.name}`}
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span className={`grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold ${theme.symbol}`}>
                                {getProjectSymbol(project)}
                              </span>
                              <span className={`hc-status ${project.active ? 'hc-status--approved' : 'hc-status--rejected'}`}>
                                {project.active ? 'Đang hoạt động' : 'Tạm dừng'}
                              </span>
                            </span>

                            <strong className="mt-5 block text-base font-bold tracking-tight text-[var(--hc-navy-900)] group-hover:text-[var(--hc-blue-700)]">
                              {project.name}
                            </strong>
                            <span className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-[var(--hc-gray-500)]">
                              {project.description || 'Project chưa có mô tả.'}
                            </span>

                            <span className="mt-5 flex items-center gap-2 border-t border-[var(--hc-gray-200)] pt-4 text-[0.6875rem] text-[var(--hc-gray-500)]">
                              <span>{taskDataFailed ? 'Chưa tải đủ task' : `${numberFormatter.format(projectTasks.length)} task`}</span>
                              <span aria-hidden="true">·</span>
                              <span>{numberFormatter.format(pendingCount)} chờ upload</span>
                              {!taskDataFailed && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{numberFormatter.format(reviewCount)} đang review</span>
                                </>
                              )}
                              <ArrowRight className="ml-auto shrink-0 transition-transform group-hover:translate-x-0.5" size={16} aria-hidden="true" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <aside className="hc-card p-4 sm:p-5" aria-labelledby="recent-tasks-title">
                    <div className="mb-3">
                      <h2 id="recent-tasks-title" className="m-0 text-base font-bold tracking-tight text-[var(--hc-navy-900)]">
                        Task cập nhật gần đây
                      </h2>
                      <p className="mt-1 text-xs text-[var(--hc-gray-500)]">Dựa trên thời gian cập nhật từ hệ thống.</p>
                    </div>

                    {recentTasks.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[var(--hc-gray-500)]">
                        Chưa có task nào trong các project này.
                      </div>
                    ) : (
                      <div className="divide-y divide-[var(--hc-gray-200)]">
                        {recentTasks.map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            className="group flex min-h-20 w-full items-start gap-3 py-3 text-left"
                            onClick={() => navigate(`/projects/${task.projectId}/tasks/${task.id}`)}
                            aria-label={`Mở task ${task.title}`}
                          >
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--hc-green-50)] text-[0.6875rem] font-bold text-[var(--hc-green-700)]">
                              {getInitials(task.createdByName)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <strong className="block truncate text-xs text-[var(--hc-navy-900)] group-hover:text-[var(--hc-blue-700)]">
                                {task.title}
                              </strong>
                              <span className="mt-1 block truncate text-[0.6875rem] text-[var(--hc-gray-500)]">
                                {task.projectName}
                              </span>
                              <span className="mt-2 flex flex-wrap items-center gap-1.5">
                                <span className={`hc-platform ${PLATFORM_CLASSES[task.platform] || ''}`}>
                                  {task.platform || '—'}
                                </span>
                                <span className={`hc-status ${STATUS_CLASSES[task.status] || ''}`}>
                                  {STATUS_LABELS[task.status] || task.status}
                                </span>
                              </span>
                              <span className="mt-2 block text-[0.625rem] text-[var(--hc-gray-400)]">
                                {getTaskTime(task) ? dateFormatter.format(getTaskTime(task)) : 'Chưa có ngày cập nhật'}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </aside>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </SidebarLayout>
  );
};

export default ProjectsPage;
