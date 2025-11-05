import React, { useState, useEffect } from 'react';
import { IconDownload } from './icons';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstall: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallButton(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as any)?.standalone;
    if (isStandalone) {
      setIsInstalled(true);
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // If deferredPrompt exists, use the native install flow
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          setIsInstalled(true);
        }

        setDeferredPrompt(null);
        setShowInstallButton(false);
      } catch (error) {
        console.error('Failed to install app:', error);
      }
    } else {
      alert('Install is handled by your browser menu. In Chrome: ⋮ > Install app.');
    }
  };

  if (!showInstallButton || isInstalled) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 hover:border-cyan-300/60 text-cyan-300 transition-all duration-300 backdrop-blur-md shadow-lg shadow-cyan-500/10"
      title="Install app on your device"
    >
      <IconDownload className="w-4 h-4" />
      <span className="hidden sm:inline">Install</span>
    </button>
  );
};

export default PWAInstall;
