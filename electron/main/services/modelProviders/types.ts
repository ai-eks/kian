export type ImageAspectRatio =
  | 'auto'
  | '21:9'
  | '16:9'
  | '3:2'
  | '4:3'
  | '5:4'
  | '1:1'
  | '4:5'
  | '3:4'
  | '2:3'
  | '9:16';
export type VideoAspectRatio =
  | 'auto'
  | 'auto_prefer_portrait'
  | '21:9'
  | '16:9'
  | '4:3'
  | '1:1'
  | '3:4'
  | '9:16';

export type ImageResolution = '4K' | '2K' | '1K' | '1080p' | '720p';
export type VideoResolution = '4k' | '2k' | '1080p' | '720p' | '480p';

export interface GenerateImageInput {
  model_id: string;
  prompt: string;
  aspect_ratio?: ImageAspectRatio;
  resolution?: ImageResolution;
  images?: string[];
}

export interface GenerateVideoInput {
  model_id: string;
  prompt?: string;
  start_image?: string;
  end_image?: string;
  aspect_ratio?: VideoAspectRatio;
  resolution?: VideoResolution;
  duration?: string | number;
  enable_audio?: boolean;
  camera_fixed?: boolean;
  seed?: string | number;
  enable_safety_checker?: boolean;
  audio?: string;
  elements?: Array<{
    frontal_image?: string;
    reference_images?: string[];
    video?: string;
  }>;
}

export type ModelCapability = 'image' | 'video' | 'audio';

export interface ProviderModelInfo {
  modelId: string;
  modelDescription: string;
  capability: ModelCapability;
}

export interface ProviderGenerateResult {
  savedPath: string;
  sourceUrl?: string;
  requestPayload: Record<string, unknown>;
  responsePayload: unknown;
  notes: string[];
}

export interface ModelProvider {
  listModels(): Promise<ProviderModelInfo[]>;
  generateImage(input: GenerateImageInput): Promise<ProviderGenerateResult>;
  generateVideo(input: GenerateVideoInput): Promise<ProviderGenerateResult>;
}
