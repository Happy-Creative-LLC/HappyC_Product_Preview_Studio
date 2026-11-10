const EVERGREEN_ITEMS = [
  { label: 'Best Sellers' },
  { label: "Today's Deals" },
  { label: 'New Releases' },
  { label: 'Prime', hasChevron: true },
  { label: 'Custom Products', hasChevron: true },
  { label: 'Toys & Games', hasChevron: true },
  { label: 'Home Improvement', hasChevron: true },
  { label: 'Pet Supplies' },
  { label: 'Gift Cards' },
  { label: 'Medical Care', hasChevron: true },
  { label: 'Amazon Home' },
  { label: 'Groceries' },
  { label: 'Whole Foods' },
  { label: 'Coupons' },
  { label: 'Pharmacy' },
  { label: 'Audible' },
];

const getLastFridayOfNovember = (year) => {
  const lastDay = new Date(year, 11, 0);
  const daysSinceFriday = (lastDay.getDay() + 2) % 7;
  return new Date(year, 10, lastDay.getDate() - daysSinceFriday);
};

const formatMonthDay = (date) => date.toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
});

export const getAmazonSeasonalNavigation = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  let campaign = { label: null, announcement: null };

  if (month === 1 && date.getDate() <= 14) {
    campaign.label = "Valentine's Day Gifts";
  } else if (month === 4) {
    campaign.label = "Mother's Day Gifts";
  } else if (month === 5) {
    campaign.label = "Father's Day Gifts";
  } else if (month === 6) {
    campaign.label = 'Prime Day';
  } else if (month === 7 || (month === 8 && date.getDate() <= 15)) {
    campaign.label = 'Back to School';
  } else if (month === 9) {
    campaign.label = 'Halloween';
  } else if (month === 10 || (month === 11 && date.getDate() <= 25)) {
    const blackFriday = getLastFridayOfNovember(year);
    const saleStart = new Date(blackFriday);
    saleStart.setDate(saleStart.getDate() - 8);

    campaign.label = 'Holiday Gifts';
    campaign.announcement = date < saleStart
      ? `Black Friday deals start ${formatMonthDay(saleStart)}`
      : 'Black Friday deals are here';
  }

  return {
    campaign,
    items: [
      ...(campaign.label ? [{ label: campaign.label }] : []),
      ...EVERGREEN_ITEMS,
    ],
  };
};

export const getAmazonCategoryNavigation = (caseType) => (
  Number(caseType) === 1
    ? {
      title: 'Amazon Fashion',
      categories: [
        'Women', 'Men', 'Kids', 'Luggage', 'Sales & Deals',
        'New Arrivals', 'Amazon Brands', 'Amazon Luxury',
      ],
    }
    : {
      title: 'Amazon Home',
      categories: [
        'Shop by Room', 'Shop by Style', 'Home Décor', 'Furniture',
        'Kitchen & Dining', 'Bed & Bath', 'Home Improvement',
      ],
    }
);
