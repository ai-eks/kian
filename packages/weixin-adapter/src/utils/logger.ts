export type WeixinAdapterLogLevel = "debug" | "info" | "warn" | "error";

export interface WeixinAdapterLogger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

const LOG_LEVEL_ORDER: Record<WeixinAdapterLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLevel(level?: WeixinAdapterLogLevel): WeixinAdapterLogLevel {
  if (level) {
    return level;
  }

  const env = process.env.KIAN_WEIXIN_ADAPTER_LOG_LEVEL?.toLowerCase();
  if (env === "debug" || env === "info" || env === "warn" || env === "error") {
    return env;
  }

  return "info";
}

export function createLogger(options?: {
  name?: string;
  level?: WeixinAdapterLogLevel;
}): WeixinAdapterLogger {
  const name = options?.name ?? "kian-weixin-adapter";
  const minLevel = resolveLevel(options?.level);

  const shouldLog = (level: WeixinAdapterLogLevel): boolean =>
    LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[minLevel];

  const write = (level: Uppercase<WeixinAdapterLogLevel>, message: string): void => {
    const line = `${new Date().toISOString()} [${name}] [${level}] ${message}`;
    if (level === "ERROR" || level === "WARN") {
      console.error(line);
      return;
    }

    console.log(line);
  };

  return {
    debug(message: string): void {
      if (shouldLog("debug")) {
        write("DEBUG", message);
      }
    },
    info(message: string): void {
      if (shouldLog("info")) {
        write("INFO", message);
      }
    },
    warn(message: string): void {
      if (shouldLog("warn")) {
        write("WARN", message);
      }
    },
    error(message: string): void {
      if (shouldLog("error")) {
        write("ERROR", message);
      }
    },
  };
}
