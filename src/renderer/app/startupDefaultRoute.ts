export interface StartupDefaultRouteGateInput {
  pending: boolean;
  pathname: string;
  hasGeneralConfig: boolean;
}

export interface StartupDefaultRouteGateResult {
  nextPending: boolean;
  shouldHandle: boolean;
}

export const resolveStartupDefaultRouteGate = ({
  pending,
  pathname,
  hasGeneralConfig
}: StartupDefaultRouteGateInput): StartupDefaultRouteGateResult => {
  if (!pending) {
    return {
      nextPending: false,
      shouldHandle: false
    };
  }

  if (pathname !== '/') {
    return {
      nextPending: false,
      shouldHandle: false
    };
  }

  if (!hasGeneralConfig) {
    return {
      nextPending: true,
      shouldHandle: false
    };
  }

  return {
    nextPending: false,
    shouldHandle: true
  };
};
