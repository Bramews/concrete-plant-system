/**
 * Offline-first Synchronization Engine for Concrete Plant System
 */

export interface OfflineTask {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
}

export class OfflineSync {
  private static CACHE_KEY = "offline_sync_queue";

  static isOnline(): boolean {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  }

  static getQueue(): OfflineTask[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(this.CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveQueue(queue: OfflineTask[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(queue));
  }

  static enqueueTask(type: string, payload: any) {
    if (typeof window === "undefined") return;

    const task: OfflineTask = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now(),
    };

    const queue = this.getQueue();
    queue.push(task);
    this.saveQueue(queue);

    // If online, immediately try to sync
    if (this.isOnline()) {
      this.syncQueue();
    }
  }

  static async syncQueue() {
    if (typeof window === "undefined") return;
    if (!this.isOnline()) return;

    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`[OfflineSync] Found ${queue.length} tasks to synchronize...`);
    const remainingTasks: OfflineTask[] = [];

    for (const task of queue) {
      try {
        let success = false;

        if (task.type === "ACCESS_LOG") {
          // Sync access logs via API
          const res = await fetch("/api/network/check-access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task.payload),
          });
          success = res.ok;
        } else if (task.type === "BROADCAST_EVENT") {
          // Sync offline broadcast event
          const res = await fetch("/api/network/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task.payload),
          });
          success = res.ok;
        } else {
          // Generic post fallback for other forms/actions
          const res = await fetch(
            `/api/offline-sync/${task.type.toLowerCase()}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(task.payload),
            },
          );
          success = res.ok;
        }

        if (!success) {
          remainingTasks.push(task);
        }
      } catch (err) {
        console.error(`[OfflineSync] Sync failed for task ${task.id}:`, err);
        remainingTasks.push(task);
      }
    }

    this.saveQueue(remainingTasks);
    if (remainingTasks.length === 0) {
      console.log("[OfflineSync] Synchronization completed successfully.");
    } else {
      console.warn(
        `[OfflineSync] ${remainingTasks.length} tasks could not be synchronized and remain in queue.`,
      );
    }
  }
}

// Register browser online event listener
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    OfflineSync.syncQueue();
  });
}
