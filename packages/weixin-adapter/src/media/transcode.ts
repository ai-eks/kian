export interface TranscodeVoiceIfNeededOptions {
  inputPath: string;
  outputPath?: string;
}

export async function transcodeVoiceIfNeeded(
  _options: TranscodeVoiceIfNeededOptions,
): Promise<never> {
  throw new Error("transcodeVoiceIfNeeded is reserved for the media phase and is not implemented in MVP");
}
