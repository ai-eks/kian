export interface UploadLocalFileOptions {
  accountId: string;
  filePath: string;
  toUserId: string;
}

export interface SendMediaOptions {
  accountId: string;
  toUserId: string;
  contextToken?: string;
  filePath?: string;
  remoteUrl?: string;
  fileName?: string;
  text?: string;
}

function notImplemented(name: string): never {
  throw new Error(`${name} is reserved for the media phase and is not implemented in MVP`);
}

export async function uploadLocalFile(_options: UploadLocalFileOptions): Promise<never> {
  return notImplemented("uploadLocalFile");
}

export async function sendMedia(_options: SendMediaOptions): Promise<never> {
  return notImplemented("sendMedia");
}
