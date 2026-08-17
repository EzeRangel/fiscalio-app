import fs from "node:fs";
import path from "node:path";

export class ElectronLogger {
  private logDir: string;
  private logFilePath: string;

  constructor(userDataPath: string) {
    this.logDir = path.join(userDataPath, "logs");
    this.logFilePath = path.join(this.logDir, "app.log");
  }

  public getLogFilePath(): string {
    return this.logFilePath;
  }

  private write(level: "INFO" | "WARN" | "ERROR", message: string, error?: unknown): void {
    const timestamp = new Date().toISOString();
    let entry = `[${timestamp}] [${level}] ${message}`;
    if (error) {
      if (error instanceof Error) {
        entry += `\n  Stack: ${error.stack || error.message}`;
      } else {
        entry += `\n  Error: ${String(error)}`;
      }
    }
    entry += "\n";

    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
      fs.appendFileSync(this.logFilePath, entry, "utf-8");
    } catch (err) {
      console.error("Failed to write to log file:", err);
    }
  }

  public info(message: string): void {
    this.write("INFO", message);
  }

  public warn(message: string): void {
    this.write("WARN", message);
  }

  public error(message: string, error?: unknown): void {
    this.write("ERROR", message, error);
  }
}
