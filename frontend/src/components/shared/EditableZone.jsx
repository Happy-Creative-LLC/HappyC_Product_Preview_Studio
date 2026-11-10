// Layout wrapper for editable preview content. Role boundaries are handled by
// the editor controls; the simulated storefront itself stays visually neutral.
const EditableZone = ({ zone = 'GENERAL', className = '', children, id, group }) => (
  <div
    id={id}
    data-zone={zone}
    data-group={group}
    className={`relative rounded-lg ${className}`}
    tabIndex={-1}
  >
    {children}
  </div>
);

export default EditableZone;
