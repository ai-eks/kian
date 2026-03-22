# @kian/weixin-adapter

`@kian/weixin-adapter` is a standalone Node.js package extracted from the reusable protocol parts of `@tencent-weixin/openclaw-weixin`, with all `openclaw/plugin-sdk` runtime coupling removed.

Current MVP scope:

- QR-code login
- local account storage
- long-poll `getUpdates`
- inbound message parsing
- send text message replies
- typed event mechanism
- reserved media APIs for the next phase

This package does **not** implement Kian session routing, agent dispatch, reply policy, storage strategy, or UI logic.

## Protocol Notice

This adapter talks to the same upstream endpoints used by the reference implementation:

- `https://ilinkai.weixin.qq.com`
- `https://novac2c.cdn.weixin.qq.com/c2c`

This is **not** the public official WeChat open platform API. Availability depends on the protocol backend remaining reachable. Use at your own risk and review compliance requirements before production use.

## Install

```bash
cd libs/weixin-adapter
npm install
npm run build
```

## Quick Start

```ts
import { createWeixinAdapterClient } from "@kian/weixin-adapter";

const client = createWeixinAdapterClient({
  stateDir: process.env.KIAN_STATE_DIR,
});

const qr = await client.startQrLogin();
console.log("Scan QR:", qr.qrCodeUrl);

const login = await client.waitForQrLogin({
  sessionKey: qr.sessionKey,
});

if (!login.connected || !login.account) {
  throw new Error(login.message);
}

client.on("message", async (message) => {
  console.log("inbound:", message.fromUserId, message.text);

  if (!message.text) {
    return;
  }

  await client.sendText({
    accountId: message.accountId,
    toUserId: message.fromUserId,
    text: `echo: ${message.text}`,
    contextToken: message.contextToken,
  });
});

await client.startPolling({ accountId: login.account.accountId });
```

## Exported API

Core exports:

- `createWeixinAdapterClient()`
- `WeixinAdapterClient`
- `createFileAccountStore()`
- `FileWeixinAccountStore`
- `startQrLogin()`
- `waitForQrLogin()`
- `getUpdates()`
- `sendMessage()`
- `sendTyping()`
- `getConfig()`
- `getUploadUrl()`
- `parseInboundMessage()`
- `normalizeAccountId()`

Reserved media exports:

- `uploadLocalFile()`
- `sendMedia()`
- `downloadInboundMedia()`
- `transcodeVoiceIfNeeded()`

The reserved media functions currently throw a clear "not implemented in MVP" error.

## Storage Layout

Default state dir resolution:

1. `KIAN_WEIXIN_ADAPTER_STATE_DIR`
2. `KIAN_STATE_DIR`
3. `OPENCLAW_STATE_DIR`
4. `CLAWDBOT_STATE_DIR`
5. `~/.kian`

Files are stored under:

```text
<stateDir>/weixin-adapter/accounts/
  <accountId>.json
  <accountId>.sync.json
```

Account files are written with best-effort `0600` permissions.

## Events

`WeixinAdapterClient` emits:

- `message`: parsed inbound message
- `status`: polling lifecycle and QR login status
- `error`: polling/runtime errors
- `raw`: raw upstream `WeixinMessage`

## Minimal Kian Integration Example

See [examples/kian-minimal-integration.ts](./examples/kian-minimal-integration.ts).

The example keeps Kian responsibilities outside the package:

- map inbound message to Kian session
- decide agent routing
- generate reply text
- call `client.sendText()`

## Known Gaps

Implemented in MVP:

- QR login session lifecycle
- account save/load/list/remove
- polling cursor persistence
- text message receive/send
- evented client API

Not implemented yet:

- media upload/download
- voice transcoding
- retry classification and stronger reconnect policy
- integration tests
- Kian session/router adapters beyond the minimal example

## Source Note

Protocol details were adapted from the local reference package `@tencent-weixin/openclaw-weixin` `1.0.2` and reorganized into a host-agnostic package shape suitable for Kian.
