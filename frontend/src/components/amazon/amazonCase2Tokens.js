// Design tokens cho Case 2 (Home & Kitchen — gallery thumbnail dọc + zoom lens).
// Đo trực tiếp từ trang Amazon thật. Tái dùng amazonTokens (Case 1) cho mọi
// giá trị đã có sẵn ở đó — KHÔNG định nghĩa lại (tránh trùng lặp giá trị).
import amazonTokens from './amazonTokens';

const amazonCase2Tokens = {
  // ── Tái dùng từ Case 1 (không định nghĩa lại) ──
  swatchActiveBorder: amazonTokens.swatchActiveBorder, // #2162A1
  mutedText:          amazonTokens.mutedText,          // #565959

  // ── ZoomLens (đo) ──
  // Magnification mặc định 2× như hành vi zoom trên Amazon.
  zoomLens: {
    lensWidth:     240,
    lensHeight:    240,
    panelWidth:    720,
    panelHeight:   540,
    panelGap:      56,   // panel lớn, cách ảnh một khoảng như Amazon thật
    magnification: 2,
  },

  // ── Rail thumbnail dọc (đo) ──
  thumbRail: {
    containerWidth: 40,
    buttonSize:     42,  // ô bấm 42×42
    imageSize:      40,  // ảnh 40×40
    gapBottom:      8,   // marginBottom giữa các ô — KHÔNG dùng CSS gap
    buttonRadius:   12,
    imageRadius:    11,
    borderIdle:     '#888C8C',
    borderSelected: amazonTokens.swatchActiveBorder, // #2162A1 — tái dùng
  },

  // ── Ô video (đo) ──
  videoSlot: {
    height:          60,
    labelFontSize:   9,
    labelFontWeight: 700,
    labelColor:      amazonTokens.mutedText, // #565959 — tái dùng
  },

  // ── Badge "+N" (ảnh ẩn) (đo) ──
  moreBadge: {
    size:      40,
    bg:        'rgba(0,0,0,0.667)',
    textSize:  14,
    textColor: '#FFFFFF',
  },
};

export default amazonCase2Tokens;
