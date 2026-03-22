import {
  createWeixinAdapterClient,
  type WeixinInboundMessage,
} from "../src/index.js";

type KianReply = {
  text: string;
};

async function routeIntoKian(message: WeixinInboundMessage): Promise<KianReply | null> {
  if (!message.text) {
    return null;
  }

  // Replace this stub with Kian's session mapping, agent routing, and reply generation.
  return {
    text: `[Kian] ${message.text}`,
  };
}

async function main(): Promise<void> {
  const client = createWeixinAdapterClient({
    stateDir: process.env.KIAN_STATE_DIR,
  });

  const qr = await client.startQrLogin();
  console.log("Scan this QR code URL with WeChat:", qr.qrCodeUrl);

  const login = await client.waitForQrLogin({
    sessionKey: qr.sessionKey,
  });

  if (!login.connected || !login.account) {
    throw new Error(login.message);
  }

  client.on("message", async (message) => {
    try {
      const reply = await routeIntoKian(message);
      if (!reply?.text) {
        return;
      }

      await client.sendText({
        accountId: message.accountId,
        toUserId: message.fromUserId,
        text: reply.text,
        contextToken: message.contextToken,
      });
    } catch (error) {
      console.error("failed to process inbound message", error);
    }
  });

  client.on("error", (event) => {
    console.error(`polling error for ${event.accountId}`, event.error);
  });

  await client.startPolling({
    accountId: login.account.accountId,
  });

  console.log(`Polling started for ${login.account.accountId}`);
}

void main();
