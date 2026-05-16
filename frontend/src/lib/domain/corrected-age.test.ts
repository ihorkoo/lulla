import { describe, expect, it } from "vitest";

import { correctedAge, daysBetween, daysToHumanAge, isPreterm } from "./corrected-age";

describe("corrected-age", () => {
  it("daysBetween counts whole days", () => {
    expect(daysBetween(new Date("2025-01-01"), new Date("2025-01-08"))).toBe(7);
    expect(daysBetween(new Date("2025-01-08"), new Date("2025-01-01"))).toBe(-7);
  });

  it("term baby (40w) has zero correction", () => {
    const dob = new Date("2025-01-01");
    const now = new Date("2025-04-01");
    const r = correctedAge(dob, 40, now);
    expect(r.correctionWeeks).toBe(0);
    expect(r.correctedDays).toBe(r.chronologicalDays);
    expect(r.isPreterm).toBe(false);
  });

  it("32-week preterm has 8 weeks of correction", () => {
    const dob = new Date("2025-01-01");
    const now = new Date("2025-05-01"); // 120 days
    const r = correctedAge(dob, 32, now);
    expect(r.correctionWeeks).toBe(8);
    expect(r.correctedDays).toBe(120 - 56);
    expect(r.isPreterm).toBe(true);
  });

  it("28-week preterm has 12 weeks of correction (Tymofiy example)", () => {
    // Dashboard mockup: chronological ~7 months, corrected ~4 months, correction -12 weeks
    const dob = new Date("2024-10-14"); // 7 months before 2025-05-14
    const now = new Date("2025-05-14");
    const r = correctedAge(dob, 28, now);
    expect(r.correctionWeeks).toBe(12);
    expect(r.isPreterm).toBe(true);
    // Roughly 7 months ≈ 213 days; corrected ≈ 213 - 84 = 129 (~4.2 months)
    expect(daysToHumanAge(r.chronologicalDays).months).toBeGreaterThanOrEqual(6);
    expect(daysToHumanAge(r.correctedDays).months).toBe(4);
  });

  it("22-week extreme preterm has 18 weeks correction", () => {
    const dob = new Date("2025-01-01");
    const now = new Date("2026-01-01"); // ~365 days
    const r = correctedAge(dob, 22, now);
    expect(r.correctionWeeks).toBe(18);
    expect(r.correctedDays).toBe(365 - 126);
  });

  it("isPreterm boundary at 37w", () => {
    expect(isPreterm(36)).toBe(true);
    expect(isPreterm(37)).toBe(false);
  });

  it("rejects invalid GA", () => {
    expect(() => correctedAge(new Date(), 21)).toThrow();
    expect(() => correctedAge(new Date(), 42)).toThrow();
    expect(() => correctedAge(new Date(), 30.5)).toThrow();
  });

  it("never returns negative corrected days", () => {
    const dob = new Date();
    const r = correctedAge(dob, 24, dob);
    expect(r.correctedDays).toBe(0);
    expect(r.chronologicalDays).toBe(0);
  });

  it("daysToHumanAge label", () => {
    expect(daysToHumanAge(7).label).toBe("7 days");
    expect(daysToHumanAge(120).label).toBe("3 months");
    expect(daysToHumanAge(800).label).toBe("2y 2m");
    expect(daysToHumanAge(730).label).toBe("2 years");
  });
});
