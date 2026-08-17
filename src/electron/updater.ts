import { autoUpdater } from "electron-updater";
import { app, dialog } from "electron";
import { ElectronLogger } from "./logger";

export function initAutoUpdater(logger?: ElectronLogger): void {
  if (!app.isPackaged) {
    logger?.info("Development environment detected, auto-updater disabled.");
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    logger?.info("Checking for software updates...");
  });

  autoUpdater.on("update-available", (info) => {
    logger?.info(`Update available: version ${info.version}`);
  });

  autoUpdater.on("update-not-available", () => {
    logger?.info("Application is up to date.");
  });

  autoUpdater.on("error", (err) => {
    logger?.error("Auto-updater encountered an error:", err);
  });

  autoUpdater.on("update-downloaded", (info) => {
    logger?.info(`Update downloaded: version ${info.version}`);

    if (process.platform === "win32") {
      dialog
        .showMessageBox({
          type: "info",
          title: "Actualización lista",
          message: `Una nueva versión de Fiscalio (${info.version}) ha sido descargada. ¿Deseas reiniciar para instalarla ahora?`,
          buttons: ["Reiniciar y actualizar", "Más tarde"],
          defaultId: 0,
        })
        .then(({ response }) => {
          if (response === 0) {
            autoUpdater.quitAndInstall();
          }
        });
    } else {
      // macOS in-app update notification
      dialog.showMessageBox({
        type: "info",
        title: "Actualización disponible",
        message: `La versión ${info.version} de Fiscalio está lista para instalarse al reiniciar la aplicación.`,
        buttons: ["Entendido"],
      });
    }
  });

  // Check on boot
  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    logger?.error("Initial update check failed:", err);
  });
}

export async function checkForUpdatesManual(logger?: ElectronLogger): Promise<void> {
  if (!app.isPackaged) {
    dialog.showMessageBox({
      type: "info",
      title: "Actualizaciones",
      message: "Estás ejecutando la versión de desarrollo. Las actualizaciones automáticas no aplican en modo dev.",
      buttons: ["Aceptar"],
    });
    return;
  }

  try {
    logger?.info("Manual update check triggered by user.");
    const result = await autoUpdater.checkForUpdates();
    if (!result || !result.updateInfo) {
      dialog.showMessageBox({
        type: "info",
        title: "Actualizaciones",
        message: "No hay actualizaciones disponibles. Ya tienes instalada la versión más reciente.",
        buttons: ["Aceptar"],
      });
    }
  } catch (err: unknown) {
    const error = err as Error;
    logger?.error("Manual update check failed:", error);
    dialog.showMessageBox({
      type: "error",
      title: "Error al buscar actualizaciones",
      message: `No se pudo verificar si existen actualizaciones: ${error.message}`,
      buttons: ["Aceptar"],
    });
  }
}
