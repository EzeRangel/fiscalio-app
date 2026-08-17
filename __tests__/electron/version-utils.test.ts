import { versionGreater } from "@/electron/version-utils";

describe("versionGreater", () => {
  it("returns true when a is newer than b", () => {
    expect(versionGreater("1.0.1", "1.0.0")).toBe(true);
    expect(versionGreater("1.1.0", "1.0.9")).toBe(true);
    expect(versionGreater("2.0.0", "1.9.9")).toBe(true);
    expect(versionGreater("1.0.10", "1.0.9")).toBe(true);
  });

  it("returns false when a is older or equal", () => {
    expect(versionGreater("1.0.0", "1.0.1")).toBe(false);
    expect(versionGreater("1.0.0", "1.0.0")).toBe(false);
    expect(versionGreater("1.0.0", "1.1.0")).toBe(false);
  });

  it("tolerates v-prefixes and variable segment lengths", () => {
    expect(versionGreater("v1.0.1", "1.0.0")).toBe(true);
    expect(versionGreater("1.0", "1.0.0")).toBe(false);
    expect(versionGreater("1.0.1", "1.0")).toBe(true);
  });
});