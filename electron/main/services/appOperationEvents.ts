import { EventEmitter } from 'node:events';
import type { AppOperationEvent } from '@shared/types';

const APP_OPERATION_EVENT = 'app-operation';
const emitter = new EventEmitter();

export const appOperationEvents = {
  emit(payload: AppOperationEvent): void {
    emitter.emit(APP_OPERATION_EVENT, payload);
  },
  on(listener: (payload: AppOperationEvent) => void): () => void {
    emitter.on(APP_OPERATION_EVENT, listener);
    return () => {
      emitter.off(APP_OPERATION_EVENT, listener);
    };
  }
};
