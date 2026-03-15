import { EventEmitter } from 'node:events';
import type { ChatHistoryUpdatedEvent, ChatStreamEvent } from '@shared/types';

const emitter = new EventEmitter();

const HISTORY_UPDATED_EVENT = 'history-updated';
const STREAM_EVENT = 'stream';

export const chatEvents = {
  emitHistoryUpdated(event: ChatHistoryUpdatedEvent): void {
    emitter.emit(HISTORY_UPDATED_EVENT, event);
  },
  onHistoryUpdated(listener: (event: ChatHistoryUpdatedEvent) => void): () => void {
    emitter.on(HISTORY_UPDATED_EVENT, listener);
    return () => emitter.off(HISTORY_UPDATED_EVENT, listener);
  },
  emitStream(event: ChatStreamEvent): void {
    emitter.emit(STREAM_EVENT, event);
  },
  onStream(listener: (event: ChatStreamEvent) => void): () => void {
    emitter.on(STREAM_EVENT, listener);
    return () => emitter.off(STREAM_EVENT, listener);
  }
};
