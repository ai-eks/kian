import os from "node:os";
import path from "node:path";

export function resolveStateDir(explicitStateDir?: string): string {
  if (explicitStateDir?.trim()) {
    return explicitStateDir;
  }

  return (
    process.env.KIAN_WEIXIN_ADAPTER_STATE_DIR?.trim() ||
    process.env.KIAN_STATE_DIR?.trim() ||
    process.env.OPENCLAW_STATE_DIR?.trim() ||
    process.env.CLAWDBOT_STATE_DIR?.trim() ||
    path.join(os.homedir(), ".kian")
  );
}

export function resolveWeixinAdapterStateDir(explicitStateDir?: string): string {
  return path.join(resolveStateDir(explicitStateDir), "weixin-adapter");
}
