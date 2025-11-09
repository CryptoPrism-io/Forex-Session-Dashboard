import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertConfig, AlertEvent, SessionData } from '../types';
import { showSessionAlert, requestNotificationPermission, canSendNotifications } from '../utils/notificationManager';

const ALERT_CONFIG_STORAGE_KEY = 'forex-alert-config';
const FIRED_ALERTS_STORAGE_KEY = 'forex-fired-alerts';
const FIFTEEN_MINUTES_IN_HOURS = 15 / 60;
const CHECK_INTERVAL_MS = 10000; // Check every 10 seconds

export const useSessionAlerts = (sessions: SessionData[]) => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig>(() => {
    const stored = localStorage.getItem(ALERT_CONFIG_STORAGE_KEY);
    return stored
      ? JSON.parse(stored)
      : {
          enabled: false,
          soundEnabled: true,
          autoDismissSeconds: 5,
        };
  });

  const [firedAlerts, setFiredAlerts] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(FIRED_ALERTS_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const [permissionRequested, setPermissionRequested] = useState(
    localStorage.getItem('forex-notification-permission-requested') === 'true'
  );

  const checkIntervalRef = useRef<number | null>(null);

  // Persist alert config to localStorage
  useEffect(() => {
    localStorage.setItem(ALERT_CONFIG_STORAGE_KEY, JSON.stringify(alertConfig));
  }, [alertConfig]);

  // Persist fired alerts to localStorage
  useEffect(() => {
    localStorage.setItem(FIRED_ALERTS_STORAGE_KEY, JSON.stringify(Array.from(firedAlerts)));
  }, [firedAlerts]);

  // Calculate all alert events from sessions
  const calculateAlertEvents = useCallback((): AlertEvent[] => {
    const alerts: AlertEvent[] = [];

    sessions.forEach((session) => {
      Object.entries(session).forEach(([key, prop]) => {
        if (key === 'name' || typeof prop !== 'object' || prop === null || !('range' in prop)) {
          return;
        }

        const bar = prop as any;
        const [startUTC, endUTC] = bar.range;
        const alertId = `${session.name}_${key}`;

        // Event 1: 15 minutes before open
        alerts.push({
          id: `${alertId}_open-before`,
          sessionName: session.name,
          barName: bar.name,
          eventType: 'open-before',
          triggerTime: startUTC - FIFTEEN_MINUTES_IN_HOURS,
          message: `${bar.name} opens in 15 minutes`,
          color: bar.color,
        });

        // Event 2: At open
        alerts.push({
          id: `${alertId}_open`,
          sessionName: session.name,
          barName: bar.name,
          eventType: 'open',
          triggerTime: startUTC,
          message: `${bar.name} is now open`,
          color: bar.color,
        });

        // Event 3: 15 minutes before close
        alerts.push({
          id: `${alertId}_close-before`,
          sessionName: session.name,
          barName: bar.name,
          eventType: 'close-before',
          triggerTime: endUTC - FIFTEEN_MINUTES_IN_HOURS,
          message: `${bar.name} closes in 15 minutes`,
          color: bar.color,
        });

        // Event 4: At close
        alerts.push({
          id: `${alertId}_close`,
          sessionName: session.name,
          barName: bar.name,
          eventType: 'close',
          triggerTime: endUTC,
          message: `${bar.name} is now closed`,
          color: bar.color,
        });
      });
    });

    return alerts;
  }, [sessions]);

  // Check if an alert should be triggered
  const checkAndTriggerAlerts = useCallback(() => {
    if (!alertConfig.enabled) return;

    const now = new Date();
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;

    const alertEvents = calculateAlertEvents();
    const tolerance = 1 / 60; // 1 minute tolerance window

    alertEvents.forEach((alert) => {
      const alertKey = `${alert.id}_${Math.floor(utcHours)}`;

      // Check if alert has already been fired
      if (firedAlerts.has(alertKey)) return;

      // Normalize trigger time to handle overnight sessions (0-48 range)
      let normalizedTrigger = alert.triggerTime;
      let normalizedUTC = utcHours;

      // If session crosses midnight and we're in the "yesterday" part
      if (alert.triggerTime > 24 && utcHours < 12) {
        normalizedUTC = utcHours + 24;
      }

      // If session starts tomorrow and we're checking today
      if (normalizedTrigger < 0) {
        normalizedTrigger += 24;
      }

      // Check if current time is within tolerance window of trigger time
      const timeDiff = Math.abs(normalizedUTC - normalizedTrigger);
      if (timeDiff <= tolerance || (timeDiff >= 24 - tolerance && timeDiff <= 24 + tolerance)) {
        // Trigger the alert
        showSessionAlert(
          `${alert.eventType === 'open-before' || alert.eventType === 'open' ? 'Opening' : 'Closing'} Alert`,
          alert.message,
          {
            autoDismissSeconds: alertConfig.autoDismissSeconds,
            playSound: alertConfig.soundEnabled,
          }
        );

        // Mark alert as fired
        setFiredAlerts((prev) => new Set(prev).add(alertKey));
      }
    });
  }, [alertConfig.enabled, alertConfig.autoDismissSeconds, alertConfig.soundEnabled, calculateAlertEvents, firedAlerts]);

  // Set up periodic check for alerts
  useEffect(() => {
    if (alertConfig.enabled) {
      checkAndTriggerAlerts(); // Check immediately

      checkIntervalRef.current = window.setInterval(() => {
        checkAndTriggerAlerts();
      }, CHECK_INTERVAL_MS);
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [alertConfig.enabled, checkAndTriggerAlerts]);

  // Reset fired alerts daily at midnight UTC
  useEffect(() => {
    const resetAlerts = () => {
      setFiredAlerts(new Set());
    };

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    const timeUntilReset = tomorrow.getTime() - now.getTime();
    const resetTimeoutId = setTimeout(resetAlerts, timeUntilReset);

    return () => clearTimeout(resetTimeoutId);
  }, []);

  // Toggle alerts on/off
  const toggleAlerts = useCallback(async () => {
    if (!alertConfig.enabled) {
      // Enabling alerts - request permission if not already done
      if (!permissionRequested && !canSendNotifications()) {
        const granted = await requestNotificationPermission();
        setPermissionRequested(true);
        localStorage.setItem('forex-notification-permission-requested', 'true');
        if (!granted) {
          console.warn('Notification permission was denied');
          return;
        }
      }
    }

    setAlertConfig((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  }, [alertConfig.enabled, permissionRequested]);

  // Update alert sound setting
  const toggleSound = useCallback(() => {
    setAlertConfig((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  }, []);

  return {
    alertConfig,
    toggleAlerts,
    toggleSound,
    calculateAlertEvents,
  };
};
