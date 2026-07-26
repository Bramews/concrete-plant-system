export class Logger {
  static log(message: string, ...args: any[]) {
    // In production, maybe we only want vital logs or use a structured logging service
    if (process.env.NODE_ENV !== "production") {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  static warn(message: string, ...args: any[]) {
    console.warn(`[WARN] ${message}`, ...args);
  }

  static error(message: string, error?: any) {
    // Always log errors, potentially send to alerting service (Sentry, etc.)
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} - ${message}`, error);

    if (process.env.NODE_ENV === "production") {
      // Here we would integrate with Sentry/Datadog
      // For now, we ensure it's logged to stderr for container capture
    }
  }

  static debug(message: string, ...args: any[]) {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}
