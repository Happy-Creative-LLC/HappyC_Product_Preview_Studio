import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Loader2,
  Lock,
  Mail,
  Pencil,
  RefreshCw,
  Unlock,
  UserPlus,
  Users,
} from 'lucide-react';
import SidebarLayout from '../components/shared/SidebarLayout';
import axiosInstance from '../api/axiosConfig';
import { useAppStore } from '../stores/appStore';

const ROLE_OPTIONS = [
  { value: 'SELLER', label: 'Seller', short: 'Seller' },
  { value: 'PRODUCT_DESIGN', label: 'Product Design', short: 'PD' },
  { value: 'MARVEL', label: 'Marvel Labs', short: 'Marvel' },
  { value: 'ADMIN', label: 'Admin', short: 'Admin' },
];

const ROLE_CLASSES = {
  ADMIN: 'bg-[var(--hc-navy-900)] text-white',
  MARVEL: 'bg-[var(--hc-purple-50)] text-[var(--hc-purple-700)]',
  SELLER: 'bg-[var(--hc-green-50)] text-[var(--hc-green-700)]',
  PRODUCT_DESIGN: 'bg-[var(--hc-red-50)] text-[var(--hc-red-700)]',
};

const STATUS_META = {
  ACTIVE: { label: 'Hoạt động', className: 'hc-status--approved' },
  PENDING: { label: 'Chờ duyệt', className: 'hc-status--pending' },
  LOCKED: { label: 'Đã khoá', className: 'hc-status--rejected' },
};

// Thứ tự tab cố định theo vận hành, không theo thứ tự tạo trong DB.
const PROJECT_TAB_ORDER = ['happy', 'creative', 'global', 'hapify84'];

// Marvel và Admin không gắn project nên mỗi vai trò là một tab riêng.
const ROLE_TAB_PREFIX = 'role:';
const ROLE_TABS = [
  { role: 'MARVEL', label: 'Marvel' },
  { role: 'ADMIN', label: 'Admin' },
];

// Tab project chỉ thêm được 2 vai trò gắn với project.
const PROJECT_ROLE_CHOICES = ['SELLER', 'PRODUCT_DESIGN'];

const getInitial = (name, email) => (name?.trim()?.[0] || email?.trim()?.[0] || '?').toUpperCase();

// Backend trả LocalDateTime không kèm offset (VD "2026-08-06T08:19:33"), trình duyệt
// sẽ hiểu là giờ máy — đúng với môi trường nội bộ cùng múi giờ.
const formatLastLogin = (value) => {
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

const isProjectRole = (role) => role === 'SELLER' || role === 'PRODUCT_DESIGN';

const getRoleLabel = (role) => ROLE_OPTIONS.find((option) => option.value === role)?.label || role;

const AdminUsersPage = () => {
  const { user, projects, fetchProjects } = useAppStore();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ email: '', fullName: '', role: 'SELLER' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    const loadUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const [{ data }] = await Promise.all([
          axiosInstance.get('/api/admin/users'),
          fetchProjects(),
        ]);
        if (isCurrent) setUsers(data);
      } catch (err) {
        if (isCurrent) {
          setError(err.response?.data?.message || 'Không thể tải danh sách nhân sự. Vui lòng thử lại.');
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadUsers();
    return () => {
      isCurrent = false;
    };
  }, [fetchProjects, reloadKey]);

  const tabs = useMemo(() => {
    const rank = (key) => {
      const index = PROJECT_TAB_ORDER.indexOf(key);
      return index === -1 ? PROJECT_TAB_ORDER.length : index;
    };

    const projectTabs = [...projects]
      .sort((a, b) => rank(a.key) - rank(b.key))
      .map((project) => ({
        key: project.key,
        label: project.name.replace(/\s*Project$/i, ''),
        count: users.filter((item) => item.projectKey === project.key).length,
      }));

    const roleTabs = ROLE_TABS.map((tab) => ({
      key: `${ROLE_TAB_PREFIX}${tab.role}`,
      label: tab.label,
      count: users.filter((item) => item.role === tab.role).length,
    }));

    return [...projectTabs, ...roleTabs];
  }, [projects, users]);

  const currentTab = activeTab ?? tabs[0]?.key ?? null;

  // Tab đang mở quyết định luôn vai trò/project của nhân sự được thêm.
  const tabRole = currentTab?.startsWith(ROLE_TAB_PREFIX)
    ? currentTab.slice(ROLE_TAB_PREFIX.length)
    : null;
  const tabProjectKey = tabRole ? null : currentTab;
  const tabProject = projects.find((project) => project.key === tabProjectKey);
  const roleChoices = tabRole ? [tabRole] : PROJECT_ROLE_CHOICES;
  const groupLabel = tabRole ? getRoleLabel(tabRole) : (tabProject?.name || 'project này');

  const visibleUsers = (() => {
    if (!currentTab) return [];
    if (tabRole) return users.filter((item) => item.role === tabRole);
    return users.filter((item) => item.projectKey === currentTab);
  })();

  const openCreateForm = () => {
    setEditingUser(null);
    setForm({ email: '', fullName: '', role: roleChoices[0] });
    setFormError('');
    setFormOpen(true);
  };

  const openEditForm = (target) => {
    setEditingUser(target);
    setForm({
      email: target.email,
      fullName: target.fullName || '',
      role: target.role,
    });
    setFormError('');
    setFormOpen(true);
  };

  // Form không gửi `status`: backend giữ nguyên trạng thái cũ khi sửa,
  // và mặc định ACTIVE khi tạo mới.
  const persistUser = async (body, target) => {
    const { data } = target
      ? await axiosInstance.put(`/api/admin/users/${target.id}`, body)
      : await axiosInstance.post('/api/admin/users', body);

    setUsers((prev) => (
      target
        ? prev.map((item) => (item.id === data.id ? data : item))
        : [...prev, data]
    ));
    return data;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await persistUser({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        role: form.role,
        projectKey: isProjectRole(form.role)
          ? (editingUser?.projectKey || tabProjectKey)
          : null,
      }, editingUser);
      setFormOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Không lưu được nhân sự. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const toggleLock = async (target) => {
    setError('');
    try {
      await persistUser({
        email: target.email,
        fullName: target.fullName,
        role: target.role,
        projectKey: target.projectKey,
        status: target.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED',
      }, target);
    } catch (err) {
      setError(err.response?.data?.message || 'Không đổi được trạng thái nhân sự.');
    }
  };

  return (
    <SidebarLayout breadcrumbs={[{ label: 'Quản lý nhân sự' }]}>
      <section className="hc-page" aria-labelledby="admin-users-title">
        <header className="hc-page-heading">
          <div>
            <h1 id="admin-users-title">Quản lý nhân sự</h1>
          </div>
          <button type="button" className="hc-button hc-button--primary" onClick={openCreateForm}>
            <UserPlus size={16} aria-hidden="true" />
            Thêm nhân sự
          </button>
        </header>

        {error && (
          <div className="hc-alert hc-alert--error mb-5" role="alert">
            <AlertTriangle size={18} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <strong className="block">Có lỗi xảy ra</strong>
              <span>{error}</span>
            </div>
            <button
              type="button"
              className="hc-button hc-button--secondary min-h-11 shrink-0"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              <RefreshCw size={15} aria-hidden="true" />
              Tải lại
            </button>
          </div>
        )}

        {loading ? (
          <div className="hc-loading-page" role="status" aria-live="polite">
            <Loader2 className="animate-spin" size={30} aria-hidden="true" />
            <span>Đang tải danh sách nhân sự…</span>
          </div>
        ) : (
          <>
            <div className="hc-chip-list mb-5" role="tablist" aria-label="Lọc nhân sự theo nhóm">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-pressed={currentTab === tab.key}
                  aria-selected={currentTab === tab.key}
                  className="hc-chip gap-2"
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  <span className="rounded-full bg-[var(--hc-gray-100)] px-1.5 py-0.5 text-[0.625rem] tabular-nums text-[var(--hc-gray-600)]">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="hc-card overflow-hidden">
              {visibleUsers.length === 0 ? (
                <div className="hc-empty-state">
                  <Users size={38} aria-hidden="true" />
                  <strong>Chưa có nhân sự trong nhóm này</strong>
                  <p>Nhấn “Thêm nhân sự” để thêm email Gmail cho thành viên đầu tiên của {groupLabel}.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* 6 cột nên nới min-width, wrapper overflow-x-auto lo phần cuộn ngang */}
                  <table className="w-full min-w-[58rem] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[var(--hc-gray-200)] text-left text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--hc-gray-500)]">
                        <th className="px-5 py-3">Tên nhân sự</th>
                        <th className="px-5 py-3">Gmail</th>
                        <th className="px-5 py-3">Role</th>
                        <th className="px-5 py-3">Trạng thái</th>
                        <th className="px-5 py-3">Lần cuối login</th>
                        <th className="px-5 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleUsers.map((item) => {
                        const statusMeta = STATUS_META[item.status] || STATUS_META.PENDING;
                        const roleMeta = ROLE_OPTIONS.find((option) => option.value === item.role);
                        const isSelf = item.id === user?.userId;

                        return (
                          <tr key={item.id} className="border-b border-[var(--hc-gray-100)] last:border-0">
                            <td className="px-5 py-3.5">
                              <span className="flex items-center gap-2">
                                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--hc-orange-50)] text-[0.6875rem] font-bold text-[var(--hc-orange-600)]">
                                  {getInitial(item.fullName, item.email)}
                                </span>
                                <span className="font-semibold text-[var(--hc-navy-900)]">
                                  {item.fullName || '—'}
                                </span>
                                {isSelf && (
                                  <span className="text-[0.625rem] text-[var(--hc-gray-400)]">(bạn)</span>
                                )}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="flex items-center gap-2 font-mono text-xs text-[var(--hc-gray-600)]">
                                <Mail size={14} className="shrink-0 text-[var(--hc-gray-400)]" aria-hidden="true" />
                                {item.email}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.6875rem] font-bold ${ROLE_CLASSES[item.role] || 'bg-[var(--hc-gray-100)]'}`}>
                                {roleMeta?.short || item.role}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`hc-status ${statusMeta.className}`}>{statusMeta.label}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              {item.lastLoginAt ? (
                                <span className="flex items-center gap-2 text-xs text-[var(--hc-gray-600)]">
                                  <Clock size={14} className="shrink-0 text-[var(--hc-gray-400)]" aria-hidden="true" />
                                  <span className="tabular-nums">{formatLastLogin(item.lastLoginAt)}</span>
                                </span>
                              ) : (
                                <span className="text-xs text-[var(--hc-gray-400)]">Chưa đăng nhập</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  className="hc-button hc-button--secondary min-h-9 px-3 text-xs"
                                  onClick={() => openEditForm(item)}
                                >
                                  <Pencil size={13} aria-hidden="true" />
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  className="hc-button hc-button--danger min-h-9 px-3 text-xs disabled:opacity-40"
                                  onClick={() => toggleLock(item)}
                                  disabled={isSelf}
                                  title={isSelf ? 'Không thể tự khoá tài khoản của mình' : undefined}
                                >
                                  {item.status === 'LOCKED' ? <Unlock size={13} aria-hidden="true" /> : <Lock size={13} aria-hidden="true" />}
                                  {item.status === 'LOCKED' ? 'Mở khoá' : 'Khoá'}
                                </button>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-form-title"
            className="hc-card w-full max-w-lg p-5 sm:p-6"
          >
            <h2 id="staff-form-title" className="m-0 text-lg font-bold tracking-tight text-[var(--hc-navy-900)]">
              {editingUser ? 'Sửa thông tin nhân sự' : `Thêm nhân sự — ${groupLabel}`}
            </h2>
            <p className="mt-1 text-xs text-[var(--hc-gray-500)]">
              Nhân sự sẽ đăng nhập bằng chính email Gmail này sau khi Google Login được bật.
            </p>

            <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
              <label className="hc-field">
                <span>Email Gmail</span>
                <input
                  className="hc-input"
                  type="email"
                  required
                  autoFocus
                  placeholder="ten.nhansu@gmail.com"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </label>

              <label className="hc-field">
                <span>Tên nhân sự</span>
                <input
                  className="hc-input"
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                />
              </label>

              {roleChoices.length > 1 ? (
                <label className="hc-field">
                  <span>Vai trò</span>
                  <select
                    className="hc-select"
                    value={form.role}
                    onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                  >
                    {roleChoices.map((role) => (
                      <option key={role} value={role}>{getRoleLabel(role)}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="hc-field">
                  <span>Vai trò</span>
                  <span className={`inline-flex w-max rounded-full px-3 py-1.5 text-xs font-bold ${ROLE_CLASSES[form.role] || 'bg-[var(--hc-gray-100)]'}`}>
                    {getRoleLabel(form.role)}
                  </span>
                </div>
              )}

              {formError && (
                <div className="hc-alert hc-alert--error" role="alert">
                  <AlertTriangle size={17} aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  className="hc-button hc-button--secondary"
                  onClick={() => setFormOpen(false)}
                  disabled={saving}
                >
                  Huỷ
                </button>
                <button type="submit" className="hc-button hc-button--primary" disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <UserPlus size={16} aria-hidden="true" />}
                  {editingUser ? 'Lưu thay đổi' : 'Thêm nhân sự'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};

export default AdminUsersPage;
