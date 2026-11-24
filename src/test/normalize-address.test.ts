import { describe, expect, it } from "vitest";
import { normalizeAddress } from "@/components/cocox/CocoXApp";

describe("normalizeAddress", () => {
  it("keeps full web addresses as-is", () => {
    expect(normalizeAddress("https://example.com")).toBe("https://example.com");
  });
  it("adds https to bare domains", () => {
    expect(normalizeAddress("example.com/path")).toBe("https://example.com/path");
  });
  it("turns plain words into a DuckDuckGo search", () => {
    expect(normalizeAddress("cool games")).toBe("https://duckduckgo.com/?q=cool%20games");
  });
});
