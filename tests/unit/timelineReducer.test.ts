import { describe, expect, it } from 'vitest';
import { applyTimelineAction } from '../../src/shared/utils/timelineReducer';

const timeline = {
  id: 't1',
  projectId: 'p1',
  title: '主时间线',
  fps: 24,
  duration: 60,
  snapshotJson: '{}',
  tracks: [
    {
      id: 'track-1',
      timelineId: 't1',
      type: 'video' as const,
      order: 0,
      clips: [
        {
          id: 'clip-1',
          trackId: 'track-1',
          start: 0,
          end: 5,
          content: 'a',
          assetId: null,
          metaJson: null
        }
      ]
    }
  ]
};

describe('applyTimelineAction', () => {
  it('appends clip', () => {
    const next = applyTimelineAction(timeline, {
      action: 'timeline.appendClip',
      payload: {
        trackId: 'track-1',
        clip: { id: 'clip-2', start: 5, end: 10, content: 'b' }
      }
    });
    expect(next.tracks[0].clips).toHaveLength(2);
  });

  it('updates clip', () => {
    const next = applyTimelineAction(timeline, {
      action: 'timeline.updateClip',
      payload: {
        trackId: 'track-1',
        clipId: 'clip-1',
        patch: { content: 'new' }
      }
    });
    expect(next.tracks[0].clips[0].content).toBe('new');
  });
});
