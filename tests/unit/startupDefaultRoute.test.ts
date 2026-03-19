import { describe, expect, it } from 'vitest';

import { resolveStartupDefaultRouteGate } from '../../src/renderer/app/startupDefaultRoute';

describe('resolveStartupDefaultRouteGate', () => {
  it('keeps the startup redirect pending while the app is still on the root page and config is loading', () => {
    expect(
      resolveStartupDefaultRouteGate({
        pending: true,
        pathname: '/',
        hasGeneralConfig: false
      })
    ).toEqual({
      nextPending: true,
      shouldHandle: false
    });
  });

  it('cancels the startup redirect once the user leaves the root page before config loads', () => {
    expect(
      resolveStartupDefaultRouteGate({
        pending: true,
        pathname: '/tasks',
        hasGeneralConfig: false
      })
    ).toEqual({
      nextPending: false,
      shouldHandle: false
    });
  });

  it('runs the startup redirect exactly once after config becomes available on the root page', () => {
    expect(
      resolveStartupDefaultRouteGate({
        pending: true,
        pathname: '/',
        hasGeneralConfig: true
      })
    ).toEqual({
      nextPending: false,
      shouldHandle: true
    });
  });

  it('does not re-arm the redirect after it has been cancelled', () => {
    expect(
      resolveStartupDefaultRouteGate({
        pending: false,
        pathname: '/',
        hasGeneralConfig: true
      })
    ).toEqual({
      nextPending: false,
      shouldHandle: false
    });
  });
});
