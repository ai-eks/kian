import { BrowserWindow, shell } from 'electron';
import type { LinkOpenMode } from '@shared/types';
import { logger } from './logger';
import { settingsService } from './settingsService';

interface BuiltinBrowserState {
  window: BrowserWindow;
}

let builtinBrowserState: BuiltinBrowserState | null = null;

const BUILTIN_BROWSER_TITLE = '内置浏览器';

const parseUrl = (rawUrl: string): URL | null => {
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
};

const canOpenInBuiltinBrowser = (url: URL): boolean =>
  url.protocol === 'http:' || url.protocol === 'https:';

const resolveFallbackTitle = (url: URL): string => {
  const host = url.host.trim();
  return host ? `${host} · ${BUILTIN_BROWSER_TITLE}` : BUILTIN_BROWSER_TITLE;
};

const ensureBuiltinBrowserWindow = (): BrowserWindow => {
  if (builtinBrowserState && !builtinBrowserState.window.isDestroyed()) {
    return builtinBrowserState.window;
  }

  const browserWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: BUILTIN_BROWSER_TITLE,
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  browserWindow.webContents.setWindowOpenHandler(({ url }) => {
    void linkOpenService.open(url);
    return { action: 'deny' };
  });

  browserWindow.on('closed', () => {
    if (builtinBrowserState?.window === browserWindow) {
      builtinBrowserState = null;
    }
  });

  builtinBrowserState = { window: browserWindow };
  return browserWindow;
};

const getConfiguredLinkOpenMode = async (): Promise<LinkOpenMode> => {
  const generalConfig = await settingsService.getGeneralConfig();
  return generalConfig.linkOpenMode;
};

const openInSystemBrowser = async (url: string): Promise<void> => {
  await shell.openExternal(url);
};

const openInBuiltinBrowser = async (url: URL): Promise<void> => {
  const browserWindow = ensureBuiltinBrowserWindow();
  browserWindow.setTitle(resolveFallbackTitle(url));
  await browserWindow.loadURL(url.toString());
  browserWindow.show();
  browserWindow.focus();
};

export const linkOpenService = {
  async open(rawUrl: string): Promise<boolean> {
    const trimmedUrl = rawUrl.trim();
    const parsedUrl = parseUrl(trimmedUrl);
    if (!parsedUrl) {
      throw new Error('链接地址无效');
    }

    const linkOpenMode = await getConfiguredLinkOpenMode();
    try {
      if (linkOpenMode === 'system' || !canOpenInBuiltinBrowser(parsedUrl)) {
        await openInSystemBrowser(parsedUrl.toString());
        return true;
      }

      await openInBuiltinBrowser(parsedUrl);
      return true;
    } catch (error) {
      logger.warn(`Failed to open link: ${parsedUrl.toString()}`, error);
      throw error instanceof Error ? error : new Error('打开链接失败');
    }
  }
};
