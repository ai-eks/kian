export interface FeishuWsHeartbeatState {
  startedAt: number;
  lastSignalAt: number;
  lastSignalKind: "start" | "ping" | "pong" | "event";
  lastPingAt: number;
  lastPongAt: number;
  lastEventAt: number;
  lastUnackedPingAt: number;
}

export interface FeishuWsHealthConfig {
  pongTimeoutMs: number;
  silenceTimeoutMs: number;
}

export type FeishuWsHealthStatus =
  | { healthy: true }
  | {
      healthy: false;
      reason: "pong_timeout" | "heartbeat_silence";
      silenceMs: number;
      pendingPongMs?: number;
      lastSignalKind: FeishuWsHeartbeatState["lastSignalKind"];
      lastPingAt: number;
      lastPongAt: number;
      lastEventAt: number;
      lastUnackedPingAt: number;
    };

export const createFeishuWsHeartbeatState = (
  now: number = Date.now(),
): FeishuWsHeartbeatState => ({
  startedAt: now,
  lastSignalAt: now,
  lastSignalKind: "start",
  lastPingAt: 0,
  lastPongAt: 0,
  lastEventAt: 0,
  lastUnackedPingAt: 0,
});

export const markFeishuWsHeartbeatPing = (
  state: FeishuWsHeartbeatState,
  now: number = Date.now(),
): void => {
  state.lastPingAt = now;
  state.lastSignalAt = now;
  state.lastSignalKind = "ping";
  if (state.lastUnackedPingAt <= 0) {
    state.lastUnackedPingAt = now;
  }
};

export const markFeishuWsHeartbeatPong = (
  state: FeishuWsHeartbeatState,
  now: number = Date.now(),
): void => {
  state.lastPongAt = now;
  state.lastSignalAt = now;
  state.lastSignalKind = "pong";
  state.lastUnackedPingAt = 0;
};

export const markFeishuWsHeartbeatEvent = (
  state: FeishuWsHeartbeatState,
  now: number = Date.now(),
): void => {
  state.lastEventAt = now;
  state.lastSignalAt = now;
  state.lastSignalKind = "event";
  state.lastUnackedPingAt = 0;
};

export const getFeishuWsHealthStatus = (
  state: FeishuWsHeartbeatState,
  now: number = Date.now(),
  config: FeishuWsHealthConfig,
): FeishuWsHealthStatus => {
  const silenceMs = now - Math.max(state.lastSignalAt, state.startedAt);
  if (state.lastUnackedPingAt > 0) {
    const pendingPongMs = now - state.lastUnackedPingAt;
    if (pendingPongMs > config.pongTimeoutMs) {
      return {
        healthy: false,
        reason: "pong_timeout",
        silenceMs,
        pendingPongMs,
        lastSignalKind: state.lastSignalKind,
        lastPingAt: state.lastPingAt,
        lastPongAt: state.lastPongAt,
        lastEventAt: state.lastEventAt,
        lastUnackedPingAt: state.lastUnackedPingAt,
      };
    }
  }

  if (silenceMs > config.silenceTimeoutMs) {
    return {
      healthy: false,
      reason: "heartbeat_silence",
      silenceMs,
      lastSignalKind: state.lastSignalKind,
      lastPingAt: state.lastPingAt,
      lastPongAt: state.lastPongAt,
      lastEventAt: state.lastEventAt,
      lastUnackedPingAt: state.lastUnackedPingAt,
    };
  }

  return { healthy: true };
};
