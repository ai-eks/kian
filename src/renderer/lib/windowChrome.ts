import type { MouseEvent } from 'react';
import { api } from '@renderer/lib/api';

const WINDOW_CHROME_IGNORE_SELECTOR = [
  '.no-drag',
  'button',
  'a',
  'input',
  'textarea',
  'select',
  '[role="button"]',
  '[contenteditable="true"]'
].join(',');

const shouldIgnoreWindowChromeToggle = (target: EventTarget | null): boolean => {
  return target instanceof HTMLElement && target.closest(WINDOW_CHROME_IGNORE_SELECTOR) !== null;
};

export const toggleWindowMaximizeFromChrome = (event: MouseEvent<HTMLElement>): void => {
  if (event.defaultPrevented || shouldIgnoreWindowChromeToggle(event.target)) {
    return;
  }

  void api.window.toggleMaximize();
};
