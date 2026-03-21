import { appOperationEvents } from "./appOperationEvents";

export type SettingsRuntimeReloadTarget =
  | "renderer"
  | "quickLauncherShortcut"
  | "chatChannels"
  | "agentSessions"
  | "appPreviewWindow";

interface SettingsRuntimeHooks {
  refreshQuickLauncherShortcutRegistration?: () => Promise<void>;
}

interface ReloadOptions {
  targets?: SettingsRuntimeReloadTarget[];
}

const DEFAULT_RELOAD_TARGETS: SettingsRuntimeReloadTarget[] = [
  "renderer",
  "quickLauncherShortcut",
  "chatChannels",
  "agentSessions",
  "appPreviewWindow",
];

let hooks: SettingsRuntimeHooks = {};

const normalizeTargets = (
  targets?: SettingsRuntimeReloadTarget[],
): SettingsRuntimeReloadTarget[] =>
  targets && targets.length > 0
    ? Array.from(new Set(targets))
    : DEFAULT_RELOAD_TARGETS;

export const settingsRuntimeService = {
  configure(nextHooks: SettingsRuntimeHooks): void {
    hooks = {
      ...hooks,
      ...nextHooks,
    };
  },

  async reload(options?: ReloadOptions): Promise<void> {
    const targets = normalizeTargets(options?.targets);

    if (targets.includes("quickLauncherShortcut")) {
      await hooks.refreshQuickLauncherShortcutRegistration?.();
    }

    if (targets.includes("chatChannels")) {
      const { chatChannelService } = await import("./chatChannelService");
      await chatChannelService.refresh();
    }

    if (targets.includes("agentSessions")) {
      const { agentService } = await import("./agentService");
      agentService.refreshAllSessionsForNextPrompt();
    }

    if (targets.includes("appPreviewWindow")) {
      const { appPreviewWindowService } = await import("./appPreviewWindowService");
      await appPreviewWindowService.refreshActiveWindow();
    }

    if (targets.includes("renderer")) {
      appOperationEvents.emit({
        type: "reload_settings",
      });
    }
  },
};
