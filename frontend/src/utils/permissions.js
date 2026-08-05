export const ROLE_LABELS = {
  ADMIN: 'Admin',
  MARVEL: 'Marvel Labs',
  SELLER: 'Seller',
  PRODUCT_DESIGN: 'Product Design',
};

const TASK_MANAGERS = new Set(['ADMIN', 'SELLER']);
const SEARCH_USERS = new Set(['ADMIN', 'SELLER']);

// Seller và Product Design luôn gắn với đúng 1 project (backend bắt buộc projectKey),
// nên bỏ hẳn bước chọn project trong điều hướng của họ.
const SINGLE_PROJECT_ROLES = new Set(['SELLER', 'PRODUCT_DESIGN']);

export const isSingleProjectRole = (role) => SINGLE_PROJECT_ROLES.has(role);

export const canCreateTask = (role) => TASK_MANAGERS.has(role);
export const canSubmitTaskReview = (role) => TASK_MANAGERS.has(role);
export const canUseAmazonSearch = (role) => SEARCH_USERS.has(role);

export const canEditZone = (role, ownerRole) => role === 'ADMIN' || role === ownerRole;

export const getRoleLabel = (role) => ROLE_LABELS[role] || role || 'Thành viên';
