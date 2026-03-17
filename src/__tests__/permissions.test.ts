import { vi } from "vitest";
import { hasPermission, hasAnyPermission, usePermissions } from "@/lib/permissions";
import * as authLib from "@/lib/auth";

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "none" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("hasPermission", () => {
  it("returns true when permission is present", () => {
    expect(hasPermission(["contracts:read", "contracts:write"], "contracts:read")).toBe(true);
  });

  it("returns false when permission is absent", () => {
    expect(hasPermission(["contracts:read"], "contracts:write")).toBe(false);
  });

  it("returns false for empty permissions array", () => {
    expect(hasPermission([], "contracts:read")).toBe(false);
  });
});

describe("hasAnyPermission", () => {
  it("returns true when at least one permission matches", () => {
    expect(hasAnyPermission(["contracts:read"], ["contracts:read", "contracts:write"])).toBe(true);
  });

  it("returns false when no permissions match", () => {
    expect(hasAnyPermission(["locations:read"], ["contracts:read", "contracts:write"])).toBe(false);
  });

  it("returns false for empty permissions array", () => {
    expect(hasAnyPermission([], ["contracts:read"])).toBe(false);
  });

  it("returns false for empty required array", () => {
    expect(hasAnyPermission(["contracts:read"], [])).toBe(false);
  });
});

describe("usePermissions", () => {
  it("returns permissions from user context", () => {
    const token = makeJwt({
      sub: "user-1",
      username: "admin",
      permissions: ["contracts:read", "locations:write"],
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    authLib.storeTokens(token, "refresh");

    const perms = usePermissions();
    expect(perms).toEqual(["contracts:read", "locations:write"]);
  });

  it("returns empty array when no token is stored", () => {
    expect(usePermissions()).toEqual([]);
  });

  it("returns empty array for token without permissions", () => {
    const token = makeJwt({
      sub: "user-1",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    authLib.storeTokens(token, "refresh");

    expect(usePermissions()).toEqual([]);
  });
});
