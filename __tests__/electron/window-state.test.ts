import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { loadWindowState, saveWindowState, WindowBounds } from "@/electron/window-state";

describe("Window State Persistence", () => {
  let tempDir: string;
  let stateFilePath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "window-state-test-"));
    stateFilePath = path.join(tempDir, "window-state.json");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should return default bounds when state file does not exist", () => {
    const state = loadWindowState(stateFilePath);
    expect(state).toEqual({
      width: 1200,
      height: 800,
      minWidth: 1024,
      minHeight: 700,
      x: undefined,
      y: undefined,
      isMaximized: false,
    });
  });

  it("should save and load window bounds correctly", () => {
    const customBounds: WindowBounds = {
      width: 1400,
      height: 900,
      minWidth: 1024,
      minHeight: 700,
      x: 150,
      y: 100,
      isMaximized: true,
    };

    saveWindowState(stateFilePath, customBounds);
    expect(fs.existsSync(stateFilePath)).toBe(true);

    const loaded = loadWindowState(stateFilePath);
    expect(loaded).toEqual(customBounds);
  });

  it("should handle corrupted state files gracefully by falling back to defaults", () => {
    fs.writeFileSync(stateFilePath, "invalid-json{");
    const state = loadWindowState(stateFilePath);
    expect(state.width).toBe(1200);
    expect(state.height).toBe(800);
  });
});
