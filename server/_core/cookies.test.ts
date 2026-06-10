import { describe, it, expect } from "vitest";
import { getSessionCookieOptions } from "./cookies";

describe("getSessionCookieOptions", () => {
  it("deve usar SameSite=lax em localhost com HTTP", () => {
    const mockReq = {
      hostname: "localhost",
      protocol: "http",
      headers: {},
    } as any;

    const options = getSessionCookieOptions(mockReq);

    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(false);
    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe("/");
  });

  it("deve usar SameSite=lax em 127.0.0.1 com HTTP", () => {
    const mockReq = {
      hostname: "127.0.0.1",
      protocol: "http",
      headers: {},
    } as any;

    const options = getSessionCookieOptions(mockReq);

    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(false);
  });

  it("deve usar SameSite=lax em IP privado com HTTP", () => {
    const mockReq = {
      hostname: "192.168.1.88",
      protocol: "http",
      headers: {},
    } as any;

    const options = getSessionCookieOptions(mockReq);

    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(false);
  });

  it("deve usar SameSite=none com Secure=true em HTTPS", () => {
    const mockReq = {
      hostname: "example.com",
      protocol: "https",
      headers: {},
    } as any;

    const options = getSessionCookieOptions(mockReq);

    expect(options.sameSite).toBe("none");
    expect(options.secure).toBe(true);
  });

  it("deve usar SameSite=none com Secure=true quando x-forwarded-proto=https", () => {
    const mockReq = {
      hostname: "example.com",
      protocol: "http",
      headers: { "x-forwarded-proto": "https" },
    } as any;

    const options = getSessionCookieOptions(mockReq);

    expect(options.sameSite).toBe("none");
    expect(options.secure).toBe(true);
  });

  it("deve usar SameSite=lax em domínio não-local com HTTP", () => {
    const mockReq = {
      hostname: "example.com",
      protocol: "http",
      headers: {},
    } as any;

    const options = getSessionCookieOptions(mockReq);

    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(false);
  });
});
