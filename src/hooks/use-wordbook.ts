"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getWordbookServerSnapshot,
  getWordbookSnapshot,
  hydrateWordbook,
  subscribeWordbook,
} from "@/lib/wordbook-store";

export function useWordbook() {
  const state = useSyncExternalStore(
    subscribeWordbook,
    getWordbookSnapshot,
    getWordbookServerSnapshot,
  );

  useEffect(() => {
    hydrateWordbook();
  }, []);

  return state;
}