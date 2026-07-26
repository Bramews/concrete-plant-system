// @ts-nocheck
import { CapacitorConfig } from "@capacitor/cli";

const isDev = process.env.NODE_ENV === "development";

const config: CapacitorConfig = {
  appId: "com.concreteerp.app",
  appName: "Concrete ERP Pro",
  webDir: "out",
  server: {
    allowNavigation: ["concrete-erp.com", "*.concrete-erp.com"],
    cleartext: isDev,
  },
  android: {
    allowMixedContent: isDev,
    captureInput: true,
    webContentsDebuggingEnabled: isDev,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0F172A",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0F172A",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
