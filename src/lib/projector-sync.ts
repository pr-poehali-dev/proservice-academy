// Синхронизация состояния презентации между окнами через localStorage
// Работает мгновенно через событие storage

export const PROJECTOR_KEY = "psa_projector_state";

export interface ProjectorState {
  active: boolean;
  slideIdx: number;
  lessonTitle: string;
  courseTitle: string;
  slides: { title: string; content: string[]; bullets: string[] }[];
  darkTheme: boolean;
  timestamp: number;
}

export function pushProjectorState(state: Omit<ProjectorState, "timestamp">) {
  const full = JSON.stringify({ ...state, timestamp: Date.now() });
  localStorage.setItem(PROJECTOR_KEY, full);
  // Тригерим для текущего окна тоже (storage срабатывает только в других вкладках)
  window.dispatchEvent(new StorageEvent("storage", {
    key: PROJECTOR_KEY,
    newValue: full,
  }));
}

export function getProjectorState(): ProjectorState | null {
  try {
    const raw = localStorage.getItem(PROJECTOR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function onProjectorStateChange(cb: (state: ProjectorState) => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key !== PROJECTOR_KEY || !e.newValue) return;
    try { cb(JSON.parse(e.newValue)); } catch { /* ignore */ }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
