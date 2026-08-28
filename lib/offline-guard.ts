"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export const MAX_OFFLINE_SECONDS = 300; // 5 minutes strictly
const STORAGE_KEY = "system_offline_security_state_v1";

interface OfflineStateData {
  lastOnlineTimestamp: number;
  offlineStartMonotonic: number;
  accumulatedOfflineSeconds: number;
  checksum: string;
}

// Simple hash for anti-tamper validation
function calculateChecksum(
  lastTime: number,
  offlineStart: number,
  accum: number,
): string {
  const str = `${lastTime}_${offlineStart}_${accum}_CPS_OFFLINE_SEC_2026`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(16);
}

export interface OfflineGuardState {
  isOnline: boolean;
  isCheckingPing: boolean;
  offlineDurationSeconds: number;
  remainingSeconds: number;
  isLockedOut: boolean;
  isTampered: boolean;
  retryConnection: () => Promise<boolean>;
}

export function useOfflineGuard(): OfflineGuardState {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isCheckingPing, setIsCheckingPing] = useState<boolean>(false);
  const [offlineDurationSeconds, setOfflineDurationSeconds] =
    useState<number>(0);
  const [isTampered, setIsTampered] = useState<boolean>(false);

  const startMonotonicRef = useRef<number | null>(null);
  const lastRealTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load state from local storage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: OfflineStateData = JSON.parse(raw);
        const expectedChecksum = calculateChecksum(
          parsed.lastOnlineTimestamp,
          parsed.offlineStartMonotonic,
          parsed.accumulatedOfflineSeconds,
        );

        if (parsed.checksum !== expectedChecksum) {
          console.warn(
            "[Offline Guard] System clock or storage tamper detected!",
          );
          setIsTampered(true);
        } else if (parsed.accumulatedOfflineSeconds > 0) {
          setOfflineDurationSeconds(parsed.accumulatedOfflineSeconds);
        }
      }
    } catch (e) {
      console.error("[Offline Guard] Storage error", e);
    }
  }, []);

  // Save current state securely
  const saveState = useCallback((accumulatedSec: number) => {
    try {
      const now = Date.now();
      const startMono = startMonotonicRef.current || performance.now();
      const checksum = calculateChecksum(now, startMono, accumulatedSec);
      const data: OfflineStateData = {
        lastOnlineTimestamp: now,
        offlineStartMonotonic: startMono,
        accumulatedOfflineSeconds: accumulatedSec,
        checksum,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Ping server to verify true internet / API availability
  const checkPing = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return true;
    setIsCheckingPing(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("/api/health", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);
      const online = Boolean(res && (res.ok || res.status < 500));
      return online;
    } catch (e) {
      return false;
    } finally {
      setIsCheckingPing(false);
    }
  }, []);

  // Handle Online transition
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setOfflineDurationSeconds(0);
    startMonotonicRef.current = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("[حارس الاتصال] تعذر حذف مفتاح التخزين المؤقت لحالة الاتصال:", e);
    }
  }, []);

  // Handle Offline transition
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    if (!startMonotonicRef.current) {
      startMonotonicRef.current = performance.now();
      lastRealTimeRef.current = Date.now();
    }
  }, []);

  // Main tick loop
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initialOnline = navigator.onLine;
    setIsOnline(initialOnline);
    if (!initialOnline) {
      handleOffline();
    }

    const onOnlineEvent = async () => {
      const realPing = await checkPing();
      if (realPing) {
        handleOnline();
      }
    };

    const onOfflineEvent = () => {
      handleOffline();
    };

    window.addEventListener("online", onOnlineEvent);
    window.addEventListener("offline", onOfflineEvent);

    // Monotonic Timer tick every 1000ms
    timerIntervalRef.current = setInterval(async () => {
      // Check system clock jumps (tamper protection)
      const currentRealTime = Date.now();
      const timeDiff = currentRealTime - lastRealTimeRef.current;
      lastRealTimeRef.current = currentRealTime;

      // If clock jumped backwards by more than 10 seconds or forward by more than 1 day while offline
      if (!isOnline && (timeDiff < -10000 || timeDiff > 86400000)) {
        console.warn("[Offline Guard] System clock manipulated");
        setIsTampered(true);
      }

      if (!isOnline && startMonotonicRef.current !== null) {
        const elapsedSec = Math.floor(
          (performance.now() - startMonotonicRef.current) / 1000,
        );
        setOfflineDurationSeconds(elapsedSec);
        saveState(elapsedSec);

        // Every 30 seconds, re-check ping quietly in case connection returned without event
        if (elapsedSec % 30 === 0) {
          const pingResult = await checkPing();
          if (pingResult) {
            handleOnline();
          }
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener("online", onOnlineEvent);
      window.removeEventListener("offline", onOfflineEvent);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [checkPing, handleOffline, handleOnline, isOnline, saveState]);

  const retryConnection = useCallback(async (): Promise<boolean> => {
    const result = await checkPing();
    if (result) {
      handleOnline();
      return true;
    }
    return false;
  }, [checkPing, handleOnline]);

  const remainingSeconds = Math.max(
    0,
    MAX_OFFLINE_SECONDS - offlineDurationSeconds,
  );
  const isLockedOut = (!isOnline && remainingSeconds <= 0) || isTampered;

  return {
    isOnline,
    isCheckingPing,
    offlineDurationSeconds,
    remainingSeconds,
    isLockedOut,
    isTampered,
    retryConnection,
  };
}
