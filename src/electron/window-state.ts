import fs from "node:fs";
import path from "node:path";

export interface WindowBounds {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  x?: number;
  y?: number;
  isMaximized?: boolean;
}

export const DEFAULT_WINDOW_BOUNDS: WindowBounds = {
  width: 1200,
  height: 800,
  minWidth: 1024,
  minHeight: 700,
  isMaximized: false,
};

export function loadWindowState(filePath: string): WindowBounds {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_WINDOW_BOUNDS,
        ...parsed,
        minWidth: DEFAULT_WINDOW_BOUNDS.minWidth,
        minHeight: DEFAULT_WINDOW_BOUNDS.minHeight,
      };
    }
  } catch (error) {
    console.warn("Failed to read window-state.json, falling back to defaults:", error);
  }

  return { ...DEFAULT_WINDOW_BOUNDS };
}

export function saveWindowState(filePath: string, bounds: WindowBounds): void {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(bounds, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save window state:", error);
  }
}
