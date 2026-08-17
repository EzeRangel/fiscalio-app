import { app, BrowserWindow, dialog } from "electron";
import path from "node:path";
import fs from "node:fs";
import { ElectronLogger } from "./logger";
import { ServerManager } from "./server-manager";
import { loadWindowState, saveWindowState } from "./window-state";
import { setupApplicationMenu } from "./menu";

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let serverManager: ServerManager | null = null;
let logger: ElectronLogger | null = null;
let isQuitting = false;

// 1. Enforce Single-Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  const userDataPath = app.getPath("userData");
  const dataDirPath = process.env.FISCALIO_DATA_DIR || path.join(userDataPath, "data");
  const stateFilePath = path.join(userDataPath, "window-state.json");

  // Ensure data dir exists
  fs.mkdirSync(dataDirPath, { recursive: true });

  logger = new ElectronLogger(userDataPath);
  logger.info("Fiscalio Electron Shell Starting...");
  logger.info(`UserData directory: ${userDataPath}`);
  logger.info(`Database storage directory: ${dataDirPath}`);

  const projectRoot = app.isPackaged
    ? process.resourcesPath
    : process.cwd();

  serverManager = new ServerManager({
    projectRoot,
    userDataDir: dataDirPath,
    preferredPort: 3120,
    logger,
    startupTimeoutMs: 30000,
  });

  function createSplashWindow(): BrowserWindow {
    const splash = new BrowserWindow({
      width: 480,
      height: 320,
      frame: false,
      resizable: false,
      center: true,
      show: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const splashHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #09090b;
              color: #fafafa;
              user-select: none;
              -webkit-app-region: drag;
            }
            .logo {
              font-size: 28px;
              font-weight: 700;
              letter-spacing: -0.5px;
              margin-bottom: 8px;
            }
            .subtitle {
              font-size: 13px;
              color: #a1a1aa;
              margin-bottom: 24px;
            }
            .spinner {
              width: 24px;
              height: 24px;
              border: 3px solid rgba(255, 255, 255, 0.1);
              border-top-color: #3b82f6;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="logo">Fiscalio</div>
          <div class="subtitle">Iniciando aplicación y base de datos local...</div>
          <div class="spinner"></div>
        </body>
      </html>
    `;

    splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);
    return splash;
  }

  function showErrorScreen(title: string, message: string): void {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }

    const errorWindow = new BrowserWindow({
      width: 550,
      height: 380,
      center: true,
      resizable: false,
      title: "Error al iniciar Fiscalio",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              margin: 0;
              padding: 32px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #09090b;
              color: #fafafa;
            }
            h2 { color: #ef4444; margin-top: 0; }
            p { color: #d4d4d8; font-size: 14px; line-height: 1.5; }
            .btn {
              display: inline-block;
              margin-top: 16px;
              padding: 8px 16px;
              background: #2563eb;
              color: white;
              border-radius: 6px;
              text-decoration: none;
              font-size: 13px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <p>${message}</p>
          <p>Revisa el archivo de registro en <code>${logger?.getLogFilePath()}</code> para más detalles.</p>
        </body>
      </html>
    `;

    errorWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
  }

  async function createMainWindow(serverUrl: string): Promise<BrowserWindow> {
    const savedBounds = loadWindowState(stateFilePath);

    const win = new BrowserWindow({
      width: savedBounds.width,
      height: savedBounds.height,
      minWidth: savedBounds.minWidth,
      minHeight: savedBounds.minHeight,
      x: savedBounds.x,
      y: savedBounds.y,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    if (savedBounds.isMaximized) {
      win.maximize();
    }

    const saveCurrentBounds = () => {
      if (!win.isDestroyed()) {
        const isMaximized = win.isMaximized();
        const bounds = win.getBounds();
        saveWindowState(stateFilePath, {
          width: bounds.width,
          height: bounds.height,
          minWidth: 1024,
          minHeight: 700,
          x: bounds.x,
          y: bounds.y,
          isMaximized,
        });
      }
    };

    win.on("resize", saveCurrentBounds);
    win.on("move", saveCurrentBounds);
    win.on("close", (event) => {
      saveCurrentBounds();
      if (process.platform === "darwin" && !isQuitting) {
        event.preventDefault();
        win.hide();
      }
    });

    await win.loadURL(serverUrl);

    win.show();
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }

    return win;
  }

  app.whenReady().then(async () => {
    setupApplicationMenu(dataDirPath);
    splashWindow = createSplashWindow();

    try {
      if (!serverManager) throw new Error("Server manager uninitialized");
      const { url } = await serverManager.start();
      mainWindow = await createMainWindow(url);
    } catch (err: unknown) {
      const error = err as Error;
      logger?.error("Startup failure:", error);
      showErrorScreen("Error al iniciar el servidor interno", error.message);
    }
  });

  app.on("activate", () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  app.on("before-quit", async (event) => {
    if (!isQuitting) {
      isQuitting = true;
      if (serverManager) {
        event.preventDefault();
        logger?.info("Quitting application, shutting down backend server...");
        try {
          await serverManager.stop();
        } catch (err) {
          logger?.error("Error during server shutdown:", err);
        }
        app.quit();
      }
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
