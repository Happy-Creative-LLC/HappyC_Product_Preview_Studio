import { useEffect, useState } from 'react';
import { Search, ShoppingCart, MapPin, Menu, ChevronDown, Globe2, Loader2 } from 'lucide-react';
import AmazonLogo from '../AmazonLogo';
import { getAmazonCategoryNavigation, getAmazonSeasonalNavigation } from '../seasonalNavigation';

/* Seasonal and department navigation modeled for the internal preview. */
const HeaderDesktop = ({
  caseType = 1,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchLoading = false,
  searchPlaceholder = 'Search Amazon',
  previewDate,
}) => {
  const [today, setToday] = useState(() => new Date());
  const queryPreviewDate = new URLSearchParams(window.location.search).get('previewDate');
  const selectedPreviewDate = previewDate || queryPreviewDate;
  const parsedPreviewDate = selectedPreviewDate ? new Date(`${selectedPreviewDate}T12:00:00`) : null;
  const seasonalDate = parsedPreviewDate && !Number.isNaN(parsedPreviewDate.getTime()) ? parsedPreviewDate : today;

  useEffect(() => {
    if (selectedPreviewDate) return undefined;

    const now = new Date();
    const untilNextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime() + 50;
    const timer = window.setTimeout(() => setToday(new Date()), untilNextDay);
    return () => window.clearTimeout(timer);
  }, [selectedPreviewDate]);

  const { campaign, items: navItems } = getAmazonSeasonalNavigation(seasonalDate);
  const categoryNavigation = getAmazonCategoryNavigation(caseType);
  const controlledSearchProps = onSearchChange
    ? { value: searchValue ?? '', onChange: onSearchChange }
    : {};

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    onSearchSubmit?.();
  };

  return (
    <header className="w-full sticky top-0 z-30 shadow-md">
      {/* Top Bar */}
      <div className="bg-[#131921] text-white flex items-center px-3 gap-1 h-[60px]">
        {/* Logo */}
        <div className="shrink-0 border border-transparent hover:border-white rounded-xs p-1 cursor-pointer">
          <AmazonLogo className="h-[30px] w-auto" />
        </div>

        {/* Deliver to */}
        <div className="flex flex-col ml-1 border border-transparent hover:border-white rounded-xs px-1 py-0.5 cursor-pointer shrink-0">
          <span className="text-[11px] text-[#CCCCCC] leading-none ml-4">Deliver to</span>
          <span className="text-[13px] font-bold leading-tight flex items-center gap-0.5">
            <MapPin size={13} className="text-white" /> New York 10001
          </span>
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="mx-2 flex h-[42px] flex-1 items-center overflow-hidden rounded-sm bg-white focus-within:ring-2 focus-within:ring-[#ff9900] focus-within:ring-offset-2 focus-within:ring-offset-[#131921]"
          role="search"
        >
          <select
            className="h-full bg-[#F3F3F3] border-r border-[#CDCDCD] text-[#111] text-xs px-2 outline-hidden cursor-pointer"
            style={{ minWidth: 52, maxWidth: 56 }}
            aria-label="Danh mục Amazon"
          >
            <option>All</option>
            <option>Clothing</option>
            <option>Home &amp; Kitchen</option>
          </select>
          <input
            type="text"
            placeholder={searchPlaceholder}
            aria-label="Từ khoá tìm kiếm Amazon"
            className="h-full min-w-0 flex-1 px-3 text-base text-[#111] outline-hidden"
            {...controlledSearchProps}
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="flex h-full w-12 shrink-0 items-center justify-center bg-[#FF9900] transition-colors hover:bg-[#E47911] disabled:cursor-wait disabled:bg-[#f3a847]"
            aria-label={searchLoading ? 'Đang tìm kiếm Amazon' : 'Tìm kiếm Amazon'}
          >
            {searchLoading
              ? <Loader2 size={20} className="animate-spin text-[#111]" aria-hidden="true" />
              : <Search size={20} className="text-[#111]" aria-hidden="true" />}
          </button>
        </form>

        {/* Language */}
        <div className="hidden xl:flex items-center gap-0.5 border border-transparent hover:border-white rounded-xs px-1.5 py-1 cursor-pointer shrink-0 select-none">
          <Globe2 size={15} aria-hidden="true" />
          <span className="font-bold text-[13px] ml-0.5">EN</span>
          <ChevronDown size={11} className="text-[#CCCCCC]" />
        </div>

        {/* Account & Lists */}
        <div className="hidden lg:flex flex-col border border-transparent hover:border-white rounded-xs px-1.5 py-0.5 cursor-pointer shrink-0 select-none">
          <span className="text-[11px] text-[#CCCCCC] leading-none">Hello, sign in</span>
          <span className="text-[13px] font-bold leading-tight flex items-center gap-0.5">
            Account &amp; Lists <ChevronDown size={11} />
          </span>
        </div>

        {/* Returns & Orders */}
        <div className="hidden lg:flex flex-col border border-transparent hover:border-white rounded-xs px-1.5 py-0.5 cursor-pointer shrink-0 select-none">
          <span className="text-[11px] text-[#CCCCCC] leading-none">Returns</span>
          <span className="text-[13px] font-bold leading-tight">&amp; Orders</span>
        </div>

        {/* Cart */}
        <div className="flex items-end border border-transparent hover:border-white rounded-xs px-1 cursor-pointer shrink-0 select-none">
          <div className="relative">
            <ShoppingCart size={34} />
            <span className="absolute -top-1 left-[14px] text-[#FF9900] font-bold text-[14px] leading-none">0</span>
          </div>
          <span className="font-bold text-[13px] mb-0.5 ml-0.5">Cart</span>
        </div>
      </div>

      {/* Sub Nav */}
      <div
        className="bg-[#232F3E] text-white text-[13px] px-2 h-[38px] flex items-center overflow-x-auto whitespace-nowrap gap-0"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex items-center font-bold cursor-pointer border border-transparent hover:border-white rounded-xs px-2 py-1 shrink-0 gap-1">
          <Menu size={18} /> All
        </div>
        {navItems.map(item => (
          <span
            key={item.label}
            className="cursor-pointer border border-transparent hover:border-white rounded-xs px-2 py-1 shrink-0 flex items-center gap-0.5"
          >
            {item.label}
            {item.hasChevron && <ChevronDown size={11} className="text-[#CCCCCC] ml-0.5" />}
          </span>
        ))}
        {campaign.announcement && (
          <span className="ml-auto shrink-0 px-3 text-[12px] font-bold">
            {campaign.announcement}
          </span>
        )}
      </div>

      {/* Category sub-nav mirrors the selected Amazon department. */}
      <div
        className="bg-white border-b border-gray-200 px-4 h-[36px] flex items-center shadow-xs overflow-x-auto gap-0"
        style={{ scrollbarWidth: 'none' }}
      >
        <span className="font-bold text-[15px] text-gray-900 whitespace-nowrap mr-6 shrink-0">
          {categoryNavigation.title}
        </span>
        <div className="flex flex-1 items-center justify-between gap-6">
          {categoryNavigation.categories.map((category) => (
            <span
              key={category}
              className="cursor-pointer hover:underline hover:text-orange-500 whitespace-nowrap text-[13px] text-gray-700"
            >
              {category}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
};

export default HeaderDesktop;
