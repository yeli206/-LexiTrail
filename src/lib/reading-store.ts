const STORAGE_KEY = "lexitrail-reading-v1";

export interface ReadingState {
  version: 1;
  completed: Record<string, string>;
}

const EMPTY_STATE: ReadingState = { version: 1, completed: {} };
let state = EMPTY_STATE;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function persist(next: ReadingState) {
  state = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  emit();
}

function cleanState(value: unknown): ReadingState {
  if (!value || typeof value !== "object") return EMPTY_STATE;
  const candidate = value as Partial<ReadingState>;
  if (candidate.version !== 1 || !candidate.completed || typeof candidate.completed !== "object") {
    return EMPTY_STATE;
  }
  return {
    version: 1,
    completed: Object.fromEntries(
      Object.entries(candidate.completed).filter(([slug, date]) => slug && typeof date === "string"),
    ),
  };
}

export function hydrateReading() {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      state = cleanState(JSON.parse(stored));
    } catch {
      state = EMPTY_STATE;
    }
  }
  initialized = true;
  emit();
}

export function subscribeReading(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getReadingSnapshot() {
  if (!initialized && typeof window !== "undefined") hydrateReading();
  return state;
}

export function getReadingServerSnapshot() {
  return EMPTY_STATE;
}

export function toggleRead(slug: string) {
  const next = { ...state.completed };
  if (next[slug]) delete next[slug];
  else next[slug] = new Date().toISOString();
  persist({ version: 1, completed: next });
}

export function markRead(slug: string) {
  if (state.completed[slug]) return;
  persist({ version: 1, completed: { ...state.completed, [slug]: new Date().toISOString() } });
}

export function clearReadingProgress() {
  persist(EMPTY_STATE);
}