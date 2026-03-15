import { describe, expect, it } from "vitest";
import {
  createFeishuWsHeartbeatState,
  getFeishuWsHealthStatus,
  markFeishuWsHeartbeatEvent,
  markFeishuWsHeartbeatPing,
  markFeishuWsHeartbeatPong,
} from "../../electron/main/services/chatChannel/feishuWsHeartbeat";

const HEALTH_CONFIG = {
  pongTimeoutMs: 180_000,
  silenceTimeoutMs: 360_000,
};

describe("feishuWsHeartbeat", () => {
  it("marks repeated ping without pong as unhealthy", () => {
    const state = createFeishuWsHeartbeatState(0);

    markFeishuWsHeartbeatPing(state, 1_000);
    markFeishuWsHeartbeatPing(state, 120_000);

    expect(getFeishuWsHealthStatus(state, 190_500, HEALTH_CONFIG)).toEqual({
      healthy: false,
      reason: "pong_timeout",
      silenceMs: 70_500,
      pendingPongMs: 189_500,
      lastSignalKind: "ping",
      lastPingAt: 120_000,
      lastPongAt: 0,
      lastEventAt: 0,
      lastUnackedPingAt: 1_000,
    });
  });

  it("clears pending heartbeat timeout after pong", () => {
    const state = createFeishuWsHeartbeatState(0);

    markFeishuWsHeartbeatPing(state, 1_000);
    markFeishuWsHeartbeatPong(state, 2_000);

    expect(getFeishuWsHealthStatus(state, 190_500, HEALTH_CONFIG)).toEqual({
      healthy: true,
    });
  });

  it("treats inbound events as healthy traffic", () => {
    const state = createFeishuWsHeartbeatState(0);

    markFeishuWsHeartbeatPing(state, 1_000);
    markFeishuWsHeartbeatEvent(state, 2_500);

    expect(getFeishuWsHealthStatus(state, 200_000, HEALTH_CONFIG)).toEqual({
      healthy: true,
    });
  });

  it("marks long heartbeat silence as unhealthy", () => {
    const state = createFeishuWsHeartbeatState(10_000);

    expect(getFeishuWsHealthStatus(state, 400_500, HEALTH_CONFIG)).toEqual({
      healthy: false,
      reason: "heartbeat_silence",
      silenceMs: 390_500,
      lastSignalKind: "start",
      lastPingAt: 0,
      lastPongAt: 0,
      lastEventAt: 0,
      lastUnackedPingAt: 0,
    });
  });
});
