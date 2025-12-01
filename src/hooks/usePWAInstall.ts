import { useState, useEffect } from 'react';

export interface BrowserInfo {
  name: string;
  isIOS: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isSamsung: boolean;
  isOpera: boolean;
  isStandalone: boolean;
}

export type InstallState = 'available' | 'installed' | 'dismissed' | 'unavailable';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSAL_STORAGE_KEY = 'fxDashboard_installDismissed';
const DISMISSAL_TIME_KEY = 'fxDashboard_installDismissedAt';
const DISMISSAL_COUNT_KEY = 'fxDashboard_dismissCount';
const DISMISSAL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const getBrowserInfo = (): BrowserInfo => {
  const ua = navigator.userAgent;

  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(ua);
  const isEdge = /Edg/.test(ua);
  const isSamsung = /SamsungBrowser/.test(ua);
  const isOpera = /OPR/.test(ua) || /Opera/.test(ua);

  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as any)?.standalone === true;

  const name = isIOS ? 'Safari (iOS)' :
               isSafari ? 'Safari' :
               isChrome ? 'Chrome' :
               isFirefox ? 'Firefox' :
               isEdge ? 'Edge' :
               isSamsung ? 'Samsung Internet' :
               isOpera ? 'Opera' : 'Browser';

  return {
    name,
    isIOS,
    isSafari,
    isChrome,
    isFirefox,
    isEdge,
    isSamsung,
    isOpera,
    isStandalone,
  };
};

const isDismissalCooldownActive = (): boolean => {
  const lastDismissal = localStorage.getItem(DISMISSAL_TIME_KEY);
  if (!lastDismissal) return false;

  const dismissalTime = parseInt(lastDismissal, 10);
  const now = Date.now();

  return (now - dismissalTime) < DISMISSAL_COOLDOWN_MS;
};

const incrementDismissalCount = (): void => {
  const count = parseInt(localStorage.getItem(DISMISSAL_COUNT_KEY) || '0', 10);
  localStorage.setItem(DISMISSAL_COUNT_KEY, String(count + 1));
};

const shouldShowInstallPrompt = (): boolean => {
  // Don't show if dismissed and still in cooldown
  if (isDismissalCooldownActive()) {
    return false;
  }

  // Don't show if dismissed 3+ times
  const dismissCount = parseInt(localStorage.getItem(DISMISSAL_COUNT_KEY) || '0', 10);
  if (dismissCount >= 3) {
    return false;
  }

  return true;
};

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installState, setInstallState] = useState<InstallState>('unavailable');
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    // Detect browser info
    const browser = getBrowserInfo();
    setBrowserInfo(browser);

    // If already installed, hide everything
    if (browser.isStandalone) {
      setInstallState('installed');
      return;
    }

    // Check if user previously dismissed and is in cooldown
    if (!shouldShowInstallPrompt()) {
      setInstallState('dismissed');
      return;
    }

    // Listen for beforeinstallprompt event (won't fire on all browsers/domains)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallState('available');
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setInstallState('installed');
      setDeferredPrompt(null);
      localStorage.removeItem(DISMISSAL_STORAGE_KEY);
      localStorage.removeItem(DISMISSAL_TIME_KEY);
      localStorage.removeItem(DISMISSAL_COUNT_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // If beforeinstallprompt doesn't fire, set state to allow manual instructions
    const timeoutId = setTimeout(() => {
      if (installState === 'unavailable' && !deferredPrompt) {
        setInstallState('dismissed'); // Will show manual instructions instead
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Native prompt available
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstallState('installed');
        } else {
          setInstallState('dismissed');
          recordDismissal();
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('PWA installation error:', error);
        setShowInstallModal(true);
      }
    } else {
      // Show manual instructions modal
      setShowInstallModal(true);
    }
  };

  const recordDismissal = () => {
    localStorage.setItem(DISMISSAL_STORAGE_KEY, 'true');
    localStorage.setItem(DISMISSAL_TIME_KEY, String(Date.now()));
    incrementDismissalCount();
  };

  const handleDismissModal = () => {
    setShowInstallModal(false);
    recordDismissal();
    setInstallState('dismissed');
  };

  return {
    deferredPrompt,
    installState,
    browserInfo,
    showInstallModal,
    setShowInstallModal,
    handleInstallClick,
    handleDismissModal,
    shouldShow: installState === 'available' || installState === 'dismissed',
  };
};
