import { autoUpdater } from "electron-updater";
import { app, dialog, net, shell } from "electron";
import { ElectronLogger } from "./logger";
import { versionGreater } from "./version-utils";

const RELEASES_API_URL =
  "https://api.github.com/repos/EzeRangel/fiscalio-app/releases/latest";

interface GitHubRelease {
  tagName: string;
  htmlUrl: string;
}

async function fetchLatestRelease(logger?: ElectronLogger): Promise<GitHubRelease | null> {
  try {
    const response = await new Promise<{
      statusCode: number;
      body: string;
    }>((resolve, reject) => {
      const request = net.request(RELEASES_API_URL);
      request.setHeader("Accept", "application/vnd.github+json");
      request.setHeader("User-Agent", "Fiscalio");
      let body = "";
      request.on("response", (res) => {
        res.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode ?? 0, body });
        });
      });
      request.on("error", reject);
      request.end();
    });

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`GitHub API responded with HTTP ${response.statusCode}`);
    }

    const data = JSON.parse(response.body) as { tag_name?: unknown; html_url?: unknown };
    if (typeof data.tag_name !== "string" || typeof data.html_url !== "string") {
      return null;
    }
    return { tagName: data.tag_name, htmlUrl: data.html_url };
  } catch (err: unknown) {
    logger?.error("Failed to fetch the latest GitHub release:", err);
    return null;
  }
}

/**
 * macOS (unsigned v1): update distribution is manual via GitHub Releases.
 * Checks the latest release and, if newer than the running version, points the
 * user at the GitHub URL (transparent, never routed through the marketing site).
 */
async function checkGitHubReleasesForMac(logger?: ElectronLogger, silent = true): Promise<void> {
  const release = await fetchLatestRelease(logger);
  const remote = release?.tagName.replace(/^v/i, "") ?? "";
  const current = app.getVersion();

  if (release && remote && remote !== current && versionGreater(remote, current)) {
    const { response } = await dialog.showMessageBox({
      type: "info",
      title: "Actualización disponible",
      message: `Hay una nueva versión de Fiscalio: ${release.tagName}.`,
      detail:
        "En esta versión las actualizaciones se instalan manualmente. Descarga la última versión desde GitHub Releases.",
      buttons: ["Descargar", "Más tarde"],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });
    if (response === 0) {
      await shell.openExternal(release.htmlUrl);
    }
    return;
  }

  if (!silent) {
    await dialog.showMessageBox({
      type: "info",
      title: "Actualizaciones",
      message: "No hay actualizaciones disponibles. Ya tienes instalada la versión más reciente.",
      buttons: ["Aceptar"],
    });
  }
}

export function initAutoUpdater(logger?: ElectronLogger): void {
  if (!app.isPackaged) {
    logger?.info("Development environment detected, auto-updater disabled.");
    return;
  }

  if (process.platform === "darwin") {
    // macOS v1: manual distribution via GitHub Releases (no Developer ID yet)
    checkGitHubReleasesForMac(logger, true).catch(() => {});
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
  });

  // Check on boot
  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    logger?.error("Initial update check failed:", err);
  });
}

export async function checkForUpdatesManual(logger?: ElectronLogger): Promise<void> {
  if (!app.isPackaged) {
    await dialog.showMessageBox({
      type: "info",
      title: "Actualizaciones",
      message: "Estás ejecutando la versión de desarrollo. Las actualizaciones automáticas no aplican en modo dev.",
      buttons: ["Aceptar"],
    });
    return;
  }

  if (process.platform === "darwin") {
    await checkGitHubReleasesForMac(logger, false);
    return;
  }

  try {
    logger?.info("Manual update check triggered by user.");
    const result = await autoUpdater.checkForUpdates();
    if (!result || !result.updateInfo) {
      await dialog.showMessageBox({
        type: "info",
        title: "Actualizaciones",
        message: "No hay actualizaciones disponibles. Ya tienes instalada la versión más reciente.",
        buttons: ["Aceptar"],
      });
    }
  } catch (err: unknown) {
    const error = err as Error;
    logger?.error("Manual update check failed:", error);
    await dialog.showMessageBox({
      type: "error",
      title: "Error al buscar actualizaciones",
      message: `No se pudo verificar si existen actualizaciones: ${error.message}`,
      buttons: ["Aceptar"],
    });
  }
}