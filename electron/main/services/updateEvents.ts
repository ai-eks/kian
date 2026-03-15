import { EventEmitter } from 'node:events';
import type { AppUpdateStatusDTO } from '@shared/types';

const UPDATE_STATUS_EVENT = 'update-status';
const emitter = new EventEmitter();

export const updateEvents = {
  emit(payload: AppUpdateStatusDTO): void {
    emitter.emit(UPDATE_STATUS_EVENT, payload);
  },
  on(listener: (payload: AppUpdateStatusDTO) => void): () => void {
    emitter.on(UPDATE_STATUS_EVENT, listener);
    return () => {
      emitter.off(UPDATE_STATUS_EVENT, listener);
    };
  }
};

