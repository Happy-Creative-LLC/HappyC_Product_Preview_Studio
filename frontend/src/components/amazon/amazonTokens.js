// Design tokens cho toàn bộ Amazon preview components.
// Màu đo trực tiếp từ giao diện live preview.
const amazonTokens = {
  // ── Measured từ live preview ──
  linkColor:      '#007185',
  linkHoverColor: '#C45500',
  swatchActiveBorder: '#2162A1',

  // ── Header ──
  headerBg:       '#131921',
  subNavBg:       '#232F3E',
  footerMidBg:    '#232F3E',
  footerBottomBg: '#131A22',
  backToTopBg:    '#37475A',
  searchBtnBg:    '#FEBD69',
  searchBtnHover: '#F3A847',

  // ── Amazon's Choice badge ──
  choiceBadgeBg:     '#232F3E',
  choiceAccentColor: '#FF9900',

  // ── Price / alerts ──
  priceColor:     '#0F1111',
  shipsColor:     '#B12704',
  couponColor:    '#cc6600',
  savingsBadgeBg: '#007600',

  // ── BuyBox CTA ──
  ctaBtnBg:     '#FFD814',
  ctaBtnHover:  '#F7CA00',
  ctaBtnActive: '#DDB100',
  ctaBtnBorder: '#FCD200',

  // ── Borders / dividers ──
  dividerColor: '#E7E7E7',
  borderLight:  '#D5D9D9',
  borderLighter:'#E7E7E7',

  // ── Muted text ──
  mutedText: '#565959',
  subText:   '#CCCCCC',

  // ── Gallery thumbnails ──
  swatchInactiveBorder:        '#D5D9D9',
  swatchActiveVideoBorder:     '#A855F7',
  swatchInactiveVideoBorder:   '#D5B8F5',
  videoPlaceholderBg:          '#F3E8FF',
  videoIconColor:              '#A855F7',

  // ── Gallery dimensions ──
  thumbSize:           55,
  mainMinHeight:       420,
  mainImageMaxHeight:  600,
  zoomScale:           2.2,

  // ── Pre-built Tailwind class strings ──
  // Đặt ở đây để Tailwind JIT scan thấy full class names và emit CSS đúng.
  cls: {
    // Thumbnails
    thumbActiveImage:   'border-[#2162A1]',
    thumbActiveVideo:   'border-[#A855F7] ring-[1.5px] ring-[#A855F7]',
    thumbInactiveImage: 'border-[#D5D9D9] hover:border-[#2162A1]',
    thumbInactiveVideo: 'border-[#D5B8F5] hover:border-[#A855F7]',
    thumbFocusRing:     'focus-visible:ring-2 focus-visible:ring-[#E77600]',
    videoIconColor:     'text-[#A855F7] fill-[#A855F7]',
    videoPlaceholderBg: 'bg-[#F3E8FF]',
    captionText:        'text-[11px] text-[#565959]',
    shareBtnBorder:     'border border-[#D5D9D9]',

    // Links
    link:       'text-[#007185] hover:text-[#C45500] hover:underline',

    // Price
    priceBlack: 'text-[#0F1111]',

    // Savings badge
    savingsBadge: 'inline-block bg-[#007600] text-white font-bold px-1.5 py-[1px] rounded-[3px] text-[11px]',

    // BuyBox CTA
    ctaBtn: 'w-full min-h-[44px] py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] active:bg-[#DDB100] border border-[#FCD200] rounded-full text-[13px] shadow-[0_1px_2px_rgba(15,17,17,0.15)] transition-colors cursor-pointer mb-2',
  },
};

export default amazonTokens;
