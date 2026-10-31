import useIsMobile from '../../hooks/useIsMobile';
import HeaderDesktop from './desktop/HeaderDesktop';
import HeaderMobile from './mobile/HeaderMobile';

// Breakpoint selector — renders only the mobile OR desktop header (one DOM tree).
const Header = (props) => {
  const isMobile = useIsMobile();
  return isMobile ? <HeaderMobile {...props} /> : <HeaderDesktop {...props} />;
};

export default Header;
