import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const GOOGLE_SCRIPT_ID = 'google-identity-services';
const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client?hl=vi';

let googleScriptPromise;

const loadGoogleIdentityServices = () => {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    const script = existingScript || document.createElement('script');

    const handleLoad = () => {
      if (window.google?.accounts?.id) resolve(window.google);
      else reject(new Error('Google Identity Services không khả dụng.'));
    };
    const handleError = () => reject(new Error('Không thể tải Google Identity Services.'));

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existingScript) {
      script.id = GOOGLE_SCRIPT_ID;
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    googleScriptPromise = undefined;
    throw error;
  });

  return googleScriptPromise;
};

const GoogleLogo = () => (
  <svg aria-hidden="true" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.26-.16-1.86H9v3.53h4.84a4.14 4.14 0 0 1-1.8 2.71v2.29h2.91c1.7-1.57 2.69-3.88 2.69-6.67Z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.13l-2.91-2.29c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.36A9 9 0 0 0 9 18Z" />
    <path fill="#FBBC05" d="M3.96 10.73A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.28-1.73V4.91H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.09l3-2.36Z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .96 4.91l3 2.36C4.67 5.14 6.66 3.58 9 3.58Z" />
  </svg>
);

const GoogleSignInButton = ({
  active,
  clientId,
  disabled = false,
  onCredential,
  onUnavailable,
}) => {
  const slotRef = useRef(null);
  const credentialHandlerRef = useRef(onCredential);
  const [status, setStatus] = useState(clientId ? 'idle' : 'unconfigured');

  useEffect(() => {
    credentialHandlerRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!active) return undefined;
    if (!clientId) return undefined;

    let cancelled = false;
    let resizeObserver;
    let renderedWidth = 0;
    loadGoogleIdentityServices()
      .then((googleApi) => {
        if (cancelled || !slotRef.current) return;

        googleApi.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) credentialHandlerRef.current(response.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'popup',
        });

        const renderButton = () => {
          if (!slotRef.current) return;
          const availableWidth = Math.floor(slotRef.current.getBoundingClientRect().width);
          const width = Math.min(Math.max(availableWidth, 240), 400);
          if (width === renderedWidth) return;
          renderedWidth = width;
          slotRef.current.replaceChildren();
          googleApi.accounts.id.renderButton(slotRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            locale: 'vi',
            width,
          });
          setStatus('ready');
        };

        renderButton();
        resizeObserver = new ResizeObserver(renderButton);
        resizeObserver.observe(slotRef.current);
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [active, clientId]);

  const showFallback = status !== 'ready';
  const isLoading = status === 'loading';

  return (
    <div className={`hc-google-button ${disabled ? 'hc-google-button--disabled' : ''}`}>
      <div
        className="hc-google-button__slot"
        ref={slotRef}
        aria-hidden={showFallback}
      />
      {showFallback && (
        <button
          className="hc-google-button__fallback"
          type="button"
          onClick={onUnavailable}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={19} aria-hidden="true" />
          ) : (
            <GoogleLogo />
          )}
          {isLoading ? 'Đang tải Google...' : 'Đăng nhập bằng Google'}
        </button>
      )}
    </div>
  );
};

export default GoogleSignInButton;
