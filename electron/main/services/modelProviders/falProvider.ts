import { promises as fs } from 'node:fs';
import path from 'node:path';
import { logger } from '../logger';
import type {
  GenerateImageInput,
  GenerateVideoInput,
  ImageAspectRatio,
  ImageResolution,
  ModelProvider,
  ProviderGenerateResult,
  ProviderModelInfo,
  VideoAspectRatio,
  VideoResolution
} from './types';

const FAL_QUEUE_BASE_URL = 'https://queue.fal.run';
const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 8 * 60_000;

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.webm', '.m4v', '.m3u8']);

export const FAL_SUPPORTED_MODELS: ProviderModelInfo[] = [
  {
    modelId: 'fal-ai/bytedance/seedream/v4.5/text-to-image',
    capability: 'image',
    modelDescription: '图像生成（高质量文生图），适合角色设定图、海报风格镜头和高细节概念图。'
  },
  {
    modelId: 'fal-ai/flux/dev',
    capability: 'image',
    modelDescription: '图像生成（通用高质量），适合分镜草图到精修图的迭代。'
  },
  {
    modelId: 'fal-ai/flux/schnell',
    capability: 'image',
    modelDescription: '图像生成（快速低延迟），适合前期创意探索与快速出图。'
  },
  {
    modelId: 'fal-ai/nano-banana',
    capability: 'image',
    modelDescription: '图像生成与编辑（Google Nano Banana），适合通用创意出图和快速图像改写。'
  },
  {
    modelId: 'fal-ai/nano-banana/edit',
    capability: 'image',
    modelDescription: '图像编辑（Google Nano Banana Edit），支持多图输入进行重绘、替换和局部编辑。'
  },
  {
    modelId: 'fal-ai/nano-banana-pro',
    capability: 'image',
    modelDescription: '图像生成与编辑（Google Nano Banana Pro），支持 1K/2K/4K，适合高质量输出。'
  },
  {
    modelId: 'fal-ai/nano-banana-pro/edit',
    capability: 'image',
    modelDescription: '图像编辑（Google Nano Banana Pro Edit），支持多图输入与 1K/2K/4K 输出。'
  },
  {
    modelId: 'fal-ai/bytedance/seedance/v1/lite/image-to-video',
    capability: 'video',
    modelDescription: '视频生成（图生视频，轻量版），适合预演动画、分镜动态化和快速样片。'
  },
  {
    modelId: 'fal-ai/bytedance/seedance/v1/pro/image-to-video',
    capability: 'video',
    modelDescription: '视频生成（图生视频，质量优先），适合关键镜头和更平滑动作生成。'
  },
  {
    modelId: 'fal-ai/bytedance/seedance/v1.5/pro/image-to-video',
    capability: 'video',
    modelDescription: '视频生成（图生视频，v1.5 Pro），支持更丰富动态、720p/1080p 与可选生成音频。'
  },
  {
    modelId: 'fal-ai/kling-video/v1/pro/text-to-video',
    capability: 'video',
    modelDescription: 'Kling v1 Pro 文生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/v1/pro/image-to-video',
    capability: 'video',
    modelDescription: 'Kling v1 Pro 图生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/v1.5/pro/text-to-video',
    capability: 'video',
    modelDescription: 'Kling v1.5 Pro 文生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/v1.6/pro/text-to-video',
    capability: 'video',
    modelDescription: 'Kling v1.6 Pro 文生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/v1.6/pro/image-to-video',
    capability: 'video',
    modelDescription: 'Kling v1.6 Pro 图生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/v2.1/standard/image-to-video',
    capability: 'video',
    modelDescription: 'Kling v2.1 Standard 图生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/v2.5-turbo/standard/image-to-video',
    capability: 'video',
    modelDescription: 'Kling v2.5 Turbo Standard 图生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
    capability: 'video',
    modelDescription: 'Kling v2.5 Turbo Pro 图生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/v2.6/pro/text-to-video',
    capability: 'video',
    modelDescription: 'Kling v2.6 Pro 文生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/v2.6/pro/image-to-video',
    capability: 'video',
    modelDescription: 'Kling v2.6 Pro 图生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/v3/standard/text-to-video',
    capability: 'video',
    modelDescription: 'Kling v3 Standard 文生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/v3/pro/text-to-video',
    capability: 'video',
    modelDescription: 'Kling v3 Pro 文生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/v3/standard/image-to-video',
    capability: 'video',
    modelDescription: 'Kling v3 Standard 图生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/v3/pro/image-to-video',
    capability: 'video',
    modelDescription: 'Kling v3 Pro 图生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/o1/image-to-video',
    capability: 'video',
    modelDescription: 'Kling O1 图生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/o3/standard/image-to-video',
    capability: 'video',
    modelDescription: 'Kling O3 Standard 图生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/o3/pro/image-to-video',
    capability: 'video',
    modelDescription: 'Kling O3 Pro 图生视频。'
  },
  {
    modelId: 'fal-ai/veo2',
    capability: 'video',
    modelDescription: 'Google Veo 2 文生视频。'
  },
  {
    modelId: 'fal-ai/veo2/image-to-video',
    capability: 'video',
    modelDescription: 'Google Veo 2 图生视频。'
  },
  {
    modelId: 'fal-ai/veo3',
    capability: 'video',
    modelDescription: 'Google Veo 3 文生视频。'
  },
  {
    modelId: 'fal-ai/veo3/fast',
    capability: 'video',
    modelDescription: 'Google Veo 3 Fast 文生视频。'
  },
  {
    modelId: 'fal-ai/veo3/image-to-video',
    capability: 'video',
    modelDescription: 'Google Veo 3 图生视频。'
  },
  {
    modelId: 'fal-ai/veo3/fast/image-to-video',
    capability: 'video',
    modelDescription: 'Google Veo 3 Fast 图生视频。'
  },
  {
    modelId: 'fal-ai/veo3.1',
    capability: 'video',
    modelDescription: 'Google Veo 3.1 文生视频。'
  },
  {
    modelId: 'fal-ai/veo3.1/fast',
    capability: 'video',
    modelDescription: 'Google Veo 3.1 Fast 文生视频。'
  },
  {
    modelId: 'fal-ai/veo3.1/image-to-video',
    capability: 'video',
    modelDescription: 'Google Veo 3.1 图生视频。'
  },
  {
    modelId: 'fal-ai/veo3.1/fast/image-to-video',
    capability: 'video',
    modelDescription: 'Google Veo 3.1 Fast 图生视频。'
  },
  {
    modelId: 'fal-ai/veo3.1/reference-to-video',
    capability: 'video',
    modelDescription: 'Google Veo 3.1 参考图到视频。'
  },
  {
    modelId: 'fal-ai/veo3.1/first-last-frame-to-video',
    capability: 'video',
    modelDescription: 'Google Veo 3.1 首尾帧生视频。'
  },
  {
    modelId: 'fal-ai/veo3.1/fast/first-last-frame-to-video',
    capability: 'video',
    modelDescription: 'Google Veo 3.1 Fast 首尾帧生视频。'
  },
  {
    modelId: 'fal-ai/kling-video/video-to-audio',
    capability: 'audio',
    modelDescription: 'Kling 视频生音频。'
  },
  {
    modelId: 'fal-ai/lyria2',
    capability: 'audio',
    modelDescription: 'Google Lyria 2 音乐生成。'
  }
];

interface FalVideoModelConfig {
  aspectRatios: readonly VideoAspectRatio[];
  defaultAspectRatio: VideoAspectRatio;
  resolutions: readonly VideoResolution[];
  defaultResolution: VideoResolution;
  minDuration: number;
  maxDuration: number;
  supportsGenerateAudio: boolean;
  supportsCameraFixed: boolean;
  supportsSeed: boolean;
  supportsSafetyChecker: boolean;
}

interface FalImageModelConfig {
  aspectRatios: readonly ImageAspectRatio[];
  defaultAspectRatio: ImageAspectRatio;
  resolutions?: readonly ImageResolution[];
  defaultResolution?: ImageResolution;
  requiresImageUrls?: boolean;
  disallowImageUrls?: boolean;
}

const LEGACY_IMAGE_SIZE_MODEL_ASPECT_RATIOS: readonly ImageAspectRatio[] = ['16:9', '9:16', '1:1'];

const FAL_IMAGE_MODEL_CONFIGS: Record<string, FalImageModelConfig> = {
  'fal-ai/nano-banana': {
    aspectRatios: ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'],
    defaultAspectRatio: '1:1',
    disallowImageUrls: true
  },
  'fal-ai/nano-banana/edit': {
    aspectRatios: ['auto', '21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'],
    defaultAspectRatio: 'auto',
    requiresImageUrls: true
  },
  'fal-ai/nano-banana-pro': {
    aspectRatios: ['auto', '21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'],
    defaultAspectRatio: '1:1',
    resolutions: ['4K', '2K', '1K'],
    defaultResolution: '1K',
    disallowImageUrls: true
  },
  'fal-ai/nano-banana-pro/edit': {
    aspectRatios: ['auto', '21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'],
    defaultAspectRatio: 'auto',
    resolutions: ['4K', '2K', '1K'],
    defaultResolution: '1K',
    requiresImageUrls: true
  }
};

const FAL_VIDEO_MODEL_CONFIGS: Record<string, FalVideoModelConfig> = {
  'fal-ai/bytedance/seedance/v1/lite/image-to-video': {
    aspectRatios: ['auto', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
    defaultAspectRatio: 'auto',
    resolutions: ['720p', '480p'],
    defaultResolution: '720p',
    minDuration: 2,
    maxDuration: 12,
    supportsGenerateAudio: false,
    supportsCameraFixed: true,
    supportsSeed: true,
    supportsSafetyChecker: true
  },
  'fal-ai/bytedance/seedance/v1/pro/image-to-video': {
    aspectRatios: ['auto', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
    defaultAspectRatio: 'auto',
    resolutions: ['1080p', '720p'],
    defaultResolution: '1080p',
    minDuration: 2,
    maxDuration: 12,
    supportsGenerateAudio: false,
    supportsCameraFixed: true,
    supportsSeed: true,
    supportsSafetyChecker: true
  },
  'fal-ai/bytedance/seedance/v1.5/pro/image-to-video': {
    aspectRatios: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
    defaultAspectRatio: '16:9',
    resolutions: ['1080p', '720p', '480p'],
    defaultResolution: '720p',
    minDuration: 4,
    maxDuration: 12,
    supportsGenerateAudio: true,
    supportsCameraFixed: true,
    supportsSeed: true,
    supportsSafetyChecker: true
  }
};

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const asObject = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null;

const getString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const sanitizeModelId = (modelId: string): string => modelId.trim().replace(/^\/+|\/+$/g, '');

const safeFileToken = (value: string, fallback: string): string => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 48);
  return normalized || fallback;
};

const getExtensionFromContentType = (contentType?: string, fallback = '.bin'): string => {
  if (!contentType) return fallback;
  const normalized = contentType.toLowerCase().split(';')[0]?.trim();
  if (!normalized) return fallback;

  if (normalized.includes('png')) return '.png';
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return '.jpg';
  if (normalized.includes('webp')) return '.webp';
  if (normalized.includes('gif')) return '.gif';
  if (normalized.includes('avif')) return '.avif';
  if (normalized.includes('mp4')) return '.mp4';
  if (normalized.includes('webm')) return '.webm';
  if (normalized.includes('quicktime')) return '.mov';
  if (normalized.includes('mpegurl')) return '.m3u8';
  return fallback;
};

const getExtensionFromUrl = (url: string): string | undefined => {
  try {
    const parsed = new URL(url);
    const ext = path.extname(parsed.pathname).toLowerCase();
    return ext || undefined;
  } catch {
    const ext = path.extname(url).toLowerCase();
    return ext || undefined;
  }
};

const maybeUnwrapFalData = (payload: unknown): unknown => {
  const obj = asObject(payload);
  if (!obj) return payload;
  if ('response' in obj && obj.response !== undefined) {
    return obj.response;
  }
  if ('data' in obj && obj.data !== undefined) {
    return obj.data;
  }
  if ('output' in obj && obj.output !== undefined) {
    return obj.output;
  }
  return payload;
};

const toDataUri = async (input: string, projectCwd: string): Promise<string> => {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('媒体输入不能为空');
  }
  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) {
    return trimmed;
  }

  const absolutePath = path.isAbsolute(trimmed) ? trimmed : path.resolve(projectCwd, trimmed);
  const ext = path.extname(absolutePath).toLowerCase();
  const mimeByExt: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.avif': 'image/avif',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4'
  };
  const mime = mimeByExt[ext] ?? 'application/octet-stream';
  const content = await fs.readFile(absolutePath);
  return `data:${mime};base64,${content.toString('base64')}`;
};

interface UrlCandidate {
  url: string;
  pathHint: string;
}

const normalizeSnippet = (value: string, maxLength = 240): string =>
  value.replace(/\s+/g, ' ').trim().slice(0, maxLength);

const isQueueEndpointUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host === 'queue.fal.run' || host === 'fal.run' || host === 'ws.fal.run';
  } catch {
    return false;
  }
};

const isLikelyApiStatusUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    return (
      isQueueEndpointUrl(url) ||
      pathname.includes('/requests/') ||
      pathname.endsWith('/status') ||
      pathname.endsWith('/response')
    );
  } catch {
    return false;
  }
};

const scoreCandidateUrl = (input: UrlCandidate, capability: 'image' | 'video'): number => {
  if (!/^https?:\/\//i.test(input.url)) return Number.NEGATIVE_INFINITY;

  const allowedExt = capability === 'image' ? IMAGE_EXTENSIONS : VIDEO_EXTENSIONS;
  const primaryHint = capability === 'image' ? /(image|images|thumbnail|preview|result|output)/i : /(video|videos|clip|result|output)/i;
  const secondaryHint = capability === 'image' ? /(video|audio)/i : /(image|audio)/i;

  let score = 0;
  const url = input.url;
  const pathHint = input.pathHint;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    const ext = getExtensionFromUrl(url);

    if (host === 'queue.fal.run' || host === 'fal.run' || host === 'ws.fal.run') {
      score -= 220;
    }
    if (pathname.includes('/requests/') || pathname.endsWith('/status')) {
      score -= 120;
    }
    if (host.includes('fal.media')) {
      score += 70;
    }
    if (host.includes('cloudfront.net') || host.includes('storage.googleapis.com')) {
      score += 20;
    }

    if (ext) {
      score += allowedExt.has(ext) ? 80 : -80;
    } else {
      score -= 10;
    }
  } catch {
    score -= 60;
  }

  if (primaryHint.test(pathHint)) {
    score += 50;
  }
  if (secondaryHint.test(pathHint)) {
    score -= 25;
  }

  return score;
};

const collectUrlCandidates = (payload: unknown): UrlCandidate[] => {
  const candidates: UrlCandidate[] = [];
  const seen = new Set<unknown>();
  const queue: Array<{ value: unknown; pathHint: string }> = [{ value: payload, pathHint: 'root' }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const { value, pathHint } = current;
    if (!value || seen.has(value)) continue;
    seen.add(value);

    if (typeof value === 'string') {
      if (/^https?:\/\//i.test(value)) {
        candidates.push({ url: value, pathHint });
      }
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        queue.push({ value: item, pathHint: `${pathHint}[${index}]` });
      });
      continue;
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      for (const [key, nested] of Object.entries(obj)) {
        const nextHint = `${pathHint}.${key}`;
        if (key.toLowerCase() === 'url') {
          const explicitUrl = getString(nested);
          if (explicitUrl && /^https?:\/\//i.test(explicitUrl)) {
            candidates.push({ url: explicitUrl, pathHint: nextHint });
            continue;
          }
        }
        queue.push({ value: nested, pathHint: nextHint });
      }
    }
  }

  return candidates;
};

const findUrlCandidatesInUnknown = (payload: unknown, capability: 'image' | 'video'): UrlCandidate[] => {
  const rawCandidates = collectUrlCandidates(payload);
  const dedup = new Map<string, UrlCandidate>();
  for (const candidate of rawCandidates) {
    if (!dedup.has(candidate.url)) {
      dedup.set(candidate.url, candidate);
    }
  }
  return [...dedup.values()].sort(
    (a, b) => scoreCandidateUrl(b, capability) - scoreCandidateUrl(a, capability)
  );
};

const findDownloadableUrlCandidatesInUnknown = (
  payload: unknown,
  capability: 'image' | 'video'
): UrlCandidate[] =>
  findUrlCandidatesInUnknown(payload, capability).filter(
    (candidate) => !isLikelyApiStatusUrl(candidate.url)
  );

const getMediaUrlFromKnownSchema = (payload: unknown, capability: 'image' | 'video'): string | undefined => {
  const root = asObject(payload);
  if (!root) return undefined;

  const getUrlFromObject = (value: unknown): string | undefined => {
    const obj = asObject(value);
    if (!obj) return undefined;
    const url = getString(obj.url);
    if (url && /^https?:\/\//i.test(url)) return url;
    return undefined;
  };

  if (capability === 'image') {
    if (Array.isArray(root.images)) {
      for (const item of root.images) {
        const url = getUrlFromObject(item);
        if (url) return url;
      }
    }
    const imageUrlFromObject = getUrlFromObject(root.image);
    if (imageUrlFromObject) return imageUrlFromObject;
    const imageUrl = getString(root.image_url);
    if (imageUrl && /^https?:\/\//i.test(imageUrl)) return imageUrl;
  }

  if (capability === 'video') {
    const videoUrlFromObject = getUrlFromObject(root.video);
    if (videoUrlFromObject) return videoUrlFromObject;
    if (Array.isArray(root.videos)) {
      for (const item of root.videos) {
        const url = getUrlFromObject(item);
        if (url) return url;
      }
    }
    const videoUrl = getString(root.video_url);
    if (videoUrl && /^https?:\/\//i.test(videoUrl)) return videoUrl;
  }

  return undefined;
};

const getImageSizeByAspectRatio = (aspectRatio: ImageAspectRatio): string => {
  if (aspectRatio === '1:1') return 'square_hd';
  if (aspectRatio === '9:16') return 'portrait_16_9';
  return 'landscape_16_9';
};

type FalVideoMode = 'text-to-video' | 'image-to-video' | 'first-last-frame-to-video' | 'reference-to-video';
type FalVideoDurationFormat = 'integer' | 'integer-string' | 'seconds-string';

interface FalVideoRuntimeProfile {
  mode: FalVideoMode;
  imageField?: string;
  endImageField?: string;
  defaultAspectRatio: VideoAspectRatio;
  defaultResolution: VideoResolution;
  durationFormat: FalVideoDurationFormat;
  supportsGenerateAudio: boolean;
  supportsCameraFixed: boolean;
  supportsSeed: boolean;
  supportsSafetyChecker: boolean;
}

const normalizePositiveInteger = (value?: string | number): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  if (!Number.isInteger(parsed)) return undefined;
  return parsed;
};

const normalizeDuration = (value?: string | number): number | undefined => {
  return normalizePositiveInteger(value);
};

const normalizeSeed = (value?: string | number): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return undefined;
  return parsed;
};

const getVideoModelConfig = (modelId: string): FalVideoModelConfig | undefined => FAL_VIDEO_MODEL_CONFIGS[modelId];
const getImageModelConfig = (modelId: string): FalImageModelConfig | undefined => FAL_IMAGE_MODEL_CONFIGS[modelId];

const isKlingVideoModel = (modelId: string): boolean => modelId.startsWith('fal-ai/kling-video/');
const isVeoVideoModel = (modelId: string): boolean => modelId.startsWith('fal-ai/veo');

const getVideoRuntimeProfile = (modelId: string): FalVideoRuntimeProfile => {
  const legacyConfig = getVideoModelConfig(modelId);
  if (legacyConfig) {
    return {
      mode: 'image-to-video',
      imageField: 'image_url',
      endImageField: 'end_image_url',
      defaultAspectRatio: legacyConfig.defaultAspectRatio,
      defaultResolution: legacyConfig.defaultResolution,
      durationFormat: 'integer',
      supportsGenerateAudio: legacyConfig.supportsGenerateAudio,
      supportsCameraFixed: legacyConfig.supportsCameraFixed,
      supportsSeed: legacyConfig.supportsSeed,
      supportsSafetyChecker: legacyConfig.supportsSafetyChecker
    };
  }

  if (isKlingVideoModel(modelId)) {
    const mode: FalVideoMode = modelId.includes('/text-to-video')
      ? 'text-to-video'
      : 'image-to-video';
    const useStartImageField =
      modelId.includes('/v2.6/') ||
      modelId.includes('/v3/') ||
      modelId.includes('/o1/');
    const useTailImageField =
      modelId.includes('/v1/') ||
      modelId.includes('/v1.5/') ||
      modelId.includes('/v1.6/') ||
      modelId.includes('/v2.1/') ||
      modelId.includes('/v2.5-turbo/');
    return {
      mode,
      imageField: useStartImageField ? 'start_image_url' : 'image_url',
      endImageField: useTailImageField ? 'tail_image_url' : 'end_image_url',
      defaultAspectRatio: '16:9',
      defaultResolution: '1080p',
      durationFormat: 'integer-string',
      supportsGenerateAudio:
        modelId.includes('/v2.6/') ||
        modelId.includes('/v3/') ||
        modelId.includes('/o3/'),
      supportsCameraFixed: false,
      supportsSeed: true,
      supportsSafetyChecker: false
    };
  }

  if (isVeoVideoModel(modelId)) {
    let mode: FalVideoMode = 'text-to-video';
    if (modelId.includes('/reference-to-video')) {
      mode = 'reference-to-video';
    } else if (modelId.includes('/first-last-frame-to-video')) {
      mode = 'first-last-frame-to-video';
    } else if (modelId.includes('/image-to-video')) {
      mode = 'image-to-video';
    }
    return {
      mode,
      imageField: 'image_url',
      endImageField: 'end_image_url',
      defaultAspectRatio: '16:9',
      defaultResolution: modelId.startsWith('fal-ai/veo2') ? '720p' : '1080p',
      durationFormat: 'seconds-string',
      supportsGenerateAudio: modelId.startsWith('fal-ai/veo3'),
      supportsCameraFixed: false,
      supportsSeed: false,
      supportsSafetyChecker: false
    };
  }

  return {
    mode: modelId.includes('/image-to-video') ? 'image-to-video' : 'text-to-video',
    imageField: 'image_url',
    endImageField: 'end_image_url',
    defaultAspectRatio: '16:9',
    defaultResolution: '720p',
    durationFormat: 'integer',
    supportsGenerateAudio: false,
    supportsCameraFixed: false,
    supportsSeed: false,
    supportsSafetyChecker: false
  };
};

const normalizeDurationForProfile = (
  value: string | number | undefined,
  durationFormat: FalVideoDurationFormat
): string | number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;

  if (durationFormat === 'integer') {
    return normalizeDuration(value);
  }

  if (durationFormat === 'integer-string') {
    const seconds = normalizePositiveInteger(value);
    return seconds === undefined ? undefined : String(seconds);
  }

  const trimmed = String(value).trim().toLowerCase();
  const numericPart = trimmed.endsWith('s') ? trimmed.slice(0, -1) : trimmed;
  const seconds = normalizePositiveInteger(numericPart);
  return seconds === undefined ? undefined : `${seconds}s`;
};

export class FalProvider implements ModelProvider {
  constructor(
    private readonly apiKey: string,
    private readonly projectCwd: string,
    private readonly outputDir: string
  ) {}

  async listModels(): Promise<ProviderModelInfo[]> {
    return FAL_SUPPORTED_MODELS;
  }

  async generateImage(input: GenerateImageInput): Promise<ProviderGenerateResult> {
    const modelId = sanitizeModelId(input.model_id);
    const payload = await this.buildImagePayload(modelId, input);
    const responsePayload = await this.runModel(modelId, payload);
    const sourceCandidates = findUrlCandidatesInUnknown(responsePayload, 'image');
    const downloadableCandidates = sourceCandidates.filter(
      (candidate) => !isLikelyApiStatusUrl(candidate.url)
    );
    const schemaUrl = getMediaUrlFromKnownSchema(responsePayload, 'image');
    if (sourceCandidates.length === 0) {
      logger.warn('fal image response contains no downloadable URL candidate', { modelId });
    } else {
      logger.info('fal image URL candidates ranked', {
        modelId,
        topCandidates: sourceCandidates.slice(0, 5).map((item) => ({
          url: item.url,
          pathHint: item.pathHint,
          score: scoreCandidateUrl(item, 'image')
        }))
      });
      if (isQueueEndpointUrl(sourceCandidates[0].url)) {
        logger.warn('top image URL candidate looks like queue endpoint', {
          modelId,
          topUrl: sourceCandidates[0].url
        });
      }
    }
    const fileResult = await this.persistResultFile({
      sourceUrl: schemaUrl ?? downloadableCandidates[0]?.url,
      sourceCandidates: sourceCandidates.map((item) => item.url),
      prompt: input.prompt,
      capability: 'image',
      responsePayload
    });

    return {
      savedPath: fileResult.savedPath,
      sourceUrl: fileResult.sourceUrl,
      requestPayload: payload,
      responsePayload,
      notes: fileResult.notes
    };
  }

  async generateVideo(input: GenerateVideoInput): Promise<ProviderGenerateResult> {
    const modelId = sanitizeModelId(input.model_id);
    const payload = await this.buildVideoPayload(modelId, input);
    const responsePayload = await this.runModel(modelId, payload);
    const sourceCandidates = findUrlCandidatesInUnknown(responsePayload, 'video');
    const downloadableCandidates = sourceCandidates.filter(
      (candidate) => !isLikelyApiStatusUrl(candidate.url)
    );
    const schemaUrl = getMediaUrlFromKnownSchema(responsePayload, 'video');
    if (sourceCandidates.length === 0) {
      logger.warn('fal video response contains no downloadable URL candidate', { modelId });
    } else {
      logger.info('fal video URL candidates ranked', {
        modelId,
        topCandidates: sourceCandidates.slice(0, 5).map((item) => ({
          url: item.url,
          pathHint: item.pathHint,
          score: scoreCandidateUrl(item, 'video')
        }))
      });
      if (isQueueEndpointUrl(sourceCandidates[0].url)) {
        logger.warn('top video URL candidate looks like queue endpoint', {
          modelId,
          topUrl: sourceCandidates[0].url
        });
      }
    }
    const fileResult = await this.persistResultFile({
      sourceUrl: schemaUrl ?? downloadableCandidates[0]?.url,
      sourceCandidates: sourceCandidates.map((item) => item.url),
      prompt: input.prompt ?? input.model_id,
      capability: 'video',
      responsePayload
    });

    const notes: string[] = [];
    const videoProfile = getVideoRuntimeProfile(modelId);
    if (input.audio) {
      notes.push('audio 参数当前未接入内置 fal 视频流程，已忽略。');
    }
    const hasReferenceImages = (input.elements ?? []).some(
      (element) => (element.reference_images?.length ?? 0) > 0
    );
    if (hasReferenceImages && videoProfile.mode !== 'reference-to-video') {
      notes.push('reference_images 仅在 reference-to-video 模型中生效，其他模型会忽略该参数。');
    }
    if (typeof input.enable_audio === 'boolean' && !videoProfile.supportsGenerateAudio) {
      notes.push(`模型 ${modelId} 不支持 generate_audio，已忽略 enable_audio。`);
    }
    if (typeof input.camera_fixed === 'boolean' && !videoProfile.supportsCameraFixed) {
      notes.push(`模型 ${modelId} 不支持 camera_fixed，已忽略该参数。`);
    }
    if (input.seed !== undefined && !videoProfile.supportsSeed) {
      notes.push(`模型 ${modelId} 不支持 seed，已忽略该参数。`);
    }
    if (typeof input.enable_safety_checker === 'boolean' && !videoProfile.supportsSafetyChecker) {
      notes.push(`模型 ${modelId} 不支持 enable_safety_checker，已忽略该参数。`);
    }
    if (!fileResult.sourceUrl) {
      notes.push('fal 返回中未找到可下载视频 URL，已将完整响应保存为 JSON。');
    }
    notes.push(...fileResult.notes);

    return {
      savedPath: fileResult.savedPath,
      sourceUrl: fileResult.sourceUrl,
      requestPayload: payload,
      responsePayload,
      notes
    };
  }

  private async runModel(modelId: string, payload: Record<string, unknown>): Promise<unknown> {
    const submitUrl = `${FAL_QUEUE_BASE_URL}/${modelId}`;
    const submitResponse = await this.requestJson(submitUrl, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const submitObject = asObject(submitResponse);

    const requestId = getString(submitObject?.request_id);
    if (!requestId) {
      return maybeUnwrapFalData(submitResponse);
    }

    const statusUrl =
      getString(submitObject?.status_url) ?? `${submitUrl}/requests/${requestId}/status`;
    const responseUrl =
      getString(submitObject?.response_url) ?? `${submitUrl}/requests/${requestId}`;

    const start = Date.now();
    while (Date.now() - start < POLL_TIMEOUT_MS) {
      const statusPayload = await this.requestJson(statusUrl, { method: 'GET' });
      const statusObj = asObject(statusPayload);
      const status = getString(statusObj?.status)?.toUpperCase();

      if (status === 'COMPLETED') {
        if (statusObj?.response !== undefined) {
          return maybeUnwrapFalData(statusPayload);
        }
        const finalResponseUrl = getString(statusObj?.response_url) ?? responseUrl;
        const responsePayload = await this.requestJson(finalResponseUrl, { method: 'GET' });
        return maybeUnwrapFalData(responsePayload);
      }

      if (status === 'FAILED' || status === 'CANCELLED' || status === 'ERROR') {
        const reason =
          getString(statusObj?.error) ??
          getString(statusObj?.message) ??
          JSON.stringify(statusPayload);
        throw new Error(`fal request failed: ${reason}`);
      }

      await sleep(POLL_INTERVAL_MS);
    }

    throw new Error(`fal request timeout after ${Math.round(POLL_TIMEOUT_MS / 1000)} seconds`);
  }

  private async requestJson(url: string, init: { method: 'GET' | 'POST'; body?: string }): Promise<unknown> {
    const response = await fetch(url, {
      method: init.method,
      headers: {
        Authorization: `Key ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: init.body
    });

    const responseText = await response.text();
    let payload: unknown = responseText;
    if (responseText.trim().length > 0) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = responseText;
      }
    }

    if (!response.ok) {
      const message =
        typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});
      throw new Error(`fal request failed (${response.status}): ${message}`);
    }

    return payload;
  }

  private async buildImagePayload(modelId: string, input: GenerateImageInput): Promise<Record<string, unknown>> {
    const normalizedImages = await Promise.all((input.images ?? []).map((item) => toDataUri(item, this.projectCwd)));
    const payload: Record<string, unknown> = { prompt: input.prompt };

    if (modelId.startsWith('fal-ai/bytedance/seedream/') || modelId.startsWith('fal-ai/flux/')) {
      const aspectRatio = input.aspect_ratio ?? '16:9';
      if (!LEGACY_IMAGE_SIZE_MODEL_ASPECT_RATIOS.includes(aspectRatio)) {
        throw new Error(
          `模型 ${modelId} 仅支持 aspect_ratio=${LEGACY_IMAGE_SIZE_MODEL_ASPECT_RATIOS.join(', ')}`
        );
      }
      payload.image_size = getImageSizeByAspectRatio(aspectRatio);
      if (normalizedImages.length === 1) {
        payload.image_url = normalizedImages[0];
      }
      if (normalizedImages.length > 1) {
        payload.image_urls = normalizedImages;
      }
      return payload;
    }

    const imageModelConfig = getImageModelConfig(modelId);
    if (imageModelConfig) {
      const aspectRatio = input.aspect_ratio ?? imageModelConfig.defaultAspectRatio;
      if (!imageModelConfig.aspectRatios.includes(aspectRatio)) {
        throw new Error(
          `模型 ${modelId} 不支持 aspect_ratio=${aspectRatio}，可选值：${imageModelConfig.aspectRatios.join(', ')}`
        );
      }
      payload.aspect_ratio = aspectRatio;

      if (imageModelConfig.resolutions?.length) {
        const resolution = input.resolution ?? imageModelConfig.defaultResolution;
        if (!resolution || !imageModelConfig.resolutions.includes(resolution)) {
          throw new Error(
            `模型 ${modelId} 不支持 resolution=${resolution ?? '（空）'}，可选值：${imageModelConfig.resolutions.join(', ')}`
          );
        }
        payload.resolution = resolution;
      } else if (input.resolution) {
        throw new Error(`模型 ${modelId} 不支持 resolution 参数`);
      }

      if (imageModelConfig.requiresImageUrls && normalizedImages.length === 0) {
        throw new Error(`模型 ${modelId} 需要至少一张参考图（images）`);
      }
      if (imageModelConfig.disallowImageUrls && normalizedImages.length > 0) {
        throw new Error(`模型 ${modelId} 不接收 images，请使用对应的 /edit 模型`);
      }
      if (normalizedImages.length > 0) {
        payload.image_urls = normalizedImages;
      }
      return payload;
    }

    // Generic fallback for other image models that accept aspect_ratio / resolution style fields.
    payload.aspect_ratio = input.aspect_ratio ?? '16:9';
    if (input.resolution) {
      payload.resolution = input.resolution;
    }
    if (normalizedImages.length === 1) {
      payload.image_url = normalizedImages[0];
    }
    if (normalizedImages.length > 1) {
      payload.image_urls = normalizedImages;
    }
    return payload;
  }

  private async buildVideoPayload(modelId: string, input: GenerateVideoInput): Promise<Record<string, unknown>> {
    const modelConfig = getVideoModelConfig(modelId);
    const videoProfile = getVideoRuntimeProfile(modelId);
    const normalizedStartImage = input.start_image
      ? await toDataUri(input.start_image, this.projectCwd)
      : undefined;
    const fallbackStartImage = input.elements?.[0]?.frontal_image
      ? await toDataUri(input.elements[0].frontal_image, this.projectCwd)
      : undefined;
    const imageUrl = normalizedStartImage ?? fallbackStartImage;
    const endImageUrl = input.end_image
      ? await toDataUri(input.end_image, this.projectCwd)
      : undefined;
    const normalizedReferenceImages = await Promise.all(
      (input.elements?.flatMap((element) => element.reference_images ?? []) ?? [])
        .map((image) => toDataUri(image, this.projectCwd))
    );

    const aspectRatio = input.aspect_ratio ?? videoProfile.defaultAspectRatio;
    if (modelConfig && !modelConfig.aspectRatios.includes(aspectRatio)) {
      throw new Error(
        `模型 ${modelId} 不支持 aspect_ratio=${aspectRatio}，可选值：${modelConfig.aspectRatios.join(', ')}`
      );
    }

    const resolution = input.resolution ?? videoProfile.defaultResolution;
    if (modelConfig && !modelConfig.resolutions.includes(resolution)) {
      throw new Error(
        `模型 ${modelId} 不支持 resolution=${resolution}，可选值：${modelConfig.resolutions.join(', ')}`
      );
    }

    const prompt = input.prompt?.trim();
    const payload: Record<string, unknown> = {
      prompt: prompt || 'Cinematic smooth motion.',
      aspect_ratio: aspectRatio,
      resolution
    };

    if (videoProfile.mode === 'image-to-video') {
      if (!imageUrl) {
        throw new Error('该模型需要 start_image（或 elements[0].frontal_image）');
      }
      payload[videoProfile.imageField ?? 'image_url'] = imageUrl;
      if (endImageUrl) {
        payload[videoProfile.endImageField ?? 'end_image_url'] = endImageUrl;
      }
    } else if (videoProfile.mode === 'first-last-frame-to-video') {
      if (!imageUrl || !endImageUrl) {
        throw new Error('该模型需要同时提供 start_image 和 end_image');
      }
      payload.first_frame_url = imageUrl;
      payload.last_frame_url = endImageUrl;
    } else if (videoProfile.mode === 'reference-to-video') {
      const references = [...normalizedReferenceImages];
      if (imageUrl) {
        references.unshift(imageUrl);
      }
      if (references.length === 0) {
        throw new Error('该模型需要至少一张参考图（elements[0].reference_images 或 start_image）');
      }
      payload.image_urls = references;
    } else if (!prompt) {
      payload.prompt = 'Cinematic smooth motion.';
    }

    const duration = normalizeDurationForProfile(input.duration, videoProfile.durationFormat);
    if (input.duration !== undefined && duration === undefined) {
      if (videoProfile.durationFormat === 'seconds-string') {
        throw new Error('duration 必须是正整数秒（例如 8 或 8s）');
      }
      throw new Error('duration 必须是正整数秒');
    }
    if (duration !== undefined) {
      if (
        modelConfig &&
        typeof duration === 'number' &&
        (duration < modelConfig.minDuration || duration > modelConfig.maxDuration)
      ) {
        throw new Error(
          `模型 ${modelId} 要求 duration 在 ${modelConfig.minDuration}-${modelConfig.maxDuration} 秒之间`
        );
      }
      payload.duration = duration;
    }

    if (typeof input.enable_audio === 'boolean' && videoProfile.supportsGenerateAudio) {
      payload.generate_audio = input.enable_audio;
    }
    if (typeof input.camera_fixed === 'boolean' && videoProfile.supportsCameraFixed) {
      payload.camera_fixed = input.camera_fixed;
    }
    if (typeof input.enable_safety_checker === 'boolean' && videoProfile.supportsSafetyChecker) {
      payload.enable_safety_checker = input.enable_safety_checker;
    }
    if (input.seed !== undefined && videoProfile.supportsSeed) {
      const seed = normalizeSeed(input.seed);
      if (seed === undefined) {
        throw new Error('seed 必须是整数');
      }
      payload.seed = seed;
    }

    return payload;
  }

  private async persistResultFile(input: {
    sourceUrl?: string;
    sourceCandidates?: string[];
    prompt: string;
    capability: 'image' | 'video';
    responsePayload: unknown;
  }): Promise<{ savedPath: string; sourceUrl?: string; notes: string[] }> {
    await fs.mkdir(this.outputDir, { recursive: true });
    const timestamp = Date.now();
    const token = safeFileToken(input.prompt, input.capability);
    const notes: string[] = [];
    const candidates = Array.from(
      new Set([input.sourceUrl, ...(input.sourceCandidates ?? [])].filter((item): item is string => Boolean(item)))
    );
    const downloadableCandidates = candidates.filter((url) => !isLikelyApiStatusUrl(url));

    if (candidates.length === 0) {
      const fallbackPath = path.join(this.outputDir, `${timestamp}-${token}.json`);
      await fs.writeFile(fallbackPath, `${JSON.stringify(input.responsePayload, null, 2)}\n`, 'utf8');
      notes.push('fal 返回中未找到可下载媒体 URL，已将完整响应保存为 JSON。');
      return { savedPath: fallbackPath, notes };
    }
    if (downloadableCandidates.length === 0) {
      const debugPath = path.join(this.outputDir, `${timestamp}-${token}-download-debug.json`);
      const debugPayload = {
        capability: input.capability,
        prompt: input.prompt,
        selected_source_url: input.sourceUrl ?? null,
        source_candidates: candidates,
        skipped_reason: 'all candidates look like queue/status API URLs',
        response_payload: input.responsePayload
      };
      await fs.writeFile(debugPath, `${JSON.stringify(debugPayload, null, 2)}\n`, 'utf8');
      logger.error('fal generated media download skipped due to non-downloadable candidates', {
        debugPath,
        sourceCandidates: candidates
      });
      throw new Error(
        `download generated file failed: all candidate URLs look like queue/status endpoints; debug_json=${debugPath}`
      );
    }

    const failedAttempts: Array<{
      url: string;
      status?: number;
      statusText?: string;
      contentType?: string;
      bodySnippet?: string;
      error?: string;
    }> = [];

    for (const candidateUrl of downloadableCandidates) {
      try {
        const response = await fetch(candidateUrl);
        if (!response.ok) {
          const bodySnippet = normalizeSnippet(await response.text());
          failedAttempts.push({
            url: candidateUrl,
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type') ?? undefined,
            bodySnippet
          });
          continue;
        }

        const extFromUrl = getExtensionFromUrl(candidateUrl);
        const defaultExt = input.capability === 'image' ? '.png' : '.mp4';
        const extFromType = getExtensionFromContentType(response.headers.get('content-type') ?? undefined, defaultExt);
        const ext = extFromUrl ?? extFromType ?? defaultExt;
        const binary = Buffer.from(await response.arrayBuffer());
        const outputPath = path.join(this.outputDir, `${timestamp}-${token}${ext}`);
        await fs.writeFile(outputPath, binary);

        if (failedAttempts.length > 0) {
          notes.push(`媒体 URL 已自动重试并切换候选地址，最终成功下载：${candidateUrl}`);
        }
        return { savedPath: outputPath, sourceUrl: candidateUrl, notes };
      } catch (error) {
        failedAttempts.push({
          url: candidateUrl,
          error: toErrorMessage(error)
        });
      }
    }

    const debugPath = path.join(this.outputDir, `${timestamp}-${token}-download-debug.json`);
    const debugPayload = {
      capability: input.capability,
      prompt: input.prompt,
      selected_source_url: input.sourceUrl ?? null,
      source_candidates: candidates,
      downloadable_candidates: downloadableCandidates,
      failed_attempts: failedAttempts,
      response_payload: input.responsePayload
    };
    await fs.writeFile(debugPath, `${JSON.stringify(debugPayload, null, 2)}\n`, 'utf8');

    const lastFailure =
      failedAttempts.length > 0 ? failedAttempts[failedAttempts.length - 1] : undefined;
    const summary = lastFailure
      ? `last_status=${lastFailure.status ?? 'N/A'} last_error=${lastFailure.error ?? 'N/A'} last_url=${lastFailure.url}`
      : 'no failure details';

    logger.error('fal generated media download failed', {
      debugPath,
      attempts: failedAttempts
    });
    throw new Error(
      `download generated file failed after ${downloadableCandidates.length} attempts; ${summary}; debug_json=${debugPath}`
    );
  }
}

export const createFalProvider = (input: {
  apiKey: string;
  projectCwd: string;
  outputDir: string;
}): ModelProvider => new FalProvider(input.apiKey, input.projectCwd, input.outputDir);

export const isFalModelSupported = (modelId: string): boolean =>
  FAL_SUPPORTED_MODELS.some((item) => item.modelId === sanitizeModelId(modelId));

export const getFalModelById = (modelId: string): ProviderModelInfo | undefined =>
  FAL_SUPPORTED_MODELS.find((item) => item.modelId === sanitizeModelId(modelId));

export const formatFalModelsForError = (): string =>
  FAL_SUPPORTED_MODELS.map((item) => `${item.modelId} (${item.capability})`).join(', ');

export const formatFalErrorMessage = (error: unknown): string => `fal provider error: ${toErrorMessage(error)}`;
