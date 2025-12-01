export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  autoDismissSeconds?: number;
}

/**
 * Request notification permissions from the user
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  return false;
};

/**
 * Check if notifications are allowed
 */
export const canSendNotifications = (): boolean => {
  return 'Notification' in window && Notification.permission === 'granted';
};

/**
 * Send a browser notification
 */
export const sendNotification = (options: NotificationOptions): Notification | null => {
  if (!canSendNotifications()) {
    console.warn('Notifications are not permitted');
    return null;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      badge: options.badge,
      tag: options.tag || 'session-alert',
      requireInteraction: false,
    });

    // Auto-dismiss the notification after specified seconds
    if (options.autoDismissSeconds && options.autoDismissSeconds > 0) {
      setTimeout(() => {
        notification.close();
      }, options.autoDismissSeconds * 1000);
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
};

/**
 * Generate a simple beep sound using Web Audio API
 */
const generateBeepSound = (): void => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set frequency and duration
    oscillator.frequency.value = 800; // Hz
    oscillator.type = 'sine';

    // Create envelope (attack, sustain, release)
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn('Could not generate beep sound:', error);
  }
};

/**
 * Play alert sound using Web Audio API or HTML5 Audio
 */
export const playAlertSound = async (soundPath: string = '/alert-sound.mp3'): Promise<void> => {
  try {
    // Try using Web Audio API first for better control
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const response = await fetch(soundPath);

    if (!response.ok) {
      // If file not found, use generated beep
      generateBeepSound();
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
  } catch (error) {
    // Try HTML5 Audio element as fallback
    try {
      const audio = new Audio(soundPath);
      audio.volume = 0.5;
      await audio.play();
    } catch (audioError) {
      // Final fallback: generate a beep
      console.warn('Could not play audio file, using generated beep');
      generateBeepSound();
    }
  }
};

/**
 * Create and show a complete alert notification with optional sound
 */
export const showSessionAlert = (
  title: string,
  body: string,
  options?: {
    autoDismissSeconds?: number;
    playSound?: boolean;
    soundPath?: string;
  }
): void => {
  const autoDismissSeconds = options?.autoDismissSeconds || 5;
  const playSound = options?.playSound !== false;
  const soundPath = options?.soundPath || '/alert-sound.mp3';

  // Send notification
  sendNotification({
    title,
    body,
    autoDismissSeconds,
    icon: '/favicon.ico',
  });

  // Play sound if enabled
  if (playSound) {
    playAlertSound(soundPath);
  }
};
