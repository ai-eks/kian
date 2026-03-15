import { logger } from './logger';
import { taskService } from './taskService';

const POLL_INTERVAL_MS = 3000;

let running = false;
let ticking = false;
let pollTimer: NodeJS.Timeout | null = null;

const clearTimer = (): void => {
  if (!pollTimer) return;
  clearTimeout(pollTimer);
  pollTimer = null;
};

const scheduleNextTick = (): void => {
  if (!running) return;
  clearTimer();
  pollTimer = setTimeout(() => {
    void tick();
  }, POLL_INTERVAL_MS);
};

const tick = async (): Promise<void> => {
  if (!running || ticking) return;
  ticking = true;

  try {
    const tasks = await taskService.listTasks();
    for (const task of tasks) {
      if (task.status !== 'running') continue;
      await taskService.ensureTaskProcess(task.id);
    }
  } catch (error) {
    logger.error('Task supervisor tick failed', error);
  } finally {
    ticking = false;
    scheduleNextTick();
  }
};

export const taskSupervisorService = {
  start(): void {
    if (running) return;
    running = true;
    logger.info('Task supervisor started');
    void tick();
  },

  stop(): void {
    if (!running) return;
    running = false;
    ticking = false;
    clearTimer();
    logger.info('Task supervisor stopped');
  }
};
