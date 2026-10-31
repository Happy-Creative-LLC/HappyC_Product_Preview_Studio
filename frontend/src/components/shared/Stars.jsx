
const Stars = ({ value = 0, size = 14, color = '#de7921' }) => {
  const pct = (Number(value) / 5) * 100;
  return (
    <span className="relative inline-block align-middle" style={{ fontSize: size, lineHeight: 1 }}>
      <span style={{ color: '#d5d9dc' }}>★★★★★</span>
      <span
        className="absolute left-0 top-0 overflow-hidden whitespace-nowrap"
        style={{ width: `${pct}%`, color }}
      >
        ★★★★★
      </span>
    </span>
  );
};

export default Stars;
