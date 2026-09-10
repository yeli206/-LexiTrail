"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getReadingServerSnapshot,
  getReadingSnapshot,
  hydrateReading,
  subscribeReading,
} from "@/lib/reading-store";

export function useReading() {
  const state = useSyncExternalStore(
    subscribeReading,
    getReadingSnapshot,
    getReadingServerSnapshot,
  );

  useEffect(() => {
    hydrateReading();
  }, []);

  return state;
}