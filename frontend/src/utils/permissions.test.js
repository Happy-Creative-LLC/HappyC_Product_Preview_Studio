import { describe, expect, it } from 'vitest';
import {
  canCreateTask,
  canEditZone,
  canSubmitTaskReview,
  canUseAmazonSearch,
  getRoleLabel,
  isSingleProjectRole,
} from './permissions';

const ROLES = ['ADMIN', 'MARVEL', 'SELLER', 'PRODUCT_DESIGN'];

describe('permissions', () => {
  it('only Admin and Seller create tasks, submit for review and use Amazon Search', () => {
    const allowed = ROLES.filter((role) => canCreateTask(role));

    expect(allowed).toEqual(['ADMIN', 'SELLER']);
    expect(ROLES.filter((role) => canSubmitTaskReview(role))).toEqual(allowed);
    expect(ROLES.filter((role) => canUseAmazonSearch(role))).toEqual(allowed);
  });

  it('each zone is editable by its owner and by Admin only', () => {
    expect(ROLES.filter((role) => canEditZone(role, 'SELLER'))).toEqual(['ADMIN', 'SELLER']);
    expect(ROLES.filter((role) => canEditZone(role, 'PRODUCT_DESIGN'))).toEqual(['ADMIN', 'PRODUCT_DESIGN']);
    expect(ROLES.filter((role) => canEditZone(role, 'MARVEL'))).toEqual(['ADMIN', 'MARVEL']);
  });

  it('Seller and Product Design belong to a single project', () => {
    expect(ROLES.filter((role) => isSingleProjectRole(role))).toEqual(['SELLER', 'PRODUCT_DESIGN']);
  });

  it('matches roles by the exact uppercase string the backend returns', () => {
    expect(canCreateTask('Seller')).toBe(false);
    expect(canCreateTask(undefined)).toBe(false);
    expect(canEditZone(undefined, 'SELLER')).toBe(false);
  });

  it('labels roles for display and falls back for unknown values', () => {
    expect(getRoleLabel('MARVEL')).toBe('Marvel Labs');
    expect(getRoleLabel('PRODUCT_DESIGN')).toBe('Product Design');
    expect(getRoleLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW');
    expect(getRoleLabel(null)).toBe('Thành viên');
  });
});
