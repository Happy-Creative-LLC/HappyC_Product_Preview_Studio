import happyCreativeLogo from '../../assets/happy-creative-logo.png';

const BrandMark = ({ compact = false, inverse = false, className = '' }) => (
  <span
    className={`hc-brand ${compact ? 'hc-brand--compact' : ''} ${inverse ? 'hc-brand--inverse' : ''} ${className}`.trim()}
    aria-label="Happy Creative Product Preview Studio"
  >
    <img
      className="hc-brand__mark"
      src={happyCreativeLogo}
      alt=""
      aria-hidden="true"
    />
    <span className="hc-brand__copy">
      <strong>Happy Creative LLC</strong>
      {!compact && <small>product preview studio</small>}    
    </span>
  </span>
);

export default BrandMark;
