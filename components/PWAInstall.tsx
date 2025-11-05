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
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallButton(false);
    });

    // Check if running in standalone mode (already installed)
    if (window.navigator.standalone === true) {
      setIsInstalled(true);
      setShowInstallButton(false);
    }

    // Fallback: Show button after 3 seconds if event hasn't fired (for development/testing)
    // This allows users to see and test the button UI
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt) {
        setShowInstallButton(true);
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', () => {
        setIsInstalled(true);
      });
    };
  }, [deferredPrompt]);

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
      // Fallback: Show a message or guide user (for development)
      alert('PWA installation is available on compatible browsers. Please use the browser menu: Settings > Install app');
    }
  };

  if (!showInstallButton && !isInstalled) {
    return null;
  }

  if (isInstalled) {
    return null; // Hide button when already installed
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
