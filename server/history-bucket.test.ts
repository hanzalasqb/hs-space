import { describe, expect, it } from "vitest";
import { historyBucket } from "../shared/history";

describe("history bucket", () => {
  const now = new Date("2026-08-15T12:00:00.000Z").getTime();

  it("groups same-day conversations as Today", () => {
    expect(historyBucket(new Date("2026-08-15T09:00:00.000Z"), now)).toBe("Today");
  });

  it("groups the last seven days as Previous 7 Days", () => {
    expect(historyBucket(new Date("2026-08-11T09:00:00.000Z"), now)).toBe("Previous 7 Days");
  });

  it("groups older conversations as Older", () => {
    expect(historyBucket(new Date("2026-08-01T09:00:00.000Z"), now)).toBe("Older");
  });
});
