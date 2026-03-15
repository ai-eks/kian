import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type {
  OnboardingDependencyStatus,
  OnboardingEnvironmentStatus,
} from "@shared/types";

const execFileAsync = promisify(execFile);
const COMMAND_TIMEOUT_MS = 5000;
const COMMAND_MAX_BUFFER = 64 * 1024;
const SHELL_ENV_TIMEOUT_MS = 3000;
const PATH_START_MARKER = "__KIAN_PATH_START__";
const PATH_END_MARKER = "__KIAN_PATH_END__";
const SHELL_PATH_COMMAND = `printf '${PATH_START_MARKER}%s${PATH_END_MARKER}' "$PATH"`;

let commandEnvPromise: Promise<NodeJS.ProcessEnv> | null = null;

const firstNonEmptyLine = (value: string): string | undefined =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

const normalizeVersionLine = (stdout?: string, stderr?: string): string | undefined => {
  const merged = `${stdout ?? ""}\n${stderr ?? ""}`;
  return firstNonEmptyLine(merged);
};

const getShellCandidates = (): string[] => {
  const values = [process.env.SHELL];

  if (process.platform === "darwin") {
    values.push("/bin/zsh", "/bin/bash", "/bin/sh");
  } else if (process.platform === "linux") {
    values.push("/bin/bash", "/bin/sh");
  }

  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())))];
};

const extractPathFromShellOutput = (stdout?: string, stderr?: string): string | undefined => {
  const merged = `${stdout ?? ""}\n${stderr ?? ""}`;
  const start = merged.indexOf(PATH_START_MARKER);
  const end = merged.indexOf(PATH_END_MARKER, start + PATH_START_MARKER.length);
  if (start === -1 || end === -1) {
    return undefined;
  }
  const value = merged.slice(start + PATH_START_MARKER.length, end).trim();
  return value.length > 0 ? value : undefined;
};

const resolveCommandEnv = async (): Promise<NodeJS.ProcessEnv> => {
  if (process.platform === "win32") {
    return process.env;
  }

  for (const shell of getShellCandidates()) {
    try {
      const { stdout, stderr } = await execFileAsync(shell, ["-ic", SHELL_PATH_COMMAND], {
        timeout: SHELL_ENV_TIMEOUT_MS,
        windowsHide: true,
        maxBuffer: COMMAND_MAX_BUFFER,
        env: process.env,
      });
      const shellPath = extractPathFromShellOutput(stdout, stderr);
      if (shellPath) {
        return { ...process.env, PATH: shellPath };
      }
    } catch (error) {
      const errno = error as NodeJS.ErrnoException & {
        stdout?: string;
        stderr?: string;
      };

      if (errno.code === "ENOENT") {
        continue;
      }

      const shellPath = extractPathFromShellOutput(errno.stdout, errno.stderr);
      if (shellPath) {
        return { ...process.env, PATH: shellPath };
      }
    }
  }

  return process.env;
};

const getCommandEnv = (): Promise<NodeJS.ProcessEnv> => {
  if (!commandEnvPromise) {
    commandEnvPromise = resolveCommandEnv();
  }
  return commandEnvPromise;
};

const checkCommandWithArgs = async (
  command: string,
  args: string[],
): Promise<OnboardingDependencyStatus> => {
  const commandEnv = await getCommandEnv();

  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout: COMMAND_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: COMMAND_MAX_BUFFER,
      env: commandEnv,
    });
    return {
      installed: true,
      version: normalizeVersionLine(stdout, stderr),
    };
  } catch (error) {
    const errno = error as NodeJS.ErrnoException & {
      stdout?: string;
      stderr?: string;
    };

    if (errno.code === "ENOENT") {
      return { installed: false };
    }

    const fallbackVersion = normalizeVersionLine(errno.stdout, errno.stderr);
    return {
      installed: true,
      version: fallbackVersion,
    };
  }
};

const checkCommand = async (
  command: string,
  candidateArgs: string[][],
): Promise<OnboardingDependencyStatus> => {
  for (const args of candidateArgs) {
    const result = await checkCommandWithArgs(command, args);
    if (!result.installed || result.version) {
      return result;
    }
  }

  return { installed: true };
};

export const onboardingService = {
  async getEnvironmentStatus(): Promise<OnboardingEnvironmentStatus> {
    const [node, pnpm, claudeCode] = await Promise.all([
      checkCommand("node", [["--version"]]),
      checkCommand("pnpm", [["--version"]]),
      checkCommand("claude", [["--version"], ["-v"], ["version"]]),
    ]);

    return {
      node,
      pnpm,
      claudeCode,
    };
  },
};
