type CircuitState = "CLOSED" | "OPEN" | "HALF-OPEN";

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private lastStateChange: number = Date.now();

  private readonly failureThreshold: number;
  private readonly cooldownPeriodMs: number;
  private readonly successThreshold: number;

  constructor(
    failureThreshold = 3,
    cooldownPeriodMs = 15000, // 15 seconds cooldown
    successThreshold = 2,
  ) {
    this.failureThreshold = failureThreshold;
    this.cooldownPeriodMs = cooldownPeriodMs;
    this.successThreshold = successThreshold;
  }

  public getState(): CircuitState {
    // If OPEN, check if cooldown period has elapsed
    if (this.state === "OPEN") {
      const elapsed = Date.now() - this.lastStateChange;
      if (elapsed > this.cooldownPeriodMs) {
        this.setState("HALF-OPEN");
        console.warn(
          "[CircuitBreaker] Cooldown elapsed. State changed to HALF-OPEN.",
        );
      }
    }
    return this.state;
  }

  private setState(state: CircuitState) {
    this.state = state;
    this.lastStateChange = Date.now();
  }

  public async execute<T>(
    action: () => Promise<T>,
    fallback: () => T,
  ): Promise<T> {
    const currentState = this.getState();

    if (currentState === "OPEN") {
      console.warn(
        "[CircuitBreaker] Circuit is OPEN. Blocking request, returning fallback.",
      );
      return fallback();
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      return fallback();
    }
  }

  private onSuccess() {
    this.failureCount = 0;

    if (this.state === "HALF-OPEN") {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.setState("CLOSED");
        this.successCount = 0;
        console.log("[CircuitBreaker] Circuit returned to CLOSED (Healthy).");
      }
    }
  }

  private onFailure(error: any) {
    console.error("[CircuitBreaker] Execution failed:", error);
    this.failureCount++;
    this.successCount = 0;

    if (this.state === "CLOSED" && this.failureCount >= this.failureThreshold) {
      this.setState("OPEN");
      console.error(
        "[CircuitBreaker] Failure threshold met. Circuit TRIPPED to OPEN.",
      );
    } else if (this.state === "HALF-OPEN") {
      this.setState("OPEN");
      console.error(
        "[CircuitBreaker] HALF-OPEN request failed. Circuit returned to OPEN.",
      );
    }
  }
}

// Global instance map for different services (e.g. database, external api)
const breakers: Record<string, CircuitBreaker> = {};

export function getCircuitBreaker(
  serviceName: string,
  config?: { failureThreshold?: number; cooldownPeriodMs?: number },
): CircuitBreaker {
  if (!breakers[serviceName]) {
    breakers[serviceName] = new CircuitBreaker(
      config?.failureThreshold,
      config?.cooldownPeriodMs,
    );
  }
  return breakers[serviceName];
}
