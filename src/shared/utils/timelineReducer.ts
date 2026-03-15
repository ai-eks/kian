import type { TimelineDTO } from '@shared/types';

type TimelineAction =
  | { action: 'timeline.replaceSnapshot'; payload: { snapshotJson: string; duration?: number } }
  | {
      action: 'timeline.appendClip';
      payload: { trackId: string; clip: { id: string; start: number; end: number; content?: string } };
    }
  | {
      action: 'timeline.updateClip';
      payload: { trackId: string; clipId: string; patch: Partial<{ start: number; end: number; content: string }> };
    }
  | { action: 'timeline.deleteClip'; payload: { trackId: string; clipId: string } };

export const applyTimelineAction = (timeline: TimelineDTO, action: TimelineAction): TimelineDTO => {
  if (action.action === 'timeline.replaceSnapshot') {
    return {
      ...timeline,
      snapshotJson: action.payload.snapshotJson,
      duration: action.payload.duration ?? timeline.duration
    };
  }

  const tracks = timeline.tracks.map((track) => {
    if (track.id !== action.payload.trackId) {
      return track;
    }

    if (action.action === 'timeline.appendClip') {
      return {
        ...track,
        clips: [...track.clips, { ...action.payload.clip, trackId: track.id, assetId: null, metaJson: null }]
      };
    }

    if (action.action === 'timeline.updateClip') {
      return {
        ...track,
        clips: track.clips.map((clip) =>
          clip.id === action.payload.clipId
            ? { ...clip, ...action.payload.patch }
            : clip
        )
      };
    }

    return {
      ...track,
      clips: track.clips.filter((clip) => clip.id !== action.payload.clipId)
    };
  });

  return { ...timeline, tracks };
};
