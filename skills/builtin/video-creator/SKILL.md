---
name: video-creator
description: Manage the video creation DSL in `<AgentWorkspaceRoot>/creation` for scene-by-scene and shot-by-shot planning and generation workflows. Use when the user requests video creation work.
---

# Video Creation

Use this skill to manage video-creation DSL data in **`<AgentWorkspaceRoot>/creation`**. The data lives in `creation/board.json` and must strictly follow the type definitions below. Read and write it through **ReadDsl** (JMESPath queries) and **UpdateDsl** (JSON Patch updates).

## Storage Location

- **Root path**: `<AgentWorkspaceRoot>/creation`
- **DSL file**: `creation/board.json`
- The workspace is determined by the current agent session. ReadDsl and UpdateDsl always operate on the current agent’s `creation/board.json`.

## Data Contract (DSL Type Definitions)

The root object in `board.json` is `VideoCreation` and must match the following TypeScript definitions. Do not introduce undefined fields or break the structure when reading or writing.

```typescript
/**
 * Media source enum
 */
export type MediaSourceType = "generate" | "upload" | "other";

/**
 * Model / asset configuration
 */
export interface BaseModelConfig {
  modelName: string; // Previously model_name
  resolution?: string; // Resolution (e.g. "1920x1080")
  aspectRatio?: string; // Previously aspect_ratio (e.g. "16:9")
  prompt?: string; // Original prompt
}

export interface ImageModelConfig extends BaseModelConfig {
  images?: string[]; // Input images (image-to-image)
}

/**
 * Video generation model configuration (text-to-video / image-to-video)
 */
export interface VideoModelConfig extends BaseModelConfig {
  startImageFilePath?: string; // First-frame image
  endImageFilePath?: string; // Last-frame image
  audio?: string; // Audio input (used for avatar videos)
  elements?: {
    frontalImage?: string;
    referenceImages?: string[];
    video?: string;
  };
  duration: number; // Video duration in seconds
}

export type ModelConfig = ImageModelConfig | VideoModelConfig;

/**
 * Media asset version
 */
export interface MediaAssetVersion {
  source: MediaSourceType;
  filePath?: string;
  active?: boolean; // Whether this version is currently in use
  caption?: string;
  modelConfig: ModelConfig;
}

export type MediaAssetList = MediaAssetVersion[];

export type AudioTrackType = "music" | "voiceover" | "sound_effect";

/**
 * Audio track
 */
export interface AudioTrack {
  id: string;
  type: AudioTrackType;
  description: string;
  startTime: number;
  duration: number;
  audioFile?: MediaAssetList;
}

/**
 * Shot
 */
export interface Shot {
  id: string;
  description: string;
  duration: number;
  type: "avatar" | "normal"; // avatar = lip-sync, normal = text-to-video or first/last-frame video
  startFrame?: MediaAssetList;
  endFrame?: MediaAssetList;
  videoFile?: MediaAssetList;
}

/**
 * Scene
 */
export interface Scene {
  id: string;
  description: string;
  shots?: Shot[];
}

/**
 * Video creation DSL root
 */
export interface VideoCreation {
  creativeSummary: string; // Creative summary
  scenes: Scene[];         // Scene list
  sounds: AudioTrack[];    // Audio track list
}
```

## Root Fields at a Glance

| Field | Type | Description |
| ----- | ---- | ----------- |
| `creativeSummary` | string | Creative summary |
| `scenes` | Scene[] | Scene list. Each item includes `id`, `description`, and `shots` |
| `sounds` | AudioTrack[] | Audio track list. Each item includes `id`, `type`, `description`, `startTime`, `duration`, and `audioFile` |

## How to Manage Video Creation Data

1. **Inspect the current board structure**: `ReadDsl("@")` or targeted queries such as `ReadDsl("keys(@)")` or `ReadDsl("scenes[*].id")`.
2. **Read the creative summary**: `ReadDsl("creativeSummary")`.
3. **Read scenes and shots**: `ReadDsl("scenes")` or `ReadDsl("scenes[*].shots")`.
4. **Read audio tracks**: `ReadDsl("sounds")`.
5. **Update the creative summary**: use a single `replace` operation in `UpdateDsl` with path `/creativeSummary` and the new string value.
6. **Add a scene**: use a single `add` operation with path `/scenes/-` and a value that matches `Scene` (including `id`, `description`, and optional `shots`).
7. **Add a shot under a scene**: use path `/scenes/<scene-index>/shots/-` and a value that matches `Shot` (including `id`, `description`, `duration`, `type`, and optional `startFrame`, `endFrame`, and `videoFile`).
8. **Update or replace a shot or asset**: use `replace` with a path pointing to the target node, for example `/scenes/0/shots/1` or `/scenes/0/shots/1/videoFile/0`.
9. **Add an audio track**: use path `/sounds/-` with a value that matches `AudioTrack`.
10. **Delete a scene, shot, or audio track**: use `remove` with the target path, for example `/scenes/1`, `/scenes/0/shots/0`, or `/sounds/0`.
11. **Initialize an empty board**: if the file does not exist or needs to be created from scratch, use `UpdateDsl` to write the root structure first, for example by adding `creativeSummary`, `scenes`, and `sounds`, while keeping the contract above intact.

## Operating Conventions

- All reads and writes to `creation/board.json` must go through **ReadDsl** and **UpdateDsl**. Do not edit the file directly.
- Keep the JSON valid and consistent with the DSL types above. Do not mix arrays and objects or add root fields outside the contract.
- When adding scenes, shots, or audio tracks, assign unique and stable `id` values such as UUIDs or prefixed short IDs.
