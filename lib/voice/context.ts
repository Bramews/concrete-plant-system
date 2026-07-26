import fs from "fs";
import path from "path";

// Paths for local JSON files in the workspace
const TMP_DIR = path.join(process.cwd(), "tmp");
const CONTEXT_FILE = path.join(TMP_DIR, "voice-context.json");
const LOGS_FILE = path.join(TMP_DIR, "voice-logs.json");

export interface VoiceContextState {
  currentCharacter: string;
  lastLanguage: string;
  volume: number;
}

export interface VoiceLogEntry {
  timestamp: string;
  command: string;
  response: string;
  success: boolean;
  characterId: string;
  language: string;
}

// Helper to ensure tmp directory exists
function ensureTmpDir() {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
}

/**
 * Load local voice context state from tmp/voice-context.json
 */
export function getLocalVoiceContext(): VoiceContextState {
  ensureTmpDir();
  const defaultState: VoiceContextState = {
    currentCharacter: "saleh",
    lastLanguage: "ar",
    volume: 1.0,
  };

  try {
    if (fs.existsSync(CONTEXT_FILE)) {
      const data = fs.readFileSync(CONTEXT_FILE, "utf-8");
      return JSON.parse(data) as VoiceContextState;
    }
  } catch (err) {
    console.error("Failed to read voice context file, returning default:", err);
  }

  return defaultState;
}

/**
 * Save voice context state to tmp/voice-context.json
 */
export function saveLocalVoiceContext(
  state: Partial<VoiceContextState>,
): boolean {
  ensureTmpDir();
  try {
    const currentState = getLocalVoiceContext();
    const updatedState = { ...currentState, ...state };
    fs.writeFileSync(
      CONTEXT_FILE,
      JSON.stringify(updatedState, null, 2),
      "utf-8",
    );
    return true;
  } catch (err) {
    console.error("Failed to save voice context file:", err);
    return false;
  }
}

/**
 * Load all voice logs from tmp/voice-logs.json
 */
export function getLocalVoiceLogs(): VoiceLogEntry[] {
  ensureTmpDir();
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, "utf-8");
      return JSON.parse(data) as VoiceLogEntry[];
    }
  } catch (err) {
    console.error("Failed to read voice logs file:", err);
  }
  return [];
}

/**
 * Append a new voice command log entry to tmp/voice-logs.json
 */
export function addLocalVoiceLog(
  entry: Omit<VoiceLogEntry, "timestamp">,
): boolean {
  ensureTmpDir();
  try {
    const logs = getLocalVoiceLogs();
    const newEntry: VoiceLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };
    logs.push(newEntry);

    // Limit to last 200 logs to prevent file growth
    const trimmedLogs = logs.slice(-200);

    fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmedLogs, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to append voice log:", err);
    return false;
  }
}

/**
 * Helper to strip trailing punctuation and spaces for robust matching.
 */
function cleanCommandText(cmd: string): string {
  return cmd
    .trim()
    .toLowerCase()
    .replace(/[.?!،؟\s]+$/, "")
    .trim();
}

/**
 * Automatically learns command patterns based on repetition.
 * If the exact clean command has been successfully processed in the logs,
 * it saves it to the local cache.
 */
export function learnCommandPattern(
  command: string,
  response: string,
  success: boolean,
  actionResult: any,
) {
  if (!success) return;

  const cleanCmd = cleanCommandText(command);

  // Load existing learned commands
  const learnedFile = path.join(TMP_DIR, "voice-learned-commands.json");
  let learned: Record<string, any> = {};
  try {
    if (fs.existsSync(learnedFile)) {
      learned = JSON.parse(fs.readFileSync(learnedFile, "utf-8"));
    }
  } catch (err) {
    console.error("Failed to read learned commands file:", err);
  }

  // If already learned, no need to do anything
  if (learned[cleanCmd]) return;

  // Search logs to see if this command was executed successfully before
  const logs = getLocalVoiceLogs();
  const priorMatches = logs.filter(
    (log) => cleanCommandText(log.command) === cleanCmd && log.success,
  );

  // If it appeared before (at least once successfully), learn it!
  if (priorMatches.length >= 1) {
    learned[cleanCmd] = actionResult;
    try {
      fs.writeFileSync(learnedFile, JSON.stringify(learned, null, 2), "utf-8");
      console.log(
        `[Voice Assistant] Learned new command pattern: "${cleanCmd}"`,
      );
    } catch (err) {
      console.error("Failed to save learned command pattern:", err);
    }
  }
}

/**
 * Resolves a command from the local cache if it was learned before.
 */
export function getLearnedCommand(command: string): any | null {
  const cleanCmd = cleanCommandText(command);
  const learnedFile = path.join(TMP_DIR, "voice-learned-commands.json");
  try {
    if (fs.existsSync(learnedFile)) {
      const learned = JSON.parse(fs.readFileSync(learnedFile, "utf-8"));
      return learned[cleanCmd] || null;
    }
  } catch (err) {
    console.error("Failed to read learned commands file:", err);
  }
  return null;
}
