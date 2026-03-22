export interface DownloadInboundMediaOptions {
  accountId: string;
  messageId: string;
  targetDir?: string;
}

export async function downloadInboundMedia(_options: DownloadInboundMediaOptions): Promise<never> {
  throw new Error("downloadInboundMedia is reserved for the media phase and is not implemented in MVP");
}
