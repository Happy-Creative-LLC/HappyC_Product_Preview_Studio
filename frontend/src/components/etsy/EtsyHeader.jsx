import useIsMobile from '../../hooks/useIsMobile';
import EtsyHeaderDesktop from './desktop/EtsyHeaderDesktop';
import EtsyHeaderMobile from './mobile/EtsyHeaderMobile';

// Breakpoint selector — renders only the mobile OR desktop Etsy header.
const EtsyHeader = (props) => {
  const isMobile = useIsMobile();
  return isMobile ? <EtsyHeaderMobile {...props} /> : <EtsyHeaderDesktop {...props} />;
};

export default EtsyHeader;
