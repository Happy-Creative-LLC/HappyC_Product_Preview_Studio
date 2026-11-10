import { describe, expect, it } from 'vitest';
import { getAmazonCategoryNavigation, getAmazonSeasonalNavigation } from './seasonalNavigation';

describe('Amazon seasonal navigation', () => {
  it('shows the observed Black Friday announcement for November 2026', () => {
    const { campaign, items } = getAmazonSeasonalNavigation(new Date(2026, 10, 10));

    expect(campaign.label).toBe('Holiday Gifts');
    expect(campaign.announcement).toBe('Black Friday deals start Nov 19');
    expect(items[0].label).toBe('Holiday Gifts');
  });

  it('uses a summer campaign and keeps evergreen links outside holiday periods', () => {
    const { campaign, items } = getAmazonSeasonalNavigation(new Date(2026, 6, 15));

    expect(campaign.label).toBe('Prime Day');
    expect(campaign.announcement).toBeNull();
    expect(items).toContainEqual({ label: "Today's Deals" });
  });

  it('selects the category strip for the Amazon preview case', () => {
    expect(getAmazonCategoryNavigation(1).title).toBe('Amazon Fashion');
    expect(getAmazonCategoryNavigation(2).categories).toContain('Kitchen & Dining');
  });
});
